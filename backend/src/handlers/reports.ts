import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { query } from '../lib/db';
import { ok, notFound, serverError } from '../lib/response';
import { REPORT_READER_TOTALS, REPORT_ROUTE_COUNT } from '../db/queries';

// ---------------------------------------------------------------------------
// Report registry
// ---------------------------------------------------------------------------
interface ReportConfig {
  title: string;
  sql: string;
  columns: string[];
}

type ReportCategory = Record<string, ReportConfig>;

const REPORT_REGISTRY: Record<string, ReportCategory> = {
  productivity: {
    'reader-totals': {
      title: 'Reader Totals',
      sql: REPORT_READER_TOTALS,
      columns: ['reader', 'total_readings', 'exceptions', 'approved'],
    },
  },
  coverage: {
    'route-count': {
      title: 'Route Meter & Reading Counts',
      sql: REPORT_ROUTE_COUNT,
      columns: [
        'route_code',
        'route_name',
        'meter_count',
        'reading_count',
        'certified',
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// GET /cities/:id/reports
// ---------------------------------------------------------------------------
async function listReports(): Promise<APIGatewayProxyResultV2> {
  const catalog: Record<string, { slug: string; title: string }[]> = {};

  for (const [category, reports] of Object.entries(REPORT_REGISTRY)) {
    catalog[category] = Object.entries(reports).map(([slug, cfg]) => ({
      slug,
      title: cfg.title,
    }));
  }

  return ok({ reports: catalog });
}

// ---------------------------------------------------------------------------
// GET /cities/:id/reports/:category/:type
// ---------------------------------------------------------------------------
async function runReport(
  cityId: string,
  category: string,
  reportType: string
): Promise<APIGatewayProxyResultV2> {
  const categoryMap = REPORT_REGISTRY[category];
  if (!categoryMap) return notFound(`Report category '${category}' not found`);

  const config = categoryMap[reportType];
  if (!config) {
    return notFound(
      `Report '${reportType}' not found in category '${category}'`
    );
  }

  const rows = await query(config.sql, [cityId]);

  return ok({
    title: config.title,
    columns: config.columns,
    rows,
    count: rows.length,
  });
}

// ---------------------------------------------------------------------------
// Handler entry point
// ---------------------------------------------------------------------------
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // GET /cities/:id/reports/:category/:type
    const reportMatch = path.match(
      /^\/cities\/([^/]+)\/reports\/([^/]+)\/([^/]+)$/
    );
    if (method === 'GET' && reportMatch) {
      return await runReport(reportMatch[1], reportMatch[2], reportMatch[3]);
    }

    // GET /cities/:id/reports (catalog)
    const catalogMatch = path.match(/^\/cities\/([^/]+)\/reports$/);
    if (method === 'GET' && catalogMatch) {
      return await listReports();
    }

    return notFound('Route not found');
  } catch (err) {
    console.error('reports handler error', err);
    return serverError('Internal server error');
  }
}
