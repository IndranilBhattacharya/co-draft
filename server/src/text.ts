// Free, offline text helpers: no AI model, no API key, no extra memory.
// ponytail: extractive (picks existing sentences). Plug an LLM in here if you ever want generated prose.

const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have i in is it its of on or that the this to was we were will with you".split(" "),
);

const words = (text: string) =>
  (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).filter((word) => !STOP_WORDS.has(word));

/** Cuts at a word boundary so titles and previews never end mid-word. */
export function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** The first non-empty line is almost always what a document is about. */
export const suggestTitle = (text: string) => clip(text.split("\n").find((line) => line.trim()) ?? "Untitled", 60);

/**
 * Classic extractive summary: words that repeat across the document are its topic,
 * so the sentences richest in those words make the best summary. Kept in original order.
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
