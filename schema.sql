DROP POLICY IF EXISTS objects_policy ON storage.objects;
DROP POLICY IF EXISTS buckets_policy ON storage.buckets;
DELETE FROM storage.objects;
DELETE FROM storage.buckets;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" with schema extensions;

-- STORAGE
INSERT INTO storage.buckets (id, name) VALUES ('USER_AVATARS', 'USER_AVATARS');

UPDATE storage.buckets SET public = true;

-- START: TABLES

CREATE TABLE errors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    url_path text NOT NULL,
    function_name text NOT NULL,
    error_message text NOT NULL,
    user_id uuid,
    created_at timestamptz DEFAULT NOW()
);

-- END: TABLES

GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC,POSTGRES;
GRANT ALL ON SCHEMA public TO public,postgres;