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

export type PromptTableRow =
  Database["prompt_schema"]["Tables"]["prompts"]["Row"];
export type PromptTableInsert =
  Database["prompt_schema"]["Tables"]["prompts"]["Insert"];
export type PromptTableUpdate =
  Database["prompt_schema"]["Tables"]["prompts"]["Update"];

export type GetVariables = {
  data: VariableTableRow[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};

export type GetPrompts = {
  data: PromptTableRow[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};

export type GetMinifiedPrompts = {
  data: Pick<PromptTableRow, "id" | "label">[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};
