import { PageHeaderSkeleton, PanelSkeleton } from "@/components/skeletons";

export default function MonetizationLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <PanelSkeleton className="mb-6 h-16" />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <PanelSkeleton className="h-72" />
        <PanelSkeleton className="h-72" />
      </div>
    </>
  );
}
