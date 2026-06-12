import {
  PageHeaderSkeleton,
  PanelSkeleton,
  RowListSkeleton,
} from "@/components/skeletons";

export default function SettingsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_.85fr]">
        <PanelSkeleton className="h-80" />
        <PanelSkeleton className="h-64" />
      </div>
      <div className="mt-6">
        <RowListSkeleton rows={3} />
      </div>
    </>
  );
}
