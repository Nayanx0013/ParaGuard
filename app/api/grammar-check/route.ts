import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

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

    // Use LanguageTool Public API (Free, No API Key)
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', 'en-US');

    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`LanguageTool returned ${response.status}`);
    }

    const data = await response.json();
    let fixedText = text;

    if (data.matches && data.matches.length > 0) {
      // Sort matches by offset descending so we can apply them from the end of the string to the beginning
      // This prevents earlier offset changes from breaking later offsets
      const sortedMatches = [...data.matches].sort((a: any, b: any) => b.offset - a.offset);

      for (const match of sortedMatches) {
        if (match.replacements && match.replacements.length > 0) {
          const replacement = match.replacements[0].value;
          fixedText = 
            fixedText.substring(0, match.offset) + 
            replacement + 
            fixedText.substring(match.offset + match.length);
        }
      }
    }

    return NextResponse.json({ result: fixedText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Grammar Check API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
