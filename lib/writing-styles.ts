export const WRITING_STYLE_OPTIONS = [
  {
    value: "contrarian",
    label: "Contrarian",
    description: "Challenge the obvious take and invite a thoughtful debate.",
  },
  {
    value: "educational",
    label: "Educational",
    description: "Explain what changed, why it matters, and what to do next.",
  },
  {
    value: "breaking_news",
    label: "Breaking News",
    description: "Lead with urgency and quickly summarize the latest development.",
  },
  {
    value: "story",
    label: "Story",
    description: "Use a narrative arc to make the trend relatable and memorable.",
  },
] as const;

export type WritingStyle = (typeof WRITING_STYLE_OPTIONS)[number]["value"];

export const DEFAULT_WRITING_STYLE: WritingStyle = "educational";

export function isWritingStyle(value: unknown): value is WritingStyle {
  return WRITING_STYLE_OPTIONS.some((option) => option.value === value);
}

export function resolveWritingStyle(value: unknown): WritingStyle {
  return isWritingStyle(value) ? value : DEFAULT_WRITING_STYLE;
}
