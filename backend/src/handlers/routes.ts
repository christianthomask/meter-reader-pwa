import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { query, queryOne } from '../lib/db';
import { ok, notFound, serverError } from '../lib/response';
import { ROUTES_BY_CITY, ROUTE_DETAIL } from '../db/queries';

// ---------------------------------------------------------------------------
// GET /cities/:id/routes
// ---------------------------------------------------------------------------
async function listRoutes(cityId: string): Promise<APIGatewayProxyResultV2> {
  const rows = await query(ROUTES_BY_CITY, [cityId]);
  return ok({ routes: rows });
}

// ---------------------------------------------------------------------------
// GET /routes/:id
// ---------------------------------------------------------------------------
async function getRoute(routeId: string): Promise<APIGatewayProxyResultV2> {
  const route = await queryOne(ROUTE_DETAIL, [routeId]);
  if (!route) return notFound('Route not found');
  return ok(route);
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

    // GET /cities/:id/routes
    const cityRoutesMatch = path.match(/^\/cities\/([^/]+)\/routes$/);
    if (method === 'GET' && cityRoutesMatch) {
      return await listRoutes(cityRoutesMatch[1]);
    }

    // GET /routes/:id
    const routeMatch = path.match(/^\/routes\/([^/]+)$/);
    if (method === 'GET' && routeMatch) {
      return await getRoute(routeMatch[1]);
    }

    return notFound('Route not found');
  } catch (err) {
    console.error('routes handler error', err);
    return serverError('Internal server error');
  }
}
