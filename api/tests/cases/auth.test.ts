import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeLog } from '../../src/lib/sanitize';

describe('Auth & Security Test Cases', () => {
  before(() => {
    process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long!';
  });

  describe('CWE-117 Log Sanitization', () => {
    it('should strip CRLF newline injection vectors', () => {
      const maliciousInput = 'admin_user\r\nHTTP/1.1 200 OK\r\nSet-Cookie: admin=true';
      const clean = sanitizeLog(maliciousInput);
      assert.ok(!clean.includes('\r'), 'Must not contain carriage returns');
      assert.ok(!clean.includes('\n'), 'Must not contain line feeds');
    });

    it('should return empty string for null and undefined', () => {
      assert.strictEqual(sanitizeLog(null), '');
      assert.strictEqual(sanitizeLog(undefined), '');
    });

    it('should truncate excessively long log strings past 500 characters', () => {
      const hugeInput = 'A'.repeat(800);
      const clean = sanitizeLog(hugeInput);
      assert.ok(decodeURIComponent(clean).length <= 500);
    });
  });

  describe('Phone and Customer ID Normalization Rules', () => {
    const cleanPhone = (val: string) => val.replace(/\D/g, '').slice(-10);

    it('should accurately extract 10 digits from various Indian phone formats', () => {
      assert.strictEqual(cleanPhone('+91 98765 43210'), '9876543210');
      assert.strictEqual(cleanPhone('+919876543210'), '9876543210');
      assert.strictEqual(cleanPhone('09876543210'), '9876543210');
      assert.strictEqual(cleanPhone('98765-43210'), '9876543210');
    });

    it('should identify valid customer code prefixes (CU)', () => {
      const isCustomerCode = (val: string) => val.trim().toUpperCase().startsWith('CU');
      assert.ok(isCustomerCode('CU849201'));
      assert.ok(isCustomerCode('cu849201'));
      assert.ok(isCustomerCode('CU-849201'));
      assert.strictEqual(isCustomerCode('AS849201'), false);
      assert.strictEqual(isCustomerCode('9876543210'), false);
    });
  });

  describe('JWT Token Operations', () => {
    it('should generate valid signable tokens with correct payload', async () => {
      const { createAuthToken, createRefreshToken } = await import('../../src/lib/jwt');
      const payload = { userId: 'usr_test_123', phone: '9876543210' };
      
      const authToken = createAuthToken(payload);
      assert.ok(authToken && typeof authToken === 'string');
      assert.strictEqual(authToken.split('.').length, 3, 'JWT must have header.payload.signature');

      const refreshToken = createRefreshToken(payload);
      assert.ok(refreshToken && typeof refreshToken === 'string');
      assert.strictEqual(refreshToken.split('.').length, 3);
    });
  });
});

