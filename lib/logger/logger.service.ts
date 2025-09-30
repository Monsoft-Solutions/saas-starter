import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../env';

/**
 * Winston Logger Service
 *
 * Provides centralized, structured logging with environment-aware configuration.
 *
 * Features:
 * - Development: Console output with colorization
 * - Production: Daily rotating file logs with JSON format
 * - Environment-aware log levels
 * - Structured logging with timestamps and metadata
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define transports based on environment
const transports: winston.transport[] = [];

if (env.NODE_ENV === 'production') {
  // Production: File logging with daily rotation
  const fileRotateTransport = new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: format,
  });

  const errorFileRotateTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: format,
  });

  // In production, only log errors and warnings to console
  const consoleTransport = new winston.transports.Console({
    level: 'warn',
    format: consoleFormat,
  });

  transports.push(
    fileRotateTransport,
    errorFileRotateTransport,
    consoleTransport
  );
} else {
  // Development: Console logging with all levels
  const consoleTransport = new winston.transports.Console({
    level: 'debug',
    format: consoleFormat,
  });

  transports.push(consoleTransport);
}

// Create the logger
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
  // Do not exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled promise rejections
if (env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format: format,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format: format,
    })
  );
}

// Create a stream object for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Export the logger instance
export default logger;

// Export convenience methods for common logging patterns
export const logInfo = (message: string, meta?: any) =>
  logger.info(message, meta);
export const logError = (message: string, error?: Error | any, meta?: any) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      ...meta,
    });
  } else {
    logger.error(message, { error, ...meta });
  }
};
export const logWarn = (message: string, meta?: any) =>
  logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) =>
  logger.debug(message, meta);
export const logHttp = (message: string, meta?: any) =>
  logger.http(message, meta);
