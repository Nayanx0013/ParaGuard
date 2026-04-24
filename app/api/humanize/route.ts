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
    if (!groqKey) return NextResponse.json({ error: 'System configuration error' }, { status: 500 });

    let currentText = text;
    let passesUsed = 0;
    let finalScore = 0;
    let perplexityScore = 0;

    // Layer 1: Initial Diagnostics
    const initialPhraseRes = detectAIPhrases(text);
    const initialBurstRes = scoreBurstiness(text);

    // Determine starting intensity level based on robotic risk
    let level = initialBurstRes.humanLikelihoodScore < 40 ? 3 : (initialBurstRes.humanLikelihoodScore < 60 ? 2 : 1);

    // Layer 2: The 3-Pass Refinement Loop
    while (passesUsed < 3) {
      passesUsed++;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { 
              role: "system", 
              content: HUMANIZER_PROMPTS[`LEVEL_${level}`] + getCorpusAwarePromptInjection() 
            },
            { role: "user", content: currentText }
          ],
          temperature: 0.8
        })
      });

      if (!groqRes.ok) break;

      const data = await groqRes.json();
      currentText = data.choices[0].message.content;

      // Layer 3: Calibration
      const stats = scoreBurstiness(currentText);
      finalScore = calibrateBurstinessScore(stats.humanLikelihoodScore);

      // Layer 4: Quality Check - Exit early if text is sufficiently humanized
      if (finalScore > 75) break;

      // Increase intensity if text remains robotic
      if (level < 3) level++;

      // 1-second delay to manage rate limits and allow "breathing room" between passes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Layer 5: Perplexity Verification
    const pResult = await scorePerplexity(currentText);
    perplexityScore = pResult?.normalized || 0;

    // Calculate final combined certainty
    const combinedScore = Math.round((finalScore * 0.7) + (perplexityScore * 0.3));

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
    console.error("Humanizer Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}