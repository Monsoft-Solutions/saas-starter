import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  actionStateSchema,
  createActionStateSchema,
  actionSuccess,
  actionError,
  type ActionState,
  type ActionStateData,
} from '@/lib/types/actions/action-state.type';

describe('Action State', () => {
  describe('actionStateSchema', () => {
    it('should validate basic action state', () => {
      const validState = {
        success: 'Operation successful',
      };

      const result = actionStateSchema.parse(validState);
      expect(result).toEqual(validState);
    });

    it('should accept error field', () => {
      const validState = {
        error: 'Something went wrong',
      };

      const result = actionStateSchema.parse(validState);
      expect(result).toEqual(validState);
    });

    it('should accept both success and error as optional', () => {
      const emptyState = {};
      const result = actionStateSchema.parse(emptyState);
      expect(result).toEqual({});
    });

    it('should reject non-string success', () => {
      const invalidState = {
        success: 123,
      };

      expect(() => actionStateSchema.parse(invalidState)).toThrow();
    });

    it('should reject non-string error', () => {
      const invalidState = {
        error: 123,
      };

      expect(() => actionStateSchema.parse(invalidState)).toThrow();
    });
  });

  describe('createActionStateSchema', () => {
    it('should extend base schema with additional fields', () => {
      const customSchema = createActionStateSchema({
        email: z.string().email(),
        redirectUrl: z.string().url().optional(),
      });

      const validState = {
        success: 'Signed in successfully',
        email: 'user@example.com',
        redirectUrl: 'https://example.com/app',
      };

      const result = customSchema.parse(validState);
      expect(result).toEqual(validState);
    });

    it('should validate additional fields', () => {
      const customSchema = createActionStateSchema({
        userId: z.string().uuid(),
      });

      const invalidState = {
        success: 'User created',
        userId: 'not-a-uuid',
      };

      expect(() => customSchema.parse(invalidState)).toThrow();
    });

    it('should allow optional additional fields', () => {
      const customSchema = createActionStateSchema({
        email: z.string().email().optional(),
      });

      const stateWithoutEmail = {
        error: 'Invalid input',
      };

      const result = customSchema.parse(stateWithoutEmail);
      expect(result).toEqual(stateWithoutEmail);
    });

    it('should maintain type inference', () => {
      const customSchema = createActionStateSchema({
        count: z.number(),
        items: z.array(z.string()),
      });

      type CustomState = z.infer<typeof customSchema>;

      const state: CustomState = {
        success: 'Items loaded',
        count: 5,
        items: ['a', 'b', 'c'],
      };

      const result = customSchema.parse(state);
      expect(result).toEqual(state);
    });
  });

  describe('actionSuccess', () => {
    it('should create success state with message', () => {
      const result = actionSuccess('Operation completed');

      expect(result).toEqual({
        success: 'Operation completed',
      });
    });

    it('should include additional data', () => {
      const result = actionSuccess('User created', {
        userId: '123',
        email: 'user@example.com',
      });

      expect(result).toEqual({
        success: 'User created',
        userId: '123',
        email: 'user@example.com',
      });
    });

    it('should preserve type information', () => {
      type CustomData = {
        redirectUrl: string;
        userId: string;
      };

      const result = actionSuccess<CustomData>('Signed in', {
        redirectUrl: '/app',
        userId: '123',
      });

      // TypeScript should infer the correct type
      expect(result.redirectUrl).toBe('/app');
      expect(result.userId).toBe('123');
    });

    it('should work without additional data', () => {
      const result = actionSuccess('Done');

      expect(result).toEqual({
        success: 'Done',
      });
    });
  });

  describe('actionError', () => {
    it('should create error state with message', () => {
      const result = actionError('Something went wrong');

      expect(result).toEqual({
        error: 'Something went wrong',
      });
    });

    it('should include additional data', () => {
      const result = actionError('Validation failed', {
        email: 'user@example.com',
        field: 'password',
      });

      expect(result).toEqual({
        error: 'Validation failed',
        email: 'user@example.com',
        field: 'password',
      });
    });

    it('should preserve form field values', () => {
      const result = actionError('Invalid credentials', {
        email: 'user@example.com',
        rememberMe: true,
      });

      expect(result.error).toBe('Invalid credentials');
      expect(result.email).toBe('user@example.com');
      expect(result.rememberMe).toBe(true);
    });

    it('should work without additional data', () => {
      const result = actionError('Error occurred');

      expect(result).toEqual({
        error: 'Error occurred',
      });
    });
  });

  describe('ActionStateData type utility', () => {
    it('should infer correct type from schema', () => {
      const customSchema = createActionStateSchema({
        email: z.string().email(),
        redirectUrl: z.string().url(),
      });

      type CustomState = ActionStateData<typeof customSchema>;

      const state: CustomState = {
        success: 'Done',
        email: 'user@example.com',
        redirectUrl: 'https://example.com',
      };

      expect(state).toBeDefined();
    });
  });

  describe('ActionState type', () => {
    it('should accept valid action states', () => {
      const successState: ActionState = {
        success: 'Operation successful',
      };

      const errorState: ActionState = {
        error: 'Operation failed',
      };

      const emptyState: ActionState = {};

      expect(successState).toBeDefined();
      expect(errorState).toBeDefined();
      expect(emptyState).toBeDefined();
    });
  });
});
