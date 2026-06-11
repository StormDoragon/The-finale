import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeTrend,
  buildRankedDrafts,
  generateFacebookDraft,
  regenerateFacebookDraft,
} from "../lib/copy-engine.ts";

const STYLES = ["contrarian", "educational", "breaking_news", "story"] as const;

const richTrend = {
  title: "Small businesses are quietly winning the AI race",
  source: "Industry Weekly",
  summary:
    "A new survey found that 73% of small businesses now use AI tools daily, up from 21% last year. Most of them spend under $100 a month. The biggest gains came from automating customer replies and bookkeeping.",
};

const plainTrend = {
  title: "A useful trend",
  source: "Trusted source",
  summary: "A concise summary of what changed.",
};

test("analyzeTrend extracts the most striking stat and the key fact", () => {
  const analysis = analyzeTrend(richTrend);
  assert.equal(analysis.stat, "73%");
  assert.match(analysis.keyFact, /73% of small businesses/);
  assert.ok(analysis.body.length >= 1);
  assert.ok(analysis.supporting.length >= 1);
});

test("analyzeTrend ignores bare numbers and years when hunting for stats", () => {
  const analysis = analyzeTrend({
    title: "T",
    source: "S",
    summary: "In 2026, the group of 12 companies met 3 times.",
  });
  assert.equal(analysis.stat, null);
});

test("analyzeTrend keeps abbreviations like U.S. inside one sentence", () => {
  const analysis = analyzeTrend({
    title: "T",
    source: "S",
    summary: "The U.S. market reacted slowly. Europe moved first.",
  });
  assert.equal(analysis.body.length, 1);
  assert.match(analysis.body[0], /The U\.S\. market reacted slowly\. Europe moved first\./);
});

test("analyzeTrend cleans shouting titles and news prefixes", () => {
  const analysis = analyzeTrend({
    title: "BREAKING: EVERYONE IS SWITCHING TO SMALLER AI MODELS.",
    source: "S",
    summary: "Smaller models are cheaper to run.",
  });
  assert.equal(analysis.title, "Everyone is switching to smaller AI models");
});

test("a summary sentence that repeats the title is not duplicated in the draft", () => {
  const trend = {
    title: "People are leaving big social networks",
    source: "Community report",
    summary:
      "People are leaving big social networks. Niche forums grew 40% this year.",
  };
  for (const style of STYLES) {
    const draft = generateFacebookDraft(trend, style);
    const matches = draft
      .toLowerCase()
      .split("people are leaving big social networks").length - 1;
    assert.ok(matches <= 1, `${style} draft repeats the title: ${draft}`);
  }
});

test("generateFacebookDraft is deterministic", () => {
  for (const style of STYLES) {
    assert.equal(
      generateFacebookDraft(richTrend, style),
      generateFacebookDraft(richTrend, style),
    );
  }
});

test("a striking stat leads the hook when the trend has one", () => {
  for (const style of ["contrarian", "educational", "breaking_news"] as const) {
    const draft = generateFacebookDraft(richTrend, style);
    const hook = draft.split("\n")[0];
    assert.match(hook, /73%/, `${style} hook should lead with the stat: ${hook}`);
  }
});

test("every style produces a complete draft with attribution for plain trends", () => {
  for (const style of STYLES) {
    const draft = generateFacebookDraft(plainTrend, style);
    assert.ok(draft.includes("Trusted source"), `${style} draft is missing the source`);
    assert.ok(draft.includes(plainTrend.summary), `${style} draft is missing the summary`);
    assert.doesNotMatch(draft, /undefined|\bnull\b/);
    assert.doesNotMatch(draft, /\.\./, `${style} draft has doubled punctuation`);
  }
});

test("each style ranks at least three distinct candidates", () => {
  for (const style of STYLES) {
    const ranked = buildRankedDrafts(plainTrend, style);
    assert.ok(ranked.length >= 3, `${style} has too few candidates`);
    assert.equal(new Set(ranked.map((d) => d.content)).size, ranked.length);
  }
});

test("regenerateFacebookDraft cycles through every ranked candidate", () => {
  for (const style of STYLES) {
    const total = buildRankedDrafts(richTrend, style).length;
    const seen = new Set<string>();
    let current = generateFacebookDraft(richTrend, style);
    seen.add(current);
    for (let i = 1; i < total; i += 1) {
      current = regenerateFacebookDraft(richTrend, current, style);
      seen.add(current);
    }
    assert.equal(seen.size, total, `${style} regeneration repeated a draft early`);
    assert.ok(
      seen.has(regenerateFacebookDraft(richTrend, current, style)),
      `${style} regeneration should wrap back around`,
    );
  }
});

test("regenerateFacebookDraft recognizes a lightly edited draft by its marker", () => {
  const original = generateFacebookDraft(richTrend, "educational");
  const edited = original.replace(/73%/g, "almost three quarters");
  const regenerated = regenerateFacebookDraft(richTrend, edited, "educational");
  assert.notEqual(regenerated, edited);
  assert.notEqual(regenerated, original);
});

test("regenerateFacebookDraft stays within the selected style", () => {
  const regenerated = regenerateFacebookDraft(
    plainTrend,
    "an existing custom draft",
    "breaking_news",
  );
  assert.match(regenerated, /Breaking:|Just in:|developing right now/);
  assert.doesNotMatch(regenerated, /Unpopular opinion|scroll right past/);
});

test("hooks stay inside the feed-friendly length window", () => {
  for (const style of STYLES) {
    for (const trend of [richTrend, plainTrend]) {
      const hook = generateFacebookDraft(trend, style).split("\n")[0];
      assert.ok(hook.length <= 160, `${style} hook is too long: ${hook}`);
      assert.ok(hook.length >= 10, `${style} hook is too short: ${hook}`);
    }
  }
});
