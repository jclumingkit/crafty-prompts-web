import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database";

export const deleteVariable = async (
  supabase: SupabaseClient<Database>,
  variableId: string
) => {
  const { error } = await supabase
    .schema("prompt_schema")
    .from("variables")
    .delete()
    .eq("id", variableId);
  if (error) throw error;
};

export const deletePrompt = async (
  supabase: SupabaseClient<Database>,
  promptId: string
) => {
  const { error } = await supabase
    .schema("prompt_schema")
    .from("prompts")
    .delete()
    .eq("id", promptId);
  if (error) throw error;
};
