import Groq from "groq-sdk";

function getModeSpecificRules(tone: string): string {
  const normalizedTone = tone.trim().toLowerCase();

  if (normalizedTone === "expand") {
    // Keep expand mode factual to avoid stock poetic phrases that trigger web matches.
    return `Expand mode rules (STRICT):
1. Only elaborate on ideas already present in the input - never introduce new topics, facts, or claims not in the original text.
2. Use plain, clear, factual language. Do NOT use poetic or flowery language.
3. Never use metaphors, similes, or literary devices.
4. Never use phrases that sound like they belong in a travel blog, motivational poster, self-help book, or generic essay.
5. Banned phrases and patterns (do not use these or anything similar):
   - "elixir of life", "unsung hero", "timeless pursuit"
   - "testament to human ingenuity", "technological titans"
   - "painting the sky", "golden flame", "hues of crimson"
   - "luminescent orb", "ancient balm", "verdant wonders"
   - Any phrase using "wields", "harnesses", "titans", "orb", "balm", "verdant", "luminescent", "majestic"
6. When expanding a sentence, add factual context or clarification - not decoration.
7. Every added sentence must be grounded in the topic, not descriptive filler.

GOOD expand example:
Input: "The sun rises in the east."
Output: "The sun rises in the east each morning as the Earth completes its daily rotation, gradually illuminating the landscape and raising the ambient temperature."

BAD expand example (do not do this):
Input: "The sun rises in the east."
Output: "The sun rises like a golden flame over the eastern horizon, painting the sky with hues of crimson and gold."`;
  }

  if (normalizedTone === "creative") {
    // Force creative outputs away from generic LLM clichés that commonly appear online.
    return `Creative mode rules (STRICT):
1. Rewrite the text with vivid, ORIGINAL language - but original means genuinely novel, not stock literary phrases.
2. Every metaphor or image used must be specific to the content of the sentence - not a generic poetic flourish.
3. Banned patterns (these are LLM cliches that exist on millions of websites):
   - "curious soul", "fascinating journey", "insatiable thirst"
   - "where X and Y entwine/dance/intertwine"
   - "embarking on a journey", "tapestry of", "symphony of"
   - "in the digital age", "rapidly evolving landscape"
   - "beacon of", "cornerstone of", "at its core"
4. If you cannot think of a truly original image, use plain clear language instead - plain is better than cliched.
5. Do not add content not present in the original.`;
  }

  return "";
}

export async function paraphraseText(text: string, tone: string) {
  const apiKey = process.env.GROQ_API_KEY || "";
  
  if (!apiKey) {
    throw new Error("Groq API Key is missing.");
  }

  const groq = new Groq({ apiKey });

  const modeSpecificRules = getModeSpecificRules(tone);

  const prompt = `You are a professional writing assistant. 
Rewrite the following text in a ${tone} tone. 
Rules:
- Preserve the original meaning entirely
- Do not add new information
- Vary sentence structure significantly
- Output ONLY the rewritten text, nothing else
- Never output any conversational filler like "Here is the rewritten text:"
- Universal rule for ALL modes:
  - Identify all proper nouns in the input (names of people, places, organisations, brands, products, technical terms).
  - Reproduce every proper noun EXACTLY as written in the input - same spelling, same capitalisation, no substitutions.
  - Never replace a proper noun with a pronoun, synonym, or description unless the original also uses one.
${modeSpecificRules ? `- Mode-specific rules:\n${modeSpecificRules}` : ""}

User Text:
${text}`;

  try {
    const GROQ_MODELS = [
      "llama-3.3-70b-versatile", // Best free model - try first
      "llama-3.1-8b-instant", // Fallback - higher rate limits
    ] as const;

    let lastError: Error | null = null;

    // Try higher-quality model first, then fall back only on retryable service pressure.
    for (const model of GROQ_MODELS) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model,
          temperature: 0.7,
        });

        const result = chatCompletion.choices[0]?.message?.content || "";
        if (!result) throw new Error(`${model} returned empty response`);
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        lastError = err instanceof Error ? err : new Error(message);
        console.warn(`Groq model ${model} failed: ${message}`);

        const isRetryable =
          message.includes("rate_limit") ||
          message.includes("overloaded") ||
          message.includes("503") ||
          message.includes("529");

        // Fail fast on auth/quota/request issues; only continue for rate/overload failures.
        if (!isRetryable) throw lastError;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Bubble up so route-level provider fallback can try Gemini.
    throw lastError ?? new Error("All Groq models failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to paraphrase text. Please try again later.";
    console.error("Groq API Error:", error);
    throw new Error(message);
  }
}
