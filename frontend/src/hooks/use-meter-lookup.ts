import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Meter } from "@/types/api";
// import { api } from "@/lib/api";

// ---- Mock Data ----

const streetNames = [
  "Oak St", "Elm Ave", "Main St", "Pacific Blvd", "Grand Ave",
  "Cypress Dr", "Maple Ln", "Willow Way", "Cedar Ct", "Beach Rd",
  "Hillcrest Dr", "Valley View Ln", "1st St", "2nd St", "3rd Ave",
  "Ocean View Dr", "Sunset Blvd", "Harbor Way", "Pine St", "Birch Ave",
];

const routeNames = ["North", "South", "East", "West", "Downtown", "Hillside", "Industrial", "Coastal"];

function generateMeters(cityId: string): Meter[] {
  const meters: Meter[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < 40; i++) {
    const routeIdx = i % 8;
    const streetNum = 100 + Math.floor(Math.random() * 9900);
    const street = streetNames[i % streetNames.length];
    meters.push({
      id: `meter-${cityId}-${i + 1}`,
      cityId,
      routeId: `route-${cityId}-${routeIdx + 1}`,
      meterNumber: `MTR-${String(10000 + i).slice(1)}`,
      accountNumber: `ACC-${cityId.replace("city-", "")}-${String(1000 + i).slice(1)}`,
      meterType: i % 3 === 0 ? "digital" : "analog",
      address: `${streetNum} ${street}`,
      lat: 35.12 + Math.random() * 0.05,
      lon: -120.6 + Math.random() * 0.05,
      status: i % 5 === 0 ? "unread" : "read",
      alwaysRequirePhoto: i % 7 === 0,
      doNotRead: false,
      lidNotes: "",
      createdAt: now,
      updatedAt: now,
    });
  }
  return meters;
}

// Cache meter data per city
const meterCache: Record<string, Meter[]> = {};

function getMeters(cityId: string): Meter[] {
  if (!meterCache[cityId]) {
    meterCache[cityId] = generateMeters(cityId);
  }
  return meterCache[cityId];
}

export interface MeterSearchResult {
  meter: Meter;
  routeName: string;
}

// ---- Debounce Hook ----

export function useDebouncedValue(value: string, delay: number = 300): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ---- Hook ----

export function useMeterLookup(cityId: string, query: string) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ["meter-lookup", cityId, debouncedQuery],
    queryFn: async (): Promise<MeterSearchResult[]> => {
      // Real API call (swap later):
      // const res = await api.get<ApiResponse<MeterSearchResult[]>>(`/cities/${cityId}/meters/search`, { q: debouncedQuery });
      // return res.data;

      await new Promise((r) => setTimeout(r, 200));
      const meters = getMeters(cityId);
      const q = debouncedQuery.toLowerCase();

      const results = meters
        .filter(
          (m) =>
            m.meterNumber.toLowerCase().includes(q) ||
            m.address.toLowerCase().includes(q) ||
            m.accountNumber.toLowerCase().includes(q)
        )
        .slice(0, 8)
        .map((m) => {
          const routeIdx = parseInt(m.routeId.split("-").pop() || "1", 10) - 1;
          return {
            meter: m,
            routeName: routeNames[routeIdx] || "Unknown",
          };
        });

      return results;
    },
    enabled: !!cityId && debouncedQuery.length >= 2,
  });
}
