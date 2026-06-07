import type { Post, Trend } from "@/lib/types";

export const demoTrends: Trend[] = [
  {
    id: "demo-1",
    title: "People are choosing smaller, more intentional online communities",
    source: "Community report",
    url: "https://example.com/community-report",
    summary:
      "Audiences are moving toward focused spaces that feel useful, human, and easier to trust.",
    status: "new",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "demo-2",
    title:
      "Behind-the-scenes posts continue to outperform polished brand content",
    source: "Social listening",
    url: "https://example.com/social-listening",
    summary:
      "Simple process posts are earning stronger replies because they create a natural opening for conversation.",
    status: "used",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
  },
  {
    id: "demo-3",
    title: "Practical AI education is replacing broad hype",
    source: "Industry newsletter",
    url: "https://example.com/ai-education",
    summary:
      "Readers want specific examples and honest limitations instead of generalized predictions.",
    status: "used",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
  },
];

export const demoPosts: Post[] = [
  {
    id: "post-1",
    trend_id: "demo-2",
    platform: "facebook",
    content:
      "The content people remember is rarely the most polished. It is the moment you show the work, the lesson, or the decision behind the result. What part of your process could you share this week?",
    status: "draft",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    approved_at: null,
    published_at: null,
    trends: { title: demoTrends[1].title },
  },
  {
    id: "post-2",
    trend_id: "demo-3",
    platform: "facebook",
    content:
      "AI becomes useful when we stop asking what it can do in theory and start asking which small, repeated task it can make clearer today. Start with one workflow. Keep the human judgment. Measure what actually changed.",
    status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    approved_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    published_at: null,
    trends: { title: demoTrends[2].title },
  },
  {
    id: "post-3",
    trend_id: null,
    platform: "facebook",
    content:
      "A clear message creates room for better conversations. This week, remove one unnecessary sentence from the story you tell about your work.",
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    approved_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];
