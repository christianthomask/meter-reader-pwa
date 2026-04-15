import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reader } from "@/types/api";

// ---- Mock Data ----

const mockReaders: Reader[] = [
  {
    id: "reader-1",
    managerId: "manager-1",
    name: "Carlos Martinez",
    email: "carlos.martinez@acs-meters.com",
    phone: "(805) 555-1001",
    active: true,
    createdAt: "2024-06-15T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-2",
    managerId: "manager-1",
    name: "Sarah Johnson",
    email: "sarah.johnson@acs-meters.com",
    phone: "(805) 555-1002",
    active: true,
    createdAt: "2024-07-20T00:00:00Z",
    updatedAt: "2026-04-02T00:00:00Z",
  },
  {
    id: "reader-3",
    managerId: "manager-1",
    name: "David Kim",
    email: "david.kim@acs-meters.com",
    phone: "(805) 555-1003",
    active: true,
    createdAt: "2024-08-10T00:00:00Z",
    updatedAt: "2026-03-28T00:00:00Z",
  },
  {
    id: "reader-4",
    managerId: "manager-1",
    name: "Emily Chen",
    email: "emily.chen@acs-meters.com",
    phone: "(805) 555-1004",
    active: true,
    createdAt: "2024-09-05T00:00:00Z",
    updatedAt: "2026-04-05T00:00:00Z",
  },
  {
    id: "reader-5",
    managerId: "manager-1",
    name: "James Wilson",
    email: "james.wilson@acs-meters.com",
    phone: "(805) 555-1005",
    active: true,
    createdAt: "2024-10-15T00:00:00Z",
    updatedAt: "2026-04-03T00:00:00Z",
  },
  {
    id: "reader-6",
    managerId: "manager-1",
    name: "Maria Garcia",
    email: "maria.garcia@acs-meters.com",
    phone: "(805) 555-1006",
    active: true,
    createdAt: "2024-11-01T00:00:00Z",
    updatedAt: "2026-03-30T00:00:00Z",
  },
  {
    id: "reader-7",
    managerId: "manager-1",
    name: "Robert Taylor",
    email: "robert.taylor@acs-meters.com",
    phone: "(805) 555-1007",
    active: false,
    createdAt: "2024-06-20T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "reader-8",
    managerId: "manager-1",
    name: "Lisa Nguyen",
    email: "lisa.nguyen@acs-meters.com",
    phone: "(805) 555-1008",
    active: true,
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2026-04-06T00:00:00Z",
  },
  {
    id: "reader-9",
    managerId: "manager-1",
    name: "Michael Brown",
    email: "michael.brown@acs-meters.com",
    phone: "(805) 555-1009",
    active: false,
    createdAt: "2024-08-25T00:00:00Z",
    updatedAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "reader-10",
    managerId: "manager-1",
    name: "Amanda Lopez",
    email: "amanda.lopez@acs-meters.com",
    phone: "(805) 555-1010",
    active: true,
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2026-04-07T00:00:00Z",
  },
];

// Reader stats keyed by reader ID
export interface ReaderStats {
  routesAssigned: number;
  totalReadings: number;
}

const mockReaderStats: Record<string, ReaderStats> = {
  "reader-1": { routesAssigned: 4, totalReadings: 782 },
  "reader-2": { routesAssigned: 3, totalReadings: 615 },
  "reader-3": { routesAssigned: 5, totalReadings: 498 },
  "reader-4": { routesAssigned: 3, totalReadings: 723 },
  "reader-5": { routesAssigned: 2, totalReadings: 341 },
  "reader-6": { routesAssigned: 4, totalReadings: 567 },
  "reader-7": { routesAssigned: 0, totalReadings: 210 },
  "reader-8": { routesAssigned: 3, totalReadings: 389 },
  "reader-9": { routesAssigned: 0, totalReadings: 155 },
  "reader-10": { routesAssigned: 2, totalReadings: 278 },
};

// In-memory store for mutations (mock persistence)
const readersStore = [...mockReaders];

export function getReaderStats(readerId: string): ReaderStats {
  return mockReaderStats[readerId] ?? { routesAssigned: 0, totalReadings: 0 };
}

// ---- Hooks ----

export function useReaders() {
  return useQuery({
    queryKey: ["readers"],
    queryFn: async (): Promise<Reader[]> => {
      await new Promise((r) => setTimeout(r, 400));
      return [...readersStore];
    },
  });
}

export function useCreateReader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
    }): Promise<Reader> => {
      await new Promise((r) => setTimeout(r, 300));
      const newReader: Reader = {
        id: `reader-${Date.now()}`,
        managerId: "manager-1",
        name: data.name,
        email: data.email,
        phone: data.phone,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      readersStore.push(newReader);
      return newReader;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readers"] });
    },
  });
}

export function useUpdateReader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      email: string;
      phone: string;
    }): Promise<Reader> => {
      await new Promise((r) => setTimeout(r, 300));
      const idx = readersStore.findIndex((r) => r.id === data.id);
      if (idx === -1) throw new Error("Reader not found");
      readersStore[idx] = {
        ...readersStore[idx],
        name: data.name,
        email: data.email,
        phone: data.phone,
        updatedAt: new Date().toISOString(),
      };
      return readersStore[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readers"] });
    },
  });
}

export function useDeactivateReader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (readerId: string): Promise<Reader> => {
      await new Promise((r) => setTimeout(r, 300));
      const idx = readersStore.findIndex((r) => r.id === readerId);
      if (idx === -1) throw new Error("Reader not found");
      readersStore[idx] = {
        ...readersStore[idx],
        active: false,
        updatedAt: new Date().toISOString(),
      };
      return readersStore[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readers"] });
    },
  });
}
