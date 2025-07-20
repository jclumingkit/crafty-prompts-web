import z from "zod";

export const variableSchema = z.object({
  id: z.string().optional(),
  label: z
    .string()
    .min(1, "Label is required")
    .max(100, "Label must be less than 100 characters"),
  value: z
    .string()
    .min(1, "Value is required")
    .max(200, "Value must be less than 200 characters"),
});

export const VARIABLE_FORM_DEFAULT_VALUES = {
  label: "",
  value: "",
};

export type VariableFormValues = z.infer<typeof variableSchema>;
