import {
  PageHeaderSkeleton,
  PanelSkeleton,
  StatGridSkeleton,
} from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <StatGridSkeleton count={6} columns={3} />
      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <PanelSkeleton className="h-80" />
        <PanelSkeleton className="h-80" />
      </div>
    </>
  );
}
