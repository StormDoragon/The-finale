import type { Trend } from "@/lib/types";

type TrendInput = Pick<Trend, "title" | "source" | "summary">;

type DraftTemplate = {
  marker: string;
  render: (trend: TrendInput) => string;
};

// Three Facebook post shapes: hook line, a few short lines, closing CTA or
// question. No hashtags, well under 300 words. Markers let regeneration keep
// rotating even when someone has lightly edited a generated draft.
const templates: DraftTemplate[] = [
  {
    marker: "Here is why it matters:",
    render: (t) =>
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
  },
  {
    marker: "it's worth a closer look.",
    render: (t) =>
      [
        `${t.title} — and almost nobody is talking about it yet.`,
        "",
        t.summary,
        "",
        `We picked this up from ${t.source}, and it's worth a closer look.`,
        "",
        "Would this change how you do things? Share your thoughts below.",
      ].join("\n"),
  },
  {
    marker: "If not, here's the short version:",
    render: (t) =>
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
  },
];

function contentHash(content: string): number {
  let hash = 0;
  for (const character of content) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function generateFacebookDraft(trend: TrendInput): string {
  const index = Math.floor(Math.random() * templates.length);
  return templates[index].render(trend);
}

export function regenerateFacebookDraft(
  trend: TrendInput,
  currentContent: string,
): string {
  const rendered = templates.map((template) => template.render(trend));
  const exactIndex = rendered.indexOf(currentContent);
  const markerIndex = templates.findIndex((template) =>
    currentContent.includes(template.marker),
  );
  const currentIndex =
    exactIndex >= 0
      ? exactIndex
      : markerIndex >= 0
        ? markerIndex
        : contentHash(currentContent) % templates.length;

  for (let offset = 1; offset < templates.length; offset += 1) {
    const nextContent = rendered[(currentIndex + offset) % templates.length];
    if (nextContent !== currentContent) return nextContent;
  }

  return rendered[(currentIndex + 1) % templates.length];
}
