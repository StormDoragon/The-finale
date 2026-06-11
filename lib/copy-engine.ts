import type { Trend } from "@/lib/types";
import type { WritingStyle } from "@/lib/writing-styles";

export type TrendInput = Pick<Trend, "title" | "source" | "summary">;

/**
 * Zero-cost local copywriting engine.
 *
 * Instead of pasting the raw trend fields into a fixed template, the engine:
 *
 * 1. Analyzes the trend — cleans up the title (shouting caps, "BREAKING:"
 *    prefixes, stray punctuation), splits the summary into sentences, finds
 *    the most striking statistic and the most concrete fact, and formats the
 *    body into short, scannable Facebook-style paragraphs.
 * 2. Renders every template available for the selected writing style.
 *    Templates that need a statistic or supporting detail only activate when
 *    the trend actually contains one.
 * 3. Scores each candidate on hook strength (length, concreteness, curiosity)
 *    and overall readability, then returns the highest-scoring draft.
 *
 * Generation is deterministic: the same trend always produces the same best
 * draft, and "Regenerate" walks down the ranked list of alternatives.
 */

export type TrendAnalysis = {
  /** Cleaned headline without trailing punctuation. */
  title: string;
  source: string;
  /** Most striking figure in the summary, e.g. "73%", "$4 billion", "3x". */
  stat: string | null;
  /** Most concrete summary sentence — the strongest single fact. */
  keyFact: string;
  /** Full summary formatted as short paragraphs. */
  body: string[];
  /** Body paragraphs excluding the key fact, for fact-led openers. */
  supporting: string[];
};

const TITLE_PREFIX =
  /^(?:breaking|just in|news alert|update|exclusive|report|watch|trending)\s*[:\-–—]\s*/i;

// Acronyms preserved when taming an all-caps title.
const KEEP_CAPS = new Set([
  "AI", "API", "AR", "CEO", "CFO", "CTO", "EU", "EV", "FBI", "GDP", "GPT",
  "IPO", "NASA", "NBA", "NFL", "TV", "UK", "UN", "US", "USA", "VR",
]);

function isShouting(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 8) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length > 0.8;
}

function toSentenceCase(text: string): string {
  const lowered = text
    .split(" ")
    .map((word) => {
      const letters = word.replace(/[^A-Za-z]/g, "");
      return KEEP_CAPS.has(letters) ? word : word.toLowerCase();
    })
    .join(" ");
  return lowered.charAt(0).toUpperCase() + lowered.slice(1);
}

function cleanTitle(raw: string): string {
  let title = raw.trim().replace(/\s+/g, " ");
  title = title.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
  title = title.replace(TITLE_PREFIX, "");
  title = title.replace(/[.\s]+$/g, "");
  if (isShouting(title)) title = toSentenceCase(title);
  return title;
}

const ABBREVIATION_END =
  /\b(?:[A-Z]|Dr|Mr|Mrs|Ms|St|vs|etc|Inc|Corp|No|U\.S|U\.K|E\.U)\.$/;

function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=["'“(]?[A-Z0-9])/);
  const merged: string[] = [];
  for (const part of parts) {
    const previous = merged[merged.length - 1];
    if (previous && ABBREVIATION_END.test(previous)) {
      merged[merged.length - 1] = `${previous} ${part}`;
    } else {
      merged.push(part.trim());
    }
  }
  return merged.filter(Boolean);
}

// Bare numbers (including years) never qualify; a figure needs a unit that
// makes it land on its own in a hook.
const STAT_PATTERNS: Array<{ pattern: RegExp; priority: number }> = [
  { pattern: /\d[\d,.]*\s?(?:%|percent)/gi, priority: 4 },
  { pattern: /[$€£]\s?\d[\d,.]*(?:\s?(?:million|billion|trillion))?/gi, priority: 3 },
  { pattern: /\d[\d,.]*\s?(?:million|billion|trillion)\b/gi, priority: 2 },
  { pattern: /\b\d+(?:\.\d+)?x\b/gi, priority: 1 },
];

function extractStat(text: string): string | null {
  let best: { value: string; priority: number; index: number } | null = null;
  for (const { pattern, priority } of STAT_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const value = match[0].trim().replace(/[,.]+$/, "");
      const candidate = { value, priority, index: match.index ?? 0 };
      if (
        !best ||
        candidate.priority > best.priority ||
        (candidate.priority === best.priority && candidate.index < best.index)
      ) {
        best = candidate;
      }
    }
  }
  return best?.value ?? null;
}

const MOMENTUM_WORDS =
  /\b(first|record|fastest|biggest|largest|double[ds]?|tripled?|surged?|jump(?:ed)?|dropp?(?:ed)?|fell|soar(?:ed)?|bann?(?:ed)?|launch(?:ed)?|leak(?:ed)?|confirm(?:ed)?|overtook|beat)\b/i;

function scoreSentence(sentence: string): number {
  let score = 0;
  if (/\d/.test(sentence)) score += 3;
  if (/\d[\d,.]*\s?(?:%|percent)/i.test(sentence)) score += 2;
  if (/[$€£]|\b(?:million|billion|trillion)\b/i.test(sentence)) score += 2;
  if (MOMENTUM_WORDS.test(sentence)) score += 2;
  const words = sentence.split(/\s+/).length;
  if (words >= 6 && words <= 30) score += 1;
  if (words > 45) score -= 2;
  return score;
}

function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function toParagraphs(sentences: string[]): string[] {
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(" "));
  }
  return paragraphs;
}

function asSentence(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

function quoted(text: string): string {
  return text.includes('"') ? text : `"${text}"`;
}

export function analyzeTrend(trend: TrendInput): TrendAnalysis {
  const title = cleanTitle(trend.title);
  const source = trend.source.trim();
  const allSentences = splitSentences(trend.summary);

  // Drop a summary sentence that merely repeats the title, unless that would
  // leave the body empty.
  const titleKey = normalizeForComparison(title);
  const deduped = allSentences.filter(
    (sentence) => normalizeForComparison(sentence) !== titleKey,
  );
  const sentences = deduped.length ? deduped : allSentences;

  let keyFact = sentences[0] ?? asSentence(title);
  let bestScore = -Infinity;
  for (const sentence of sentences) {
    const score = scoreSentence(sentence);
    if (score > bestScore) {
      bestScore = score;
      keyFact = sentence;
    }
  }

  return {
    title,
    source,
    stat: extractStat(trend.summary),
    keyFact: asSentence(keyFact),
    body: toParagraphs(sentences),
    supporting: toParagraphs(sentences.filter((s) => s !== keyFact)),
  };
}

type DraftTemplate = {
  /** Stable phrase used to recognize a lightly edited draft on regenerate. */
  marker: string;
  when?: (analysis: TrendAnalysis) => boolean;
  render: (analysis: TrendAnalysis) => string;
};

function compose(...blocks: Array<string | string[]>): string {
  return blocks
    .flat()
    .filter((block) => block.trim())
    .join("\n\n");
}

const hasStat = (a: TrendAnalysis) => a.stat !== null;
const hasSupporting = (a: TrendAnalysis) => a.supporting.length > 0;

const templates: Record<WritingStyle, DraftTemplate[]> = {
  contrarian: [
    {
      marker: "drawing the wrong conclusion",
      when: hasStat,
      render: (a) =>
        compose(
          `${a.stat}. That number is making the rounds — and almost everyone is drawing the wrong conclusion from it.`,
          "Here's what's actually going on:",
          a.body,
          `(via ${a.source})`,
          "Agree, or is the conventional take right this time? Make your case in the comments.",
        ),
    },
    {
      marker: "misses the part that actually matters",
      render: (a) =>
        compose(
          `The popular take on ${quoted(a.title)} misses the part that actually matters.`,
          a.body,
          `That's the real story behind the headline from ${a.source}.`,
          "What is everyone else overlooking here?",
        ),
    },
    {
      marker: "is not the story most people think it is",
      render: (a) =>
        compose(
          `Unpopular opinion: ${quoted(a.title)} is not the story most people think it is.`,
          "Look closer:",
          a.body,
          `(via ${a.source})`,
          "Would you bet on this trend — or against it? Tell us why.",
        ),
    },
    {
      marker: "is the least useful one",
      render: (a) =>
        compose(
          `The loudest opinion about ${quoted(a.title)} is the least useful one.`,
          "Here's the quieter truth:",
          a.body,
          `(via ${a.source})`,
          "Do you agree, or is the crowd right this time?",
        ),
    },
  ],
  educational: [
    {
      marker: "Remember that number",
      when: hasStat,
      render: (a) =>
        compose(
          `${a.stat}. Remember that number.`,
          "It tells you almost everything about where this is heading:",
          a.body,
          `(Spotted via ${a.source}.)`,
          "Overhyped or underrated? Tell us in the comments.",
        ),
    },
    {
      marker: "Let's unpack that",
      when: hasSupporting,
      render: (a) =>
        compose(
          a.keyFact,
          "Let's unpack that:",
          a.supporting,
          `(Spotted via ${a.source}.)`,
          "Would this change how you do things? Share your thoughts below.",
        ),
    },
    {
      marker: "The few who stop will be ahead",
      render: (a) =>
        compose(
          "Most people will scroll right past this. The few who stop will be ahead of everyone else.",
          `${asSentence(a.title)} Here's the short version:`,
          a.body,
          `Source: ${a.source}.`,
          "Save this post, and follow the page so you don't miss the next breakdown.",
        ),
    },
    {
      marker: "If you only read one thing",
      render: (a) =>
        compose(
          "If you only read one thing about this today, make it this.",
          asSentence(a.title),
          a.body,
          `Source: ${a.source}.`,
          "What's your take — overhyped or underrated?",
        ),
    },
    {
      marker: "had you heard about this yet",
      render: (a) =>
        compose(
          "Quick question: had you heard about this yet?",
          asSentence(a.title),
          a.body,
          `Source: ${a.source}.`,
          "Follow the page so you don't miss the next one.",
        ),
    },
  ],
  breaking_news: [
    {
      marker: "That's not a typo",
      when: hasStat,
      render: (a) =>
        compose(
          `${a.stat}. That's not a typo.`,
          `${asSentence(a.title)} And it's moving fast:`,
          a.body,
          `Reported by ${a.source}.`,
          "Big shift or short-lived headline? Call it in the comments.",
        ),
    },
    {
      marker: "Breaking:",
      render: (a) =>
        compose(
          `Breaking: ${asSentence(a.title)}`,
          "What we know so far:",
          a.body,
          `This update comes via ${a.source}. We'll keep following it.`,
          "What's your first reaction?",
        ),
    },
    {
      marker: "Just in:",
      render: (a) =>
        compose(
          `Just in: ${asSentence(a.title)}`,
          "The quick briefing:",
          a.body,
          `Reported by ${a.source}.`,
          "Share this with someone who needs the update.",
        ),
    },
    {
      marker: "developing right now",
      render: (a) =>
        compose(
          `This is developing right now: ${asSentence(a.title)}`,
          a.body,
          `We're tracking it via ${a.source} and will post what changes.`,
          "What happens next? Tell us your read.",
        ),
    },
  ],
  story: [
    {
      marker: "almost everyone overlooked",
      render: (a) =>
        compose(
          "It started as a detail almost everyone overlooked.",
          asSentence(a.title),
          "Then the story got interesting:",
          a.body,
          `(The full thread surfaced via ${a.source}.)`,
          "Where do you think this goes next?",
        ),
    },
    {
      marker: "Nobody expected what came next",
      when: hasSupporting,
      render: (a) =>
        compose(
          "Nobody expected what came next.",
          `It began quietly: ${a.keyFact}`,
          a.supporting,
          `(via ${a.source})`,
          "What's the ending you'd predict?",
        ),
    },
    {
      marker: "Picture this:",
      render: (a) =>
        compose(
          `Picture this: ${asSentence(a.title)}`,
          "Here's the moment that matters:",
          a.body,
          `(We found this one via ${a.source}.)`,
          "Has something like this happened in your world?",
        ),
    },
    {
      marker: "It wasn't.",
      render: (a) =>
        compose(
          `${quoted(a.title)} could have been just another headline. It wasn't.`,
          a.body,
          `That's the part worth remembering. (via ${a.source})`,
          "Every trend has a human story. What stands out to you in this one?",
        ),
    },
  ],
};

const CURIOSITY_WORDS =
  /\b(nobody|everyone|wrong|missed|missing|overlooked|actually|before you|right now|not a typo|unpopular|quietly)\b/i;

// Facebook shows roughly the first 120 characters of a post in the mobile
// feed before truncating, so the opening line carries almost all the weight.
function scoreDraft(content: string): number {
  const lines = content.split("\n").filter((line) => line.trim());
  const hook = lines[0] ?? "";
  let score = 0;

  if (hook.length >= 20 && hook.length <= 120) score += 3;
  else if (hook.length > 160) score -= 2;
  if (/\d/.test(hook)) score += 2;
  if (CURIOSITY_WORDS.test(hook)) score += 1;

  const words = content.split(/\s+/).length;
  if (words >= 60 && words <= 180) score += 2;
  else if (words > 240) score -= 2;

  return score;
}

type RankedDraft = { marker: string; content: string };

export function buildRankedDrafts(
  trend: TrendInput,
  writingStyle: WritingStyle,
): RankedDraft[] {
  const analysis = analyzeTrend(trend);
  return templates[writingStyle]
    .filter((template) => !template.when || template.when(analysis))
    .map((template, index) => ({
      marker: template.marker,
      content: template.render(analysis),
      index,
    }))
    .map((draft) => ({ ...draft, score: scoreDraft(draft.content) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ marker, content }) => ({ marker, content }));
}

export function generateFacebookDraft(
  trend: TrendInput,
  writingStyle: WritingStyle,
): string {
  return buildRankedDrafts(trend, writingStyle)[0].content;
}

function contentHash(content: string): number {
  let hash = 0;
  for (const character of content) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function regenerateFacebookDraft(
  trend: TrendInput,
  currentContent: string,
  writingStyle: WritingStyle,
): string {
  const ranked = buildRankedDrafts(trend, writingStyle);
  const exactIndex = ranked.findIndex((d) => d.content === currentContent);
  const markerIndex = ranked.findIndex((d) =>
    currentContent.includes(d.marker),
  );
  const currentIndex =
    exactIndex >= 0
      ? exactIndex
      : markerIndex >= 0
        ? markerIndex
        : contentHash(currentContent) % ranked.length;

  for (let offset = 1; offset < ranked.length; offset += 1) {
    const next = ranked[(currentIndex + offset) % ranked.length].content;
    if (next !== currentContent) return next;
  }

  return ranked[(currentIndex + 1) % ranked.length].content;
}
