import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database";
import { PromptTableUpdate, VariableTableUpdate } from "../types";

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

  return params;
};

export const updatePrompt = async (
  supabase: SupabaseClient<Database>,
  params: PromptTableUpdate
) => {
  const { error } = await supabase
    .schema("prompt_schema")
    .from("prompts")
    .update(params)
    .eq("id", `${params.id}`);
  if (error) throw error;
};
