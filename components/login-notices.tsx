"use client";

import { useSearchParams } from "next/navigation";
import { Notice } from "@/components/notice";

export function LoginNotices() {
  const searchParams = useSearchParams();

  return (
    <Notice
      message={searchParams.get("message") ?? undefined}
      error={searchParams.get("error") ?? undefined}
    />
  );
}
