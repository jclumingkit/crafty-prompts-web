import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database";
import { GetPrompts, GetVariables } from "../types";

export const getVariables = async (
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    limit: number;
    search?: string;
    cursor?: string;
    direction?: string;
  }
) => {
  const { userId, limit, search, cursor, direction } = params;
  const { data, error } = await supabase.rpc("get_paginated_variables", {
    fetch_user_id: userId,
    fetch_limit: limit,
    search: search,
    cursor: cursor,
    direction: direction,
  });

  if (error) throw error;

  return data as GetVariables;
};

export const getPrompts = async (
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    limit: number;
    search?: string;
    cursor?: string;
    direction?: string;
  }
) => {
  const { userId, limit, search, cursor, direction } = params;
  const { data, error } = await supabase.rpc("get_paginated_prompts", {
    fetch_user_id: userId,
    fetch_limit: limit,
    search: search,
    cursor: cursor,
    direction: direction,
  });

  if (error) throw error;

  return data as GetPrompts;
};
