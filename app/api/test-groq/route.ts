import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to verify Groq connectivity.
 * Hit GET /api/test-groq to check if your API key and model work.
 * DELETE THIS FILE before going to production.
 */
export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    groqKeyPresent: !!groqKey,
    groqKeyPrefix: groqKey ? groqKey.slice(0, 8) + '...' : 'MISSING',
  };

  if (!groqKey) {
    return NextResponse.json({ ...diagnostics, error: 'GROQ_API_KEY not set' }, { status: 500 });
  }

  // Step 1: List available models
  try {
    const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${groqKey}` },
    });
    if (!modelsRes.ok) {
      const errText = await modelsRes.text();
      diagnostics.modelsError = `${modelsRes.status}: ${errText}`;
    } else {
      const modelsData = await modelsRes.json();
      diagnostics.availableModels = modelsData.data?.map((m: { id: string }) => m.id).sort() || [];
      diagnostics.targetModelAvailable = (diagnostics.availableModels as string[]).includes('llama-3.3-70b-versatile');
    }
  } catch (err) {
    diagnostics.modelsError = String(err);
  }

  // Step 2: Try a simple completion
  try {
    const testRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Rewrite the following text to sound more human. Return ONLY the rewritten text.' },
          { role: 'user', content: 'Furthermore, it is important to note that AI is transforming education.' },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!testRes.ok) {
      const errText = await testRes.text();
      diagnostics.completionError = `${testRes.status}: ${errText}`;
      diagnostics.completionWorking = false;
    } else {
      const data = await testRes.json();
      const output = data?.choices?.[0]?.message?.content;
      diagnostics.completionWorking = true;
      diagnostics.testInput = 'Furthermore, it is important to note that AI is transforming education.';
      diagnostics.testOutput = output || 'NO CONTENT IN RESPONSE';
      diagnostics.textChanged = output !== 'Furthermore, it is important to note that AI is transforming education.';
      diagnostics.rawChoices = data?.choices?.[0];
    }
  } catch (err) {
    diagnostics.completionError = String(err);
    diagnostics.completionWorking = false;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
