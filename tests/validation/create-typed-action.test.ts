import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  createTypedAction,
  createTypedActionWithUser,
} from '@/lib/types/actions/create-typed-action.util';
import { createActionStateSchema } from '@/lib/types/actions/action-state.type';

describe('Create Typed Action', () => {
  describe('createTypedAction', () => {
    const inputSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const outputSchema = createActionStateSchema({
      email: z.string().optional(),
      redirectUrl: z.string().optional(),
    });

    it('should execute action with valid input', async () => {
      const handler = vi.fn(async () => ({
        success: 'Signed in successfully',
        redirectUrl: '/app',
      }));

      const action = createTypedAction(inputSchema, outputSchema, handler);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'password123');

      const prevState = {};
      const result = await action(prevState, formData);

      expect(handler).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        success: 'Signed in successfully',
        redirectUrl: '/app',
      });
    });

    it('should return validation error for invalid input', async () => {
      const handler = vi.fn();
      const action = createTypedAction(inputSchema, outputSchema, handler);

      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('password', 'short');

      const prevState = {};
      const result = await action(prevState, formData);

      expect(handler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    });

    it('should return error for missing required fields', async () => {
      const handler = vi.fn();
      const action = createTypedAction(inputSchema, outputSchema, handler);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      // Missing password

      const prevState = {};
      const result = await action(prevState, formData);

      expect(handler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('error');
    });

    it('should validate output in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      // Use strict schema that won't allow extra fields
      const strictOutputSchema = createActionStateSchema({
        email: z.string().optional(),
        redirectUrl: z.string().optional(),
      }).strict();

      const handler = vi.fn(async () => ({
        // Invalid output - has field not in schema
        invalidField: 'value',
        error: 'test',
      }));

      const action = createTypedAction(
        inputSchema,
        strictOutputSchema,
        handler
      );

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'password123');

      const prevState = {};
      const result = await action(prevState, formData);

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Internal error');

      vi.unstubAllEnvs();
    });

    it('should skip output validation in production mode', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const handler = vi.fn(async () => ({
        success: 'Done',
      }));

      const action = createTypedAction(inputSchema, outputSchema, handler);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'password123');

      const prevState = {};
      const result = await action(prevState, formData);

      expect(result).toEqual({
        success: 'Done',
      });

      vi.unstubAllEnvs();
    });

    it('should handle async handler errors', async () => {
      const handler = vi.fn(async () => {
        throw new Error('Database error');
      });

      const action = createTypedAction(inputSchema, outputSchema, handler);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'password123');

      const prevState = {};

      await expect(action(prevState, formData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createTypedActionWithUser', () => {
    const inputSchema = z.object({
      name: z.string().min(1),
    });

    const outputSchema = createActionStateSchema({
      userId: z.string().optional(),
    });

    type TestUser = {
      id: string;
      email: string;
    };

    it('should execute action with user context', async () => {
      const mockUser: TestUser = {
        id: '123',
        email: 'user@example.com',
      };

      const getUserContext = vi.fn(async () => mockUser);
      const handler = vi.fn(async (_, user) => ({
        success: 'Profile updated',
        userId: user.id,
      }));

      const action = createTypedActionWithUser(
        inputSchema,
        outputSchema,
        handler,
        getUserContext
      );

      const formData = new FormData();
      formData.append('name', 'John Doe');

      const prevState = {};
      const result = await action(prevState, formData);

      expect(getUserContext).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith({ name: 'John Doe' }, mockUser);
      expect(result).toEqual({
        success: 'Profile updated',
        userId: '123',
      });
    });

    it('should return error if user context fails', async () => {
      const getUserContext = vi.fn(async () => {
        throw new Error('Unauthorized');
      });

      const handler = vi.fn();

      const action = createTypedActionWithUser(
        inputSchema,
        outputSchema,
        handler,
        getUserContext
      );

      const formData = new FormData();
      formData.append('name', 'John Doe');

      const prevState = {};
      const result = await action(prevState, formData);

      expect(handler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Unauthorized');
    });

    it('should validate input before getting user context', async () => {
      const getUserContext = vi.fn();
      const handler = vi.fn();

      const action = createTypedActionWithUser(
        inputSchema,
        outputSchema,
        handler,
        getUserContext
      );

      const formData = new FormData();
      // Missing required name field

      const prevState = {};
      const result = await action(prevState, formData);

      expect(getUserContext).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('error');
    });

    it('should validate output in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      // Use strict schema that won't allow extra fields
      const strictOutputSchema = createActionStateSchema({
        userId: z.string().optional(),
      }).strict();

      const mockUser: TestUser = {
        id: '123',
        email: 'user@example.com',
      };

      const getUserContext = vi.fn(async () => mockUser);
      const handler = vi.fn(async () => ({
        // Invalid output - has field not in schema
        invalidField: 'value',
        error: 'test',
      }));

      const action = createTypedActionWithUser(
        inputSchema,
        strictOutputSchema,
        handler,
        getUserContext
      );

      const formData = new FormData();
      formData.append('name', 'John Doe');

      const prevState = {};
      const result = await action(prevState, formData);

      expect(result).toHaveProperty('error');

      vi.unstubAllEnvs();
    });
  });
});
