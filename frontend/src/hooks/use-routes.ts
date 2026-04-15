import { useQuery } from "@tanstack/react-query";
import type { Route } from "@/types/api";
// import { api } from "@/lib/api";

// ---- Mock Data ----

const routeNames = ["North", "South", "East", "West", "Downtown", "Hillside", "Industrial", "Coastal"];

function generateRoutes(cityId: string): Route[] {
  const now = new Date().toISOString();
  return routeNames.map((name, i) => {
    const totalMeters = 150 + Math.floor(Math.random() * 250);
    const readPercent = cityId === "city-3" ? 1 : cityId === "city-2" ? 0 : Math.random() * 0.85;
    const metersRead = Math.floor(totalMeters * readPercent);
    const unread = totalMeters - metersRead;
    const rechecks = metersRead > 0 ? Math.floor(Math.random() * 8) : 0;
    return {
      id: `route-${cityId}-${i + 1}`,
      cityId,
      name,
      routeNumber: String(100 + i),
      status: metersRead === totalMeters ? "complete" : metersRead > 0 ? "in_progress" : "pending",
      totalMeters,
      metersRead,
      unreadMeters: unread,
      rechecks,
      createdAt: now,
      updatedAt: now,
    };
  });
}

// Cache to keep consistent data during the session
const routeCache: Record<string, Route[]> = {};

function getRoutes(cityId: string): Route[] {
  if (!routeCache[cityId]) {
    routeCache[cityId] = generateRoutes(cityId);
  }
  return routeCache[cityId];
}

// ---- Hook ----

export function useRoutes(cityId: string) {
  return useQuery({
    queryKey: ["routes", cityId],
    queryFn: async (): Promise<Route[]> => {
      // Real API call (swap later):
      // const res = await api.get<ApiResponse<Route[]>>(`/cities/${cityId}/routes`);
      // return res.data;

      await new Promise((r) => setTimeout(r, 350));
      return getRoutes(cityId);
    },
    enabled: !!cityId,
  });
}
