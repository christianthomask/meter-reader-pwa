"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Clock,
  MapPin,
  RefreshCw,
  RotateCcw,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  useExceptionQueue,
  useReadingHistory,
  useApproveReading,
  useRejectReading,
  MOCK_READERS,
  type ReviewReading,
} from "@/hooks/use-readings";
import type { ExceptionType } from "@/types/api";

// ----- Exception badge config -----

const EXCEPTION_CONFIG: Record<
  ExceptionType,
  { label: string; color: string; bg: string }
> = {
  high: { label: "HIGH", color: "text-red-700", bg: "bg-red-100 border-red-300" },
  low: { label: "LOW", color: "text-blue-700", bg: "bg-blue-100 border-blue-300" },
  zero: { label: "ZERO", color: "text-gray-700", bg: "bg-gray-100 border-gray-300" },
  negative: {
    label: "NEGATIVE",
    color: "text-purple-700",
    bg: "bg-purple-100 border-purple-300",
  },
  double_high: {
    label: "DOUBLE HIGH",
    color: "text-red-700",
    bg: "bg-red-200 border-red-400",
  },
};

const PREDEFINED_NOTES = [
  "Meter hard to locate",
  "Meter damaged",
  "No access to property",
  "Dog on property",
  "Construction near meter",
  "Lid stuck / broken",
  "Meter replaced",
  "Estimated read",
  "Meter fogged",
  "Landscape covering meter",
];

// ----- Helper -----

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ----- Loading skeleton -----

function ReviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
      <Skeleton className="h-[200px]" />
    </div>
  );
}

// ----- Main Page Component -----

export default function MeterReviewPage() {
  const params = useParams();
  const cityId = params.id as string;

  const { data: readings, isLoading } = useExceptionQueue(cityId);
  const approveMutation = useApproveReading();
  const rejectMutation = useRejectReading();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [editedValue, setEditedValue] = useState<string>("");
  const [isEdited, setIsEdited] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedNote, setSelectedNote] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rereadOpen, setRereadOpen] = useState(false);
  const [rereadReason, setRereadReason] = useState("");
  const [rereadReader, setRereadReader] = useState("");
  const [fadeKey, setFadeKey] = useState(0);

  const photoContainerRef = useRef<HTMLDivElement>(null);

  const total = readings?.length ?? 0;
  const current = readings?.[currentIndex];

  // Reset state when navigating
  const navigateTo = useCallback(
    (index: number) => {
      if (!readings) return;
      const clamped = Math.max(0, Math.min(index, readings.length - 1));
      setCurrentIndex(clamped);
      setEditedValue("");
      setIsEdited(false);
      setComment("");
      setSelectedNote("");
      setZoom(1);
      setFadeKey((k) => k + 1);
    },
    [readings]
  );

  const goNext = useCallback(() => {
    navigateTo(currentIndex + 1);
  }, [currentIndex, navigateTo]);

  const goPrev = useCallback(() => {
    navigateTo(currentIndex - 1);
  }, [currentIndex, navigateTo]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          goNext();
          break;
        case "Enter":
          e.preventDefault();
          if (current) handleApprove();
          break;
        case "Escape":
          e.preventDefault();
          if (current) setRereadOpen(true);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, goNext, goPrev, current]);

  // Scroll-wheel zoom on photo
  useEffect(() => {
    const container = photoContainerRef.current;
    if (!container) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      setZoom((z) => Math.max(0.5, Math.min(5, z + (e.deltaY > 0 ? -0.2 : 0.2))));
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  function handleEditValue(val: string) {
    // Only allow numeric input
    if (val !== "" && !/^\d+$/.test(val)) return;
    setEditedValue(val);
    setIsEdited(val !== "" && current != null && parseInt(val, 10) !== current.value);
  }

  function handleApprove() {
    if (!current) return;
    const finalValue = isEdited ? parseInt(editedValue, 10) : undefined;
    approveMutation.mutate(
      {
        readingId: current.id,
        editedValue: finalValue,
        comment: comment || undefined,
      },
      {
        onSuccess: () => {
          // Move to next reading
          if (currentIndex < total - 1) {
            goNext();
          }
        },
      }
    );
  }

  function handleReread() {
    if (!current || !rereadReason.trim()) return;
    rejectMutation.mutate(
      {
        readingId: current.id,
        reason: rereadReason,
        reassignToReaderId: rereadReader || undefined,
        comment: comment || undefined,
      },
      {
        onSuccess: () => {
          setRereadOpen(false);
          setRereadReason("");
          setRereadReader("");
          if (currentIndex < total - 1) {
            goNext();
          }
        },
      }
    );
  }

  if (isLoading) return <ReviewSkeleton />;

  if (!readings || readings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Check className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">All Caught Up!</h2>
        <p className="mt-2 text-muted-foreground">
          No exception readings to review.
        </p>
      </div>
    );
  }

  if (!current) return null;

  const displayValue = isEdited ? parseInt(editedValue, 10) : current.value;
  const displayDelta = displayValue - current.previousValue;
  const exceptionConfig = current.exceptionType
    ? EXCEPTION_CONFIG[current.exceptionType]
    : null;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Review Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{total} Meters to Review</h1>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous reading"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous (Left Arrow)</TooltipContent>
            </Tooltip>
            <span className="min-w-[80px] text-center text-sm font-medium text-muted-foreground">
              {currentIndex + 1} of {total}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goNext}
                  disabled={currentIndex === total - 1}
                  aria-label="Next reading"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next (Right Arrow)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Three-Column Layout */}
        <div
          key={fadeKey}
          className="animate-in fade-in duration-200 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr_1fr]"
        >
          {/* LEFT: Photo Panel */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Meter Photo
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[40px] text-center text-xs text-muted-foreground">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setZoom(1)}
                    aria-label="Reset zoom"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={photoContainerRef}
                className="relative flex h-[300px] items-center justify-center overflow-hidden bg-muted lg:h-[400px]"
              >
                <div
                  className="flex h-full w-full items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {current.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={current.photoUrl}
                      alt="Meter reading"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Camera className="h-16 w-16 opacity-30" />
                      <span className="text-sm">No photo available</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CENTER: Reading Panel */}
          <Card>
            <CardContent className="space-y-5 p-5">
              {/* Exception Badge */}
              {exceptionConfig && (
                <div
                  className={cn(
                    "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-bold",
                    exceptionConfig.bg,
                    exceptionConfig.color
                  )}
                >
                  {exceptionConfig.label} USAGE
                </div>
              )}

              {/* Address */}
              <div>
                <p className="text-xl font-bold">{current.address}</p>
                <p className="text-sm text-muted-foreground">
                  {current.routeNumber} &middot; {current.utilityType}
                </p>
              </div>

              {/* Current Read Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Current Read Value
                </label>
                {isEdited && (
                  <p className="text-base text-muted-foreground line-through">
                    {current.value.toLocaleString()}
                  </p>
                )}
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editedValue || String(current.value)}
                  onChange={(e) => handleEditValue(e.target.value)}
                  className={cn(
                    "h-14 text-3xl font-bold tracking-wider",
                    isEdited && "border-amber-400 bg-amber-50 text-amber-900"
                  )}
                />
                {isEdited && (
                  <p className="text-xs text-amber-600">
                    Edited - original value preserved for audit
                  </p>
                )}
              </div>

              {/* Usage display */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Previous</span>
                  <span className="font-mono font-medium">
                    {current.previousValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current</span>
                  <span className="font-mono font-medium">
                    {displayValue.toLocaleString()}
                  </span>
                </div>
                <div className="my-1 border-t" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Usage (Delta)</span>
                  <span
                    className={cn(
                      "font-mono text-lg font-bold",
                      displayDelta > 0
                        ? "text-green-700"
                        : displayDelta < 0
                        ? "text-red-700"
                        : "text-gray-500"
                    )}
                  >
                    {displayDelta > 0 ? "+" : ""}
                    {displayDelta.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Usage</span>
                  <span className="font-mono">
                    {current.averageUsage.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">% Change</span>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      current.percentage > 40
                        ? "text-red-600"
                        : current.percentage < -40
                        ? "text-blue-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {current.percentage > 0 ? "+" : ""}
                    {current.percentage}%
                  </span>
                </div>
              </div>

              {/* Comment / Note */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Note / Comment
                </label>
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {approveMutation.isPending ? "Approving..." : "Approve"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Approve reading (Enter)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={() => setRereadOpen(true)}
                      disabled={rejectMutation.isPending}
                      className="flex-1"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reread
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send to reread queue (Esc)</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Info Panel */}
          <div className="space-y-4">
            {/* Meter Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Meter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Meter ID" value={current.meterNumber} />
                <InfoRow label="Utility" value={current.utilityType} />
                <InfoRow label="Account #" value={current.accountNumber} />
                <InfoRow label="Route" value={current.routeNumber} />
                <InfoRow
                  label="Reader"
                  value={current.readerName}
                  icon={<User className="h-3.5 w-3.5" />}
                />
                <InfoRow
                  label="Read Date"
                  value={formatDateTime(current.readingTimestamp)}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
              </CardContent>
            </Card>

            {/* GPS Map placeholder */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex h-[140px] items-center justify-center bg-muted text-muted-foreground">
                  <div className="flex flex-col items-center gap-1">
                    <MapPin className="h-8 w-8 opacity-30" />
                    <span className="text-xs">Map - Leaflet integration pending</span>
                    {current.gpsLat && current.gpsLon && (
                      <span className="text-xs font-mono opacity-60">
                        {current.gpsLat.toFixed(4)}, {current.gpsLon.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Note Dropdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Predefined Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedNote}
                  onValueChange={(val) => {
                    setSelectedNote(val);
                    setComment((prev) =>
                      prev ? `${prev}\n${val}` : val
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a note..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_NOTES.map((note) => (
                      <SelectItem key={note} value={note}>
                        {note}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Reader Note */}
            {current.readerNote && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-800">
                    Reader Note
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-900">{current.readerNote}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Meter History Table */}
        <MeterHistoryTable meterId={current.meterId} />

        {/* Reread Dialog */}
        <Dialog open={rereadOpen} onOpenChange={setRereadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send to Reread Queue</DialogTitle>
              <DialogDescription>
                Mark this reading for re-reading. Optionally reassign to a
                different reader.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Why does this need a reread?"
                  value={rereadReason}
                  onChange={(e) => setRereadReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reassign to Reader (optional)
                </label>
                <Select value={rereadReader} onValueChange={setRereadReader}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current reader" />
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
                  setRereadOpen(false);
                  setRereadReason("");
                  setRereadReader("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReread}
                disabled={
                  !rereadReason.trim() || rejectMutation.isPending
                }
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {rejectMutation.isPending
                  ? "Submitting..."
                  : "Send to Reread"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ----- Sub-components -----

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        {icon}
        {value}
      </span>
    </div>
  );
}

function MeterHistoryTable({ meterId }: { meterId: string }) {
  const { data: history, isLoading } = useReadingHistory(meterId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meter History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Meter History ({history.length} readings)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Read</TableHead>
              <TableHead className="text-right">Previous</TableHead>
              <TableHead className="text-right">Usage</TableHead>
              <TableHead className="text-right">Avg Usage</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead>Reader</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Exception</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {entry.value.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {entry.previousValue.toLocaleString()}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono text-xs",
                    entry.usage > 0
                      ? "text-green-700"
                      : entry.usage < 0
                      ? "text-red-700"
                      : ""
                  )}
                >
                  {entry.usage.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {entry.averageUsage.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {entry.percentage}%
                </TableCell>
                <TableCell className="text-xs">{entry.readerName}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.status === "approved"
                        ? "default"
                        : entry.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {entry.exceptionType ? (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        EXCEPTION_CONFIG[entry.exceptionType]?.color
                      )}
                    >
                      {entry.exceptionType.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[120px] truncate text-xs">
                  {entry.note || "--"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
