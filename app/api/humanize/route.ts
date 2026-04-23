import { NextResponse } from 'next/server';
import { detectAIPhrases } from '@/lib/phraseDetector';
import { scoreBurstiness } from '@/lib/burstinessScorer';
import { HUMANIZER_PROMPTS } from '@/lib/humanizer/prompts';
import { scorePerplexity } from '@/lib/perplexityClient';
import { calibrateBurstinessScore, getCorpusAwarePromptInjection } from '@/lib/humanizer/corpusCalibration';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    const initialPhraseRes = detectAIPhrases(text);
    const initialBurstRes = scoreBurstiness(text);
    
    let currentText = text;
    let finalScore = initialBurstRes.humanLikelihoodScore;
    let passesUsed = 0;
    let perplexityScore = null;

    let level = 1;
    if (finalScore < 40) level = 3;
    else if (finalScore < 60) level = 2;

    while (passesUsed < 3) {
      passesUsed++;
      
      const groqReq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: HUMANIZER_PROMPTS[`LEVEL_${level}`] + "\n\n" + getCorpusAwarePromptInjection(level as 1|2|3) },
                { role: "user", content: currentText }
            ]
        })
      });
      
      if (!groqReq.ok) break;
      
      const groqData = await groqReq.json();
      currentText = groqData.choices[0].message.content;
      
      const burstRes = scoreBurstiness(currentText);
      finalScore = calibrateBurstinessScore(burstRes.humanLikelihoodScore);
      
      const pScore = await scorePerplexity(currentText);
      if (pScore) perplexityScore = pScore.normalized;
      
      // combinedScore removed to fix unused variable warning
      
      if ((perplexityScore && perplexityScore > 65) || (!perplexityScore && finalScore > 70)) {
         break; // Good enough
      }
      
      if (level < 3) level++;
      
      // Delay for rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

      const finalCombinedScore = ((perplexityScore || finalScore) + finalScore) / 2;

      return NextResponse.json({
        humanizedText: currentText,
        originalScore: initialBurstRes.humanLikelihoodScore,
        phraseScore: initialPhraseRes.aiScore,
        finalScore: finalScore,
        perplexityScore: perplexityScore,
        combinedScore: finalCombinedScore,
        passesUsed,
        verdict: finalCombinedScore > 70 ? 'Likely Human' : 'Borderline',
        weaknesses: initialBurstRes.weaknesses,
        improvements: []
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}