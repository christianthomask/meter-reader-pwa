"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Camera,
  RefreshCw,
  Database,
  BarChart3,
  ShieldCheck,
  Clock,
  UserCircle,
  LogOut,
  ChevronDown,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCityStore } from "@/stores/city-store";
import { useAuthStore } from "@/stores/auth-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

function getCityNavItems(cityId: string, stats?: { toReview: number; toReread: number }): NavItem[] {
  return [
    { label: "Dashboard", href: `/city/${cityId}`, icon: LayoutDashboard },
    { label: "Load Manager", href: `/city/${cityId}/load-manager`, icon: Users },
    { label: "Meter Review", href: `/city/${cityId}/review`, icon: Camera, badge: stats?.toReview },
    { label: "Rereads", href: `/city/${cityId}/rereads`, icon: RefreshCw, badge: stats?.toReread },
    { label: "City Data", href: `/city/${cityId}/data`, icon: Database },
    { label: "Reports", href: `/city/${cityId}/reports`, icon: BarChart3 },
    { label: "Certified", href: `/city/${cityId}/certified`, icon: ShieldCheck },
    { label: "History", href: `/city/${cityId}/history`, icon: Clock },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const { selectedCityId, selectedCityName } = useCityStore();
  const { user, logout } = useAuthStore();

  const cityNavItems = selectedCityId ? getCityNavItems(selectedCityId) : [];

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Droplets className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">RouteManager</span>
      </div>

      {/* City Selector */}
      <div className="border-b p-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent"
        >
          <span className={cn("truncate", !selectedCityName && "text-muted-foreground")}>
            {selectedCityName || "Select a city..."}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {selectedCityId ? (
          <div className="space-y-1">
            {cityNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== `/city/${selectedCityId}` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-destructive text-destructive-foreground"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Select a city to get started
          </p>
        )}

        {/* Global nav */}
        <div className="mt-6 border-t pt-4">
          <Link
            href="/readers"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/readers"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <UserCircle className="h-4 w-4" />
            <span>Readers</span>
          </Link>
        </div>
      </nav>

      {/* User menu */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {user?.fullName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "?"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.fullName || "Not signed in"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.role || ""}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
