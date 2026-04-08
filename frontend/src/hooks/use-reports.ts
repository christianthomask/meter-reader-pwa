import { useQuery } from "@tanstack/react-query";

// ---- Types ----

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  routeId?: string;
  readerId?: string;
}

export interface ReportColumnConfig {
  accessorKey: string;
  header: string;
  sortable?: boolean;
  cell?: "text" | "number" | "date" | "duration-flag";
}

export interface ReportConfig {
  title: string;
  slug: string;
  columns: ReportColumnConfig[];
  availableFilters: ("dateRange" | "route" | "reader")[];
}

export type ReportRow = Record<string, unknown>;

// ---- Report Registry ----

const reportRegistry: Record<string, ReportConfig> = {
  "reader-totals": {
    title: "Reader Totals",
    slug: "reader-totals",
    columns: [
      { accessorKey: "readerName", header: "Reader Name", sortable: true },
      { accessorKey: "routes", header: "Routes", sortable: true },
      { accessorKey: "totalReadings", header: "Total Readings", sortable: true, cell: "number" },
      { accessorKey: "exceptions", header: "Exceptions", sortable: true, cell: "number" },
      { accessorKey: "approved", header: "Approved", sortable: true, cell: "number" },
      { accessorKey: "rejected", header: "Rejected", sortable: true, cell: "number" },
      { accessorKey: "pending", header: "Pending", sortable: true, cell: "number" },
      { accessorKey: "lastActive", header: "Last Active", sortable: true, cell: "date" },
    ],
    availableFilters: ["dateRange", "reader"],
  },
  "reader-breaks": {
    title: "Reader Breaks",
    slug: "reader-breaks",
    columns: [
      { accessorKey: "reader", header: "Reader", sortable: true },
      { accessorKey: "date", header: "Date", sortable: true, cell: "date" },
      { accessorKey: "route", header: "Route", sortable: true },
      { accessorKey: "stopTime", header: "Stop Time", sortable: true },
      { accessorKey: "resumeTime", header: "Resume Time", sortable: true },
      { accessorKey: "duration", header: "Duration (min)", sortable: true, cell: "duration-flag" },
      { accessorKey: "location", header: "Location", sortable: true },
      { accessorKey: "notes", header: "Notes", sortable: false },
    ],
    availableFilters: ["dateRange", "route", "reader"],
  },
};

// ---- Mock Data Generators ----

function generateReaderTotals(): ReportRow[] {
  const readers = [
    { name: "Carlos Martinez", routes: "North, South, Downtown, Hillside", totalReadings: 782, lastActive: "2026-04-07T14:35:00Z" },
    { name: "Sarah Johnson", routes: "East, West, Coastal", totalReadings: 615, lastActive: "2026-04-07T16:20:00Z" },
    { name: "David Kim", routes: "North, East, Industrial, Downtown, Hillside", totalReadings: 498, lastActive: "2026-04-06T11:45:00Z" },
    { name: "Emily Chen", routes: "South, West, Coastal", totalReadings: 723, lastActive: "2026-04-07T15:10:00Z" },
    { name: "James Wilson", routes: "Downtown, Industrial", totalReadings: 341, lastActive: "2026-04-05T09:30:00Z" },
    { name: "Maria Garcia", routes: "North, South, East, Hillside", totalReadings: 567, lastActive: "2026-04-07T13:55:00Z" },
    { name: "Robert Taylor", routes: "None", totalReadings: 210, lastActive: "2026-02-15T10:00:00Z" },
    { name: "Lisa Nguyen", routes: "West, Coastal, Downtown", totalReadings: 389, lastActive: "2026-04-07T17:05:00Z" },
    { name: "Michael Brown", routes: "None", totalReadings: 155, lastActive: "2026-01-20T14:30:00Z" },
    { name: "Amanda Lopez", routes: "South, Industrial", totalReadings: 278, lastActive: "2026-04-06T16:45:00Z" },
  ];

  return readers.map((r) => {
    const exceptionRate = 0.05 + Math.random() * 0.10;
    const exceptions = Math.round(r.totalReadings * exceptionRate);
    const nonException = r.totalReadings - exceptions;
    const approved = Math.round(nonException * (0.75 + Math.random() * 0.15));
    const rejected = Math.round(nonException * (0.02 + Math.random() * 0.03));
    const pending = nonException - approved - rejected;

    return {
      readerName: r.name,
      routes: r.routes,
      totalReadings: r.totalReadings,
      exceptions,
      approved,
      rejected: Math.max(0, rejected),
      pending: Math.max(0, pending),
      lastActive: r.lastActive,
    };
  });
}

function generateReaderBreaks(): ReportRow[] {
  const readers = [
    "Carlos Martinez",
    "Sarah Johnson",
    "David Kim",
    "Emily Chen",
    "James Wilson",
    "Maria Garcia",
    "Lisa Nguyen",
    "Amanda Lopez",
  ];
  const routes = ["North", "South", "East", "West", "Downtown", "Industrial", "Hillside", "Coastal"];
  const locations = [
    "Corner of Main & Oak",
    "Parking lot - Elm Street",
    "Near pump station #4",
    "Rest area - Highway 1",
    "City Hall parking",
    "Coffee shop - Pine Ave",
    "Truck stop - Route 101",
    "Gas station - Cedar Blvd",
    "Park bench - Walnut Dr",
    "Vehicle - Industrial Park",
  ];
  const noteOptions = [
    "Lunch break",
    "Vehicle refueling",
    "Equipment issue - replaced battery",
    "Restroom break",
    "Waiting for resident access",
    "Phone call with dispatch",
    "Weather delay - heavy rain",
    "Traffic delay",
    "",
    "",
  ];

  const breaks: ReportRow[] = [];
  const baseDates = [
    "2026-04-01",
    "2026-04-02",
    "2026-04-03",
    "2026-04-04",
    "2026-04-05",
    "2026-04-06",
    "2026-04-07",
  ];

  for (let i = 0; i < 65; i++) {
    const reader = readers[i % readers.length];
    const route = routes[Math.floor(Math.random() * routes.length)];
    const date = baseDates[Math.floor(Math.random() * baseDates.length)];
    const stopHour = 7 + Math.floor(Math.random() * 9);
    const stopMin = Math.floor(Math.random() * 60);
    const duration = 11 + Math.floor(Math.random() * 50);
    const resumeMin = stopMin + duration;
    const resumeHour = stopHour + Math.floor(resumeMin / 60);
    const resumeMinFinal = resumeMin % 60;

    const stopTime = `${String(stopHour).padStart(2, "0")}:${String(stopMin).padStart(2, "0")}`;
    const resumeTime = `${String(resumeHour).padStart(2, "0")}:${String(resumeMinFinal).padStart(2, "0")}`;

    breaks.push({
      reader,
      date,
      route,
      stopTime,
      resumeTime,
      duration,
      location: locations[Math.floor(Math.random() * locations.length)],
      notes: noteOptions[Math.floor(Math.random() * noteOptions.length)],
    });
  }

  return breaks.sort((a, b) => {
    const dateCompare = String(b.date).localeCompare(String(a.date));
    if (dateCompare !== 0) return dateCompare;
    return String(a.stopTime).localeCompare(String(b.stopTime));
  });
}

// Cache so data is consistent during session
let cachedReaderTotals: ReportRow[] | null = null;
let cachedReaderBreaks: ReportRow[] | null = null;

function getReportData(reportType: string, filters: ReportFilters): ReportRow[] {
  if (reportType === "reader-totals") {
    if (!cachedReaderTotals) cachedReaderTotals = generateReaderTotals();
    let data = [...cachedReaderTotals];

    if (filters.readerId && filters.readerId !== "all") {
      data = data.filter((row) => row.readerName === filters.readerId);
    }

    return data;
  }

  if (reportType === "reader-breaks") {
    if (!cachedReaderBreaks) cachedReaderBreaks = generateReaderBreaks();
    let data = [...cachedReaderBreaks];

    if (filters.readerId && filters.readerId !== "all") {
      data = data.filter((row) => row.reader === filters.readerId);
    }
    if (filters.routeId && filters.routeId !== "all") {
      data = data.filter((row) => row.route === filters.routeId);
    }
    if (filters.startDate) {
      data = data.filter((row) => String(row.date) >= filters.startDate!);
    }
    if (filters.endDate) {
      data = data.filter((row) => String(row.date) <= filters.endDate!);
    }

    return data;
  }

  return [];
}

// ---- Hooks ----

export function useReportConfig(reportType: string) {
  return useQuery({
    queryKey: ["report-config", reportType],
    queryFn: async (): Promise<ReportConfig | null> => {
      await new Promise((r) => setTimeout(r, 100));
      return reportRegistry[reportType] ?? null;
    },
    enabled: !!reportType,
  });
}

export function useReportData(
  cityId: string,
  reportType: string,
  filters: ReportFilters
) {
  return useQuery({
    queryKey: ["report-data", cityId, reportType, filters],
    queryFn: async (): Promise<ReportRow[]> => {
      await new Promise((r) => setTimeout(r, 500));
      return getReportData(reportType, filters);
    },
    enabled: !!cityId && !!reportType,
  });
}

// ---- Report Hub Data ----

export interface ReportLink {
  slug: string;
  title: string;
  available: boolean;
}

export interface ReportCategory {
  title: string;
  reports: ReportLink[];
}

export function getReportCategories(): ReportCategory[] {
  return [
    {
      title: "General Reports",
      reports: [
        { slug: "usage-summary", title: "Usage Summary", available: false },
        { slug: "exception-summary", title: "Exception Summary", available: false },
        { slug: "billing-export", title: "Billing Export", available: false },
        { slug: "meter-inventory", title: "Meter Inventory", available: false },
      ],
    },
    {
      title: "Current Cycle Reports",
      reports: [
        { slug: "cycle-progress", title: "Cycle Progress", available: false },
        { slug: "route-completion", title: "Route Completion", available: false },
        { slug: "exception-detail", title: "Exception Detail", available: false },
        { slug: "reread-list", title: "Reread List", available: false },
      ],
    },
    {
      title: "Reader Reports",
      reports: [
        { slug: "reader-totals", title: "Reader Totals", available: true },
        { slug: "reader-breaks", title: "Reader Breaks", available: true },
        { slug: "reader-productivity", title: "Reader Productivity", available: false },
        { slug: "reader-accuracy", title: "Reader Accuracy", available: false },
      ],
    },
  ];
}

// Utility for CSV export
export function exportToCsv(
  data: ReportRow[],
  columns: ReportColumnConfig[],
  filename: string
) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.accessorKey];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escape CSV values containing commas, quotes, or newlines
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Unique reader names for filter dropdowns
export function getUniqueReaders(): string[] {
  return [
    "Carlos Martinez",
    "Sarah Johnson",
    "David Kim",
    "Emily Chen",
    "James Wilson",
    "Maria Garcia",
    "Robert Taylor",
    "Lisa Nguyen",
    "Michael Brown",
    "Amanda Lopez",
  ];
}

export function getUniqueRoutes(): string[] {
  return ["North", "South", "East", "West", "Downtown", "Industrial", "Hillside", "Coastal"];
}
