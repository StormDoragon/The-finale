/** A row in the Supabase page_tokens table. Server-side only. */
export type PageTokenRow = {
  id: string;
  page_id: string;
  page_name: string | null;
  access_token: string;
  created_at: string;
};
