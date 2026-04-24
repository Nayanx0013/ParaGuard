/**
 * preprocessor.ts
 * Gap 2: Word-level synonym replacement BEFORE sending to the LLM.
 * This removes the most obvious AI fingerprints so the LLM can focus on
 * higher-level structural rewrites rather than surface-level word swaps.
 */

// Weighted replacements — first option is used most often for variety
const REPLACEMENTS: Record<string, string[]> = {
  // Transition words
  'furthermore': ['what\'s more', 'and yet', 'on top of that', 'plus'],
  'moreover': ['beyond that', 'what\'s more', 'plus', 'and also'],
  'additionally': ['also', 'on top of that', 'and', 'plus'],
  'in addition': ['on top of that', 'also', 'plus'],
  'in conclusion': ['to wrap up', 'all in all', 'when you step back', 'simply put'],
  'in summary': ['to put it simply', 'basically', 'all in all', 'in short'],
  'to summarize': ['to put it simply', 'in short', 'basically'],
  'as a result': ['so', 'which means', 'because of this', 'and so'],
  'therefore': ['so', 'which is why', 'and that\'s why', 'hence'],
  'thus': ['so', 'as a result', 'which means'],
  'hence': ['so', 'that\'s why', 'which is why'],
  'consequently': ['as a result', 'so', 'because of this'],
  'nevertheless': ['even so', 'still', 'and yet', 'that said'],
  'nonetheless': ['even so', 'still', 'but still', 'and yet'],
  'however': ['but', 'that said', 'even so', 'still'],
  'although': ['even though', 'while', 'though'],
  'notwithstanding': ['despite that', 'even so', 'still'],

  // AI buzzwords
  'utilize': ['use', 'apply', 'work with'],
  'utilizes': ['uses', 'applies', 'works with'],
  'utilized': ['used', 'applied'],
  'utilization': ['use', 'usage'],
  'leverage': ['use', 'tap into', 'take advantage of'],
  'leverages': ['uses', 'taps into'],
  'leveraged': ['used', 'tapped into'],
  'implement': ['use', 'put in place', 'roll out'],
  'implements': ['uses', 'puts in place'],
  'implemented': ['used', 'put in place', 'rolled out'],
  'implementation': ['rollout', 'setup', 'use'],
  'seamlessly': ['smoothly', 'easily', 'naturally'],
  'seamless': ['smooth', 'easy', 'effortless'],
  'groundbreaking': ['genuinely new', 'innovative', 'fresh'],
  'cutting-edge': ['modern', 'latest', 'advanced'],
  'state-of-the-art': ['modern', 'advanced', 'latest'],
  'pivotal': ['key', 'crucial', 'central', 'important'],
  'robust': ['solid', 'strong', 'reliable'],
  'innovative': ['new', 'fresh', 'creative'],
  'delve': ['dig into', 'explore', 'look at'],
  'delves': ['digs into', 'explores', 'looks at'],
  'delved': ['dug into', 'explored', 'looked at'],
  'tapestry': ['mix', 'blend', 'combination'],
  'multifaceted': ['complex', 'varied', 'layered'],
  'holistic': ['overall', 'complete', 'broad'],
  'paradigm': ['approach', 'model', 'way of thinking'],
  'synergy': ['collaboration', 'teamwork', 'combined effect'],
  'ecosystem': ['environment', 'space', 'world'],
  'streamline': ['simplify', 'speed up', 'make easier'],
  'streamlines': ['simplifies', 'speeds up', 'makes easier'],
  'empower': ['help', 'enable', 'allow'],
  'empowers': ['helps', 'enables', 'allows'],
  'facilitate': ['help', 'make easier', 'support'],
  'facilitates': ['helps', 'makes easier', 'supports'],
  'foster': ['build', 'grow', 'encourage'],
  'fosters': ['builds', 'grows', 'encourages'],
  'enhance': ['improve', 'boost', 'strengthen'],
  'enhances': ['improves', 'boosts', 'strengthens'],
  'enhanced': ['improved', 'boosted', 'strengthened'],

  // Verbose AI phrases
  'it is important to note that': ['notably,', 'worth noting —', 'keep in mind:'],
  'it is worth noting that': ['notably,', 'worth mentioning —', 'interestingly,'],
  'it should be noted that': ['notably,', 'worth noting —'],
  'it can be seen that': ['clearly,', 'it\'s clear that', 'you can see that'],
  'it goes without saying': ['obviously', 'of course', 'clearly'],
  'needless to say': ['of course', 'obviously', 'naturally'],
  'at the end of the day': ['ultimately', 'when it comes down to it', 'in practice'],
  'in today\'s rapidly evolving': ['in today\'s', 'these days,', 'now that'],
  'in today\'s fast-paced': ['today,', 'these days,', 'in our current'],
  'as previously mentioned': ['as noted earlier', 'as I said', 'going back to that'],
  'as stated above': ['as mentioned', 'like I said', 'going back to that'],
  'due to the fact that': ['because', 'since', 'given that'],
  'in order to': ['to', 'so that'],
  'with regard to': ['about', 'on', 'regarding'],
  'with respect to': ['about', 'on', 'for'],
  'in terms of': ['for', 'when it comes to', 'regarding'],
  'a wide range of': ['many', 'various', 'a variety of'],
  'a number of': ['several', 'many', 'some'],
  'in the field of': ['in', 'within', 'across'],
  'plays a crucial role': ['is key', 'matters a lot', 'is central'],
  'plays a pivotal role': ['is key', 'plays a major part', 'is central'],
};

/**
 * Picks a replacement using weighted randomness — 
 * first option is 50% likely, subsequent options share the rest.
 */
function pickReplacement(options: string[]): string {
  if (options.length === 1) return options[0];
  const r = Math.random();
  if (r < 0.5) return options[0];
  const remaining = options.slice(1);
  return remaining[Math.floor(Math.random() * remaining.length)];
}

/**
 * preprocessText: Applies word-level synonym replacement before LLM rewriting.
 * Sorts by phrase length descending so multi-word phrases match before single words.
 */
export function preprocessText(text: string): string {
  // Sort keys by length descending to match longest phrases first
  const sortedKeys = Object.keys(REPLACEMENTS).sort((a, b) => b.length - a.length);

  let result = text;
  for (const phrase of sortedKeys) {
    const options = REPLACEMENTS[phrase];
    const replacement = pickReplacement(options);

    // Case-insensitive replacement, preserving sentence-start capitalisation
    result = result.replace(
      new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
      (match) => {
        // If the matched word starts with uppercase, capitalise the replacement
        if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      }
    );
  }

  return result;
}

/**
 * splitLongSentences: Post-processing pass to break run-on sentences.
 * Splits sentences over ~55 words at natural conjunction break points.
 */
export function splitLongSentences(text: string): string {
  const SPLIT_CONJUNCTIONS = /,\s+(and|but|so|yet|while|which|where|when|because|although|though|as|if)\s+/gi;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  return sentences.map(sentence => {
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount <= 45) return sentence;

    // Find the best split point: a conjunction after position 40% into the sentence
    const minSplitChar = Math.floor(sentence.length * 0.35);
    let splitIndex = -1;
    let match: RegExpExecArray | null;
    SPLIT_CONJUNCTIONS.lastIndex = minSplitChar;
    
    const regex = new RegExp(SPLIT_CONJUNCTIONS.source, 'gi');
    regex.lastIndex = minSplitChar;

    while ((match = regex.exec(sentence)) !== null) {
      splitIndex = match.index;
      break; // take the first match after the minimum split point
    }

    if (splitIndex === -1) return sentence;

    // Split at the comma before the conjunction
    const first = sentence.slice(0, splitIndex).trim();
    const second = sentence.slice(splitIndex).replace(/^,\s*/, '').trim();

    // Capitalise the second fragment
    const secondCapped = second.charAt(0).toUpperCase() + second.slice(1);

    // Ensure first part ends with a period
    const firstEnds = /[.!?]$/.test(first) ? first : first + '.';
    return `${firstEnds} ${secondCapped}`;
  }).join(' ');
}

/**
 * countAIMarkers: Quick check of how many AI patterns remain in text.
 * Used to decide whether to escalate the humanization level.
 */
export function countAIMarkers(text: string): number {
  const lowerText = text.toLowerCase();
  return Object.keys(REPLACEMENTS).filter(phrase =>
    lowerText.includes(phrase.toLowerCase())
  ).length;
}
