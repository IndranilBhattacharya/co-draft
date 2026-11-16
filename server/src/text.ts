// Small text helpers used for the "Suggest title" button and the live summary.
// They don't write new sentences; they pick the most useful ones already in the draft.
// That keeps them free, instant and offline.

const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have i in is it its of on or that the this to was we were will with you".split(" "),
);

const words = (text: string) =>
  (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).filter((word) => !STOP_WORDS.has(word));

/** Strips common markdown prefixes from a heading line before making it a title. */
function cleanHeading(line: string) {
  return line
    .trim()
    .replace(/^#{1,6}\s+/, "") // # Header
    .replace(/^[-*+]\s+/, "") // - Bullet
    .replace(/^>\s+/, "") // > Quote
    .replace(/^\*\*([^*]+)\*\*$/, "$1") // **Bold Title**
    .trim();
}

/** Shortens text to `max` characters cleanly without cutting abruptly or stripping everything. */
function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  // Try to break at a word boundary
  const sliced = clean.slice(0, max);
  const atWord = sliced.replace(/\s+\S*$/, "");
  // If cutting at a word leaves a reasonable title (at least 25 chars or half of max), use it.
  // Otherwise keep up to max characters so we don't reduce a line to a single word.
  const result = atWord.length >= Math.min(25, Math.floor(max / 2)) ? atWord : sliced.trim();
  return `${result}…`;
}

/** The first line that has text in it usually says what the draft is about. */
export const suggestTitle = (text: string) => {
  const firstLine = text.split("\n").find((line) => line.trim()) ?? "Untitled";
  const cleaned = cleanHeading(firstLine) || firstLine.trim();
  return clip(cleaned, 100);
};

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
