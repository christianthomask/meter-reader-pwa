"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Route as RouteIcon,
  AlertCircle,
  RefreshCw,
  UserPlus,
  UserMinus,
  Scissors,
  Phone,
  Check,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { useCityDetail } from "@/hooks/use-city";
import { useRoutes } from "@/hooks/use-routes";
import { useReaders } from "@/hooks/use-readers";
import { useAssignments } from "@/hooks/use-assignments";
import type { Reader, Route, RouteAssignment } from "@/types/api";

// ---- Loading Skeleton ----

function LoadManagerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg lg:col-span-2" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}

// ---- Split Dialog ----

function SplitDialog({
  open,
  onOpenChange,
  route,
  readers,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: Route | null;
  readers: Reader[];
  onConfirm: (splits: { readerId: string; start: number; end: number }[]) => void;
  isPending: boolean;
}) {
  const [splits, setSplits] = useState<
    { readerId: string; start: string; end: string }[]
  >([
    { readerId: "", start: "1", end: "" },
    { readerId: "", start: "", end: "" },
  ]);

  // Reset when route changes
  const totalMeters = route?.totalMeters ?? 0;

  function addSplit() {
    setSplits((s) => [...s, { readerId: "", start: "", end: "" }]);
  }

  function removeSplit(idx: number) {
    setSplits((s) => s.filter((_, i) => i !== idx));
  }

  function updateSplit(
    idx: number,
    field: "readerId" | "start" | "end",
    value: string
  ) {
    setSplits((s) =>
      s.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function handleConfirm() {
    const parsed = splits
      .filter((s) => s.readerId && s.start && s.end)
      .map((s) => ({
        readerId: s.readerId,
        start: parseInt(s.start, 10),
        end: parseInt(s.end, 10),
      }));
    if (parsed.length >= 2) {
      onConfirm(parsed);
    }
  }

  const isValid =
    splits.filter((s) => s.readerId && s.start && s.end).length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Split Route: {route?.name}
          </DialogTitle>
          <DialogDescription>
            Divide {totalMeters} meters among multiple readers. Specify meter
            ranges for each reader.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {splits.map((split, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <select
                className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-sm flex-1"
                value={split.readerId}
                onChange={(e) => updateSplit(idx, "readerId", e.target.value)}
              >
                <option value="">Select reader...</option>
                {readers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Start"
                className="w-20"
                value={split.start}
                onChange={(e) => updateSplit(idx, "start", e.target.value)}
                min={1}
                max={totalMeters}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="End"
                className="w-20"
                value={split.end}
                onChange={(e) => updateSplit(idx, "end", e.target.value)}
                min={1}
                max={totalMeters}
              />
              {splits.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeSplit(idx)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addSplit}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Reader
        </Button>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || isPending}>
            {isPending ? "Splitting..." : "Confirm Split"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Page ----

export default function LoadManagerPage() {
  const params = useParams();
  const cityId = params.id as string;

  // State
  const [selectedReaderIds, setSelectedReaderIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<string>>(
    new Set()
  );
  const [splitRoute, setSplitRoute] = useState<Route | null>(null);

  // Queries
  const { data: city } = useCityDetail(cityId);
  const {
    data: routes,
    isLoading: routesLoading,
    isError: routesError,
    refetch: refetchRoutes,
  } = useRoutes(cityId);
  const {
    data: readers,
    isLoading: readersLoading,
    isError: readersError,
    refetch: refetchReaders,
  } = useReaders();
  const {
    data: assignments,
    isLoading: assignmentsLoading,
    assign,
    unassign,
    split,
  } = useAssignments(cityId);

  const isLoading = routesLoading || readersLoading || assignmentsLoading;

  // Derive assigned / available readers
  const assignedReaderIds = useMemo(() => {
    if (!assignments) return new Set<string>();
    return new Set(assignments.map((a) => a.readerId));
  }, [assignments]);

  const availableReaders = useMemo(() => {
    if (!readers) return [];
    return readers.filter((r) => !assignedReaderIds.has(r.id));
  }, [readers, assignedReaderIds]);

  const assignedReaders = useMemo(() => {
    if (!readers || !assignments) return [];
    return readers.filter((r) => assignedReaderIds.has(r.id));
  }, [readers, assignments, assignedReaderIds]);

  // Build a map: routeId -> assignments
  const routeAssignmentMap = useMemo(() => {
    const map: Record<string, RouteAssignment[]> = {};
    if (assignments) {
      for (const a of assignments) {
        if (!map[a.routeId]) map[a.routeId] = [];
        map[a.routeId].push(a);
      }
    }
    return map;
  }, [assignments]);

  // Build a map: readerId -> Reader
  const readerMap = useMemo(() => {
    const map: Record<string, Reader> = {};
    if (readers) {
      for (const r of readers) {
        map[r.id] = r;
      }
    }
    return map;
  }, [readers]);

  // Build a map: routeId -> Route
  const routeMap = useMemo(() => {
    const map: Record<string, Route> = {};
    if (routes) {
      for (const r of routes) {
        map[r.id] = r;
      }
    }
    return map;
  }, [routes]);

  // Reader selection toggle
  function toggleReader(id: string) {
    setSelectedReaderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleRoute(id: string) {
    setSelectedRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Assign handler
  function handleAssign() {
    if (selectedReaderIds.size === 0 || selectedRouteIds.size === 0) return;
    assign.mutate(
      {
        readerIds: Array.from(selectedReaderIds),
        routeIds: Array.from(selectedRouteIds),
      },
      {
        onSuccess: () => {
          setSelectedReaderIds(new Set());
          setSelectedRouteIds(new Set());
        },
      }
    );
  }

  // Split handler
  function handleSplitConfirm(
    splits: { readerId: string; start: number; end: number }[]
  ) {
    if (!splitRoute) return;
    split.mutate(
      { routeId: splitRoute.id, splits },
      {
        onSuccess: () => setSplitRoute(null),
      }
    );
  }

  if (isLoading) {
    return <LoadManagerSkeleton />;
  }

  if (routesError || readersError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Failed to load data</p>
        <div className="flex gap-2">
          <Button
            onClick={() => refetchRoutes()}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Routes
          </Button>
          <Button
            onClick={() => refetchReaders()}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Readers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Load Manager</h1>
          <p className="text-sm text-muted-foreground">
            Assign meter readers to routes for {city?.name ?? "this city"}
          </p>
        </div>
        <Button
          onClick={handleAssign}
          disabled={
            selectedReaderIds.size === 0 ||
            selectedRouteIds.size === 0 ||
            assign.isPending
          }
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {assign.isPending
            ? "Assigning..."
            : `Assign (${selectedReaderIds.size} readers, ${selectedRouteIds.size} routes)`}
        </Button>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ---- Available Readers Panel (left) ---- */}
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Available Readers
              <Badge
                variant="outline"
                className="ml-auto border-green-300 text-green-700"
              >
                {availableReaders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableReaders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All readers are assigned
              </p>
            ) : (
              <ul className="space-y-1">
                {availableReaders.map((reader) => (
                  <li
                    key={reader.id}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors ${
                      selectedReaderIds.has(reader.id)
                        ? "bg-green-50 border border-green-300"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleReader(reader.id)}
                  >
                    <Checkbox
                      checked={selectedReaderIds.has(reader.id)}
                      onCheckedChange={() => toggleReader(reader.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {reader.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {reader.phone}
                      </div>
                    </div>
                    {selectedReaderIds.has(reader.id) && (
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ---- Routes Table (center) ---- */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RouteIcon className="h-4 w-4" />
              Routes
              <Badge variant="outline" className="ml-auto">
                {routes?.length ?? 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-16">Route #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Read</TableHead>
                  <TableHead className="text-right">Unread</TableHead>
                  <TableHead className="text-right">Rechecks</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes?.map((route) => {
                  const routeAssigns = routeAssignmentMap[route.id] || [];
                  const assignedNames = routeAssigns
                    .map((a) => readerMap[a.readerId]?.name ?? "Unknown")
                    .join(", ");
                  const hasSplit = routeAssigns.some((a) => a.isSplit);

                  return (
                    <TableRow
                      key={route.id}
                      data-state={
                        selectedRouteIds.has(route.id) ? "selected" : undefined
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRouteIds.has(route.id)}
                          onCheckedChange={() => toggleRoute(route.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {route.routeNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {route.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {route.totalMeters}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {route.metersRead}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {route.unreadMeters}
                      </TableCell>
                      <TableCell className="text-right">
                        {route.rechecks > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            {route.rechecks}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {assignedNames ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs truncate max-w-[120px]">
                              {assignedNames}
                            </span>
                            {hasSplit && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-purple-300 text-purple-600"
                              >
                                Split
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setSplitRoute(route)}
                        >
                          <Scissors className="mr-1 h-3 w-3" />
                          Split
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ---- Assigned Readers Panel (right) ---- */}
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              Assigned Readers
              <Badge
                variant="outline"
                className="ml-auto border-amber-300 text-amber-700"
              >
                {assignedReaders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedReaders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No readers assigned yet
              </p>
            ) : (
              <ul className="space-y-2">
                {assignedReaders.map((reader) => {
                  // Find all assignments for this reader
                  const readerAssigns =
                    assignments?.filter((a) => a.readerId === reader.id) ?? [];
                  const assignedRouteNames = readerAssigns
                    .map(
                      (a) =>
                        routeMap[a.routeId]?.name ?? "Unknown"
                    )
                    .join(", ");

                  // Calculate total meters for assigned routes
                  let totalAssigned = 0;
                  let totalRead = 0;
                  for (const a of readerAssigns) {
                    const r = routeMap[a.routeId];
                    if (r) {
                      totalAssigned += r.totalMeters;
                      totalRead += r.metersRead;
                    }
                  }

                  return (
                    <li
                      key={reader.id}
                      className="rounded-md border border-amber-200 bg-amber-50/50 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{reader.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Routes: {assignedRouteNames || "None"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Progress: {totalRead} / {totalAssigned} meters
                          </p>
                          {/* Progress mini bar */}
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-amber-200">
                            <div
                              className="h-1.5 rounded-full bg-amber-500 transition-all"
                              style={{
                                width: `${
                                  totalAssigned > 0
                                    ? Math.round(
                                        (totalRead / totalAssigned) * 100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Unassign buttons per assignment */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {readerAssigns.map((a) => (
                          <Button
                            key={a.id}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => unassign.mutate(a.id)}
                            disabled={unassign.isPending}
                          >
                            <UserMinus className="mr-1 h-3 w-3" />
                            {routeMap[a.routeId]?.name ?? "Route"}
                          </Button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Split Dialog ---- */}
      <SplitDialog
        open={splitRoute !== null}
        onOpenChange={(open) => {
          if (!open) setSplitRoute(null);
        }}
        route={splitRoute}
        readers={readers ?? []}
        onConfirm={handleSplitConfirm}
        isPending={split.isPending}
      />
    </div>
  );
}
