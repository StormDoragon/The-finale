import assert from "node:assert/strict";
import test from "node:test";
import {
  generateFacebookDraft,
  regenerateFacebookDraft,
} from "../lib/draft-templates.ts";
import {
  optionalHttpUrl,
  optionalText,
  postTransition,
  requiredText,
  uuid,
  ValidationError,
  writingStyle,
} from "../lib/validation.ts";

const validId = "c9b96c42-1b59-4ab2-9c3f-90f06f5ec03a";

test("requiredText trims valid input and rejects empty or oversized values", () => {
  assert.equal(requiredText("  useful signal  ", "Title", 20), "useful signal");
  assert.throws(() => requiredText("   ", "Title", 20), ValidationError);
  assert.throws(() => requiredText("too long", "Title", 3), ValidationError);
});

test("optionalText normalizes blank values to null", () => {
  assert.equal(optionalText("  ", "Voice", 20), null);
  assert.equal(optionalText("  direct  ", "Voice", 20), "direct");
});

test("optionalHttpUrl accepts web URLs and blocks unsafe protocols", () => {
  assert.equal(optionalHttpUrl("https://example.com/report"), "https://example.com/report");
  assert.equal(optionalHttpUrl(""), null);
  assert.throws(() => optionalHttpUrl("javascript:alert(1)"), ValidationError);
  assert.throws(() => optionalHttpUrl("not a URL"), ValidationError);
});

test("uuid accepts canonical IDs and rejects malformed identifiers", () => {
  assert.equal(uuid(validId, "trend"), validId);
  assert.throws(() => uuid("demo-1", "trend"), ValidationError);
});

test("postTransition enforces the editorial state machine", () => {
  assert.deepEqual(postTransition("approved"), { next: "approved", current: "draft" });
  assert.deepEqual(postTransition("published"), {
    next: "published",
    current: "approved",
  });
  assert.throws(() => postTransition("draft"), ValidationError);
  assert.throws(() => postTransition("deleted"), ValidationError);
});


test("writingStyle accepts supported values and rejects invalid input", () => {
  assert.equal(writingStyle("contrarian"), "contrarian");
  assert.equal(writingStyle("educational"), "educational");
  assert.equal(writingStyle("breaking_news"), "breaking_news");
  assert.equal(writingStyle("story"), "story");
  assert.throws(() => writingStyle("salesy"), ValidationError);
  assert.throws(() => writingStyle(null), ValidationError);
});

const trend = {
  title: "A useful trend",
  source: "Trusted source",
  summary: "A concise summary of what changed.",
};

test("regenerateFacebookDraft rotates through different templates", () => {
  const first = regenerateFacebookDraft(trend, "an existing custom draft", "educational");
  const second = regenerateFacebookDraft(trend, first, "educational");
  const third = regenerateFacebookDraft(trend, second, "educational");

  assert.notEqual(first, second);
  assert.notEqual(second, third);
  assert.equal(regenerateFacebookDraft(trend, third, "educational"), first);
});

test("regenerateFacebookDraft recognizes a lightly edited template", () => {
  const generated = [
    "Quick question: have you heard about A useful trend?",
    "",
    "If not, here's the short version:",
    "",
    "An editor changed this summary.",
    "",
    "Source: Trusted source.",
    "",
    "Follow the page so you don't miss the next one.",
  ].join("\n");

  const regenerated = regenerateFacebookDraft(trend, generated, "educational");
  assert.notEqual(regenerated, generated);
  assert.match(regenerated, /Here is why it matters:/);
});


test("generateFacebookDraft uses a distinct template set for every style", () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    assert.match(generateFacebookDraft(trend, "contrarian"), /Unpopular opinion:/);
    assert.match(generateFacebookDraft(trend, "educational"), /Here is why it matters:/);
    assert.match(generateFacebookDraft(trend, "breaking_news"), /Breaking:/);
    assert.match(generateFacebookDraft(trend, "story"), /Then something changed:/);
  } finally {
    Math.random = originalRandom;
  }
});

test("regenerateFacebookDraft stays within the selected style", () => {
  const regenerated = regenerateFacebookDraft(
    trend,
    "an existing educational draft",
    "breaking_news",
  );

  assert.match(regenerated, /Breaking:|Just in:|News alert:/);
  assert.doesNotMatch(regenerated, /Here is why it matters:/);
});

test("every writing style rotates through exactly three templates", () => {
  const styles = [
    "contrarian",
    "educational",
    "breaking_news",
    "story",
  ] as const;

  for (const style of styles) {
    const first = regenerateFacebookDraft(trend, "custom draft", style);
    const second = regenerateFacebookDraft(trend, first, style);
    const third = regenerateFacebookDraft(trend, second, style);

    assert.equal(new Set([first, second, third]).size, 3);
    assert.equal(regenerateFacebookDraft(trend, third, style), first);
  }
});
