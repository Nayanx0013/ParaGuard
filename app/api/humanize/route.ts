import { NextResponse } from 'next/server';
import { detectAIPhrases } from '@/lib/phraseDetector';
import { scoreBurstiness } from '@/lib/burstinessScorer';
import { HUMANIZER_PROMPTS } from '@/lib/humanizer/prompts';
import { scorePerplexity } from '@/lib/perplexityClient';
import { calibrateBurstinessScore, getCorpusAwarePromptInjection } from '@/lib/humanizer/corpusCalibration';
import { preprocessText, splitLongSentences, countAIMarkers } from '@/lib/humanizer/preprocessor';

/**
 * AI Humanize Pipeline v2 — 6-layer process
 * Layer 1: Diagnostics
 * Layer 2: Pre-processing (synonym replacement, sentence splitting)
 * Layer 3: 3-Pass LLM Rewriting with adaptive level escalation
 * Layer 4: Post-processing (sentence splitting on LLM output)
 * Layer 5: Calibration + scoring
 * Layer 6: Perplexity verification (optional)
 */
export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }
    if (text.trim().length < 20) {
      return NextResponse.json({ error: 'Text too short to humanize' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error('[humanize] GROQ_API_KEY is not set');
      return NextResponse.json({ error: 'System configuration error' }, { status: 500 });
    }

    // ── Layer 1: Initial Diagnostics ─────────────────────────────────────────
    const initialPhraseRes = detectAIPhrases(text);
    const initialBurstRes  = scoreBurstiness(text);
    const initialAIMarkers = countAIMarkers(text);

    console.log(`[humanize] Input: ${text.length} chars, aiScore=${initialPhraseRes.aiScore}, humanLikelihood=${initialBurstRes.humanLikelihoodScore}, markers=${initialAIMarkers}`);

    // ── Layer 2: Pre-processing ───────────────────────────────────────────────
    // Run word-level synonym replacement BEFORE the LLM so it can focus on
    // structural rewrites rather than surface-level substitutions.
    let currentText = preprocessText(text);
    currentText = splitLongSentences(currentText);

    const markersAfterPreprocess = countAIMarkers(currentText);
    console.log(`[humanize] After preprocess: markers ${initialAIMarkers} → ${markersAfterPreprocess}`);

    // Determine starting intensity: higher AI score = start at higher level
    let level = initialBurstRes.humanLikelihoodScore < 35
      ? 3
      : initialBurstRes.humanLikelihoodScore < 60
        ? 2
        : 1;

    // Corpus-aware prompt injection (avoid patterns + human transitions)
    const corpusInjection = getCorpusAwarePromptInjection() || '';

    let passesUsed  = 0;
    let finalScore  = 0;

    // ── Layer 3: 3-Pass LLM Rewriting ────────────────────────────────────────
    while (passesUsed < 3) {
      passesUsed++;

      const promptKey    = `LEVEL_${level}`;
      const systemPrompt = (HUMANIZER_PROMPTS[promptKey] || HUMANIZER_PROMPTS['LEVEL_1']) + corpusInjection;

      console.log(`[humanize] Pass ${passesUsed} — level ${level}, input ${currentText.length} chars`);

      let groqRes: Response;
      try {
        groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: currentText  },
            ],
            temperature: 0.85,
            max_tokens: 2048,
          }),
        });
      } catch (fetchErr) {
        console.error(`[humanize] Pass ${passesUsed}: network error fetching Groq:`, fetchErr);
        break;
      }

      if (!groqRes.ok) {
        const errBody = await groqRes.text();
        console.error(`[humanize] Pass ${passesUsed}: Groq ${groqRes.status}:`, errBody);
        break;
      }

      const data = await groqRes.json();
      const newContent: string | undefined = data?.choices?.[0]?.message?.content;

      if (!newContent || typeof newContent !== 'string' || newContent.trim().length === 0) {
        console.error(`[humanize] Pass ${passesUsed}: empty content from Groq`, JSON.stringify(data).slice(0, 300));
        break;
      }

      currentText = newContent.trim();
      console.log(`[humanize] Pass ${passesUsed}: received ${currentText.length} chars`);

      // ── Layer 4: Post-processing after each LLM pass ─────────────────────
      // Split any run-on sentences the LLM produced
      currentText = splitLongSentences(currentText);

      // ── Layer 5: Calibrated scoring ───────────────────────────────────────
      const stats = scoreBurstiness(currentText);
      finalScore  = calibrateBurstinessScore(stats.humanLikelihoodScore);

      const remainingMarkers = countAIMarkers(currentText);
      console.log(`[humanize] Pass ${passesUsed}: humanScore=${Math.round(finalScore)}, markers=${remainingMarkers}`);

      // Exit early if sufficiently humanized
      if (finalScore > 72) {
        console.log(`[humanize] Early exit at pass ${passesUsed} — score ${Math.round(finalScore)} > 72`);
        break;
      }

      // Escalate intensity for next pass if still too robotic
      if (level < 3) level++;

      // Brief pause to respect rate limits
      if (passesUsed < 3) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    // Fallback: re-score if loop broke before scoring (e.g. Groq error on pass 1)
    if (finalScore === 0) {
      const stats = scoreBurstiness(currentText);
      finalScore  = calibrateBurstinessScore(stats.humanLikelihoodScore);
    }

    // ── Layer 6: Perplexity Verification (optional — HF Spaces) ──────────────
    const pResult        = await scorePerplexity(currentText);
    const perplexityScore = pResult?.normalized ?? 0;

    // Combined score: if perplexity unavailable, rely solely on burstiness
    const combinedScore = perplexityScore > 0
      ? Math.round((finalScore * 0.65) + (perplexityScore * 0.35))
      : Math.round(finalScore);

    // External AI Detector integration (Replaces GPTZero)
    let gptzeroScore: number | null = null;
    const detectorUrl = process.env.NEXT_PUBLIC_HF_DETECTOR_URL;
    if (detectorUrl) {
      try {
        const detRes = await fetch(`${detectorUrl}/detect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: currentText }),
        });
        if (detRes.ok) {
          const detData = await detRes.json();
          if (typeof detData.human_score === 'number') {
            gptzeroScore = detData.human_score;
            console.log(`[humanize] HF Detector human score: ${gptzeroScore}%`);
          }
        }
      } catch (detErr) {
        console.warn('[humanize] HF Detector call failed (non-critical):', detErr);
      }
    }

    // Final combined score factoring in external detector if available
    const finalCombined = gptzeroScore !== null
      ? Math.round((combinedScore * 0.4) + (gptzeroScore * 0.6))
      : combinedScore;

    console.log(`[humanize] Complete — passes=${passesUsed} burstScore=${Math.round(finalScore)} perplexity=${perplexityScore} gptzero=${gptzeroScore} combined=${finalCombined}`);

    return NextResponse.json({
      humanizedText:     currentText,
      originalScore:     Math.round(initialBurstRes.humanLikelihoodScore),
      phraseScore:       initialPhraseRes.aiScore,
      finalScore:        Math.round(finalScore),
      perplexityScore:   Math.round(perplexityScore),
      gptzeroScore,
      combinedScore:     finalCombined,
      passesUsed,
      markersRemoved:    Math.max(0, initialAIMarkers - countAIMarkers(currentText)),
      verdict:           finalCombined > 68 ? 'Likely Human' : finalCombined > 38 ? 'Borderline' : 'Likely AI',
      weaknesses:        initialBurstRes.weaknesses,
    });

  } catch (error) {
    console.error('[humanize] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}