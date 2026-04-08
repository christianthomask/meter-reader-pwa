"use client";

import { useParams } from "next/navigation";

export default function LoadManagerPage() {
  const params = useParams();
  const cityId = params.id as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Load Manager</h1>
      <p className="text-muted-foreground">
        Assign readers to routes for city {cityId}. Coming in Phase 2.
      </p>
    </div>
  );
}
