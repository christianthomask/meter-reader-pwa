"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reading, ExceptionType, ReadingStatus } from "@/types/api";

// ----- Extended types for review context -----

export interface ReviewReading extends Reading {
  address: string;
  meterNumber: string;
  accountNumber: string;
  routeNumber: string;
  readerName: string;
  utilityType: string;
}

export interface ReadingHistoryEntry {
  id: string;
  date: string;
  value: number;
  previousValue: number;
  usage: number;
  averageUsage: number;
  percentage: number;
  readerName: string;
  status: ReadingStatus;
  exceptionType: ExceptionType | null;
  note: string | null;
}

// ----- Mock Data -----

const READERS = [
  { id: "r1", name: "Mike Thompson" },
  { id: "r2", name: "Sarah Chen" },
  { id: "r3", name: "James Rodriguez" },
  { id: "r4", name: "Lisa Park" },
];

const ADDRESSES = [
  "123 Grand Ave",
  "456 Ocean Blvd",
  "789 Higuera St",
  "1024 Marsh St",
  "315 Branch St",
  "2200 Broad St",
  "410 Pismo Ave",
  "876 Oak Park Blvd",
  "550 Pacific Blvd",
  "1432 13th St",
  "220 Elm St",
  "917 Ramona Ave",
  "645 Newport Ave",
  "1100 Price St",
  "330 Tank Farm Rd",
  "812 Orcutt Rd",
  "255 Bridge St",
  "1509 Johnson Ave",
  "460 S 4th St",
  "738 Atlantic City Ave",
];

function makeReading(
  index: number,
  exceptionType: ExceptionType,
  overrides: Partial<ReviewReading> = {}
): ReviewReading {
  const reader = READERS[index % READERS.length];
  const address = ADDRESSES[index % ADDRESSES.length];
  const routeNum = (index % 5) + 1;
  const meterId = `MTR-${String(1000 + index).padStart(5, "0")}`;
  const accountNum = `ACC-${String(20000 + index * 7).padStart(6, "0")}`;
  const baseValue = 10000 + index * 3500;

  let currentValue: number;
  let previousValue: number;
  let delta: number;
  let percentage: number;

  switch (exceptionType) {
    case "high":
      previousValue = baseValue;
      currentValue = Math.round(previousValue * (1.5 + Math.random() * 0.5));
      delta = currentValue - previousValue;
      percentage = Math.round((delta / previousValue) * 100);
      break;
    case "low":
      previousValue = baseValue;
      currentValue = Math.round(previousValue * (0.1 + Math.random() * 0.15));
      delta = currentValue - previousValue;
      percentage = Math.round((delta / previousValue) * 100);
      break;
    case "zero":
      previousValue = baseValue;
      currentValue = previousValue;
      delta = 0;
      percentage = 0;
      break;
    case "negative":
      previousValue = baseValue;
      currentValue = Math.round(previousValue * (0.85 + Math.random() * 0.1));
      delta = currentValue - previousValue;
      percentage = Math.round((delta / previousValue) * 100);
      break;
    case "double_high":
      previousValue = baseValue;
      currentValue = Math.round(previousValue * 2.2);
      delta = currentValue - previousValue;
      percentage = Math.round((delta / previousValue) * 100);
      break;
    default:
      previousValue = baseValue;
      currentValue = Math.round(previousValue * 1.03);
      delta = currentValue - previousValue;
      percentage = 3;
  }

  const avgUsage = Math.round(previousValue * 0.03);

  return {
    id: `reading-${index}`,
    meterId,
    readerId: reader.id,
    cycleId: "cycle-1",
    routeId: `route-${routeNum}`,
    value: currentValue,
    previousValue,
    deltaValue: delta,
    usage: delta,
    averageUsage: avgUsage,
    percentage,
    unit: "gallons",
    readingType: "regular",
    photoUrl: null,
    gpsLat: 35.1168 + Math.random() * 0.02,
    gpsLon: -120.6402 + Math.random() * 0.02,
    note: null,
    noteCode: null,
    comment: null,
    readerNote: null,
    status: "pending" as ReadingStatus,
    isException: true,
    exceptionType,
    originalValue: null,
    editedBy: null,
    editedAt: null,
    needsReread: false,
    rereadReason: null,
    verified: false,
    cityStatus: null,
    readingTimestamp: new Date(
      2026,
      2,
      25 + Math.floor(index / 5),
      8 + (index % 8),
      Math.floor(Math.random() * 60)
    ).toISOString(),
    createdAt: new Date(2026, 2, 25).toISOString(),
    updatedAt: new Date(2026, 2, 25).toISOString(),
    // Extended fields
    address,
    meterNumber: meterId,
    accountNumber: accountNum,
    routeNumber: `Rte ${routeNum}`,
    readerName: reader.name,
    utilityType: "Water",
    ...overrides,
  };
}

const exceptionTypes: ExceptionType[] = [
  "high",
  "high",
  "high",
  "low",
  "low",
  "zero",
  "zero",
  "negative",
  "high",
  "low",
  "high",
  "zero",
  "negative",
  "high",
  "high",
  "low",
  "high",
  "double_high",
];

const MOCK_EXCEPTION_READINGS: ReviewReading[] = exceptionTypes.map(
  (type, i) => makeReading(i, type)
);

const MOCK_REREAD_READINGS: ReviewReading[] = [
  makeReading(100, "high", {
    needsReread: true,
    rereadReason: "Photo blurry, cannot verify reading",
    status: "rejected",
  }),
  makeReading(101, "zero", {
    needsReread: true,
    rereadReason: "Meter lid was not opened",
    status: "rejected",
  }),
  makeReading(102, "negative", {
    needsReread: true,
    rereadReason: "Possible meter replacement not documented",
    status: "rejected",
  }),
  makeReading(103, "high", {
    needsReread: true,
    rereadReason: "Reading seems transposed - verify digits",
    status: "rejected",
  }),
];

function generateHistory(meterId: string): ReadingHistoryEntry[] {
  const baseIndex = parseInt(meterId.replace(/\D/g, ""), 10) || 1000;
  const entries: ReadingHistoryEntry[] = [];
  let currentVal = 5000 + (baseIndex % 1000) * 10;

  for (let i = 11; i >= 0; i--) {
    const prevVal = currentVal;
    const normalUsage = Math.round(prevVal * (0.02 + Math.random() * 0.02));
    currentVal = prevVal + normalUsage;
    const avgUsage = Math.round(prevVal * 0.03);
    const pct = prevVal > 0 ? Math.round((normalUsage / prevVal) * 100) : 0;

    entries.push({
      id: `hist-${meterId}-${i}`,
      date: new Date(2026, 2 - i, 15 + Math.floor(Math.random() * 10)).toISOString(),
      value: currentVal,
      previousValue: prevVal,
      usage: normalUsage,
      averageUsage: avgUsage,
      percentage: pct,
      readerName: READERS[i % READERS.length].name,
      status: i === 0 ? "pending" : "approved",
      exceptionType: null,
      note: null,
    });
  }

  return entries.reverse();
}

// ----- Hooks -----

export function useExceptionQueue(cityId: string) {
  return useQuery({
    queryKey: ["exception-queue", cityId],
    queryFn: async (): Promise<ReviewReading[]> => {
      // TODO: Replace with real API call:
      // return api.get<ReviewReading[]>(`/cities/${cityId}/readings/exceptions`);
      await new Promise((r) => setTimeout(r, 600));
      return MOCK_EXCEPTION_READINGS;
    },
  });
}

export function useRereadQueue(cityId: string) {
  return useQuery({
    queryKey: ["reread-queue", cityId],
    queryFn: async (): Promise<ReviewReading[]> => {
      // TODO: Replace with real API call:
      // return api.get<ReviewReading[]>(`/cities/${cityId}/readings/rereads`);
      await new Promise((r) => setTimeout(r, 400));
      return MOCK_REREAD_READINGS;
    },
  });
}

export function useReadingHistory(meterId: string) {
  return useQuery({
    queryKey: ["reading-history", meterId],
    queryFn: async (): Promise<ReadingHistoryEntry[]> => {
      // TODO: Replace with real API call:
      // return api.get<ReadingHistoryEntry[]>(`/meters/${meterId}/history`);
      await new Promise((r) => setTimeout(r, 300));
      return generateHistory(meterId);
    },
    enabled: !!meterId,
  });
}

export function useApproveReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      readingId,
      editedValue,
      comment,
    }: {
      readingId: string;
      editedValue?: number;
      comment?: string;
    }) => {
      // TODO: Replace with real API call:
      // return api.put(`/readings/${readingId}/approve`, { editedValue, comment });
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, readingId, editedValue, comment };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exception-queue"] });
    },
  });
}

export function useRejectReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      readingId,
      reason,
      reassignToReaderId,
      comment,
    }: {
      readingId: string;
      reason: string;
      reassignToReaderId?: string;
      comment?: string;
    }) => {
      // TODO: Replace with real API call:
      // return api.put(`/readings/${readingId}/reject`, { reason, reassignToReaderId, comment });
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, readingId, reason, reassignToReaderId, comment };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exception-queue"] });
      queryClient.invalidateQueries({ queryKey: ["reread-queue"] });
    },
  });
}

export function useEditReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      readingId,
      newValue,
      originalValue,
    }: {
      readingId: string;
      newValue: number;
      originalValue: number;
    }) => {
      // TODO: Replace with real API call:
      // return api.put(`/readings/${readingId}/edit`, { newValue, originalValue });
      await new Promise((r) => setTimeout(r, 200));
      return {
        success: true,
        readingId,
        newValue,
        originalValue,
        editedBy: "current-manager",
        editedAt: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exception-queue"] });
    },
  });
}

export function useReassignReadings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      readingIds,
      readerId,
    }: {
      readingIds: string[];
      readerId: string;
    }) => {
      // TODO: Replace with real API call:
      // return api.put(`/readings/reassign`, { readingIds, readerId });
      await new Promise((r) => setTimeout(r, 400));
      return { success: true, readingIds, readerId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reread-queue"] });
    },
  });
}

export const MOCK_READERS = READERS;
