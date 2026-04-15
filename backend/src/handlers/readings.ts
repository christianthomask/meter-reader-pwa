import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { query, queryOne } from '../lib/db';
import { ok, badRequest, notFound, forbidden, serverError } from '../lib/response';
import { extractUser, requireRole } from '../lib/auth';
import {
  READINGS_EXCEPTIONS,
  READINGS_REREADS,
  READING_HISTORY,
  READING_APPROVE,
  READING_REJECT,
} from '../db/queries';

// ---------------------------------------------------------------------------
// GET /cities/:id/readings/exceptions
// ---------------------------------------------------------------------------
async function getExceptions(
  cityId: string
): Promise<APIGatewayProxyResultV2> {
  const rows = await query(READINGS_EXCEPTIONS, [cityId]);
  return ok({ readings: rows, count: rows.length });
}

// ---------------------------------------------------------------------------
// GET /cities/:id/readings/rereads
// ---------------------------------------------------------------------------
async function getRereads(cityId: string): Promise<APIGatewayProxyResultV2> {
  const rows = await query(READINGS_REREADS, [cityId]);
  return ok({ readings: rows, count: rows.length });
}

// ---------------------------------------------------------------------------
// GET /meters/:id/readings/history
// ---------------------------------------------------------------------------
async function getHistory(meterId: string): Promise<APIGatewayProxyResultV2> {
  const rows = await query(READING_HISTORY, [meterId]);
  return ok({ readings: rows });
}

// ---------------------------------------------------------------------------
// PUT /readings/:id/approve
// ---------------------------------------------------------------------------
async function approveReading(
  readingId: string,
  body: string | undefined,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const parsed = body ? (JSON.parse(body) as { value?: number }) : {};
  const newValue = parsed.value ?? null;

  const row = await queryOne(READING_APPROVE, [readingId, newValue, userId]);
  if (!row) return notFound('Reading not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// PUT /readings/:id/reject
// ---------------------------------------------------------------------------
async function rejectReading(
  readingId: string,
  body: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { reason } = JSON.parse(body) as { reason?: string };
  if (!reason) return badRequest('reason is required');

  const row = await queryOne(READING_REJECT, [readingId, reason]);
  if (!row) return notFound('Reading not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// PUT /readings/:id/edit
// ---------------------------------------------------------------------------
async function editReading(
  readingId: string,
  body: string | undefined,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { value } = JSON.parse(body) as { value?: number };
  if (value === undefined) return badRequest('value is required');

  const row = await queryOne(
    `UPDATE readings
     SET original_value = CASE WHEN original_value IS NULL THEN value ELSE original_value END,
         value = $2,
         edited_by = $3,
         edited_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [readingId, value, userId]
  );

  if (!row) return notFound('Reading not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// POST /cities/:id/readings/certify
// ---------------------------------------------------------------------------
async function certifyReadings(
  cityId: string,
  body: string | undefined,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { reading_ids } = JSON.parse(body) as { reading_ids?: string[] };
  if (!reading_ids || reading_ids.length === 0) {
    return badRequest('reading_ids array is required');
  }

  // Build parameterized placeholders: $3, $4, $5, ...
  const placeholders = reading_ids.map((_, i) => `$${i + 3}`).join(', ');

  const rows = await query(
    `UPDATE readings r
     SET status = 'certified',
         certified_by = $1,
         certified_at = NOW(),
         updated_at = NOW()
     FROM meters m
     WHERE r.meter_id = m.id
       AND m.city_id = $2
       AND r.id IN (${placeholders})
       AND r.status = 'approved'
     RETURNING r.*`,
    [userId, cityId, ...reading_ids]
  );

  return ok({
    certified: rows.length,
    total_requested: reading_ids.length,
    readings: rows,
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
    const user = extractUser(event);

    try {
      requireRole(user, ['admin', 'manager']);
    } catch {
      return forbidden();
    }

    // GET /cities/:id/readings/exceptions
    const exceptionsMatch = path.match(
      /^\/cities\/([^/]+)\/readings\/exceptions$/
    );
    if (method === 'GET' && exceptionsMatch) {
      return await getExceptions(exceptionsMatch[1]);
    }

    // GET /cities/:id/readings/rereads
    const rereadsMatch = path.match(
      /^\/cities\/([^/]+)\/readings\/rereads$/
    );
    if (method === 'GET' && rereadsMatch) {
      return await getRereads(rereadsMatch[1]);
    }

    // POST /cities/:id/readings/certify
    const certifyMatch = path.match(
      /^\/cities\/([^/]+)\/readings\/certify$/
    );
    if (method === 'POST' && certifyMatch) {
      return await certifyReadings(certifyMatch[1], event.body, user.userId);
    }

    // GET /meters/:id/readings/history
    const historyMatch = path.match(
      /^\/meters\/([^/]+)\/readings\/history$/
    );
    if (method === 'GET' && historyMatch) {
      return await getHistory(historyMatch[1]);
    }

    // PUT /readings/:id/approve
    const approveMatch = path.match(/^\/readings\/([^/]+)\/approve$/);
    if (method === 'PUT' && approveMatch) {
      return await approveReading(approveMatch[1], event.body, user.userId);
    }

    // PUT /readings/:id/reject
    const rejectMatch = path.match(/^\/readings\/([^/]+)\/reject$/);
    if (method === 'PUT' && rejectMatch) {
      return await rejectReading(rejectMatch[1], event.body);
    }

    // PUT /readings/:id/edit
    const editMatch = path.match(/^\/readings\/([^/]+)\/edit$/);
    if (method === 'PUT' && editMatch) {
      return await editReading(editMatch[1], event.body, user.userId);
    }

    return notFound('Route not found');
  } catch (err) {
    console.error('readings handler error', err);
    return serverError('Internal server error');
  }
}
