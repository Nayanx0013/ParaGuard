import { NextResponse } from 'next/server';
import { detectAIPhrases } from '@/lib/phraseDetector';
import { scoreBurstiness } from '@/lib/burstinessScorer';
import { HUMANIZER_PROMPTS } from '@/lib/humanizer/prompts';
import { scorePerplexity } from '@/lib/perplexityClient';
import { calibrateBurstinessScore, getCorpusAwarePromptInjection } from '@/lib/humanizer/corpusCalibration';

/**
 * AI Humanize Pipeline: A 5-layer process to transform AI text into human-like prose.
 */
export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error('[humanize] GROQ_API_KEY is not set');
      return NextResponse.json({ error: 'System configuration error' }, { status: 500 });
    }

    let currentText = text;
    let passesUsed = 0;
    let finalScore = 0;
    let perplexityScore = 0;

    // Layer 1: Initial Diagnostics
    const initialPhraseRes = detectAIPhrases(text);
    const initialBurstRes = scoreBurstiness(text);

    // Determine starting intensity level based on robotic risk
    let level = initialBurstRes.humanLikelihoodScore < 40 ? 3 : (initialBurstRes.humanLikelihoodScore < 60 ? 2 : 1);

    // BUG FIX #3: getCorpusAwarePromptInjection() could return "" if corpus not loaded.
    // That's fine — we just guard against "undefined" being concatenated.
    const corpusInjection = getCorpusAwarePromptInjection() || "";

    // Layer 2: The 3-Pass Refinement Loop
    while (passesUsed < 3) {
      passesUsed++;

      const systemPrompt = (HUMANIZER_PROMPTS[`LEVEL_${level}`] || HUMANIZER_PROMPTS['LEVEL_1']) + corpusInjection;

      console.log(`[humanize] Pass ${passesUsed}, level ${level}, input length: ${currentText.length}`);

      let groqRes: Response;
      try {
        groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: currentText }
            ],
            temperature: 0.8
          })
        });
      } catch (fetchErr) {
        // BUG FIX #1: Network-level fetch errors were silently swallowed.
        console.error(`[humanize] Pass ${passesUsed}: fetch to Groq failed:`, fetchErr);
        break;
      }

      // BUG FIX #1: Non-200 from Groq was silently breaking the loop but keeping
      // currentText === original text. Now we log the actual error body.
      if (!groqRes.ok) {
        const errBody = await groqRes.text();
        console.error(`[humanize] Pass ${passesUsed}: Groq returned ${groqRes.status}:`, errBody);
        break;
      }

      const data = await groqRes.json();

      // BUG FIX #2: THE MAIN BUG.
      // data.choices[0].message.content could be undefined/null if Groq returns
      // a streaming response, a refusal, or a malformed payload.
      // Previously: currentText = data.choices[0].message.content
      // If that is undefined, currentText becomes undefined, which then gets
      // JSON-serialised as null and the UI receives the original input text
      // from the stale React state. Fixed: only update if content is a non-empty string.
      const newContent: string | undefined = data?.choices?.[0]?.message?.content;

      if (!newContent || typeof newContent !== 'string' || newContent.trim().length === 0) {
        console.error(`[humanize] Pass ${passesUsed}: Groq response had no usable content.`, JSON.stringify(data).slice(0, 500));
        break;
      }

      currentText = newContent.trim();
      console.log(`[humanize] Pass ${passesUsed}: Got ${currentText.length} chars back from Groq`);

      // Layer 3: Calibration
      const stats = scoreBurstiness(currentText);
      finalScore = calibrateBurstinessScore(stats.humanLikelihoodScore);

      // Layer 4: Quality Check - Exit early if text is sufficiently humanized
      if (finalScore > 75) break;

      // Increase intensity if text remains robotic
      if (level < 3) level++;

      // 1-second delay to manage rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Layer 5: Perplexity Verification (optional — HF Spaces may be offline)
    const pResult = await scorePerplexity(currentText);
    perplexityScore = pResult?.normalized ?? 0;

    // BUG FIX #4: combinedScore was 0 when perplexity returned null because
    // finalScore was never set if the loop broke immediately (level 3, pass 1, break).
    // Now we re-score if finalScore is still 0.
    if (finalScore === 0) {
      const stats = scoreBurstiness(currentText);
      finalScore = calibrateBurstinessScore(stats.humanLikelihoodScore);
    }

    // Calculate final combined certainty.
    // If perplexity is unavailable (0), fall back entirely to burstiness score.
    const combinedScore = perplexityScore > 0
      ? Math.round((finalScore * 0.7) + (perplexityScore * 0.3))
      : Math.round(finalScore);

    console.log(`[humanize] Done. passesUsed=${passesUsed} finalScore=${finalScore} perplexity=${perplexityScore} combined=${combinedScore}`);

    return NextResponse.json({
      humanizedText: currentText,
      originalScore: Math.round(initialBurstRes.humanLikelihoodScore),
      phraseScore: initialPhraseRes.aiScore,
      finalScore: Math.round(finalScore),
      perplexityScore: Math.round(perplexityScore),
      combinedScore: combinedScore,
      passesUsed,
      verdict: combinedScore > 70 ? 'Likely Human' : (combinedScore > 40 ? 'Borderline' : 'Likely AI'),
      weaknesses: initialBurstRes.weaknesses
    });

  } catch (error) {
    console.error("[humanize] Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}