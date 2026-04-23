import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required to use Grammar Check." }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.length > 20000) {
      return NextResponse.json({ error: 'Invalid text provided. Maximum 20,000 characters allowed.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API Key is missing.' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const prompt = `You are a strict, expert copyeditor. Fix all spelling, punctuation, and grammatical errors in the text below. 
Rules:
1. ONLY fix grammar and spelling.
2. DO NOT change the user's tone, vocabulary, or stylistic choices unnecessarily. 
3. DO NOT expand or summarize the text.
4. Output ONLY the corrected text. Do not include any explanations, Markdown blocks, or conversational filler like "Here is the fixed text:".
5. Do not change the author's voice or make text sound more formal than the input.
6. If the text is already perfectly correct, return it exactly as it was provided.

User Text:
${text}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1, // very low to prevent hallucinations or creativity
    });

    const result = chatCompletion.choices[0]?.message?.content || "";

    if (!result) {
      throw new Error("Empty response from LLM");
    }

    return NextResponse.json({ result: result.trim() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Grammar Check API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
