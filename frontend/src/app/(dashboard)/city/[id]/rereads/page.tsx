"use client";

import { useParams } from "next/navigation";

export default function RereadsPage() {
  const params = useParams();
  const cityId = params.id as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rereads</h1>
      <p className="text-muted-foreground">
        Manage reread queue for city {cityId}. Coming in Phase 2.
      </p>
    </div>
  );
}
