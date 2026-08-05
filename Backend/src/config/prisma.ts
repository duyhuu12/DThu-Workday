import './env.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { booleanEnv, numberEnv, requiredEnv } from './env.js';

const adapter = new PrismaMariaDb({
  host: requiredEnv('DATABASE_HOST'),
  port: numberEnv('DATABASE_PORT', 3306),
  user: requiredEnv('DATABASE_USER'),
  password: requiredEnv('DATABASE_PASSWORD'),
  database: requiredEnv('DATABASE_NAME'),
  connectionLimit: numberEnv('DATABASE_CONNECTION_LIMIT', 5),
  connectTimeout: numberEnv('DATABASE_CONNECT_TIMEOUT_MS', 10_000),
  acquireTimeout: numberEnv('DATABASE_ACQUIRE_TIMEOUT_MS', 20_000),
  allowPublicKeyRetrieval: booleanEnv('DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL', true),
  ssl: booleanEnv('DATABASE_SSL', false),
});

export const prisma = new PrismaClient({ adapter });
