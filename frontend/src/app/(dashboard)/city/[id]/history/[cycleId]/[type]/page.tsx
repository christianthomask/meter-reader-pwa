"use client";

import { useParams } from "next/navigation";

export default function HistoryReportPage() {
  const params = useParams();
  const cityId = params.id as string;
  const cycleId = params.cycleId as string;
  const reportType = params.type as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History: {reportType}</h1>
      <p className="text-muted-foreground">
        Historical report for city {cityId}, cycle {cycleId}. Coming in Phase 5.
      </p>
    </div>
  );
}
