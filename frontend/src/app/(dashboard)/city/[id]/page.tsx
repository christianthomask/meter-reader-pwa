"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  RefreshCw,
  ShieldCheck,
  Search,
  Download,
  Eye,
  MapPin,
  Activity,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { useCityDetail, useCityCycle } from "@/hooks/use-city";
import { useMeterLookup } from "@/hooks/use-meter-lookup";
import type { CityStatus } from "@/types/api";

// ---- Status helpers ----

const statusConfig: Record<
  CityStatus,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Active", color: "text-green-700", bg: "bg-green-100 border-green-300" },
  read_pending: { label: "Read Pending", color: "text-amber-700", bg: "bg-amber-100 border-amber-300" },
  complete: { label: "Complete", color: "text-blue-700", bg: "bg-blue-100 border-blue-300" },
  ready_to_download: { label: "Ready to Download", color: "text-purple-700", bg: "bg-purple-100 border-purple-300" },
};

function StatusBadge({ status }: { status: CityStatus }) {
  const cfg = statusConfig[status];
  return (
    <Badge className={`${cfg.bg} ${cfg.color} border`}>
      {cfg.label}
    </Badge>
  );
}

// ---- Progress Bar ----

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>{pct}% complete</span>
        <span>{value.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---- Loading Skeleton ----

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-lg" />
    </div>
  );
}

// ---- Meter Lookup Component ----

function MeterLookup({ cityId }: { cityId: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: results, isLoading } = useMeterLookup(cityId, query);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          Meter Lookup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by meter ID, address, or account number..."
              className="pl-9"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </div>

          {/* Dropdown Results */}
          {isOpen && query.length >= 2 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : results && results.length > 0 ? (
                <ul className="max-h-64 overflow-y-auto py-1">
                  {results.map((result) => (
                    <li key={result.meter.id}>
                      <button
                        className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors"
                        onClick={() => {
                          console.log("Open meter detail:", result.meter);
                          setIsOpen(false);
                          setQuery(result.meter.meterNumber);
                        }}
                      >
                        <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {result.meter.meterNumber}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {result.routeName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {result.meter.address}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Account: {result.meter.accountNumber}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No meters found matching &quot;{query}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Main Page ----

export default function CityDashboardPage() {
  const params = useParams();
  const cityId = params.id as string;

  const { data: city, isLoading, isError, refetch } = useCityDetail(cityId);
  const { data: cycle } = useCityCycle(city?.cycleId);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !city) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Failed to load city data</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const { stats } = city;
  const pctRead = stats.totalMeters > 0 ? Math.round((stats.metersRead / stats.totalMeters) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ---- Status Card ---- */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{city.name}</h1>
                <StatusBadge status={city.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {cycle && (
                  <>
                    <span>
                      Cycle #{cycle.cycleNumber}
                    </span>
                    <span>
                      Started: {new Date(cycle.startDate).toLocaleDateString()}
                    </span>
                    <span>
                      Ends: {new Date(cycle.endDate).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {city.status === "ready_to_download" && (
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Download Reads
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- Meter Count Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Meters</p>
            <p className="text-3xl font-bold mt-1">{stats.totalMeters.toLocaleString()}</p>
            <ProgressBar value={stats.metersRead} max={stats.totalMeters} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Meters Read</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {stats.metersRead.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {pctRead}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Unread</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">
              {stats.unreadMeters.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {100 - pctRead}% remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Action Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* To Reread */}
        <Link href={`/city/${cityId}/rereads`}>
          <Card className="cursor-pointer transition-colors hover:border-red-400 h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <RefreshCw className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.toReread}
                  </p>
                  <p className="text-sm text-muted-foreground">To Reread</p>
                </div>
                {stats.toReread > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.toReread}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* To Review */}
        <Link href={`/city/${cityId}/review`}>
          <Card className="cursor-pointer transition-colors hover:border-orange-400 h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <Eye className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.toReview}
                  </p>
                  <p className="text-sm text-muted-foreground">To Review</p>
                </div>
                {stats.toReview > 0 && (
                  <Badge className="ml-auto bg-orange-500 hover:bg-orange-600 border-transparent">
                    {stats.toReview}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Total Certified */}
        <Link href={`/city/${cityId}/certified`}>
          <Card className="cursor-pointer transition-colors hover:border-green-400 h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.totalCertified}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Certified</p>
                </div>
                <Badge className="ml-auto bg-green-500 hover:bg-green-600 border-transparent">
                  {stats.totalCertified}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ---- Meter Lookup ---- */}
      <MeterLookup cityId={cityId} />
    </div>
  );
}
