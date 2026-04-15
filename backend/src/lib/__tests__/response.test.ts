import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { ok, badRequest, notFound, created, noContent, unauthorized, forbidden, serverError } from '../response';

// All response helpers return the structured variant of APIGatewayProxyResultV2
type Result = APIGatewayProxyStructuredResultV2;

describe('Response helpers', () => {
  describe('ok()', () => {
    it('returns status 200 with JSON body', () => {
      const result = ok({ data: 'test' }) as Result;
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify({ data: 'test' }));
    });

    it('includes CORS headers', () => {
      const result = ok({ data: 'test' }) as Result;
      const headers = result.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Access-Control-Allow-Origin']).toBeDefined();
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
    });
  });

  describe('created()', () => {
    it('returns status 201', () => {
      const result = created({ id: 1 }) as Result;
      expect(result.statusCode).toBe(201);
      expect(result.body).toBe(JSON.stringify({ id: 1 }));
    });
  });

  describe('noContent()', () => {
    it('returns status 204 with empty body', () => {
      const result = noContent() as Result;
      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
    });
  });

  describe('badRequest()', () => {
    it('returns status 400 with error message', () => {
      const result = badRequest('Invalid input') as Result;
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Invalid input' });
    });

    it('includes CORS headers', () => {
      const result = badRequest('fail') as Result;
      const headers = result.headers as Record<string, string>;
      expect(headers['Access-Control-Allow-Origin']).toBeDefined();
    });
  });

  describe('unauthorized()', () => {
    it('returns status 401', () => {
      const result = unauthorized() as Result;
      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('forbidden()', () => {
    it('returns status 403 with default message', () => {
      const result = forbidden() as Result;
      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Forbidden – insufficient role' });
    });
  });

  describe('notFound()', () => {
    it('returns status 404 with default message', () => {
      const result = notFound() as Result;
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Not found' });
    });

    it('returns status 404 with custom message', () => {
      const result = notFound('Meter not found') as Result;
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Meter not found' });
    });

    it('includes CORS headers', () => {
      const result = notFound() as Result;
      const headers = result.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Access-Control-Allow-Origin']).toBeDefined();
    });
  });

  describe('serverError()', () => {
    it('returns status 500 with default message', () => {
      const result = serverError() as Result;
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Internal server error' });
    });
  });
});
