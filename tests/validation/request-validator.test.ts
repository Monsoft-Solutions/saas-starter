import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  validateRequest,
  validateQueryParams,
  validateRouteParams,
  validateFormData,
} from '@/lib/validation/request-validator.util';

describe('Request Validator', () => {
  describe('validateRequest', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(0),
    });

    it('should validate valid data successfully', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const result = validateRequest(data, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should return error for invalid data', () => {
      const data = {
        name: '',
        email: 'invalid-email',
        age: -5,
      };

      const result = validateRequest(data, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should return error for missing required fields', () => {
      const data = {
        name: 'John',
      };

      const result = validateRequest(data, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should include validation details in test environment', () => {
      const data = { name: '', email: 'invalid' };
      const result = validateRequest(data, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        // In test environment (NODE_ENV='test'), details should be included
        expect(result.details).toBeDefined();
      }
    });

    it('should handle null data', () => {
      const result = validateRequest(null, testSchema);

      expect(result.success).toBe(false);
    });

    it('should handle undefined data', () => {
      const result = validateRequest(undefined, testSchema);

      expect(result.success).toBe(false);
    });
  });

  describe('validateQueryParams', () => {
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      search: z.string().optional(),
    });

    it('should validate query params successfully', () => {
      const searchParams = new URLSearchParams('page=2&limit=50&search=test');
      const result = validateQueryParams(searchParams, querySchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.search).toBe('test');
      }
    });

    it('should apply default values for missing params', () => {
      const searchParams = new URLSearchParams();
      const result = validateQueryParams(searchParams, querySchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string numbers to numbers', () => {
      const searchParams = new URLSearchParams('page=5&limit=10');
      const result = validateQueryParams(searchParams, querySchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should return error for invalid query params', () => {
      const searchParams = new URLSearchParams('page=-1&limit=200');
      const result = validateQueryParams(searchParams, querySchema);

      expect(result.success).toBe(false);
    });
  });

  describe('validateRouteParams', () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
      slug: z.string().min(1),
    });

    it('should validate route params successfully', () => {
      const params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'my-post',
      };

      const result = validateRouteParams(params, paramsSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(params);
      }
    });

    it('should return error for invalid UUID', () => {
      const params = {
        id: 'invalid-uuid',
        slug: 'my-post',
      };

      const result = validateRouteParams(params, paramsSchema);

      expect(result.success).toBe(false);
    });

    it('should handle array route params', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()),
      });

      const params = {
        tags: ['tech', 'news'],
      };

      const result = validateRouteParams(params, arraySchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['tech', 'news']);
      }
    });
  });

  describe('validateFormData', () => {
    const formSchema = z.object({
      username: z.string().min(3),
      email: z.string().email(),
      terms: z.string().transform((v) => v === 'on'),
    });

    it('should validate form data successfully', () => {
      const formData = new FormData();
      formData.append('username', 'johndoe');
      formData.append('email', 'john@example.com');
      formData.append('terms', 'on');

      const result = validateFormData(formData, formSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('johndoe');
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.terms).toBe(true);
      }
    });

    it('should return error for invalid form data', () => {
      const formData = new FormData();
      formData.append('username', 'ab'); // Too short
      formData.append('email', 'invalid');

      const result = validateFormData(formData, formSchema);

      expect(result.success).toBe(false);
    });

    it('should handle empty form data', () => {
      const formData = new FormData();
      const result = validateFormData(formData, formSchema);

      expect(result.success).toBe(false);
    });
  });
});
