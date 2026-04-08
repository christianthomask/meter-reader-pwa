import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { query, queryOne } from '../lib/db';
import { ok, badRequest, notFound, forbidden, serverError } from '../lib/response';
import { extractUser, requireRole } from '../lib/auth';
import { METERS_BY_CITY, METER_DETAIL, METER_LOOKUP } from '../db/queries';

// ---------------------------------------------------------------------------
// GET /cities/:id/meters
// ---------------------------------------------------------------------------
async function listMeters(cityId: string): Promise<APIGatewayProxyResultV2> {
  const rows = await query(METERS_BY_CITY, [cityId]);
  return ok({ meters: rows });
}

// ---------------------------------------------------------------------------
// GET /meters/:id
// ---------------------------------------------------------------------------
async function getMeter(meterId: string): Promise<APIGatewayProxyResultV2> {
  const row = await queryOne(METER_DETAIL, [meterId]);
  if (!row) return notFound('Meter not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// GET /meters/lookup?serial=...
// ---------------------------------------------------------------------------
async function lookupMeter(
  serial: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!serial) return badRequest('serial query parameter is required');

  const row = await queryOne(METER_LOOKUP, [serial]);
  if (!row) return notFound('Meter not found');
  return ok(row);
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
    const qs = event.queryStringParameters ?? {};
    const user = extractUser(event);

    try {
      requireRole(user, ['admin', 'manager']);
    } catch {
      return forbidden();
    }

    // GET /cities/:id/meters
    const cityMetersMatch = path.match(/^\/cities\/([^/]+)\/meters$/);
    if (method === 'GET' && cityMetersMatch) {
      return await listMeters(cityMetersMatch[1]);
    }

    // GET /meters/lookup?serial=...
    if (method === 'GET' && path === '/meters/lookup') {
      return await lookupMeter(qs.serial);
    }

    // GET /meters/:id
    const meterMatch = path.match(/^\/meters\/([^/]+)$/);
    if (method === 'GET' && meterMatch) {
      return await getMeter(meterMatch[1]);
    }

    return notFound('Route not found');
  } catch (err) {
    console.error('meters handler error', err);
    return serverError('Internal server error');
  }
}
