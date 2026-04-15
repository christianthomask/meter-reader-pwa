"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getReportCategories } from "@/hooks/use-reports";
import { useCityDetail } from "@/hooks/use-city";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ChevronRight } from "lucide-react";

export default function ReportsPage() {
  const params = useParams();
  const cityId = params.id as string;
  const { data: city, isLoading: cityLoading } = useCityDetail(cityId);
  const categories = getReportCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {cityLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight">
            Reports {city ? `- ${city.name}` : ""}
          </h1>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          View and export reports for this city
        </p>
      </div>

      {/* Three-column report hub */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {category.reports.map((report) =>
                report.available ? (
                  <Link
                    key={report.slug}
                    href={`/city/${cityId}/reports/${report.slug}`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors group"
                  >
                    <span>{report.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ) : (
                  <div
                    key={report.slug}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {report.title}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      (Coming Soon)
                    </span>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
