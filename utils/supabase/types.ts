import { Database } from "./database";

export type ErrorTableRow = Database["public"]["Tables"]["errors"]["Row"];
export type ErrorTableInsert = Database["public"]["Tables"]["errors"]["Insert"];
export type ErrorTableUpdate = Database["public"]["Tables"]["errors"]["Update"];
