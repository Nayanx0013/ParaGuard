import { NextResponse } from "next/server";
import { paraphraseText as paraphraseWithGroq } from "@/lib/groq";
import { paraphraseText as paraphraseWithGemini } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { getValidationErrorMessage, paraphraseRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to use paraphrasing." },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const parsedPayload = paraphraseRequestSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(parsedPayload.error) },
        { status: 400 }
      );
    }

    const { text: trimmedText, tone: normalizedTone } = parsedPayload.data;

    let paraphrasedText: string;
    const tone = normalizedTone || "Formal";

    try {
      // Primary provider chain starts with Groq models for speed and quality.
      paraphrasedText = await paraphraseWithGroq(trimmedText, tone);
    } catch (groqError: unknown) {
      const groqMessage = groqError instanceof Error ? groqError.message : "Groq failed";
      console.warn("Groq fully failed, falling back to Gemini:", groqMessage);

      try {
        // Secondary provider chain uses Gemini free-tier models.
        paraphrasedText = await paraphraseWithGemini(trimmedText, tone);
      } catch (geminiError: unknown) {
        const geminiMessage = geminiError instanceof Error ? geminiError.message : "Gemini failed";
        console.error("All providers failed. Groq:", groqMessage, "Gemini:", geminiMessage);

        return NextResponse.json(
          {
            error: `All AI providers are currently unavailable. Please try again in a moment. (Groq: ${groqMessage} | Gemini: ${geminiMessage})`,
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ result: paraphrasedText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Paraphrase API caught error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
