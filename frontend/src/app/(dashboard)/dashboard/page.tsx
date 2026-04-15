"use client";

import { useCityStore } from "@/stores/city-store";

// TODO: Replace with real data from API
const mockCities = [
  { id: "1", name: "Grover Beach", status: "active" as const, totalMeters: 847, metersRead: 612 },
  { id: "2", name: "Arroyo Grande", status: "read_pending" as const, totalMeters: 1234, metersRead: 0 },
  { id: "3", name: "Pismo Beach", status: "complete" as const, totalMeters: 562, metersRead: 562 },
  { id: "4", name: "Oceano", status: "ready_to_download" as const, totalMeters: 389, metersRead: 389 },
  { id: "5", name: "Nipomo", status: "active" as const, totalMeters: 1156, metersRead: 834 },
];

const statusLabels = {
  active: "Active",
  read_pending: "Read Pending",
  complete: "Complete",
  ready_to_download: "Ready to Download",
};

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  read_pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  complete: "bg-blue-100 text-blue-800 border-blue-200",
  ready_to_download: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function DashboardPage() {
  const { setSelectedCity } = useCityStore();

  const grouped = mockCities.reduce(
    (acc, city) => {
      if (!acc[city.status]) acc[city.status] = [];
      acc[city.status].push(city);
      return acc;
    },
    {} as Record<string, typeof mockCities>
  );

  const statusOrder = ["active", "read_pending", "ready_to_download", "complete"] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Cities</h1>
        <p className="text-muted-foreground">Select a city to manage meter readings</p>
      </div>

      {statusOrder.map((status) => {
        const cities = grouped[status];
        if (!cities?.length) return null;
        return (
          <div key={status} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {statusLabels[status]}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <a
                  key={city.id}
                  href={`/city/${city.id}`}
                  onClick={() => setSelectedCity(city.id, city.name)}
                  className="group rounded-lg border bg-card p-5 shadow-sm transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold group-hover:text-primary">{city.name}</h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[city.status]}`}
                    >
                      {statusLabels[city.status]}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">{city.metersRead}</p>
                      <p className="text-xs text-muted-foreground">
                        of {city.totalMeters} meters read
                      </p>
                    </div>
                    {city.totalMeters > 0 && (
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${(city.metersRead / city.totalMeters) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
