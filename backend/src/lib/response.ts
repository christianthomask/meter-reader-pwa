import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers':
    'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

function jsonResponse(
  statusCode: number,
  body?: unknown
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: body !== undefined ? JSON.stringify(body) : '',
  };
}

export function ok(body: unknown): APIGatewayProxyResultV2 {
  return jsonResponse(200, body);
}

export function created(body: unknown): APIGatewayProxyResultV2 {
  return jsonResponse(201, body);
}

export function noContent(): APIGatewayProxyResultV2 {
  return jsonResponse(204);
}

export function badRequest(message: string): APIGatewayProxyResultV2 {
  return jsonResponse(400, { error: message });
}

export function unauthorized(): APIGatewayProxyResultV2 {
  return jsonResponse(401, { error: 'Unauthorized' });
}

export function forbidden(
  message = 'Forbidden – insufficient role'
): APIGatewayProxyResultV2 {
  return jsonResponse(403, { error: message });
}

export function notFound(message = 'Not found'): APIGatewayProxyResultV2 {
  return jsonResponse(404, { error: message });
}

export function serverError(
  message = 'Internal server error'
): APIGatewayProxyResultV2 {
  return jsonResponse(500, { error: message });
}
