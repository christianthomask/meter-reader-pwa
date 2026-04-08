"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useReportConfig,
  useReportData,
  exportToCsv,
  getUniqueReaders,
  getUniqueRoutes,
  type ReportFilters,
  type ReportRow,
  type ReportColumnConfig,
} from "@/hooks/use-reports";
import { useCityDetail } from "@/hooks/use-city";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  Download,
  FileText,
  ArrowLeft,
  Columns,
} from "lucide-react";

// ---- Helper: format date for display ----
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ---- Build TanStack columns from report config ----
function buildColumns(
  configColumns: ReportColumnConfig[],
): ColumnDef<ReportRow>[] {
  return configColumns.map((col) => {
    const colDef: ColumnDef<ReportRow> = {
      accessorKey: col.accessorKey,
      header: col.sortable
        ? ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {col.header}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        : col.header,
    };

    // Custom cell renderers
    if (col.cell === "number") {
      colDef.cell = ({ getValue }) => {
        const val = getValue() as number;
        return <span>{val != null ? val.toLocaleString() : ""}</span>;
      };
    } else if (col.cell === "date") {
      colDef.cell = ({ getValue }) => {
        const val = getValue() as string;
        // If it looks like a full ISO datetime, use formatDateTime
        if (val && val.includes("T")) return <span>{formatDateTime(val)}</span>;
        return <span>{formatDate(val)}</span>;
      };
    } else if (col.cell === "duration-flag") {
      colDef.cell = ({ getValue }) => {
        const duration = getValue() as number;
        const isLong = duration > 30;
        return (
          <span
            className={cn(
              "font-medium",
              isLong && "text-red-600 dark:text-red-400"
            )}
          >
            {duration}
            {isLong && " !"}
          </span>
        );
      };
    }

    return colDef;
  });
}

// ---- Page Component ----

export default function ReportTypePage() {
  const params = useParams();
  const cityId = params.id as string;
  const reportType = params.type as string;

  const { data: city } = useCityDetail(cityId);
  const { data: reportConfig, isLoading: configLoading } =
    useReportConfig(reportType);

  // Filters
  const [filters, setFilters] = useState<ReportFilters>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pageSize, setPageSize] = useState(25);

  const { data: reportData, isLoading: dataLoading } = useReportData(
    cityId,
    reportType,
    filters
  );

  // Build columns from config
  const columns = useMemo(() => {
    if (!reportConfig) return [];
    return buildColumns(reportConfig.columns);
  }, [reportConfig]);

  const tableData = useMemo(() => reportData ?? [], [reportData]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, columnVisibility, pagination: { pageIndex: 0, pageSize } },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // CSV export handler
  const handleCsvExport = useCallback(() => {
    if (!reportConfig || !reportData) return;
    const filename = `${reportConfig.title.replace(/\s+/g, "-").toLowerCase()}-${cityId}`;
    exportToCsv(reportData, reportConfig.columns, filename);
  }, [reportConfig, reportData, cityId]);

  // PDF placeholder
  const handlePdfExport = useCallback(() => {
    alert("PDF export will be available in a future release.");
  }, []);

  const uniqueReaders = getUniqueReaders();
  const uniqueRoutes = getUniqueRoutes();

  const isLoading = configLoading || dataLoading;

  // If config not found
  if (!configLoading && !reportConfig) {
    return (
      <div className="space-y-6">
        <Link
          href={`/city/${cityId}/reports`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Reports
        </Link>
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Not Available</h2>
          <p className="text-muted-foreground">
            The report type &quot;{reportType}&quot; is not available yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <Link
          href={`/city/${cityId}/reports`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Reports
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {configLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight">
                {reportConfig?.title}
                {city ? ` - ${city.name}` : ""}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCsvExport}
              disabled={isLoading || !reportData?.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePdfExport}
              disabled={isLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {reportConfig && (
        <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4 bg-muted/30">
          {reportConfig.availableFilters.includes("dateRange") && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  className="w-40"
                  value={filters.startDate ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  className="w-40"
                  value={filters.endDate ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </>
          )}

          {reportConfig.availableFilters.includes("route") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Route</Label>
              <Select
                value={filters.routeId ?? "all"}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    routeId: val === "all" ? undefined : val,
                  }))
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Routes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {uniqueRoutes.map((route) => (
                    <SelectItem key={route} value={route}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reportConfig.availableFilters.includes("reader") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Reader</Label>
              <Select
                value={filters.readerId ?? "all"}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    readerId: val === "all" ? undefined : val,
                  }))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Readers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Readers</SelectItem>
                  {uniqueReaders.map((reader) => (
                    <SelectItem key={reader} value={reader}>
                      {reader}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(filters.startDate ||
            filters.endDate ||
            filters.routeId ||
            filters.readerId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({})}
              className="text-muted-foreground"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `${tableData.length} record${tableData.length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex items-center gap-3">
          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Page size */}
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              table.setPageSize(Number(val));
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No data found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
