import {
  PageHeaderSkeleton,
  PanelSkeleton,
  StatGridSkeleton,
} from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <div className="mt-4">
        <StatGridSkeleton />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <PanelSkeleton className="h-64" />
        <PanelSkeleton className="h-64" />
      </div>
    </>
  );
}
