import { useQuery } from "@tanstack/react-query";
import type { CityWithStats, Cycle } from "@/types/api";
// import { api } from "@/lib/api";

// ---- Mock Data ----

const mockCities: Record<string, CityWithStats> = {
  "city-1": {
    id: "city-1",
    name: "Grover Beach",
    status: "active",
    totalMeters: 2847,
    metersRead: 1612,
    cycleId: "cycle-1",
    contactName: "Janet Morrison",
    contactPhone: "(805) 555-0101",
    contactEmail: "jmorrison@groverbeach.gov",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
    stats: {
      toReview: 71,
      toReread: 4,
      totalCertified: 1108,
      totalMeters: 2847,
      metersRead: 1612,
      unreadMeters: 1235,
    },
  },
  "city-2": {
    id: "city-2",
    name: "Pismo Beach",
    status: "read_pending",
    totalMeters: 1923,
    metersRead: 0,
    cycleId: "cycle-2",
    contactName: "Robert Chin",
    contactPhone: "(805) 555-0202",
    contactEmail: "rchin@pismobeach.gov",
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2026-03-28T00:00:00Z",
    stats: {
      toReview: 0,
      toReread: 0,
      totalCertified: 0,
      totalMeters: 1923,
      metersRead: 0,
      unreadMeters: 1923,
    },
  },
  "city-3": {
    id: "city-3",
    name: "Arroyo Grande",
    status: "complete",
    totalMeters: 3421,
    metersRead: 3421,
    cycleId: "cycle-3",
    contactName: "Linda Nguyen",
    contactPhone: "(805) 555-0303",
    contactEmail: "lnguyen@arroyogrande.gov",
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2026-03-15T00:00:00Z",
    stats: {
      toReview: 0,
      toReread: 0,
      totalCertified: 3421,
      totalMeters: 3421,
      metersRead: 3421,
      unreadMeters: 0,
    },
  },
  "city-4": {
    id: "city-4",
    name: "Atascadero",
    status: "ready_to_download",
    totalMeters: 4102,
    metersRead: 4102,
    cycleId: "cycle-4",
    contactName: "Tom Rodriguez",
    contactPhone: "(805) 555-0404",
    contactEmail: "trodriguez@atascadero.gov",
    createdAt: "2024-03-05T00:00:00Z",
    updatedAt: "2026-04-05T00:00:00Z",
    stats: {
      toReview: 12,
      toReread: 0,
      totalCertified: 4090,
      totalMeters: 4102,
      metersRead: 4102,
      unreadMeters: 0,
    },
  },
  "city-5": {
    id: "city-5",
    name: "Paso Robles",
    status: "active",
    totalMeters: 5230,
    metersRead: 3105,
    cycleId: "cycle-5",
    contactName: "Karen Walsh",
    contactPhone: "(805) 555-0505",
    contactEmail: "kwalsh@pasorobles.gov",
    createdAt: "2024-02-20T00:00:00Z",
    updatedAt: "2026-04-07T00:00:00Z",
    stats: {
      toReview: 143,
      toReread: 17,
      totalCertified: 2890,
      totalMeters: 5230,
      metersRead: 3105,
      unreadMeters: 2125,
    },
  },
};

const mockCycles: Record<string, Cycle> = {
  "cycle-1": {
    id: "cycle-1",
    cityId: "city-1",
    cycleNumber: 3,
    startDate: "2026-03-25T00:00:00Z",
    endDate: "2026-04-25T00:00:00Z",
    status: "active",
    previousCustfileCount: 2820,
    currentCustfileCount: 2847,
    difference: 27,
    createdAt: "2026-03-25T00:00:00Z",
  },
  "cycle-2": {
    id: "cycle-2",
    cityId: "city-2",
    cycleNumber: 1,
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-05-01T00:00:00Z",
    status: "preparing",
    previousCustfileCount: 1900,
    currentCustfileCount: 1923,
    difference: 23,
    createdAt: "2026-04-01T00:00:00Z",
  },
  "cycle-3": {
    id: "cycle-3",
    cityId: "city-3",
    cycleNumber: 5,
    startDate: "2026-02-15T00:00:00Z",
    endDate: "2026-03-15T00:00:00Z",
    status: "complete",
    previousCustfileCount: 3400,
    currentCustfileCount: 3421,
    difference: 21,
    createdAt: "2026-02-15T00:00:00Z",
  },
  "cycle-4": {
    id: "cycle-4",
    cityId: "city-4",
    cycleNumber: 4,
    startDate: "2026-03-01T00:00:00Z",
    endDate: "2026-04-01T00:00:00Z",
    status: "complete",
    previousCustfileCount: 4080,
    currentCustfileCount: 4102,
    difference: 22,
    createdAt: "2026-03-01T00:00:00Z",
  },
  "cycle-5": {
    id: "cycle-5",
    cityId: "city-5",
    cycleNumber: 2,
    startDate: "2026-03-20T00:00:00Z",
    endDate: "2026-04-20T00:00:00Z",
    status: "active",
    previousCustfileCount: 5200,
    currentCustfileCount: 5230,
    difference: 30,
    createdAt: "2026-03-20T00:00:00Z",
  },
};

// ---- Hooks ----

export function useCityDetail(cityId: string) {
  return useQuery({
    queryKey: ["city", cityId],
    queryFn: async (): Promise<CityWithStats> => {
      // Real API call (swap later):
      // const res = await api.get<ApiResponse<CityWithStats>>(`/cities/${cityId}`);
      // return res.data;

      await new Promise((r) => setTimeout(r, 400));
      const city = mockCities[cityId];
      if (!city) throw new Error("City not found");
      return city;
    },
    enabled: !!cityId,
  });
}

export function useCityCycle(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["cycle", cycleId],
    queryFn: async (): Promise<Cycle> => {
      // Real API call (swap later):
      // const res = await api.get<ApiResponse<Cycle>>(`/cycles/${cycleId}`);
      // return res.data;

      await new Promise((r) => setTimeout(r, 300));
      const cycle = mockCycles[cycleId!];
      if (!cycle) throw new Error("Cycle not found");
      return cycle;
    },
    enabled: !!cycleId,
  });
}
