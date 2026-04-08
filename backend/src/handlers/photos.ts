import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ok, badRequest, forbidden, serverError } from '../lib/response';
import { extractUser, requireRole } from '../lib/auth';

const s3 = new S3Client({});
const BUCKET = process.env.PHOTOS_BUCKET ?? '';
const PRESIGNED_EXPIRY = 300; // 5 minutes

// ---------------------------------------------------------------------------
// GET /photos/upload-url?filename=...&contentType=...
// ---------------------------------------------------------------------------
// Allowed MIME types for photo uploads (SEC-010)
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function getUploadUrl(
  filename: string | undefined,
  contentType: string | undefined,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  if (!filename) return badRequest('filename query parameter is required');

  // SEC-010: Validate content type
  const ct = contentType ?? 'image/jpeg';
  if (!ALLOWED_CONTENT_TYPES.includes(ct)) {
    return badRequest(
      `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`
    );
  }

  // SEC-009: Sanitize filename – strip path separators, keep only safe chars,
  // then prefix with a timestamp to avoid collisions.
  const sanitized = filename
    .replace(/[/\\]/g, '')          // strip path separators
    .replace(/\.\./g, '')           // strip traversal sequences
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // keep only safe chars
  const safeFilename = sanitized || `upload-${Date.now()}`;

  const key = `readings/${userId}/${Date.now()}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: ct,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: PRESIGNED_EXPIRY,
  });

  return ok({ upload_url: url, key, content_type: ct });
}

// ---------------------------------------------------------------------------
// GET /photos/download-url?key=...
// ---------------------------------------------------------------------------
// SEC-002: Allowed S3 key prefixes for download URLs
const ALLOWED_KEY_PREFIXES = ['photos/', 'custfiles/', 'readings/'];

async function getDownloadUrl(
  key: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!key) return badRequest('key query parameter is required');

  // SEC-002: Reject path traversal and validate key prefix
  if (key.includes('..')) {
    return badRequest('Invalid key: path traversal not allowed');
  }
  const hasAllowedPrefix = ALLOWED_KEY_PREFIXES.some((prefix) =>
    key.startsWith(prefix)
  );
  if (!hasAllowedPrefix) {
    return badRequest(
      `Invalid key: must start with one of ${ALLOWED_KEY_PREFIXES.join(', ')}`
    );
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: PRESIGNED_EXPIRY,
  });

  return ok({ download_url: url, key });
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
      requireRole(user, ['admin', 'manager', 'reader']);
    } catch {
      return forbidden();
    }

    // GET /photos/upload-url
    if (method === 'GET' && path === '/photos/upload-url') {
      return await getUploadUrl(qs.filename, qs.contentType, user.userId);
    }

    // GET /photos/download-url
    if (method === 'GET' && path === '/photos/download-url') {
      return await getDownloadUrl(qs.key);
    }

    return badRequest('Unknown photos endpoint');
  } catch (err) {
    console.error('photos handler error', err);
    return serverError('Internal server error');
  }
}
