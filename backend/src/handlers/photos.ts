import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ok, badRequest, serverError } from '../lib/response';
import { extractUser } from '../lib/auth';

const s3 = new S3Client({});
const BUCKET = process.env.PHOTOS_BUCKET ?? '';
const PRESIGNED_EXPIRY = 300; // 5 minutes

// ---------------------------------------------------------------------------
// GET /photos/upload-url?filename=...&contentType=...
// ---------------------------------------------------------------------------
async function getUploadUrl(
  filename: string | undefined,
  contentType: string | undefined,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  if (!filename) return badRequest('filename query parameter is required');

  const key = `readings/${userId}/${Date.now()}-${filename}`;
  const ct = contentType ?? 'image/jpeg';

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
async function getDownloadUrl(
  key: string | undefined
): Promise<APIGatewayProxyResultV2> {
  if (!key) return badRequest('key query parameter is required');

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
