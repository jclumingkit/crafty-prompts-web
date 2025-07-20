import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database";
import {
  ErrorTableInsert,
  PromptTableInsert,
  VariableTableInsert,
} from "../types";

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
  const { data, error } = await supabase
    .schema("prompt_schema")
    .from("variables")
    .insert(params)
    .select();

  if (error) throw error;

  return data[0];
};

export const createPrompt = async (
  supabase: SupabaseClient<Database>,
  params: PromptTableInsert
) => {
  const { error } = await supabase
    .schema("prompt_schema")
    .from("prompts")
    .insert(params);

  if (error) throw error;
};
