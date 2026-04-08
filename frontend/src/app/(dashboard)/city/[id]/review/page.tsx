"use client";

import { useParams } from "next/navigation";

export default function MeterReviewPage() {
  const params = useParams();
  const cityId = params.id as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meter Review</h1>
      <p className="text-muted-foreground">
        Review exception readings for city {cityId}. Coming in Phase 2.
      </p>
    </div>
  );
}
