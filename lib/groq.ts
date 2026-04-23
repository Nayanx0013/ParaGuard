import Groq from "groq-sdk";

function getModeSpecificRules(tone: string): string {
  const normalizedTone = tone.trim().toLowerCase();

  if (normalizedTone === "expand") {
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

  if (normalizedTone === "ai humanizer") {
    return `AI Humanizer mode rules (STRICT):
1. Your ONLY goal is to make this text pass as human-written on GPTZero, Turnitin, and similar AI detectors.
2. SENTENCE STRUCTURE — break AI patterns aggressively:
   - Mix very short sentences (4-6 words) with longer ones (20+ words) randomly
   - Start some sentences with "And", "But", "So", "Look," — humans do this naturally
   - Occasionally split what would be one long AI sentence into two short punchy ones
   - Never write 3+ sentences of similar length in a row
3. VOCABULARY — remove all AI-favoured words:
   - Replace: "utilize" → "use", "facilitate" → "help", "demonstrate" → "show"
   - Replace: "furthermore" → "also", "in addition" → "plus", "however" → "but"
   - Replace: "it is important to note" → just say the thing directly
   - Replace: "overall well-being" → "how you feel overall", "inner peace" → "feeling calm inside"
   - Never use: "delve", "crucial", "significant", "notably", "it's worth noting"
4. ADD HUMAN IMPERFECTIONS:
   - Add filler phrases naturally: "honestly", "I mean", "you know", "kind of", "pretty much"
   - Add mild personal emphasis: "which is actually huge", "and that really matters"
   - Use contractions everywhere: "it's", "don't", "can't", "you'll", "that's"
   - Occasionally end a sentence with a preposition — humans do that all the time
5. FLOW — make it feel slightly unpolished:
   - Avoid perfect parallel structure (AI loves "A, B, and C" lists — break them up)
   - Let some thoughts trail naturally rather than wrapping up perfectly
   - Do NOT summarize or conclude neatly — humans often just stop
6. DO NOT add spelling mistakes or grammatical errors
7. Preserve all original meaning and facts exactly`;
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
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ] as const;

    let lastError: Error | null = null;

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

        if (!isRetryable) throw lastError;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw lastError ?? new Error("All Groq models failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to paraphrase text. Please try again later.";
    console.error("Groq API Error:", error);
    throw new Error(message);
  }
}