export type Trend = {
  id: string;
  title: string;
  source: string;
  url: string | null;
  summary: string;
  status: string;
  created_at: string;
};

export type Post = {
  id: string;
  trend_id: string | null;
  platform: string;
  content: string;
  status: "draft" | "approved" | "published" | "rejected";
  created_at: string;
  approved_at: string | null;
  published_at: string | null;
  trends?: { title: string } | null;
};
