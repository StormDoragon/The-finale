import Anthropic from "@anthropic-ai/sdk";
import type { Trend } from "@/lib/types";

// claude-sonnet-4-20250514 retires 2026-06-15; claude-sonnet-4-6 is its
// drop-in replacement. Override with ANTHROPIC_MODEL to pin a specific ID.
const DEFAULT_MODEL = "claude-sonnet-4-6";

export function hasAnthropicEnv() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function buildSystemPrompt(brandVoice: string) {
  return [
    "You write Facebook posts for a single-publisher page. You turn a saved trend (title, source, and the editor's quick summary) into one publish-ready post.",
    "",
    "Format rules:",
    "- Open with a hook line: a bold claim or a question.",
    "- Follow with 3 to 5 short, punchy lines. One idea per line, with a blank line between lines.",
    "- End with a call to action or a question that invites comments.",
    "- No hashtags.",
    "- Maximum 300 words.",
    "- Return only the post text. No preamble, no quotes around the post, no markdown formatting.",
    brandVoice
      ? `\nBrand voice — write in this voice:\n${brandVoice}`
      : "",
  ].join("\n");
}

export async function generateFacebookDraft(
  trend: Pick<Trend, "title" | "source" | "summary">,
  brandVoice: string,
): Promise<string> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(brandVoice),
    messages: [
      {
        role: "user",
        content: [
          `Trend title: ${trend.title}`,
          `Source: ${trend.source}`,
          `Editor's summary: ${trend.summary}`,
          "",
          "Write the Facebook post draft.",
        ].join("\n"),
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("The model returned an empty draft.");
  return text;
}

// Used when ANTHROPIC_API_KEY is not configured, so the workflow still
// produces a reviewable draft instead of failing.
export function templateFacebookDraft(
  trend: Pick<Trend, "title" | "summary">,
): string {
  return `${trend.title}\n\n${trend.summary}\n\nWhat are you noticing in your corner of the world?`;
}
