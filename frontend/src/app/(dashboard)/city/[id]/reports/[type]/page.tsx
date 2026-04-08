"use client";

import { useParams } from "next/navigation";

export default function ReportTypePage() {
  const params = useParams();
  const cityId = params.id as string;
  const reportType = params.type as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Report: {reportType}</h1>
      <p className="text-muted-foreground">
        Report for city {cityId}. Coming in Phase 3.
      </p>
    </div>
  );
}
