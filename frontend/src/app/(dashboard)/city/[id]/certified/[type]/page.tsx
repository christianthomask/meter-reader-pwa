"use client";

import { useParams } from "next/navigation";

export default function CertifiedTypePage() {
  const params = useParams();
  const cityId = params.id as string;
  const certType = params.type as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Certified: {certType}</h1>
      <p className="text-muted-foreground">
        Certified report for city {cityId}. Coming in Phase 4.
      </p>
    </div>
  );
}
