import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { query, queryOne } from '../lib/db';
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError,
} from '../lib/response';
import { extractUser } from '../lib/auth';
import { CYCLES_BY_CITY, CYCLE_DETAIL } from '../db/queries';

// ---------------------------------------------------------------------------
// GET /cities/:id/cycles
// ---------------------------------------------------------------------------
async function listCycles(cityId: string): Promise<APIGatewayProxyResultV2> {
  const rows = await query(CYCLES_BY_CITY, [cityId]);
  return ok({ cycles: rows });
}

// ---------------------------------------------------------------------------
// GET /cycles/:id
// ---------------------------------------------------------------------------
async function getCycle(cycleId: string): Promise<APIGatewayProxyResultV2> {
  const row = await queryOne(CYCLE_DETAIL, [cycleId]);
  if (!row) return notFound('Cycle not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// POST /cities/:id/cycles
// ---------------------------------------------------------------------------
async function createCycle(
  cityId: string,
  body: string | undefined,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { name, start_date, end_date } = JSON.parse(body) as {
    name?: string;
    start_date?: string;
    end_date?: string;
  };

  if (!name || !start_date || !end_date) {
    return badRequest('name, start_date, and end_date are required');
  }

  const row = await queryOne(
    `INSERT INTO cycles (city_id, name, status, start_date, end_date, created_by, created_at)
     VALUES ($1, $2, 'active', $3, $4, $5, NOW())
     RETURNING *`,
    [cityId, name, start_date, end_date, userId]
  );

  return created(row);
}

// ---------------------------------------------------------------------------
// POST /cycles/:id/upload-custfile
// ---------------------------------------------------------------------------
async function uploadCustfile(
  cycleId: string,
  body: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { meters } = JSON.parse(body) as {
    meters?: Array<{
      serial_number: string;
      address: string;
      route_code: string;
      previous_reading?: number;
    }>;
  };

  if (!meters || meters.length === 0) {
    return badRequest('meters array is required');
  }

  // Verify cycle exists
  const cycle = await queryOne(CYCLE_DETAIL, [cycleId]);
  if (!cycle) return notFound('Cycle not found');

  let imported = 0;
  let skipped = 0;

  for (const meter of meters) {
    try {
      await queryOne(
        `INSERT INTO cycle_meters (cycle_id, serial_number, address, route_code, previous_reading)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (cycle_id, serial_number) DO UPDATE
         SET address = EXCLUDED.address,
             route_code = EXCLUDED.route_code,
             previous_reading = EXCLUDED.previous_reading`,
        [
          cycleId,
          meter.serial_number,
          meter.address,
          meter.route_code,
          meter.previous_reading ?? null,
        ]
      );
      imported++;
    } catch {
      skipped++;
    }
  }

  return ok({ imported, skipped, total: meters.length });
}

// ---------------------------------------------------------------------------
// GET /cycles/:id/download-reads
// ---------------------------------------------------------------------------
async function downloadReads(
  cycleId: string
): Promise<APIGatewayProxyResultV2> {
  const rows = await query(
    `SELECT m.serial_number, m.address,
            r.value AS reading_value, r.reading_timestamp,
            r.status, r.is_exception, r.needs_reread,
            rt.code AS route_code
     FROM readings r
     JOIN meters m ON m.id = r.meter_id
     JOIN assignments a ON a.id = r.assignment_id
     LEFT JOIN routes rt ON rt.id = m.route_id
     WHERE a.cycle_id = $1
     ORDER BY rt.code, m.address`,
    [cycleId]
  );

  return ok({ cycle_id: cycleId, readings: rows, count: rows.length });
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

    // GET /cities/:id/cycles
    const cityCyclesMatch = path.match(/^\/cities\/([^/]+)\/cycles$/);
    if (method === 'GET' && cityCyclesMatch) {
      return await listCycles(cityCyclesMatch[1]);
    }

    // POST /cities/:id/cycles
    if (method === 'POST' && cityCyclesMatch) {
      return await createCycle(cityCyclesMatch[1], event.body, user.userId);
    }

    // POST /cycles/:id/upload-custfile
    const uploadMatch = path.match(/^\/cycles\/([^/]+)\/upload-custfile$/);
    if (method === 'POST' && uploadMatch) {
      return await uploadCustfile(uploadMatch[1], event.body);
    }

    // GET /cycles/:id/download-reads
    const downloadMatch = path.match(/^\/cycles\/([^/]+)\/download-reads$/);
    if (method === 'GET' && downloadMatch) {
      return await downloadReads(downloadMatch[1]);
    }

    // GET /cycles/:id
    const cycleMatch = path.match(/^\/cycles\/([^/]+)$/);
    if (method === 'GET' && cycleMatch) {
      return await getCycle(cycleMatch[1]);
    }

    return notFound('Route not found');
  } catch (err) {
    console.error('cycles handler error', err);
    return serverError('Internal server error');
  }
}
