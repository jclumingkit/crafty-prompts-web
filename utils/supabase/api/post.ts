import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database";
import { ErrorTableInsert } from "../types";

export const createErrorLog = async (
  supabase: SupabaseClient<Database>,
  params: ErrorTableInsert
) => {
  const { error } = await supabase.from("errors").insert(params);
  if (error) throw error;
};
