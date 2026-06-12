import type { PostType } from "@/lib/facebook/types";

const TYPE_STYLES: Record<PostType, string> = {
  photo: "bg-emerald-400/10 text-emerald-300",
  video: "bg-blue-400/10 text-blue-300",
  reel: "bg-violet-400/10 text-violet-300",
  link: "bg-amber-400/10 text-amber-300",
  text: "bg-white/5 text-slate-400",
};

export function PostTypeBadge({ type }: { type: PostType }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${TYPE_STYLES[type]}`}
    >
      {type}
    </span>
  );
}

export function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        published
          ? "bg-emerald-400/10 text-emerald-300"
          : "bg-white/5 text-slate-400"
      }`}
    >
      {published ? "Published" : "Unpublished"}
    </span>
  );
}
