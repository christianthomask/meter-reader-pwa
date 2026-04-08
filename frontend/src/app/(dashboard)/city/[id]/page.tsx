"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Camera,
  RefreshCw,
  ShieldCheck,
  Search,
  Download,
} from "lucide-react";

// TODO: Replace with real API calls
const mockCityData = {
  id: "1",
  name: "Grover Beach",
  status: "active",
  started: "2026-03-25",
  totalMeters: 847,
  metersRead: 612,
  unreadMeters: 235,
  toReview: 71,
  toReread: 4,
  totalCertified: 108,
};

export default function CityDashboardPage() {
  const params = useParams();
  const cityId = params.id as string;
  const city = mockCityData;

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{city.name}</h1>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium text-green-600">{city.status}</span>
            {" | "}Started: {city.started}
          </p>
        </div>
        {city.status === "ready_to_download" && (
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Download Reads
          </button>
        )}
      </div>

      {/* Meter counts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Meters</p>
          <p className="text-3xl font-bold">{city.totalMeters.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Meters Read</p>
          <p className="text-3xl font-bold text-green-600">{city.metersRead.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Unread</p>
          <p className="text-3xl font-bold text-orange-600">{city.unreadMeters.toLocaleString()}</p>
        </div>
      </div>

      {/* Action cards - clickable counts */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          href={`/city/${cityId}/rereads`}
          className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-destructive"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <RefreshCw className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{city.toReread}</p>
            <p className="text-sm text-muted-foreground">to Reread</p>
          </div>
        </Link>

        <Link
          href={`/city/${cityId}/review`}
          className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-orange-400"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
            <Camera className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{city.toReview}</p>
            <p className="text-sm text-muted-foreground">to Review</p>
          </div>
        </Link>

        <Link
          href={`/city/${cityId}/certified`}
          className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-green-400"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{city.totalCertified}</p>
            <p className="text-sm text-muted-foreground">Total Certified</p>
          </div>
        </Link>
      </div>

      {/* Meter Lookup */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-lg font-semibold">Meter Lookup</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by meter ID, address, or account number..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}
