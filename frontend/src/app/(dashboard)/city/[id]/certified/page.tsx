"use client";

import { useParams } from "next/navigation";

export default function CertifiedPage() {
  const params = useParams();
  const cityId = params.id as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Certified Reports</h1>
      <p className="text-muted-foreground">
        Certified reports for city {cityId}. Coming in Phase 4.
      </p>
    </div>
  );
}
