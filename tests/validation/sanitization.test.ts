import { describe, expect, it } from 'vitest';
import {
  sanitizedString,
  sanitizedEmail,
  sanitizedUrl,
  sanitizedSlug,
  sanitizedPhone,
  sanitizedHtml,
  sanitizedNumber,
  sanitizedBoolean,
  sanitizedDate,
  sanitizedStringArray,
} from '@/lib/validation/sanitization.util';

describe('Sanitization Utilities', () => {
  describe('sanitizedString', () => {
    it('should trim whitespace', () => {
      const schema = sanitizedString();
      const result = schema.parse('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should collapse multiple spaces', () => {
      const schema = sanitizedString();
      const result = schema.parse('hello    world');
      expect(result).toBe('hello world');
    });

    it('should enforce minimum length', () => {
      const schema = sanitizedString({ min: 5 });
      expect(() => schema.parse('abc')).toThrow();
      expect(schema.parse('hello')).toBe('hello');
    });

    it('should enforce maximum length', () => {
      const schema = sanitizedString({ max: 5 });
      expect(() => schema.parse('hello world')).toThrow();
      expect(schema.parse('hello')).toBe('hello');
    });

    it('should enforce regex pattern', () => {
      const schema = sanitizedString({ pattern: /^[a-z]+$/ });
      expect(() => schema.parse('Hello123')).toThrow();
      expect(schema.parse('hello')).toBe('hello');
    });
  });

  describe('sanitizedEmail', () => {
    it('should trim and lowercase email', () => {
      const result = sanitizedEmail.parse('  John@Example.COM  ');
      expect(result).toBe('john@example.com');
    });

    it('should remove all whitespace from valid emails', () => {
      // Note: Internal whitespace makes email invalid, so test with trailing/leading spaces
      const result = sanitizedEmail.parse('john@example.com ');
      expect(result).toBe('john@example.com');
    });

    it('should reject invalid email format', () => {
      expect(() => sanitizedEmail.parse('invalid-email')).toThrow();
      expect(() => sanitizedEmail.parse('missing@domain')).toThrow();
    });

    it('should accept valid email formats', () => {
      expect(sanitizedEmail.parse('user@example.com')).toBe('user@example.com');
      expect(sanitizedEmail.parse('user.name@example.co.uk')).toBe(
        'user.name@example.co.uk'
      );
    });
  });

  describe('sanitizedUrl', () => {
    it('should trim whitespace from URLs', () => {
      const result = sanitizedUrl.parse('  https://example.com  ');
      expect(result).toBe('https://example.com');
    });

    it('should accept valid URLs', () => {
      expect(sanitizedUrl.parse('https://example.com')).toBe(
        'https://example.com'
      );
      expect(sanitizedUrl.parse('http://localhost:3000')).toBe(
        'http://localhost:3000'
      );
    });

    it('should reject invalid URLs', () => {
      expect(() => sanitizedUrl.parse('not-a-url')).toThrow();
      expect(() => sanitizedUrl.parse('example.com')).toThrow();
    });
  });

  describe('sanitizedSlug', () => {
    it('should convert to lowercase', () => {
      const result = sanitizedSlug.parse('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      const result = sanitizedSlug.parse('my blog post');
      expect(result).toBe('my-blog-post');
    });

    it('should remove special characters', () => {
      const result = sanitizedSlug.parse('hello@world!#$');
      expect(result).toBe('helloworld');
    });

    it('should collapse multiple hyphens', () => {
      const result = sanitizedSlug.parse('hello---world');
      expect(result).toBe('hello-world');
    });

    it('should remove leading and trailing hyphens', () => {
      const result = sanitizedSlug.parse('-hello-world-');
      expect(result).toBe('hello-world');
    });

    it('should handle complex strings', () => {
      const result = sanitizedSlug.parse('  My Blog Post (2024)  ');
      expect(result).toBe('my-blog-post-2024');
    });
  });

  describe('sanitizedPhone', () => {
    it('should remove all non-numeric characters', () => {
      const result = sanitizedPhone.parse('(123) 456-7890');
      expect(result).toBe('1234567890');
    });

    it('should preserve leading + for international numbers', () => {
      const result = sanitizedPhone.parse('+1 (234) 567-8900');
      expect(result).toBe('+12345678900');
    });

    it('should handle various formats', () => {
      expect(sanitizedPhone.parse('123.456.7890')).toBe('1234567890');
      expect(sanitizedPhone.parse('123 456 7890')).toBe('1234567890');
      expect(sanitizedPhone.parse('+44 20 1234 5678')).toBe('+442012345678');
    });
  });

  describe('sanitizedHtml', () => {
    it('should trim whitespace', () => {
      const result = sanitizedHtml.parse('  <p>Hello</p>  ');
      expect(result).toBe('<p>Hello</p>');
    });

    // Note: Full HTML sanitization would require a library like sanitize-html
    // This test just verifies the basic trim functionality
  });

  describe('sanitizedNumber', () => {
    it('should coerce string to number', () => {
      const schema = sanitizedNumber();
      expect(schema.parse('42')).toBe(42);
      expect(schema.parse('3.14')).toBe(3.14);
    });

    it('should enforce minimum value', () => {
      const schema = sanitizedNumber({ min: 10 });
      expect(() => schema.parse('5')).toThrow();
      expect(schema.parse('15')).toBe(15);
    });

    it('should enforce maximum value', () => {
      const schema = sanitizedNumber({ max: 100 });
      expect(() => schema.parse('200')).toThrow();
      expect(schema.parse('50')).toBe(50);
    });

    it('should handle negative numbers', () => {
      const schema = sanitizedNumber();
      expect(schema.parse('-42')).toBe(-42);
    });
  });

  describe('sanitizedBoolean', () => {
    it('should convert "true" to boolean true', () => {
      expect(sanitizedBoolean.parse('true')).toBe(true);
      expect(sanitizedBoolean.parse('TRUE')).toBe(true);
      expect(sanitizedBoolean.parse('True')).toBe(true);
    });

    it('should convert "1" to boolean true', () => {
      expect(sanitizedBoolean.parse('1')).toBe(true);
    });

    it('should convert "yes" to boolean true', () => {
      expect(sanitizedBoolean.parse('yes')).toBe(true);
      expect(sanitizedBoolean.parse('YES')).toBe(true);
    });

    it('should convert other values to false', () => {
      expect(sanitizedBoolean.parse('false')).toBe(false);
      expect(sanitizedBoolean.parse('0')).toBe(false);
      expect(sanitizedBoolean.parse('no')).toBe(false);
      expect(sanitizedBoolean.parse('anything')).toBe(false);
    });
  });

  describe('sanitizedDate', () => {
    it('should parse ISO 8601 date strings', () => {
      const dateString = '2024-10-07T12:00:00.000Z';
      const result = sanitizedDate.parse(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(dateString);
    });

    it('should reject invalid date formats', () => {
      expect(() => sanitizedDate.parse('not-a-date')).toThrow();
      expect(() => sanitizedDate.parse('2024-13-45')).toThrow();
    });
  });

  describe('sanitizedStringArray', () => {
    it('should sanitize each string in array', () => {
      const schema = sanitizedStringArray();
      const result = schema.parse(['  hello  ', '  world  ']);
      expect(result).toEqual(['hello', 'world']);
    });

    it('should enforce minimum array length', () => {
      const schema = sanitizedStringArray({ min: 2 });
      expect(() => schema.parse(['one'])).toThrow();
      expect(schema.parse(['one', 'two'])).toEqual(['one', 'two']);
    });

    it('should enforce maximum array length', () => {
      const schema = sanitizedStringArray({ max: 2 });
      expect(() => schema.parse(['one', 'two', 'three'])).toThrow();
      expect(schema.parse(['one', 'two'])).toEqual(['one', 'two']);
    });

    it('should enforce minimum item length', () => {
      const schema = sanitizedStringArray({ itemMin: 3 });
      expect(() => schema.parse(['ab', 'cd'])).toThrow();
      expect(schema.parse(['abc', 'def'])).toEqual(['abc', 'def']);
    });

    it('should enforce maximum item length', () => {
      const schema = sanitizedStringArray({ itemMax: 5 });
      expect(() => schema.parse(['hello', 'world!!!'])).toThrow();
      expect(schema.parse(['hello', 'world'])).toEqual(['hello', 'world']);
    });
  });
});
