import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize } = winston.format;

// Standard customized log layout
const customLogFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Configure logger transports
const transports: winston.transport[] = [
  // 1. Console transport - with colorization for readable local development
  new winston.transports.Console({
    level: 'info',
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customLogFormat
    ),
  }),

  // 2. Rotating File transport for ERRORS only
  new DailyRotateFile({
    level: 'error',
    dirname: path.join(process.cwd(), 'logs'),
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d', // keeps logs for 30 days
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customLogFormat
    ),
  }),

  // 3. Rotating File transport for COMBINED logs (all levels)
  new DailyRotateFile({
    level: 'info',
    dirname: path.join(process.cwd(), 'logs'),
    filename: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customLogFormat
    ),
  }),
];

// Initialize Winston instance
const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customLogFormat
  ),
  transports,
});

export default logger;
