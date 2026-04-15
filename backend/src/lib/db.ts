import { Pool, PoolConfig } from 'pg';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

interface DbSecret {
  host: string;
  port: number;
  dbname: string;
  username: string;
  password: string;
}

const secretsClient = new SecretsManagerClient({});

// Cache for Lambda warm starts
let cachedSecret: DbSecret | null = null;
let pool: Pool | null = null;

async function getSecret(): Promise<DbSecret> {
  if (cachedSecret) return cachedSecret;

  const secretArn = process.env.DB_SECRET_ARN;
  if (!secretArn) {
    throw new Error('DB_SECRET_ARN environment variable is not set');
  }

  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );

  if (!response.SecretString) {
    throw new Error('Secret value is empty');
  }

  cachedSecret = JSON.parse(response.SecretString) as DbSecret;
  return cachedSecret;
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  const secret = await getSecret();

  const config: PoolConfig = {
    host: secret.host,
    port: secret.port,
    database: secret.dbname,
    user: secret.username,
    password: secret.password,
    max: 3, // Keep low for Lambda concurrency
    idleTimeoutMillis: 60_000,
    connectionTimeoutMillis: 5_000,
    ssl: {
      rejectUnauthorized: true,
    },
  };

  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('Unexpected pool error', err);
    pool = null;
  });

  return pool;
}

/** Run a single query using the shared pool. */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const p = await getPool();
  const result = await p.query<T>(text, params);
  return result.rows;
}

/** Run a single query and return the first row or null. */
export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
