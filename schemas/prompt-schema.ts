import z from "zod";

export const promptSchema = z.object({
  id: z.string().optional(),
  label: z
    .string()
    .min(1, "Label is required")
    .max(100, "Label must be less than 100 characters"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(4000, "Content must be less than 4000 characters"),
});

export const PROMPT_FORM_DEFAULT_VALUES = {
  label: "",
  content: "",
};

export type PromptFormValues = z.infer<typeof promptSchema>;
