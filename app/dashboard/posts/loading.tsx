import {
  PageHeaderSkeleton,
  PanelSkeleton,
  RowListSkeleton,
} from "@/components/skeletons";

export default function PostsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <PanelSkeleton className="mb-6 h-24" />
      <RowListSkeleton rows={8} />
    </>
  );
}
