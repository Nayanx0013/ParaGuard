import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { word } = await request.json();

    if (!word || typeof word !== "string" || word.length > 50) {
      return NextResponse.json({ error: "Invalid word length." }, { status: 400 });
    }

    // Use Datamuse API (100% Free, No API Key, 100k req/day)
    // ml = "Means Like"
    const response = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=5`);
    
    if (!response.ok) {
      throw new Error(`Datamuse API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Extract just the word strings and filter out exact matches
    const synonyms = data
      .map((item: { word: string }) => item.word)
      .filter((s: string) => s.toLowerCase() !== word.toLowerCase())
      .slice(0, 5);

    return NextResponse.json({ synonyms });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Undefined error";
    console.error("Synonyms fetching failed:", msg);
    return NextResponse.json({ error: "Failed to fetch synonyms", synonyms: [] }, { status: 500 });
  }
}
