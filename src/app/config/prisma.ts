import { PrismaClient } from '@prisma/client';
import config from './index';

// Declare global space to hold PrismaClient singleton in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.env !== 'production') {
  globalThis.prisma = prisma;
}
