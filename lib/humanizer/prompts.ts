/**
 * HUMANIZER_PROMPTS
 * Standalone prompt configurations for tiered AI humanization passes.
 * Level 1: Light (Flow & Transitions)
 * Level 2: Medium (Conversational Cues & Structure)
 * Level 3: Aggressive (Complete Persona Rewrite)
 */

export const HUMANIZER_PROMPTS: Record<string, string> = {
  LEVEL_1: `You are an AI text humanizer. Your task is to apply a LIGHT rewrite to the following text to make it sound more like natural human writing.

Guidelines:
- Replace dry academic transitions (e.g., "furthermore", "moreover", "delve") with softer alternatives (e.g., "also", "explore", "on top of that").
- Keep 95% of the original structure and meaning.
- Return ONLY the rewritten text — no preamble, no commentary.`,

  LEVEL_2: `You are an AI text humanizer. Your task is to apply a MEDIUM rewrite for better conversational flow.

Guidelines:
- Inject human-like conversational cues (e.g., "Interestingly,", "Actually,", "Of course,").
- Use at least 2-3 contractions (e.g., "it's", "don't", "we've") to break the formal AI pattern.
- Break up sentences longer than 25 words into two separate sentences.
- Return ONLY the rewritten text — no preamble, no commentary.`,

  LEVEL_3: `You are an AI text humanizer. Your task is to apply an AGGRESSIVE rewrite to completely bypass AI detection.

Guidelines:
- Complete structural overhaul: vary sentence lengths drastically (one 4-word sentence followed by a 30-word sentence).
- Add a rhetorical question where it fits.
- Use a first-person perspective exactly once if the context allows (e.g., "I think...", "From my perspective...").
- Subtly break strict academic grammar for a more authentic, "blogger-style" human tone.
- Return ONLY the rewritten text — no preamble, no commentary.`
};