// Small text helpers used for the "Suggest title" button and the live summary.
// They don't write new sentences; they pick the most useful ones already in the draft.
// That keeps them free, instant and offline.

const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have i in is it its of on or that the this to was we were will with you".split(" "),
);

const words = (text: string) =>
  (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).filter((word) => !STOP_WORDS.has(word));

/** Shortens text to `max` characters without cutting a word in half. */
function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** The first line that has text in it usually says what the draft is about. */
export const suggestTitle = (text: string) => clip(text.split("\n").find((line) => line.trim()) ?? "Untitled", 60);

/**
 * Picks the most important sentences of the draft.
 * Idea: words the author repeats a lot are what the draft is about. So we count every
 * word (skipping filler like "the" and "and"), give each sentence the average count of
 * its words, keep the top few, and put them back in their original order.
 */
export function summarize(text: string, sentenceCount = 3) {
  const sentences = (text.match(/[^.!?\n]+[.!?]*/g) ?? []).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= sentenceCount) return clip(sentences.join(" "), 400);

  const frequency = new Map<string, number>();
  for (const word of words(text)) frequency.set(word, (frequency.get(word) ?? 0) + 1);
  const score = (sentence: string) => {
    const list = words(sentence);
    return list.reduce((sum, word) => sum + (frequency.get(word) ?? 0), 0) / (list.length || 1);
  };

  return sentences
    .map((sentence, index) => ({ sentence, index, score: score(sentence) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => a.index - b.index)
    .map(({ sentence }) => sentence)
    .join(" ");
}
