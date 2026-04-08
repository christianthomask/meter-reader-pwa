import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { query, queryOne } from '../lib/db';
import { ok, notFound, badRequest, forbidden, serverError } from '../lib/response';
import { extractUser, requireRole } from '../lib/auth';
import { CITIES_LIST, CITY_DETAIL, CITY_STATS } from '../db/queries';

// ---------------------------------------------------------------------------
// GET /cities
// ---------------------------------------------------------------------------
async function listCities(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  const user = extractUser(event);

  const rows = await query(CITIES_LIST, [user.userId]);

  // Group by status for the dashboard view
  const grouped: Record<string, unknown[]> = {};
  for (const row of rows) {
    const status = (row.status as string) ?? 'unknown';
    if (!grouped[status]) grouped[status] = [];
    grouped[status].push(row);
  }

  return ok({ cities: rows, byStatus: grouped });
}

// ---------------------------------------------------------------------------
// GET /cities/:id
// ---------------------------------------------------------------------------
async function getCity(cityId: string): Promise<APIGatewayProxyResultV2> {
  const city = await queryOne(CITY_DETAIL, [cityId]);
  if (!city) return notFound('City not found');
  return ok(city);
}

// ---------------------------------------------------------------------------
// PUT /cities/:id/status
// ---------------------------------------------------------------------------
async function updateCityStatus(
  cityId: string,
  body: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { status } = JSON.parse(body) as { status?: string };
  if (!status) return badRequest('status is required');

  const validStatuses = ['active', 'inactive', 'pending', 'archived'];
  if (!validStatuses.includes(status)) {
    return badRequest(`status must be one of: ${validStatuses.join(', ')}`);
  }

  const updated = await queryOne(
    `UPDATE cities SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [cityId, status]
  );

  if (!updated) return notFound('City not found');
  return ok(updated);
}

// ---------------------------------------------------------------------------
// GET /cities/:id/stats
// ---------------------------------------------------------------------------
async function getCityStats(cityId: string): Promise<APIGatewayProxyResultV2> {
  const stats = await queryOne(CITY_STATS, [cityId]);
  if (!stats) return notFound('City not found');
  return ok(stats);
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
    const user = extractUser(event);

    try {
      requireRole(user, ['admin', 'manager']);
    } catch {
      return forbidden();
    }

    // GET /cities
    if (method === 'GET' && path === '/cities') {
      return await listCities(event);
    }

    // GET /cities/:id/stats
    const statsMatch = path.match(/^\/cities\/([^/]+)\/stats$/);
    if (method === 'GET' && statsMatch) {
      return await getCityStats(statsMatch[1]);
    }

    // PUT /cities/:id/status
    const statusMatch = path.match(/^\/cities\/([^/]+)\/status$/);
    if (method === 'PUT' && statusMatch) {
      return await updateCityStatus(statusMatch[1], event.body);
    }

    // GET /cities/:id
    const detailMatch = path.match(/^\/cities\/([^/]+)$/);
    if (method === 'GET' && detailMatch) {
      return await getCity(detailMatch[1]);
    }

    return notFound('Route not found');
  } catch (err) {
    console.error('cities handler error', err);
    return serverError('Internal server error');
  }
}
