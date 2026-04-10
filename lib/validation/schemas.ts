import { z } from "zod";

export const MAX_TEXT_LENGTH = 20000;
export const MAX_TONE_LENGTH = 40;

const requiredText = z
  .string({ message: "Text is required" })
  .trim()
  .min(1, "Text cannot be empty")
  .max(MAX_TEXT_LENGTH, `Text is too long. Maximum allowed length is ${MAX_TEXT_LENGTH} characters.`);

export const paraphraseRequestSchema = z.object({
  text: requiredText,
  tone: z.string().trim().min(1).max(MAX_TONE_LENGTH).optional().default("Formal"),
});

export const plagiarismCheckRequestSchema = z.object({
  originalText: requiredText,
  rewrittenText: requiredText,
});

export function getValidationErrorMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message || "Invalid request payload";
}

export type ParaphraseRequest = z.infer<typeof paraphraseRequestSchema>;
export type PlagiarismCheckRequest = z.infer<typeof plagiarismCheckRequestSchema>;