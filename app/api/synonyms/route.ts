import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { word, context } = await request.json();

    // Prevent LLM DoS/Wallet Exhaustion Attacks
    if (!word || typeof word !== "string" || word.length > 50) {
      return NextResponse.json({ error: "Invalid word length." }, { status: 400 });
    }

    if (context && (typeof context !== "string" || context.length > 2000)) {
      return NextResponse.json({ error: "Context string is too large." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API Key is missing." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const prompt = `Provide exactly 5 contextual synonyms for the word "${word}" based on the following sentence context. 
Context: "${context || word}"

Return ONLY a valid JSON object with a single key "synonyms" containing an array of strings. Do not include any other text, markdown formatting, or explanation.
Example output: {"synonyms": ["synonym1", "synonym2", "synonym3", "synonym4", "synonym5"]}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // Low temperature for more accurate/literal synonyms
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content || "[]";
    
    try {
      const parsed = JSON.parse(content);
      const synonyms = Array.isArray(parsed) ? parsed : (parsed.synonyms || []);
      return NextResponse.json({ synonyms: synonyms.slice(0, 5) });
    } catch {
      // Fallback parsing if LLM didn't return perfect JSON array
      const matches = content.match(/"([^"]+)"/g);
      if (matches) {
        const synonyms = matches.map(s => s.replace(/"/g, '')).filter(s => s.toLowerCase() !== word.toLowerCase());
        return NextResponse.json({ synonyms: synonyms.slice(0, 5) });
      }
      return NextResponse.json({ synonyms: [] });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Undefined error";
    console.error("Synonyms fetching failed:", msg);
    return NextResponse.json({ error: "Failed to fetch synonyms", synonyms: [] }, { status: 500 });
  }
}
