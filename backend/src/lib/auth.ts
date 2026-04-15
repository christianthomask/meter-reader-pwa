import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  groups: string[];
}

/**
 * Extract user info from the Cognito JWT claims attached by the
 * API Gateway JWT authorizer.
 */
export function extractUser(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): AuthUser {
  const claims = event.requestContext.authorizer.jwt.claims;

  const userId = (claims.sub as string) ?? '';
  const email = (claims.email as string) ?? '';
  const role = (claims['custom:role'] as string) ?? 'reader';

  // cognito:groups comes as a space-delimited string or an array
  let groups: string[] = [];
  const rawGroups = claims['cognito:groups'];
  if (Array.isArray(rawGroups)) {
    groups = rawGroups as string[];
  } else if (typeof rawGroups === 'string') {
    groups = rawGroups.split(' ').filter(Boolean);
  }

  return { userId, email, role, groups };
}

/**
 * Verify that the authenticated user has one of the allowed roles.
 * Throws an object with `statusCode` 403 when the check fails so the
 * caller can return an appropriate HTTP response.
 */
export function requireRole(
  user: AuthUser,
  allowedRoles: string[]
): void {
  if (!allowedRoles.includes(user.role)) {
    const err: any = new Error('Forbidden – insufficient role');
    err.statusCode = 403;
    throw err;
  }
}
