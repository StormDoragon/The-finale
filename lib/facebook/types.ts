// Shapes shared by the Facebook Graph API client and the dashboard UI.

export type GraphError = {
  message: string;
  code?: number;
  /** True when Facebook reports the token as expired or invalidated (code 190). */
  expiredToken: boolean;
};

export type GraphResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: GraphError };

export type PageProfile = {
  id: string;
  name: string;
  category: string | null;
  fanCount: number;
  followersCount: number | null;
  about: string | null;
  link: string | null;
  pictureUrl: string | null;
  coverUrl: string | null;
};

export type PostType = "photo" | "video" | "reel" | "link" | "text";

export type PagePost = {
  id: string;
  pageId: string;
  pageName: string;
  message: string;
  createdTime: string;
  type: PostType;
  thumbnailUrl: string | null;
  permalinkUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  /** post_impressions_unique — null when insights are unavailable for the post. */
  reach: number | null;
  isPublished: boolean;
};

/** One day of an insights time series. `date` is the Graph API end_time. */
export type InsightPoint = { date: string; value: number };

/** Insight metric name → daily points, oldest first. */
export type InsightSeries = Record<string, InsightPoint[]>;

// Raw Graph API response fragments (only the fields the app reads).

export type RawPageProfile = {
  id: string;
  name: string;
  category?: string;
  fan_count?: number;
  followers_count?: number;
  about?: string;
  link?: string;
  picture?: { data?: { url?: string } };
  cover?: { source?: string };
};

export type RawAttachment = { media_type?: string; type?: string };

export type RawInsightValue = {
  value?: number | Record<string, number>;
  end_time?: string;
};

export type RawInsight = {
  name: string;
  period?: string;
  values?: RawInsightValue[];
};

export type RawPost = {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  status_type?: string;
  is_published?: boolean;
  shares?: { count?: number };
  likes?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  attachments?: { data?: RawAttachment[] };
  insights?: { data?: RawInsight[] };
};
