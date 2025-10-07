import { describe, expect, it } from 'vitest';
import {
  ErrorCode,
  ERROR_CODE_TO_STATUS,
  getStatusForErrorCode,
} from '@/lib/validation/error-codes.enum';

describe('Error Codes', () => {
  describe('ErrorCode enum', () => {
    it('should have all validation error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCode.INVALID_FORMAT).toBe('INVALID_FORMAT');
      expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD');
      expect(ErrorCode.INVALID_EMAIL).toBe('INVALID_EMAIL');
      expect(ErrorCode.INVALID_PASSWORD).toBe('INVALID_PASSWORD');
      expect(ErrorCode.INVALID_PHONE).toBe('INVALID_PHONE');
      expect(ErrorCode.INVALID_URL).toBe('INVALID_URL');
    });

    it('should have all authentication error codes', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
      expect(ErrorCode.SESSION_EXPIRED).toBe('SESSION_EXPIRED');
      expect(ErrorCode.TOKEN_INVALID).toBe('TOKEN_INVALID');
      expect(ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
      expect(ErrorCode.ACCOUNT_LOCKED).toBe('ACCOUNT_LOCKED');
      expect(ErrorCode.ACCOUNT_DISABLED).toBe('ACCOUNT_DISABLED');
    });

    it('should have all authorization error codes', () => {
      expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCode.INSUFFICIENT_PERMISSIONS).toBe(
        'INSUFFICIENT_PERMISSIONS'
      );
      expect(ErrorCode.ORGANIZATION_ACCESS_DENIED).toBe(
        'ORGANIZATION_ACCESS_DENIED'
      );
      expect(ErrorCode.RESOURCE_ACCESS_DENIED).toBe('RESOURCE_ACCESS_DENIED');
    });

    it('should have all resource error codes', () => {
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND');
      expect(ErrorCode.USER_NOT_FOUND).toBe('USER_NOT_FOUND');
      expect(ErrorCode.ORGANIZATION_NOT_FOUND).toBe('ORGANIZATION_NOT_FOUND');
      expect(ErrorCode.ALREADY_EXISTS).toBe('ALREADY_EXISTS');
      expect(ErrorCode.DUPLICATE_ENTRY).toBe('DUPLICATE_ENTRY');
    });

    it('should have all business logic error codes', () => {
      expect(ErrorCode.BUSINESS_RULE_VIOLATION).toBe('BUSINESS_RULE_VIOLATION');
      expect(ErrorCode.QUOTA_EXCEEDED).toBe('QUOTA_EXCEEDED');
      expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCode.SUBSCRIPTION_REQUIRED).toBe('SUBSCRIPTION_REQUIRED');
      expect(ErrorCode.SUBSCRIPTION_INACTIVE).toBe('SUBSCRIPTION_INACTIVE');
      expect(ErrorCode.PAYMENT_REQUIRED).toBe('PAYMENT_REQUIRED');
      expect(ErrorCode.INVALID_STATE).toBe('INVALID_STATE');
      expect(ErrorCode.OPERATION_NOT_ALLOWED).toBe('OPERATION_NOT_ALLOWED');
    });

    it('should have all external service error codes', () => {
      expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
      expect(ErrorCode.PAYMENT_GATEWAY_ERROR).toBe('PAYMENT_GATEWAY_ERROR');
      expect(ErrorCode.EMAIL_SERVICE_ERROR).toBe('EMAIL_SERVICE_ERROR');
      expect(ErrorCode.STORAGE_SERVICE_ERROR).toBe('STORAGE_SERVICE_ERROR');
    });

    it('should have all server error codes', () => {
      expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.CONFIGURATION_ERROR).toBe('CONFIGURATION_ERROR');
      expect(ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });
  });

  describe('ERROR_CODE_TO_STATUS mapping', () => {
    it('should map validation errors to 400', () => {
      expect(ERROR_CODE_TO_STATUS[ErrorCode.VALIDATION_ERROR]).toBe(400);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.INVALID_INPUT]).toBe(400);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.INVALID_EMAIL]).toBe(400);
    });

    it('should map authentication errors to 401', () => {
      expect(ERROR_CODE_TO_STATUS[ErrorCode.UNAUTHORIZED]).toBe(401);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.INVALID_CREDENTIALS]).toBe(401);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.SESSION_EXPIRED]).toBe(401);
    });

    it('should map authorization errors to 403', () => {
      expect(ERROR_CODE_TO_STATUS[ErrorCode.FORBIDDEN]).toBe(403);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.INSUFFICIENT_PERMISSIONS]).toBe(
        403
      );
    });

    it('should map not found errors to 404', () => {
      expect(ERROR_CODE_TO_STATUS[ErrorCode.NOT_FOUND]).toBe(404);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.RESOURCE_NOT_FOUND]).toBe(404);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.USER_NOT_FOUND]).toBe(404);
    });

    it('should map conflict errors to 409', () => {
      expect(ERROR_CODE_TO_STATUS[ErrorCode.ALREADY_EXISTS]).toBe(409);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.DUPLICATE_ENTRY]).toBe(409);
    });

    it('should map business logic errors to appropriate status codes', () => {
      expect(ERROR_CODE_TO_STATUS[ErrorCode.BUSINESS_RULE_VIOLATION]).toBe(422);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.RATE_LIMIT_EXCEEDED]).toBe(429);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.SUBSCRIPTION_REQUIRED]).toBe(402);
    });

    it('should map server errors to 500', () => {
      expect(ERROR_CODE_TO_STATUS[ErrorCode.INTERNAL_SERVER_ERROR]).toBe(500);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.DATABASE_ERROR]).toBe(500);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.UNKNOWN_ERROR]).toBe(500);
    });

    it('should map external service errors to 502 or 503', () => {
      expect(ERROR_CODE_TO_STATUS[ErrorCode.EXTERNAL_SERVICE_ERROR]).toBe(502);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.PAYMENT_GATEWAY_ERROR]).toBe(502);
      expect(ERROR_CODE_TO_STATUS[ErrorCode.EMAIL_SERVICE_ERROR]).toBe(502);
    });
  });

  describe('getStatusForErrorCode', () => {
    it('should return correct status code for known error codes', () => {
      expect(getStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).toBe(400);
      expect(getStatusForErrorCode(ErrorCode.UNAUTHORIZED)).toBe(401);
      expect(getStatusForErrorCode(ErrorCode.FORBIDDEN)).toBe(403);
      expect(getStatusForErrorCode(ErrorCode.NOT_FOUND)).toBe(404);
      expect(getStatusForErrorCode(ErrorCode.INTERNAL_SERVER_ERROR)).toBe(500);
    });

    it('should return 500 for unknown error codes', () => {
      const unknownCode = 'UNKNOWN_CODE' as ErrorCode;
      expect(getStatusForErrorCode(unknownCode)).toBe(500);
    });
  });
});
