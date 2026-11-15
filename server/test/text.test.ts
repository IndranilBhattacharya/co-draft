import assert from "node:assert/strict";
import { test } from "node:test";

import { suggestTitle, summarize } from "../src/text.ts";

test("title is the first line, clipped at a word", () => {
  assert.equal(suggestTitle("\n  Launch plan for the new editor\nDetails follow."), "Launch plan for the new editor");
  assert.equal(suggestTitle("word ".repeat(30)).endsWith("word…"), true);
});

test("summary keeps the sentences about the main topic, in order", () => {
  const text =
    "The editor ships Friday. Lunch was pizza. The editor needs share links before Friday. " +
    "Someone left an umbrella. Share links in the editor expire after one hour.";
  assert.equal(
    summarize(text),
    "The editor ships Friday. The editor needs share links before Friday. Share links in the editor expire after one hour.",
  );
});
