"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Camera,
  RefreshCw,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useRereadQueue,
  useReassignReadings,
  MOCK_READERS,
  type ReviewReading,
} from "@/hooks/use-readings";

// ----- Helpers -----

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type SortKey =
  | "routeNumber"
  | "meterNumber"
  | "accountNumber"
  | "utilityType"
  | "address"
  | "previousValue"
  | "value"
  | "usage"
  | "readingTimestamp"
  | "readerName"
  | "rereadReason";

type SortDir = "asc" | "desc";

function getSortValue(reading: ReviewReading, key: SortKey): string | number {
  switch (key) {
    case "routeNumber":
      return reading.routeNumber;
    case "meterNumber":
      return reading.meterNumber;
    case "accountNumber":
      return reading.accountNumber;
    case "utilityType":
      return reading.utilityType;
    case "address":
      return reading.address;
    case "previousValue":
      return reading.previousValue;
    case "value":
      return reading.value;
    case "usage":
      return reading.usage;
    case "readingTimestamp":
      return reading.readingTimestamp;
    case "readerName":
      return reading.readerName;
    case "rereadReason":
      return reading.rereadReason || "";
    default:
      return "";
  }
}

function sortReadings(
  readings: ReviewReading[],
  sortKey: SortKey,
  sortDir: SortDir
): ReviewReading[] {
  return [...readings].sort((a, b) => {
    const aVal = getSortValue(a, sortKey);
    const bVal = getSortValue(b, sortKey);
    const cmp =
      typeof aVal === "number" && typeof bVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
    return sortDir === "asc" ? cmp : -cmp;
  });
}

// ----- Loading skeleton -----

function RereadSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

// ----- Main Page Component -----

export default function RereadsPage() {
  const params = useParams();
  const cityId = params.id as string;
  const router = useRouter();

  const { data: readings, isLoading } = useRereadQueue(cityId);
  const reassignMutation = useReassignReadings();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("routeNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignReader, setReassignReader] = useState("");

  const sorted = useMemo(() => {
    if (!readings) return [];
    return sortReadings(readings, sortKey, sortDir);
  }, [readings, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (!readings) return;
    if (selectedIds.size === readings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(readings.map((r) => r.id)));
    }
  }

  function handleRowClick(reading: ReviewReading) {
    router.push(`/city/${cityId}/review?readingId=${reading.id}`);
  }

  function handleReassign() {
    if (!reassignReader || selectedIds.size === 0) return;
    reassignMutation.mutate(
      {
        readingIds: Array.from(selectedIds),
        readerId: reassignReader,
      },
      {
        onSuccess: () => {
          setReassignOpen(false);
          setReassignReader("");
          setSelectedIds(new Set());
        },
      }
    );
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) {
      return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  if (isLoading) return <RereadSkeleton />;

  const total = sorted.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Reread Queue</h1>
          <Badge
            variant="destructive"
            className="rounded-md px-2.5 py-1 text-sm"
          >
            {total} to Reread
          </Badge>
        </div>
        <Button
          variant="outline"
          disabled={selectedIds.size === 0}
          onClick={() => setReassignOpen(true)}
        >
          <Users className="mr-2 h-4 w-4" />
          Reassign ({selectedIds.size})
        </Button>
      </div>

      {total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="mb-4 h-12 w-12 text-muted-foreground opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">
              No rereads pending
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        selectedIds.size === total && total > 0
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("routeNumber")}
                  >
                    Rte# <SortIcon column="routeNumber" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("meterNumber")}
                  >
                    Meter ID <SortIcon column="meterNumber" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("accountNumber")}
                  >
                    Acct# <SortIcon column="accountNumber" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("utilityType")}
                  >
                    Utility <SortIcon column="utilityType" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("address")}
                  >
                    Address <SortIcon column="address" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => toggleSort("previousValue")}
                  >
                    Previous <SortIcon column="previousValue" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => toggleSort("value")}
                  >
                    Read <SortIcon column="value" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => toggleSort("usage")}
                  >
                    Usage <SortIcon column="usage" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("readingTimestamp")}
                  >
                    Date/Time <SortIcon column="readingTimestamp" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("readerName")}
                  >
                    Reader <SortIcon column="readerName" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("rereadReason")}
                  >
                    Reason <SortIcon column="rereadReason" />
                  </TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-[50px] text-center">Photo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((reading) => (
                  <TableRow
                    key={reading.id}
                    className={cn(
                      "cursor-pointer",
                      selectedIds.has(reading.id) && "bg-muted/60"
                    )}
                    onClick={() => handleRowClick(reading)}
                  >
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(reading.id)}
                        onCheckedChange={() => toggleSelect(reading.id)}
                        aria-label={`Select ${reading.meterNumber}`}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {reading.routeNumber}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {reading.meterNumber}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {reading.accountNumber}
                    </TableCell>
                    <TableCell className="text-xs">
                      {reading.utilityType}
                    </TableCell>
                    <TableCell className="text-xs max-w-[160px] truncate">
                      {reading.address}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {reading.previousValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {reading.value.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-xs font-mono font-medium",
                        reading.usage > 0
                          ? "text-green-700"
                          : reading.usage < 0
                          ? "text-red-700"
                          : "text-gray-500"
                      )}
                    >
                      {reading.usage.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDateTime(reading.readingTimestamp)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {reading.readerName}
                    </TableCell>
                    <TableCell className="max-w-[180px] text-xs">
                      <span className="line-clamp-2">
                        {reading.rereadReason || "--"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate text-xs">
                      {reading.note || "--"}
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate text-xs">
                      {reading.comment || "--"}
                    </TableCell>
                    <TableCell className="text-center">
                      {reading.photoUrl ? (
                        <Camera className="mx-auto h-4 w-4 text-blue-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reassign Dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Readings</DialogTitle>
            <DialogDescription>
              Reassign {selectedIds.size} selected reading
              {selectedIds.size !== 1 ? "s" : ""} to a different reader.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to Reader</label>
              <Select value={reassignReader} onValueChange={setReassignReader}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reader..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_READERS.map((reader) => (
                    <SelectItem key={reader.id} value={reader.id}>
                      {reader.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReassignOpen(false);
                setReassignReader("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!reassignReader || reassignMutation.isPending}
            >
              <Users className="mr-2 h-4 w-4" />
              {reassignMutation.isPending
                ? "Reassigning..."
                : `Reassign ${selectedIds.size} Reading${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
