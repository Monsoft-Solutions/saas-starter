import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../env';
import type { ErrorPayload, LogMetadata, ErrorInput } from './logger.types';
import { isError, isPlainObject } from './logger.types';

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

/**
 * Normalizes error input into a consistent ErrorPayload structure
 *
 * @param error - Error instance, plain object, or unknown value
 * @returns Standardized error payload
 */
function normalizeErrorPayload(error: ErrorInput): ErrorPayload {
  if (isError(error)) {
    // Extract additional enumerable properties safely
    const details: Record<string, unknown> = {};

    // Copy enumerable properties that aren't standard Error properties
    for (const [key, value] of Object.entries(error)) {
      if (!['name', 'message', 'stack', 'cause'].includes(key)) {
        try {
          // Only include serializable values
          if (typeof value !== 'function' && typeof value !== 'symbol') {
            details[key] = value;
          }
        } catch {
          // Skip properties that can't be serialized
          continue;
        }
      }
    }

    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(Object.keys(details).length > 0 && { details }),
    };
  }

  if (isPlainObject(error)) {
    // Handle plain objects
    const { message, name, stack, ...rest } = error;

    return {
      message: typeof message === 'string' ? message : 'Unknown error',
      ...(typeof name === 'string' && { name }),
      ...(typeof stack === 'string' && { stack }),
      ...(Object.keys(rest).length > 0 && { details: rest }),
    };
  }

  // Handle primitives and other unknown types
  return {
    message: typeof error === 'string' ? error : 'Unknown error occurred',
    details: { originalValue: error },
  };
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
export const logInfo = (message: string, meta?: LogMetadata) =>
  logger.info(message, meta);

export const logError = (
  message: string,
  error?: ErrorInput,
  meta?: LogMetadata
) => {
  const errorPayload = error ? normalizeErrorPayload(error) : undefined;

  logger.error(message, {
    ...(errorPayload && { error: errorPayload }),
    ...meta,
  });
};

export const logWarn = (message: string, meta?: LogMetadata) =>
  logger.warn(message, meta);

export const logDebug = (message: string, meta?: LogMetadata) =>
  logger.debug(message, meta);

export const logHttp = (message: string, meta?: LogMetadata) =>
  logger.http(message, meta);
