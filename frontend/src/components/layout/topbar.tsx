"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useCityStore } from "@/stores/city-store";
import { useState } from "react";

function getBreadcrumbs(pathname: string, cityName: string | null): { label: string; href?: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [];

  if (segments[0] === "dashboard") {
    crumbs.push({ label: "Dashboard" });
  } else if (segments[0] === "city" && segments[1]) {
    crumbs.push({ label: "Dashboard", href: "/dashboard" });
    crumbs.push({ label: cityName || "City", href: `/city/${segments[1]}` });

    const pageLabels: Record<string, string> = {
      "load-manager": "Load Manager",
      review: "Meter Review",
      rereads: "Rereads",
      data: "City Data",
      reports: "Reports",
      certified: "Certified Reports",
      history: "History",
    };

    if (segments[2] && pageLabels[segments[2]]) {
      crumbs.push({ label: pageLabels[segments[2]] });
    }
  } else if (segments[0] === "readers") {
    crumbs.push({ label: "Readers" });
  }

  return crumbs;
}

export function TopBar() {
  const pathname = usePathname();
  const { selectedCityName } = useCityStore();
  const [searchQuery, setSearchQuery] = useState("");
  const breadcrumbs = getBreadcrumbs(pathname, selectedCityName);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {crumb.href ? (
              <a href={crumb.href} className="text-muted-foreground hover:text-foreground">
                {crumb.label}
              </a>
            ) : (
              <span className="font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Meter Lookup */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Look up meter by ID, address, or account..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </header>
  );
}
