DROP POLICY IF EXISTS objects_policy ON storage.objects;
DROP POLICY IF EXISTS buckets_policy ON storage.buckets;
DELETE FROM storage.objects;
DELETE FROM storage.buckets;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" with schema extensions;

-- STORAGE
INSERT INTO storage.buckets (id, name) VALUES ('USER_AVATARS', 'USER_AVATARS');

UPDATE storage.buckets SET public = true;

-- SCHEMA
DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS user_schema CASCADE;
DROP SCHEMA IF EXISTS prompt_schema CASCADE;

CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS user_schema;
CREATE SCHEMA IF NOT EXISTS prompt_schema;

-- START: TABLES

CREATE TABLE errors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  url_path text NOT NULL,
  function_name text NOT NULL,
  error_message text NOT NULL,
  user_id uuid,
  created_at timestamptz DEFAULT NOW()
);

-- USER_SCHEMA

CREATE TABLE user_schema.profiles (
  user_id uuid REFERENCES auth.users(id) PRIMARY KEY NOT NULL,
  display_name text NOT NULL,
  avatar_url text
);

-- PROMPT_SCHEMA

CREATE TABLE prompt_schema.prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  user_id uuid REFERENCES user_schema.profiles(user_id) NOT NULL,
  label text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(label, '') || ' ' || 
      coalesce(content, '')
    )
  ) STORED,
  CONSTRAINT unique_prompt_label UNIQUE (label, user_id)
);

CREATE TABLE prompt_schema.variables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  user_id uuid REFERENCES user_schema.profiles(user_id) NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(label, '') || ' ' || 
      coalesce(value, '')
    )
  ) STORED,
  CONSTRAINT unique_variable_label UNIQUE (label, user_id)
);

-- END: TABLES

-- START: PRIVILEGES

GRANT ALL ON ALL TABLES IN SCHEMA user_schema TO PUBLIC,POSTGRES;
GRANT ALL ON SCHEMA user_schema TO public,postgres;

GRANT ALL ON ALL TABLES IN SCHEMA prompt_schema TO PUBLIC,POSTGRES;
GRANT ALL ON SCHEMA prompt_schema TO public,postgres;

GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC,POSTGRES;
GRANT ALL ON SCHEMA public TO public,postgres;

-- END: PRIVILEGES

-- START: POLICIES

-- END: POLICIES

-- START: INDEXES

CREATE INDEX prompts_fts on prompt_schema.prompts using gin (search_vector);
CREATE INDEX variables_fts on prompt_schema.variables using gin (search_vector);

-- END: INDEXES

-- START: FUNCTIONS

CREATE OR REPLACE FUNCTION get_paginated_variables(
  fetch_user_id UUID,
  fetch_limit INT DEFAULT 10,
  search TEXT DEFAULT NULL,
  cursor TIMESTAMPTZ DEFAULT NULL,
  direction TEXT DEFAULT 'next'
)
RETURNS JSON
SET search_path TO ''
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  data JSONB;
  hasMore BOOLEAN := FALSE;
  nextCursor TIMESTAMPTZ;
  prevCursor TIMESTAMPTZ;
  comparison_operator TEXT;
  sort_order TEXT;
  actual_limit INT;
BEGIN
  -- Calculate actual limit (fetch one extra to check if there are more)
  actual_limit := fetch_limit + 1;

  IF direction = 'next' THEN
    comparison_operator := '<';
    sort_order := 'DESC';
  ELSE
    comparison_operator := '>';
    sort_order := 'ASC';
  END IF;

  -- Build and execute the query
  EXECUTE format(
    'SELECT COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
              ''id'', v.id,
              ''user_id'', v.user_id,
              ''label'', v.label,
              ''value'', v.value,
              ''created_at'', v.created_at,
              ''updated_at'', v.updated_at
            )
          )
          FROM (
            SELECT *
            FROM prompt_schema.variables v
            WHERE v.user_id = $1
              AND (
                $2::TEXT = '''' 
                OR search_vector @@ to_tsquery($2 || '':*'')
              )
              AND ($3::TIMESTAMPTZ IS NULL OR v.created_at ' || comparison_operator || ' $3)
            ORDER BY v.created_at ' || sort_order || '
            LIMIT $4
          ) v
        ),
        ''[]''::jsonb
      )'
  )
  INTO data
  USING fetch_user_id, search, cursor, actual_limit;

  -- Check if we have more results than requested
  IF jsonb_array_length(data) > fetch_limit THEN
    hasMore := TRUE;
    -- Remove the extra row
    data := (
      SELECT jsonb_agg(value)
      FROM (
        SELECT value, row_number() OVER () as rn
        FROM jsonb_array_elements(data) AS t(value)
      ) numbered
      WHERE rn <= fetch_limit
    );
  END IF;

  -- If direction is 'prev', reverse the order of results
  IF direction = 'prev' AND jsonb_array_length(data) > 0 THEN
    SELECT jsonb_agg(value ORDER BY (value->>'created_at')::timestamptz DESC)
    INTO data
    FROM jsonb_array_elements(data) AS t(value);
  END IF;

  -- Set cursors based on the final data
  IF jsonb_array_length(data) > 0 THEN
    nextCursor := (data->(jsonb_array_length(data) - 1)->>'created_at')::timestamptz;
    prevCursor := (data->0->>'created_at')::timestamptz;
  END IF;

  -- Build final result
  SELECT json_build_object(
    'data', data,
    'hasMore', hasMore,
    'nextCursor', nextCursor,
    'prevCursor', prevCursor
  )
  INTO result;

  RETURN result;
END;
$$;


CREATE OR REPLACE FUNCTION get_paginated_prompts(
  fetch_user_id UUID,
  fetch_limit INT DEFAULT 10,
  search TEXT DEFAULT NULL,
  cursor TIMESTAMPTZ DEFAULT NULL,
  direction TEXT DEFAULT 'next'
)
RETURNS JSON
SET search_path TO ''
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  data JSONB;
  hasMore BOOLEAN := FALSE;
  nextCursor TIMESTAMPTZ;
  prevCursor TIMESTAMPTZ;
  comparison_operator TEXT;
  sort_order TEXT;
  actual_limit INT;
BEGIN
  -- Calculate actual limit (fetch one extra to check if there are more)
  actual_limit := fetch_limit + 1;

  IF direction = 'next' THEN
    comparison_operator := '<';
    sort_order := 'DESC';
  ELSE
    comparison_operator := '>';
    sort_order := 'ASC';
  END IF;

  -- Build and execute the query
  EXECUTE format(
    'SELECT COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
              ''id'', v.id,
              ''user_id'', v.user_id,
              ''label'', v.label,
              ''content'', v.content,
              ''created_at'', v.created_at,
              ''updated_at'', v.updated_at
            )
          )
          FROM (
            SELECT *
            FROM prompt_schema.prompts v
            WHERE v.user_id = $1
              AND (
                $2::TEXT = '''' 
                OR search_vector @@ to_tsquery($2 || '':*'')
              )
              AND ($3::TIMESTAMPTZ IS NULL OR v.created_at ' || comparison_operator || ' $3)
            ORDER BY v.created_at ' || sort_order || '
            LIMIT $4
          ) v
        ),
        ''[]''::jsonb
      )'
  )
  INTO data
  USING fetch_user_id, search, cursor, actual_limit;

  -- Check if we have more results than requested
  IF jsonb_array_length(data) > fetch_limit THEN
    hasMore := TRUE;
    -- Remove the extra row
    data := (
      SELECT jsonb_agg(value)
      FROM (
        SELECT value, row_number() OVER () as rn
        FROM jsonb_array_elements(data) AS t(value)
      ) numbered
      WHERE rn <= fetch_limit
    );
  END IF;

  -- If direction is 'prev', reverse the order of results
  IF direction = 'prev' AND jsonb_array_length(data) > 0 THEN
    SELECT jsonb_agg(value ORDER BY (value->>'created_at')::timestamptz DESC)
    INTO data
    FROM jsonb_array_elements(data) AS t(value);
  END IF;

  -- Set cursors based on the final data
  IF jsonb_array_length(data) > 0 THEN
    nextCursor := (data->(jsonb_array_length(data) - 1)->>'created_at')::timestamptz;
    IF cursor IS NOT NULL THEN 
      prevCursor := (data->0->>'created_at')::timestamptz;
    END IF;
  END IF;

  -- Build final result
  SELECT json_build_object(
    'data', data,
    'hasMore', hasMore,
    'nextCursor', nextCursor,
    'prevCursor', prevCursor
  )
  INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_minified_paginated_prompts(
  fetch_user_id UUID,
  fetch_limit INT DEFAULT 10,
  search TEXT DEFAULT NULL,
  cursor TIMESTAMPTZ DEFAULT NULL,
  direction TEXT DEFAULT 'next'
)
RETURNS JSON
SET search_path TO prompt_schema
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  data JSONB;
  hasMore BOOLEAN := FALSE;
  nextCursor TIMESTAMPTZ;
  prevCursor TIMESTAMPTZ;
  comparison_operator TEXT;
  sort_order TEXT;
  actual_limit INT;
BEGIN
  actual_limit := fetch_limit + 1;

  IF direction = 'next' THEN
    comparison_operator := '<';
    sort_order := 'DESC';
  ELSE
    comparison_operator := '>';
    sort_order := 'ASC';
  END IF;

  -- Build and execute the query
  EXECUTE format(
    'SELECT COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
              ''id'', v.id,
              ''label'', v.label
            )
          )
          FROM (
            SELECT *
            FROM prompt_schema.prompts v
            WHERE v.user_id = $1
              AND (
                $2::TEXT = '''' 
                OR search_vector @@ to_tsquery($2 || '':*'')
              )
              AND ($3::TIMESTAMPTZ IS NULL OR v.created_at ' || comparison_operator || ' $3)
            ORDER BY v.created_at ' || sort_order || '
            LIMIT $4
          ) v
        ),
        ''[]''::jsonb
      )'
  )
  INTO data
  USING fetch_user_id, search, cursor, actual_limit;

  -- Check if we have more results than requested
  IF jsonb_array_length(data) > fetch_limit THEN
    hasMore := TRUE;
    -- Remove the extra row
    data := (
      SELECT jsonb_agg(value)
      FROM (
        SELECT value, row_number() OVER () as rn
        FROM jsonb_array_elements(data) AS t(value)
      ) numbered
      WHERE rn <= fetch_limit
    );
  END IF;

  -- If direction is 'prev', reverse the order of results
  IF direction = 'prev' AND jsonb_array_length(data) > 0 THEN
    SELECT jsonb_agg(value ORDER BY (value->>'created_at')::timestamptz DESC)
    INTO data
    FROM jsonb_array_elements(data) AS t(value);
  END IF;

  -- Set cursors based on the final data
  IF jsonb_array_length(data) > 0 THEN
    nextCursor := (data->(jsonb_array_length(data) - 1)->>'created_at')::timestamptz;
    IF cursor IS NOT NULL THEN 
      prevCursor := (data->0->>'created_at')::timestamptz;
    END IF;
  END IF;

  -- Build final result
  SELECT json_build_object(
    'data', data,
    'hasMore', hasMore,
    'nextCursor', nextCursor,
    'prevCursor', prevCursor
  )
  INTO result;

  RETURN result;
END;
$$;






-- END: FUNCTIONS