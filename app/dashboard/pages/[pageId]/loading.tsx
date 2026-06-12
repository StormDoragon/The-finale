import { PanelSkeleton } from "@/components/skeletons";

export default function PageDetailLoading() {
  return (
    <>
      <PanelSkeleton className="h-64" />
      <div className="mt-6">
        <PanelSkeleton className="h-72" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <PanelSkeleton className="h-72" />
        <PanelSkeleton className="h-72" />
      </div>
    </>
  );
}
