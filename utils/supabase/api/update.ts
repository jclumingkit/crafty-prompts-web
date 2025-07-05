import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database";
import { VariableTableUpdate } from "../types";

export const updateVariable = async (
  supabase: SupabaseClient<Database>,
  params: VariableTableUpdate
) => {
  const { error } = await supabase
    .schema("prompt_schema")
    .from("variables")
    .update(params)
    .eq("id", `${params.id}`);
  if (error) throw error;
};
