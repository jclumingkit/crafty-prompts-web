import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database";
import { ErrorTableInsert, VariableTableInsert } from "../types";

export const createErrorLog = async (
  supabase: SupabaseClient<Database>,
  params: ErrorTableInsert
) => {
  const { error } = await supabase.from("errors").insert(params);
  if (error) throw error;
};

export const createVariable = async (
  supabase: SupabaseClient<Database>,
  params: VariableTableInsert
) => {
  const { error } = await supabase
    .schema("prompt_schema")
    .from("variables")
    .insert(params);

  if (error) throw error;
};
