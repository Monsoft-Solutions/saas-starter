import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  validatedOk,
  validatedCreated,
  shouldValidateResponse,
  optionalValidatedOk,
} from '@/lib/validation/validated-response.util';

// Mock logger
vi.mock('@/lib/logger/logger.service', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Validated Response', () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  });

  describe('validatedOk', () => {
    it('should return validated data with 200 status', async () => {
      const user = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = validatedOk(user, userSchema);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(user);
    });

    it('should accept custom status code', async () => {
      const user = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = validatedOk(user, userSchema, { status: 202 });

      expect(response.status).toBe(202);
    });

    it('should return 500 error for invalid data', async () => {
      const invalidUser = {
        id: '123',
        name: 'John',
        // Missing email
      };

      const response = validatedOk(invalidUser, userSchema);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('error');
      // Error message depends on NODE_ENV
      expect(json.error).toMatch(/validation failed|server error/i);
    });

    it('should handle invalid data appropriately', async () => {
      const invalidUser = {
        id: '123',
        name: 'John',
        // Missing email
      };

      const response = validatedOk(invalidUser, userSchema);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('error');
      expect(typeof json.error).toBe('string');
    });

    it('should handle null data', async () => {
      const response = validatedOk(null, userSchema);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('error');
    });

    it('should handle undefined data', async () => {
      const response = validatedOk(undefined, userSchema);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('error');
    });
  });

  describe('validatedCreated', () => {
    it('should return validated data with 201 status', async () => {
      const user = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = validatedCreated(user, userSchema);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toEqual(user);
    });

    it('should return error for invalid data', async () => {
      const invalidUser = {
        id: '123',
        name: 'John',
      };

      const response = validatedCreated(invalidUser, userSchema);

      expect(response.status).toBe(500);
    });
  });

  describe('shouldValidateResponse', () => {
    it('should return true in test environment', () => {
      // In test environment (NODE_ENV='test'), always validates
      expect(shouldValidateResponse()).toBe(true);
    });

    // Note: Environment stubbing doesn't work reliably with the imported env module
    // In production (NODE_ENV='production'), shouldValidateResponse() would return false
    // unless STRICT_RESPONSE_VALIDATION='true'
  });

  describe('optionalValidatedOk', () => {
    it('should validate in test environment', async () => {
      const user = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = optionalValidatedOk(user, userSchema);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(user);
    });

    it('should validate and reject invalid data in test environment', async () => {
      const invalidUser = {
        id: '123',
        name: 'John',
        // Missing email
      };

      const response = optionalValidatedOk(invalidUser, userSchema);

      // In test environment (NODE_ENV='test'), validation is enabled
      expect(response.status).toBe(500);
    });

    // Note: In production (NODE_ENV='production'), optionalValidatedOk would skip validation
    // unless STRICT_RESPONSE_VALIDATION='true'
  });
});
