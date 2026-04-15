// ============================================================
// Shared TypeScript types for the Meter Reader Manager Portal
// All interfaces match the PostgreSQL database schema.
// Property names use camelCase (frontend convention).
// All id fields are strings (UUID). All dates are strings (ISO 8601).
// ============================================================

// ----- Enums / Union Types -----

export type UserRole = 'admin' | 'manager' | 'reader' | 'city_contact';

export type CityStatus = 'complete' | 'read_pending' | 'active' | 'ready_to_download';

export type CycleStatus = 'preparing' | 'active' | 'complete' | 'archived';

export type RouteAssignmentStatus = 'assigned' | 'in_progress' | 'completed';

export type ReadingStatus = 'pending' | 'approved' | 'rejected' | 'certified';

export type ExceptionType = 'high' | 'low' | 'zero' | 'negative' | 'double_high';

export type CustfileStatus = 'uploaded' | 'processing' | 'complete' | 'error';

// ----- Core Interfaces -----

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  cognitoSub: string;
  timezone: string;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  status: CityStatus;
  totalMeters: number;
  metersRead: number;
  cycleId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface CityStats {
  toReview: number;
  toReread: number;
  totalCertified: number;
  totalMeters: number;
  metersRead: number;
  unreadMeters: number;
}

export interface Cycle {
  id: string;
  cityId: string;
  cycleNumber: number;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  previousCustfileCount: number;
  currentCustfileCount: number;
  difference: number;
  createdAt: string;
}

export interface Route {
  id: string;
  cityId: string;
  name: string;
  routeNumber: string;
  status: string;
  totalMeters: number;
  metersRead: number;
  unreadMeters: number;
  rechecks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Meter {
  id: string;
  cityId: string;
  routeId: string;
  meterNumber: string;
  accountNumber: string;
  meterType: string;
  address: string;
  lat: number;
  lon: number;
  status: string;
  alwaysRequirePhoto: boolean;
  doNotRead: boolean;
  lidNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reader {
  id: string;
  managerId: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RouteAssignment {
  id: string;
  routeId: string;
  readerId: string;
  managerId: string;
  isSplit: boolean;
  splitStart: number | null;
  splitEnd: number | null;
  status: RouteAssignmentStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Reading {
  id: string;
  meterId: string;
  readerId: string;
  cycleId: string;
  routeId: string;
  value: number;
  previousValue: number;
  deltaValue: number;
  usage: number;
  averageUsage: number;
  percentage: number;
  unit: string;
  readingType: string;
  photoUrl: string | null;
  gpsLat: number | null;
  gpsLon: number | null;
  note: string | null;
  noteCode: string | null;
  comment: string | null;
  readerNote: string | null;
  status: ReadingStatus;
  isException: boolean;
  exceptionType: ExceptionType | null;
  originalValue: number | null;
  editedBy: string | null;
  editedAt: string | null;
  needsReread: boolean;
  rereadReason: string | null;
  verified: boolean;
  cityStatus: string | null;
  readingTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface Custfile {
  id: string;
  cityId: string;
  cycleId: string;
  filename: string;
  s3Key: string;
  uploadDate: string;
  newMeters: number;
  previousCount: number;
  currentCount: number;
  difference: number;
  status: CustfileStatus;
}

export interface Certification {
  id: string;
  readingId: string;
  meterId: string;
  cityId: string;
  cycleId: string;
  certificateNumber: string;
  certType: string;
  certifiedBy: string;
  certifiedAt: string;
  data: Record<string, unknown>;
}

export interface ReaderTimestamp {
  id: string;
  readerId: string;
  routeId: string;
  readingId: string;
  actionType: string;
  timestamp: string;
  gpsLat: number | null;
  gpsLon: number | null;
}

// ----- API Response Types -----

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  message: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ----- Composite Types -----

export interface CityWithStats extends City {
  stats: CityStats;
}

// ----- Report Types -----

export type ReportCategory =
  | 'general'
  | 'current-cycle'
  | 'readers'
  | 'certified'
  | 'history';

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  type?: string;
}

export interface ReportConfig {
  id: string;
  title: string;
  category: ReportCategory;
  endpoint: string;
  columns: ColumnDef[];
}

export interface ReportData {
  rows: Record<string, unknown>[];
  totalRows: number;
  filters: Record<string, unknown>;
}
