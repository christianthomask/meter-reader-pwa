"use client";

import { useParams } from "next/navigation";

export default function ReportsPage() {
  const params = useParams();
  const cityId = params.id as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-muted-foreground">
        View reports for city {cityId}. Coming in Phase 3.
      </p>
    </div>
  );
}
