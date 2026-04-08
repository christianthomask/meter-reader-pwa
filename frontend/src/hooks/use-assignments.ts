import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouteAssignment } from "@/types/api";
// import { api } from "@/lib/api";

// ---- Mock Data ----

// Initial assignments: some readers already assigned to routes
const initialAssignments: RouteAssignment[] = [
  {
    id: "assign-1",
    routeId: "route-city-1-1",
    readerId: "reader-1",
    managerId: "mgr-1",
    isSplit: false,
    splitStart: null,
    splitEnd: null,
    status: "in_progress",
    startedAt: "2026-03-26T08:00:00Z",
    completedAt: null,
    createdAt: "2026-03-25T00:00:00Z",
  },
  {
    id: "assign-2",
    routeId: "route-city-1-2",
    readerId: "reader-2",
    managerId: "mgr-1",
    isSplit: false,
    splitStart: null,
    splitEnd: null,
    status: "in_progress",
    startedAt: "2026-03-26T08:30:00Z",
    completedAt: null,
    createdAt: "2026-03-25T00:00:00Z",
  },
  {
    id: "assign-3",
    routeId: "route-city-1-3",
    readerId: "reader-3",
    managerId: "mgr-1",
    isSplit: false,
    splitStart: null,
    splitEnd: null,
    status: "assigned",
    startedAt: null,
    completedAt: null,
    createdAt: "2026-03-25T00:00:00Z",
  },
  {
    id: "assign-4",
    routeId: "route-city-1-5",
    readerId: "reader-1",
    managerId: "mgr-1",
    isSplit: false,
    splitStart: null,
    splitEnd: null,
    status: "assigned",
    startedAt: null,
    completedAt: null,
    createdAt: "2026-03-25T00:00:00Z",
  },
];

// In-memory mutable store for assignments (keyed by cityId)
const assignmentStore: Record<string, RouteAssignment[]> = {
  "city-1": [...initialAssignments],
};

function getAssignments(cityId: string): RouteAssignment[] {
  if (!assignmentStore[cityId]) {
    assignmentStore[cityId] = [];
  }
  return assignmentStore[cityId];
}

let nextId = 100;

// ---- Hooks ----

export function useAssignments(cityId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["assignments", cityId],
    queryFn: async (): Promise<RouteAssignment[]> => {
      // Real API call (swap later):
      // const res = await api.get<ApiResponse<RouteAssignment[]>>(`/cities/${cityId}/assignments`);
      // return res.data;

      await new Promise((r) => setTimeout(r, 300));
      return getAssignments(cityId);
    },
    enabled: !!cityId,
  });

  const assignMutation = useMutation({
    mutationFn: async ({
      readerIds,
      routeIds,
    }: {
      readerIds: string[];
      routeIds: string[];
    }): Promise<RouteAssignment[]> => {
      // Real API call (swap later):
      // const res = await api.post<ApiResponse<RouteAssignment[]>>(`/cities/${cityId}/assignments`, { readerIds, routeIds });
      // return res.data;

      await new Promise((r) => setTimeout(r, 500));
      const newAssignments: RouteAssignment[] = [];
      const store = getAssignments(cityId);

      for (const readerId of readerIds) {
        for (const routeId of routeIds) {
          // Don't duplicate
          const exists = store.find(
            (a) => a.readerId === readerId && a.routeId === routeId
          );
          if (exists) continue;

          const assignment: RouteAssignment = {
            id: `assign-${nextId++}`,
            routeId,
            readerId,
            managerId: "mgr-1",
            isSplit: false,
            splitStart: null,
            splitEnd: null,
            status: "assigned",
            startedAt: null,
            completedAt: null,
            createdAt: new Date().toISOString(),
          };
          store.push(assignment);
          newAssignments.push(assignment);
        }
      }
      return newAssignments;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", cityId] });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (assignmentId: string): Promise<void> => {
      // Real API call (swap later):
      // await api.delete(`/assignments/${assignmentId}`);

      await new Promise((r) => setTimeout(r, 300));
      const store = getAssignments(cityId);
      const idx = store.findIndex((a) => a.id === assignmentId);
      if (idx >= 0) store.splice(idx, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", cityId] });
    },
  });

  const splitMutation = useMutation({
    mutationFn: async ({
      routeId,
      splits,
    }: {
      routeId: string;
      splits: { readerId: string; start: number; end: number }[];
    }): Promise<RouteAssignment[]> => {
      // Real API call (swap later):
      // const res = await api.post<ApiResponse<RouteAssignment[]>>(`/routes/${routeId}/split`, { splits });
      // return res.data;

      await new Promise((r) => setTimeout(r, 500));
      const store = getAssignments(cityId);

      // Remove existing assignments for this route
      const filtered = store.filter((a) => a.routeId !== routeId);
      assignmentStore[cityId] = filtered;

      const newAssignments: RouteAssignment[] = splits.map((s) => ({
        id: `assign-${nextId++}`,
        routeId,
        readerId: s.readerId,
        managerId: "mgr-1",
        isSplit: true,
        splitStart: s.start,
        splitEnd: s.end,
        status: "assigned" as const,
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      }));

      assignmentStore[cityId].push(...newAssignments);
      return newAssignments;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", cityId] });
    },
  });

  return {
    ...query,
    assign: assignMutation,
    unassign: unassignMutation,
    split: splitMutation,
  };
}
