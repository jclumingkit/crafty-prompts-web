import { Database } from "./database";

export type ErrorTableRow = Database["public"]["Tables"]["errors"]["Row"];
export type ErrorTableInsert = Database["public"]["Tables"]["errors"]["Insert"];
export type ErrorTableUpdate = Database["public"]["Tables"]["errors"]["Update"];

export type UserProfileTableRow =
  Database["user_schema"]["Tables"]["profiles"]["Row"];
export type UserProfileTableInsert =
  Database["user_schema"]["Tables"]["profiles"]["Insert"];
export type UserProfileTableUpdate =
  Database["user_schema"]["Tables"]["profiles"]["Update"];

export type VariableTableRow =
  Database["prompt_schema"]["Tables"]["variables"]["Row"];
export type VariableTableInsert =
  Database["prompt_schema"]["Tables"]["variables"]["Insert"];
export type VariableTableUpdate =
  Database["prompt_schema"]["Tables"]["variables"]["Update"];

export type CustomPromptTableRow =
  Database["prompt_schema"]["Tables"]["custom_prompts"]["Row"];
export type CustomPromptTableInsert =
  Database["prompt_schema"]["Tables"]["custom_prompts"]["Insert"];
export type CustomPromptTableUpdate =
  Database["prompt_schema"]["Tables"]["custom_prompts"]["Update"];

export type GetVariables = {
  data: VariableTableRow[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};
