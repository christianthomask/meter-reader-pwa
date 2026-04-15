export const queryKeys = {
  cities: {
    all: ["cities"] as const,
    detail: (id: string) => ["cities", id] as const,
    stats: (id: string) => ["cities", id, "stats"] as const,
  },
  cycles: {
    list: (cityId: string) => ["cities", cityId, "cycles"] as const,
    detail: (cityId: string, cycleId: string) => ["cities", cityId, "cycles", cycleId] as const,
  },
  routes: {
    list: (cityId: string) => ["cities", cityId, "routes"] as const,
    detail: (routeId: string) => ["routes", routeId] as const,
  },
  assignments: {
    list: (cityId: string) => ["cities", cityId, "assignments"] as const,
    detail: (id: string) => ["assignments", id] as const,
  },
  readers: {
    all: ["readers"] as const,
    detail: (id: string) => ["readers", id] as const,
  },
  meters: {
    list: (cityId: string) => ["cities", cityId, "meters"] as const,
    detail: (id: string) => ["meters", id] as const,
    lookup: (query: string, type: string) => ["meters", "lookup", query, type] as const,
  },
  readings: {
    exceptions: (cityId: string) => ["cities", cityId, "readings", "exceptions"] as const,
    rereads: (cityId: string) => ["cities", cityId, "readings", "rereads"] as const,
    history: (meterId: string) => ["meters", meterId, "readings", "history"] as const,
  },
  reports: {
    general: (cityId: string, type: string) => ["cities", cityId, "reports", "general", type] as const,
    currentCycle: (cityId: string, type: string) => ["cities", cityId, "reports", "current-cycle", type] as const,
    readers: (cityId: string, type: string) => ["cities", cityId, "reports", "readers", type] as const,
    certified: (cityId: string, type: string) => ["cities", cityId, "reports", "certified", type] as const,
    history: (cityId: string, cycleId: string, type: string) =>
      ["cities", cityId, "reports", "history", cycleId, type] as const,
  },
} as const;
