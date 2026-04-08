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
import { READERS_LIST, READER_DETAIL } from '../db/queries';

// ---------------------------------------------------------------------------
// GET /readers
// ---------------------------------------------------------------------------
async function listReaders(): Promise<APIGatewayProxyResultV2> {
  const rows = await query(READERS_LIST);
  return ok({ readers: rows });
}

// ---------------------------------------------------------------------------
// GET /readers/:id
// ---------------------------------------------------------------------------
async function getReader(readerId: string): Promise<APIGatewayProxyResultV2> {
  const row = await queryOne(READER_DETAIL, [readerId]);
  if (!row) return notFound('Reader not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// POST /readers
// ---------------------------------------------------------------------------
async function createReader(
  body: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { email, full_name, phone } = JSON.parse(body) as {
    email?: string;
    full_name?: string;
    phone?: string;
  };

  if (!email || !full_name) {
    return badRequest('email and full_name are required');
  }

  const row = await queryOne(
    `INSERT INTO users (email, full_name, phone, role, status, created_at)
     VALUES ($1, $2, $3, 'reader', 'active', NOW())
     RETURNING id, email, full_name, phone, status, created_at`,
    [email, full_name, phone ?? null]
  );

  return created(row);
}

// ---------------------------------------------------------------------------
// PUT /readers/:id
// ---------------------------------------------------------------------------
async function updateReader(
  readerId: string,
  body: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!body) return badRequest('Request body is required');

  const { email, full_name, phone, status } = JSON.parse(body) as {
    email?: string;
    full_name?: string;
    phone?: string;
    status?: string;
  };

  const sets: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [];
  let idx = 1;

  if (email) {
    sets.push(`email = $${idx++}`);
    values.push(email);
  }
  if (full_name) {
    sets.push(`full_name = $${idx++}`);
    values.push(full_name);
  }
  if (phone !== undefined) {
    sets.push(`phone = $${idx++}`);
    values.push(phone);
  }
  if (status) {
    sets.push(`status = $${idx++}`);
    values.push(status);
  }

  values.push(readerId);

  const row = await queryOne(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} AND role = 'reader' RETURNING id, email, full_name, phone, status, created_at`,
    values
  );

  if (!row) return notFound('Reader not found');
  return ok(row);
}

// ---------------------------------------------------------------------------
// DELETE /readers/:id
// ---------------------------------------------------------------------------
async function deleteReader(
  readerId: string
): Promise<APIGatewayProxyResultV2> {
  const row = await queryOne(
    `UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = $1 AND role = 'reader' RETURNING id`,
    [readerId]
  );
  if (!row) return notFound('Reader not found');
  return noContent();
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

    // GET /readers
    if (method === 'GET' && path === '/readers') {
      return await listReaders();
    }

    // POST /readers
    if (method === 'POST' && path === '/readers') {
      return await createReader(event.body);
    }

    // GET /readers/:id
    const detailMatch = path.match(/^\/readers\/([^/]+)$/);
    if (detailMatch) {
      if (method === 'GET') return await getReader(detailMatch[1]);
      if (method === 'PUT') return await updateReader(detailMatch[1], event.body);
      if (method === 'DELETE') return await deleteReader(detailMatch[1]);
    }

    return notFound('Route not found');
  } catch (err) {
    console.error('readers handler error', err);
    return serverError('Internal server error');
  }
}
