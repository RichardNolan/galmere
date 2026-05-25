import { z } from "zod";

const PERCENT_VALIDATION_MESSAGE = "Percent values must be valid numbers between 0 and 100.";

function formatPercentForMessage(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return `${value
    .toFixed(3)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1")}%`;
}

export const editableIngredientRowSchema = z.object({
  id: z.string().min(1),
  raw_material_id: z.string().min(1, "One or more rows are missing a linked raw material."),
  sequence_no: z.number().int().min(1, "Sequence numbers must be 1 or greater."),
  percent_of_recipe: z
    .string()
    .refine((value) => Number.isFinite(Number(value)), {
      message: PERCENT_VALIDATION_MESSAGE,
    })
    .transform((value) => Number(value))
    .refine((value) => value >= 0 && value <= 100, {
      message: PERCENT_VALIDATION_MESSAGE,
    }),
  declare: z.boolean(),
  quided: z.boolean(),
  raw_material_code: z.string(),
  raw_material_name: z.string(),
});

export const recipeRowsSchema = z
  .array(editableIngredientRowSchema)
  .superRefine((rows, context) => {
    if (!rows.length) {
      return;
    }

    const sequenceNumbers = rows.map((row) => row.sequence_no);
    if (new Set(sequenceNumbers).size !== sequenceNumbers.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sequence numbers must be unique within a recipe.",
      });
    }

    const total = rows.reduce((sum, row) => sum + row.percent_of_recipe, 0);
    if (Math.abs(total - 100) > 0.5) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total recipe percent must be 100% (+/- 0.5). Current total: ${formatPercentForMessage(total)}.`,
      });
    }
  });

export type EditableIngredientRowInput = z.input<typeof editableIngredientRowSchema>;

export function validateRecipeRows(rows: EditableIngredientRowInput[]): string[] {
  const parsed = recipeRowsSchema.safeParse(rows);

  if (parsed.success) {
    return [];
  }

  return [...new Set(parsed.error.issues.map((issue) => issue.message))];
}
