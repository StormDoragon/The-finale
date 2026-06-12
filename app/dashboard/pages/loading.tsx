import { PageHeaderSkeleton, PanelSkeleton } from "@/components/skeletons";

export default function PagesLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <PanelSkeleton key={index} className="h-44" />
        ))}
      </div>
    </>
  );
}
