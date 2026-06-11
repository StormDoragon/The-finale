import type { Trend } from "@/lib/types";
import type { WritingStyle } from "@/lib/writing-styles";

type TrendInput = Pick<Trend, "title" | "source" | "summary">;

type DraftTemplate = {
  marker: string;
  render: (trend: TrendInput) => string;
};

// Each style has three Facebook post shapes: a hook, short readable lines,
// and a closing CTA or question. No hashtags, and each stays well under 300
// words. Markers let regeneration rotate after light editorial changes.
const templates: Record<WritingStyle, DraftTemplate[]> = {
  contrarian: [
    {
      marker: "The popular take misses the point:",
      render: (t) =>
        [
          `Unpopular opinion: the conversation around ${t.title} is focused on the wrong thing.`,
          "",
          "The popular take misses the point:",
          "",
          t.summary,
          "",
          `That is the signal behind the headline from ${t.source}.`,
          "",
          "Do you agree, or is the conventional view right this time?",
        ].join("\n"),
    },
    {
      marker: "But the obvious conclusion is not the useful one.",
      render: (t) =>
        [
          `${t.title} sounds like proof that everyone should follow the crowd.`,
          "",
          "But the obvious conclusion is not the useful one.",
          "",
          t.summary,
          "",
          `Seen via ${t.source}.`,
          "",
          "What is everyone else overlooking here?",
        ].join("\n"),
    },
    {
      marker: "Here is the counterpoint:",
      render: (t) =>
        [
          `Before we celebrate ${t.title}, it is worth asking a harder question.`,
          "",
          "Here is the counterpoint:",
          "",
          t.summary,
          "",
          `The original signal comes from ${t.source}.`,
          "",
          "Would you bet on this trend—or against it? Tell us why.",
        ].join("\n"),
    },
  ],
  educational: [
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
  ],
  breaking_news: [
    {
      marker: "What we know right now:",
      render: (t) =>
        [
          `Breaking: ${t.title}.`,
          "",
          "What we know right now:",
          "",
          t.summary,
          "",
          `This update comes via ${t.source}.`,
          "",
          "We will be watching what happens next. What is your first reaction?",
        ].join("\n"),
    },
    {
      marker: "The latest development:",
      render: (t) =>
        [
          `Just in: ${t.title}.`,
          "",
          "The latest development:",
          "",
          t.summary,
          "",
          `Reported by ${t.source}.`,
          "",
          "Share this with someone who needs the update.",
        ].join("\n"),
    },
    {
      marker: "Here is the quick briefing:",
      render: (t) =>
        [
          `News alert: ${t.title}.`,
          "",
          "Here is the quick briefing:",
          "",
          t.summary,
          "",
          `Source: ${t.source}.`,
          "",
          "Is this a major shift or a short-lived headline?",
        ].join("\n"),
    },
  ],
  story: [
    {
      marker: "Then something changed:",
      render: (t) =>
        [
          "It started with a signal most people could easily miss.",
          "",
          t.title,
          "",
          "Then something changed:",
          "",
          t.summary,
          "",
          `The story surfaced through ${t.source}.`,
          "",
          "Where do you think this story goes next?",
        ].join("\n"),
    },
    {
      marker: "Here is the moment that matters:",
      render: (t) =>
        [
          `Picture this: ${t.title}.`,
          "",
          "Here is the moment that matters:",
          "",
          t.summary,
          "",
          `We found this chapter via ${t.source}.`,
          "",
          "Has something like this happened in your world?",
        ].join("\n"),
    },
    {
      marker: "But that was only the beginning.",
      render: (t) =>
        [
          `${t.title} could have been just another passing headline.`,
          "",
          "But that was only the beginning.",
          "",
          t.summary,
          "",
          `The details come from ${t.source}.`,
          "",
          "Every trend has a human story. What stands out to you in this one?",
        ].join("\n"),
    },
  ],
};

function contentHash(content: string): number {
  let hash = 0;
  for (const character of content) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function generateFacebookDraft(
  trend: TrendInput,
  writingStyle: WritingStyle,
): string {
  const styleTemplates = templates[writingStyle];
  const index = Math.floor(Math.random() * styleTemplates.length);
  return styleTemplates[index].render(trend);
}

export function regenerateFacebookDraft(
  trend: TrendInput,
  currentContent: string,
  writingStyle: WritingStyle,
): string {
  const styleTemplates = templates[writingStyle];
  const rendered = styleTemplates.map((template) => template.render(trend));
  const exactIndex = rendered.indexOf(currentContent);
  const markerIndex = styleTemplates.findIndex((template) =>
    currentContent.includes(template.marker),
  );
  const currentIndex =
    exactIndex >= 0
      ? exactIndex
      : markerIndex >= 0
        ? markerIndex
        : contentHash(currentContent) % styleTemplates.length;

  for (let offset = 1; offset < styleTemplates.length; offset += 1) {
    const nextContent = rendered[(currentIndex + offset) % styleTemplates.length];
    if (nextContent !== currentContent) return nextContent;
  }

  return rendered[(currentIndex + 1) % styleTemplates.length];
}
