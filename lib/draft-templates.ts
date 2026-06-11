import type { Trend } from "@/lib/types";

type TrendInput = Pick<Trend, "title" | "source" | "summary">;

// Three Facebook post shapes: hook line, a few short lines, closing CTA or
// question. No hashtags, well under 300 words.
const templates: Array<(trend: TrendInput) => string> = [
  (t) =>
    [
      `Most people will scroll right past this: ${t.title}.`,
      "",
      "Here is why it matters:",
      "",
      t.summary,
      "",
      `Spotted via ${t.source}.`,
      "",
      "What's your take — overhyped or underrated? Tell us in the comments.",
    ].join("\n"),
  (t) =>
    [
      `${t.title} — and almost nobody is talking about it yet.`,
      "",
      t.summary,
      "",
      `We picked this up from ${t.source}, and it's worth a closer look.`,
      "",
      "Would this change how you do things? Share your thoughts below.",
    ].join("\n"),
  (t) =>
    [
      `Quick question: have you heard about ${t.title}?`,
      "",
      "If not, here's the short version:",
      "",
      t.summary,
      "",
      `Source: ${t.source}.`,
      "",
      "Follow the page so you don't miss the next one.",
    ].join("\n"),
];

export function generateFacebookDraft(trend: TrendInput): string {
  const pick = templates[Math.floor(Math.random() * templates.length)];
  return pick(trend);
}
