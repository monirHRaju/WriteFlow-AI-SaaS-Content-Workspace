import Redis from 'ioredis';
import config from './index';
import logger from '../utils/logger';

/**
 * Shared Redis connection instance for BullMQ Queue and Workers.
 * Configured with maxRetriesPerRequest: null as strictly required by BullMQ.
 */
export const redisConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  connectTimeout: 5000,
});

redisConnection.on('connect', () => {
  logger.info('🚀 Connected to Redis singleton successfully for BullMQ');
});

redisConnection.on('error', (error) => {
  logger.error('❌ Redis Connection Error (BullMQ):', error);
});

export default redisConnection;
