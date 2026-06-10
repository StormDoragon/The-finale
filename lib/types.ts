export type TrendStatus = "new" | "used";
export type PostStatus = "draft" | "approved" | "published" | "rejected";

export type Trend = {
  id: string;
  owner_id?: string;
  title: string;
  source: string;
  url: string | null;
  summary: string;
  status: TrendStatus;
  created_at: string;
};

export type Post = {
  id: string;
  owner_id?: string;
  trend_id: string | null;
  platform: string;
  content: string;
  editorial_note?: string | null;
  status: PostStatus;
  created_at: string;
  approved_at: string | null;
  published_at: string | null;
  trends?: { title: string } | null;
};
