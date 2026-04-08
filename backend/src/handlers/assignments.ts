import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { query, queryOne } from '../lib/db';
import {
  ok,
  created,
  noContent,
  badRequest,
  notFound,
  serverError,
} from '../lib/response';
import { extractUser } from '../lib/auth';
import { ASSIGNMENTS_BY_CITY, ASSIGNMENT_DETAIL } from '../db/queries';

// ---------------------------------------------------------------------------
// GET /cities/:id/assignments
// ---------------------------------------------------------------------------
async function listAssignments(
  cityId: string
): Promise<APIGatewayProxyResultV2> {
  const rows = await query(ASSIGNMENTS_BY_CITY, [cityId]);
  return ok({ assignments: rows });
}

// ---------------------------------------------------------------------------
// GET /assignments/:id
// ---------------------------------------------------------------------------
async function getAssignment(
  assignmentId: string
): Promise<APIGatewayProxyResultV2> {
  const row = await queryOne(ASSIGNMENT_DETAIL, [assignmentId]);
  if (!row) return notFound('Assignment not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// POST /assignments
// ---------------------------------------------------------------------------
async function createAssignment(
  body: string | undefined,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { route_id, reader_id, cycle_id } = JSON.parse(body) as {
    route_id?: string;
    reader_id?: string;
    cycle_id?: string;
  };

  if (!route_id || !reader_id || !cycle_id) {
    return badRequest('route_id, reader_id, and cycle_id are required');
  }

  const row = await queryOne(
    `INSERT INTO assignments (route_id, reader_id, cycle_id, status, assigned_by, assigned_at)
     VALUES ($1, $2, $3, 'assigned', $4, NOW())
     RETURNING *`,
    [route_id, reader_id, cycle_id, userId]
  );

  return created(row);
}

// ---------------------------------------------------------------------------
// PUT /assignments/:id
// ---------------------------------------------------------------------------
async function updateAssignment(
  assignmentId: string,
  body: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { status, reader_id } = JSON.parse(body) as {
    status?: string;
    reader_id?: string;
  };

  const sets: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [];
  let idx = 1;

  if (status) {
    sets.push(`status = $${idx++}`);
    values.push(status);
  }
  if (reader_id) {
    sets.push(`reader_id = $${idx++}`);
    values.push(reader_id);
  }
  if (status === 'completed') {
    sets.push(`completed_at = NOW()`);
  }

  values.push(assignmentId);

  const row = await queryOne(
    `UPDATE assignments SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (!row) return notFound('Assignment not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// DELETE /assignments/:id
// ---------------------------------------------------------------------------
async function deleteAssignment(
  assignmentId: string
): Promise<APIGatewayProxyResultV2> {
  const row = await queryOne(
    `DELETE FROM assignments WHERE id = $1 RETURNING id`,
    [assignmentId]
  );
  if (!row) return notFound('Assignment not found');
  return noContent();
}

// ---------------------------------------------------------------------------
// POST /assignments/:id/split
// ---------------------------------------------------------------------------
async function splitAssignment(
  assignmentId: string,
  body: string | undefined,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { reader_ids, meter_splits } = JSON.parse(body) as {
    reader_ids: string[];
    meter_splits: Record<string, string>; // meter_id -> reader_id
  };

  if (!reader_ids || reader_ids.length < 2) {
    return badRequest('At least 2 reader_ids are required to split');
  }

  // Fetch original assignment
  const original = await queryOne(ASSIGNMENT_DETAIL, [assignmentId]);
  if (!original) return notFound('Assignment not found');

  // Mark original as split
  await queryOne(
    `UPDATE assignments SET status = 'split', updated_at = NOW() WHERE id = $1 RETURNING id`,
    [assignmentId]
  );

  // Create new assignments for each reader
  const newAssignments = [];
  for (const readerId of reader_ids) {
    const row = await queryOne(
      `INSERT INTO assignments (route_id, reader_id, cycle_id, status, assigned_by, assigned_at, parent_assignment_id)
       VALUES ($1, $2, $3, 'assigned', $4, NOW(), $5)
       RETURNING *`,
      [original.route_id, readerId, original.cycle_id, userId, assignmentId]
    );
    newAssignments.push(row);
  }

  // If meter-level splits are provided, record them
  if (meter_splits) {
    for (const [meterId, readerId] of Object.entries(meter_splits)) {
      await queryOne(
        `INSERT INTO assignment_meters (assignment_id, meter_id, reader_id)
         SELECT a.id, $2, $3
         FROM assignments a
         WHERE a.reader_id = $3 AND a.parent_assignment_id = $1
         LIMIT 1`,
        [assignmentId, meterId, readerId]
      );
    }
  }

  return created({ original_id: assignmentId, new_assignments: newAssignments });
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

    // GET /cities/:id/assignments
    const cityMatch = path.match(/^\/cities\/([^/]+)\/assignments$/);
    if (method === 'GET' && cityMatch) {
      return await listAssignments(cityMatch[1]);
    }

    // POST /assignments
    if (method === 'POST' && path === '/assignments') {
      return await createAssignment(event.body, user.userId);
    }

    // POST /assignments/:id/split
    const splitMatch = path.match(/^\/assignments\/([^/]+)\/split$/);
    if (method === 'POST' && splitMatch) {
      return await splitAssignment(splitMatch[1], event.body, user.userId);
    }

    // GET /assignments/:id
    const detailMatch = path.match(/^\/assignments\/([^/]+)$/);
    if (method === 'GET' && detailMatch) {
      return await getAssignment(detailMatch[1]);
    }

    // PUT /assignments/:id
    if (method === 'PUT' && detailMatch) {
      return await updateAssignment(detailMatch[1], event.body);
    }

    // DELETE /assignments/:id
    if (method === 'DELETE' && detailMatch) {
      return await deleteAssignment(detailMatch[1]);
    }

    return notFound('Route not found');
  } catch (err) {
    console.error('assignments handler error', err);
    return serverError('Internal server error');
  }
}
