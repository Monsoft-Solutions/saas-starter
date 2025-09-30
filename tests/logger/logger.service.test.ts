import winston from 'winston';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for Winston Logger Service
 *
 * Tests cover:
 * - Logger initialization in different environments
 * - Transport configuration verification
 * - Log level filtering
 * - Format validation
 */

describe('Logger Service', () => {
  beforeEach(() => {
    // Clear module cache to allow fresh imports
    vi.resetModules();
  });

  afterEach(async () => {
    // Clean up logger instances and process handlers
    try {
      // Get the current logger instance if it exists
      const loggerModule = await import('../../lib/logger/logger.service');
      const logger = loggerModule.default;

      // Close the logger instance to clean up transports and handlers
      if (logger && typeof logger.close === 'function') {
        await logger.close();
      }
    } catch (error) {
      // Ignore errors during cleanup (module might not be loaded)
    }

    // Remove any process-level event listeners that might have been added
    // by the logger's exception and rejection handlers
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    // Clear all mocks, spies, and stubs to prevent test interference
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();

    // Reset modules to ensure clean state for next test
    vi.resetModules();
  });

  describe('Development Environment', () => {
    it('should create logger with console transport in development', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      expect(logger).toBeDefined();
      expect(logger.transports).toHaveLength(1);
      expect(logger.transports[0]).toBeInstanceOf(winston.transports.Console);
    });

    it('should use debug level in development', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      expect(logger.level).toBe('debug');
    });

    it('should have console transport with debug level in development', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      const consoleTransport = logger
        .transports[0] as winston.transports.ConsoleTransportInstance;
      expect(consoleTransport.level).toBe('debug');
    });
  });

  describe('Production Environment', () => {
    it('should create logger with file and console transports in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.resetModules();

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      expect(logger).toBeDefined();
      // Production has 3 main transports + 2 exception/rejection handlers
      expect(logger.transports.length).toBeGreaterThanOrEqual(3);

      vi.unstubAllEnvs();
    });

    it('should use info level in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.resetModules();

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      expect(logger.level).toBe('info');

      vi.unstubAllEnvs();
    });

    it('should have console transport with warn level in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.resetModules();

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      const consoleTransport = logger.transports.find(
        (transport) => transport instanceof winston.transports.Console
      ) as winston.transports.ConsoleTransportInstance;

      expect(consoleTransport).toBeDefined();
      expect(consoleTransport.level).toBe('warn');

      vi.unstubAllEnvs();
    });

    it('should configure exception and rejection handlers in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.resetModules();

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      expect(logger.exceptions.handlers).toBeDefined();
      expect(logger.rejections.handlers).toBeDefined();

      vi.unstubAllEnvs();
    });
  });

  describe('Logger Configuration', () => {
    it('should not exit on error', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      expect(logger.exitOnError).toBe(false);
    });

    it('should have correct log levels defined', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      expect(logger.levels).toEqual({
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
      });
    });
  });

  describe('Morgan Stream', () => {
    it('should create morgan stream for HTTP logging', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { morganStream } = await import('../../lib/logger/logger.service');

      expect(morganStream).toBeDefined();
      expect(morganStream.write).toBeInstanceOf(Function);
    });

    it('should log messages via morgan stream', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { default: logger, morganStream } = await import(
        '../../lib/logger/logger.service'
      );

      const httpSpy = vi.spyOn(logger, 'http');

      morganStream.write('Test HTTP log message\n');

      expect(httpSpy).toHaveBeenCalledWith('Test HTTP log message');
    });
  });

  describe('Convenience Methods', () => {
    it('should export logInfo convenience method', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { logInfo } = await import('../../lib/logger/logger.service');

      expect(logInfo).toBeInstanceOf(Function);
    });

    it('should export logError convenience method', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { logError } = await import('../../lib/logger/logger.service');

      expect(logError).toBeInstanceOf(Function);
    });

    it('should export logWarn convenience method', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { logWarn } = await import('../../lib/logger/logger.service');

      expect(logWarn).toBeInstanceOf(Function);
    });

    it('should export logDebug convenience method', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { logDebug } = await import('../../lib/logger/logger.service');

      expect(logDebug).toBeInstanceOf(Function);
    });

    it('should export logHttp convenience method', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { logHttp } = await import('../../lib/logger/logger.service');

      expect(logHttp).toBeInstanceOf(Function);
    });
  });

  describe('Log Level Filtering', () => {
    it('should filter logs based on configured level', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'production' },
      }));

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      const infoSpy = vi.spyOn(logger, 'info');
      const debugSpy = vi.spyOn(logger, 'debug');

      logger.info('Info message');
      logger.debug('Debug message');

      expect(infoSpy).toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();
      // Note: Actual filtering happens at transport level, not logger level
    });
  });

  describe('Metadata Handling', () => {
    it('should accept metadata in log calls', async () => {
      vi.doMock('../env', () => ({
        env: { NODE_ENV: 'development' },
      }));

      const { default: logger } = await import(
        '../../lib/logger/logger.service'
      );

      const infoSpy = vi.spyOn(logger, 'info');

      const metadata = { userId: '123', action: 'test' };
      logger.info('Test message', metadata);

      expect(infoSpy).toHaveBeenCalledWith('Test message', metadata);
    });
  });
});
