import { useQuery } from "@tanstack/react-query";
import type { Reader } from "@/types/api";
// import { api } from "@/lib/api";

// ---- Mock Data ----

const mockReaders: Reader[] = [
  {
    id: "reader-1",
    managerId: "mgr-1",
    name: "Mike Thompson",
    email: "mthompson@meters.com",
    phone: "(805) 555-1001",
    active: true,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-2",
    managerId: "mgr-1",
    name: "Sarah Chen",
    email: "schen@meters.com",
    phone: "(805) 555-1002",
    active: true,
    createdAt: "2024-06-15T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-3",
    managerId: "mgr-1",
    name: "Carlos Ramirez",
    email: "cramirez@meters.com",
    phone: "(805) 555-1003",
    active: true,
    createdAt: "2024-07-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-4",
    managerId: "mgr-1",
    name: "Jessica Park",
    email: "jpark@meters.com",
    phone: "(805) 555-1004",
    active: true,
    createdAt: "2024-07-10T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-5",
    managerId: "mgr-1",
    name: "David Wilson",
    email: "dwilson@meters.com",
    phone: "(805) 555-1005",
    active: true,
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-6",
    managerId: "mgr-1",
    name: "Amanda Foster",
    email: "afoster@meters.com",
    phone: "(805) 555-1006",
    active: true,
    createdAt: "2024-08-15T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-7",
    managerId: "mgr-1",
    name: "Brian Kowalski",
    email: "bkowalski@meters.com",
    phone: "(805) 555-1007",
    active: true,
    createdAt: "2024-09-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-8",
    managerId: "mgr-1",
    name: "Maria Santos",
    email: "msantos@meters.com",
    phone: "(805) 555-1008",
    active: true,
    createdAt: "2024-09-10T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-9",
    managerId: "mgr-1",
    name: "James O'Brien",
    email: "jobrien@meters.com",
    phone: "(805) 555-1009",
    active: true,
    createdAt: "2024-10-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "reader-10",
    managerId: "mgr-1",
    name: "Lisa Chang",
    email: "lchang@meters.com",
    phone: "(805) 555-1010",
    active: true,
    createdAt: "2024-10-15T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
];

// ---- Hook ----

export function useReaders() {
  return useQuery({
    queryKey: ["readers"],
    queryFn: async (): Promise<Reader[]> => {
      // Real API call (swap later):
      // const res = await api.get<ApiResponse<Reader[]>>("/readers");
      // return res.data;

      await new Promise((r) => setTimeout(r, 300));
      return mockReaders;
    },
  });
}
