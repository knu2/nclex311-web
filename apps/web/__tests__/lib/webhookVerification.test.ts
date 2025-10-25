/**
 * Unit tests for Webhook Verification
 * Tests signature validation, payload extraction, and security features
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';

describe('Webhook Verification', () => {
  let verifyWebhookSignature: any;
  let extractWebhookId: any;
  let extractExternalId: any;
  let validateWebhookPayload: any;
  let getEventTypeFromStatus: any;

  const mockEnv = {
    XENDIT_WEBHOOK_TOKEN: 'test_webhook_secret_token_12345',
  };

  beforeEach(async () => {
    // Set environment variables
    process.env.XENDIT_WEBHOOK_TOKEN = mockEnv.XENDIT_WEBHOOK_TOKEN;

    // Dynamic import after env is set
    const webhookModule = await import('../../src/lib/webhookVerification');
    verifyWebhookSignature = webhookModule.verifyWebhookSignature;
    extractWebhookId = webhookModule.extractWebhookId;
    extractExternalId = webhookModule.extractExternalId;
    validateWebhookPayload = webhookModule.validateWebhookPayload;
    getEventTypeFromStatus = webhookModule.getEventTypeFromStatus;
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.XENDIT_WEBHOOK_TOKEN;
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid callback token successfully', () => {
      const isValid = verifyWebhookSignature(
        mockEnv.XENDIT_WEBHOOK_TOKEN,
        { test: 'payload' },
        null
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid callback token', () => {
      const isValid = verifyWebhookSignature(
        'invalid_token',
        { test: 'payload' },
        null
      );

      expect(isValid).toBe(false);
    });

    it('should reject when callback token is null', () => {
      const isValid = verifyWebhookSignature(null, { test: 'payload' }, null);

      expect(isValid).toBe(false);
    });

    it('should reject when XENDIT_WEBHOOK_TOKEN is not configured', () => {
      delete process.env.XENDIT_WEBHOOK_TOKEN;

      const isValid = verifyWebhookSignature(
        'any_token',
        { test: 'payload' },
        null
      );

      expect(isValid).toBe(false);
    });

    it('should verify HMAC signature when provided', () => {
      const payload = { test: 'payload', amount: 200 };
      const bodyString = JSON.stringify(payload);

      // Generate valid signature
      const validSignature = crypto
        .createHmac('sha256', mockEnv.XENDIT_WEBHOOK_TOKEN)
        .update(bodyString)
        .digest('hex');

      const isValid = verifyWebhookSignature(
        mockEnv.XENDIT_WEBHOOK_TOKEN,
        bodyString,
        validSignature
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC signature', () => {
      const payload = { test: 'payload' };
      const bodyString = JSON.stringify(payload);
      const invalidSignature = 'invalid_signature_abc123';

      const isValid = verifyWebhookSignature(
        mockEnv.XENDIT_WEBHOOK_TOKEN,
        bodyString,
        invalidSignature
      );

      expect(isValid).toBe(false);
    });

    it('should handle object payload for HMAC verification', () => {
      const payload = { test: 'payload', id: 'webhook_123' };

      // Generate signature from JSON string
      const bodyString = JSON.stringify(payload);
      const validSignature = crypto
        .createHmac('sha256', mockEnv.XENDIT_WEBHOOK_TOKEN)
        .update(bodyString)
        .digest('hex');

      const isValid = verifyWebhookSignature(
        mockEnv.XENDIT_WEBHOOK_TOKEN,
        payload,
        validSignature
      );

      expect(isValid).toBe(true);
    });

    it('should use timing-safe comparison to prevent timing attacks', () => {
      // Test with tokens that differ by only one character
      const validToken = 'token_123456789_abcdefgh';
      process.env.XENDIT_WEBHOOK_TOKEN = validToken;

      const similarToken1 = 'token_123456789_abcdefgi'; // Last char different
      const similarToken2 = 'token_123456789_abcdefgj'; // Last char different

      const result1 = verifyWebhookSignature(similarToken1, {}, null);
      const result2 = verifyWebhookSignature(similarToken2, {}, null);

      // Both should fail, and timing should be similar (can't test timing directly)
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should handle tokens of different lengths safely', () => {
      const shortToken = 'short';
      const longToken = 'this_is_a_much_longer_token_than_the_short_one';

      process.env.XENDIT_WEBHOOK_TOKEN = 'expected_token';

      const result1 = verifyWebhookSignature(shortToken, {}, null);
      const result2 = verifyWebhookSignature(longToken, {}, null);

      // Both should fail without leaking length information
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should return false on unexpected errors', () => {
      // Test with malformed input that might cause errors
      const result = verifyWebhookSignature(
        mockEnv.XENDIT_WEBHOOK_TOKEN,
        null as any,
        'signature'
      );

      expect(result).toBe(false);
    });
  });

  describe('extractWebhookId', () => {
    it('should extract webhook ID from valid payload', () => {
      const payload = {
        id: 'webhook_123456',
        external_id: 'order_789',
        status: 'PAID',
      };

      const webhookId = extractWebhookId(payload);

      expect(webhookId).toBe('webhook_123456');
    });

    it('should return null when ID is missing', () => {
      const payload = {
        external_id: 'order_789',
        status: 'PAID',
      };

      const webhookId = extractWebhookId(payload);

      expect(webhookId).toBeNull();
    });

    it('should return null when ID is empty string', () => {
      const payload = {
        id: '',
        external_id: 'order_789',
      };

      const webhookId = extractWebhookId(payload);

      expect(webhookId).toBeNull();
    });

    it('should return null when ID is not a string', () => {
      const payload = {
        id: 12345,
        external_id: 'order_789',
      };

      const webhookId = extractWebhookId(payload as any);

      expect(webhookId).toBeNull();
    });

    it('should return null when payload is null', () => {
      const webhookId = extractWebhookId(null as any);

      expect(webhookId).toBeNull();
    });
  });

  describe('extractExternalId', () => {
    it('should extract external ID from valid payload', () => {
      const payload = {
        id: 'webhook_123456',
        external_id: 'order_789',
        status: 'PAID',
      };

      const externalId = extractExternalId(payload);

      expect(externalId).toBe('order_789');
    });

    it('should return null when external_id is missing', () => {
      const payload = {
        id: 'webhook_123456',
        status: 'PAID',
      };

      const externalId = extractExternalId(payload);

      expect(externalId).toBeNull();
    });

    it('should return null when external_id is empty string', () => {
      const payload = {
        id: 'webhook_123456',
        external_id: '',
      };

      const externalId = extractExternalId(payload);

      expect(externalId).toBeNull();
    });

    it('should return null when external_id is not a string', () => {
      const payload = {
        id: 'webhook_123456',
        external_id: 789,
      };

      const externalId = extractExternalId(payload as any);

      expect(externalId).toBeNull();
    });
  });

  describe('validateWebhookPayload', () => {
    it('should validate correct payload structure', () => {
      const payload = {
        id: 'webhook_123456',
        external_id: 'order_789',
        status: 'PAID',
        amount: 200,
        payer_email: 'user@example.com',
      };

      const isValid = validateWebhookPayload(payload);

      expect(isValid).toBe(true);
    });

    it('should accept all valid statuses', () => {
      const statuses = ['PENDING', 'PAID', 'EXPIRED', 'FAILED'];

      statuses.forEach(status => {
        const payload = {
          id: 'webhook_123',
          external_id: 'order_789',
          status,
        };

        const isValid = validateWebhookPayload(payload);
        expect(isValid).toBe(true);
      });
    });

    it('should reject payload without id', () => {
      const payload = {
        external_id: 'order_789',
        status: 'PAID',
      };

      const isValid = validateWebhookPayload(payload);

      expect(isValid).toBe(false);
    });

    it('should reject payload without external_id', () => {
      const payload = {
        id: 'webhook_123',
        status: 'PAID',
      };

      const isValid = validateWebhookPayload(payload);

      expect(isValid).toBe(false);
    });

    it('should reject payload without status', () => {
      const payload = {
        id: 'webhook_123',
        external_id: 'order_789',
      };

      const isValid = validateWebhookPayload(payload);

      expect(isValid).toBe(false);
    });

    it('should reject payload with invalid status', () => {
      const payload = {
        id: 'webhook_123',
        external_id: 'order_789',
        status: 'INVALID_STATUS',
      };

      const isValid = validateWebhookPayload(payload);

      expect(isValid).toBe(false);
    });

    it('should reject non-object payload', () => {
      const isValid1 = validateWebhookPayload(null);
      const isValid2 = validateWebhookPayload('string');
      const isValid3 = validateWebhookPayload(123);
      const isValid4 = validateWebhookPayload([]);

      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
      expect(isValid3).toBe(false);
      expect(isValid4).toBe(false);
    });

    it('should reject payload with null required fields', () => {
      const payload = {
        id: null,
        external_id: 'order_789',
        status: 'PAID',
      };

      const isValid = validateWebhookPayload(payload);

      expect(isValid).toBe(false);
    });

    it('should reject payload with empty string required fields', () => {
      const payload = {
        id: '',
        external_id: 'order_789',
        status: 'PAID',
      };

      const isValid = validateWebhookPayload(payload);

      expect(isValid).toBe(false);
    });
  });

  describe('getEventTypeFromStatus', () => {
    it('should map PAID status to invoice.paid event', () => {
      const eventType = getEventTypeFromStatus('PAID');
      expect(eventType).toBe('invoice.paid');
    });

    it('should map EXPIRED status to invoice.expired event', () => {
      const eventType = getEventTypeFromStatus('EXPIRED');
      expect(eventType).toBe('invoice.expired');
    });

    it('should map FAILED status to invoice.failed event', () => {
      const eventType = getEventTypeFromStatus('FAILED');
      expect(eventType).toBe('invoice.failed');
    });

    it('should map PENDING status to invoice.pending event', () => {
      const eventType = getEventTypeFromStatus('PENDING');
      expect(eventType).toBe('invoice.pending');
    });

    it('should return invoice.pending for unknown status', () => {
      const eventType = getEventTypeFromStatus('UNKNOWN_STATUS');
      expect(eventType).toBe('invoice.pending');
    });

    it('should handle case-sensitive status mapping', () => {
      const eventType = getEventTypeFromStatus('paid');
      expect(eventType).toBe('invoice.pending'); // Should not match lowercase
    });
  });

  describe('Security considerations', () => {
    it('should not leak information about token length through errors', () => {
      const shortToken = 'a';
      const longToken = 'a'.repeat(100);
      const correctLength = mockEnv.XENDIT_WEBHOOK_TOKEN;

      // All should return false without revealing which is correct length
      expect(verifyWebhookSignature(shortToken, {}, null)).toBe(false);
      expect(verifyWebhookSignature(longToken, {}, null)).toBe(false);
      expect(verifyWebhookSignature(correctLength + 'x', {}, null)).toBe(false);
    });

    it('should handle special characters in tokens safely', () => {
      const specialCharsToken = 'token_with_!@#$%^&*()_+{}[]|\\:;<>?,./';
      process.env.XENDIT_WEBHOOK_TOKEN = specialCharsToken;

      const isValid = verifyWebhookSignature(
        specialCharsToken,
        { test: 'payload' },
        null
      );

      expect(isValid).toBe(true);
    });

    it('should handle Unicode characters in payload', () => {
      const payload = {
        id: 'webhook_unicode',
        external_id: 'order_unicode',
        status: 'PAID',
        description: '₱200.00 支付成功 🎉',
      };

      const bodyString = JSON.stringify(payload);
      const validSignature = crypto
        .createHmac('sha256', mockEnv.XENDIT_WEBHOOK_TOKEN)
        .update(bodyString)
        .digest('hex');

      const isValid = verifyWebhookSignature(
        mockEnv.XENDIT_WEBHOOK_TOKEN,
        bodyString,
        validSignature
      );

      expect(isValid).toBe(true);
    });

    it('should handle very large payloads', () => {
      const largePayload = {
        id: 'webhook_large',
        external_id: 'order_large',
        status: 'PAID',
        data: 'x'.repeat(10000), // 10KB of data
      };

      const bodyString = JSON.stringify(largePayload);
      const validSignature = crypto
        .createHmac('sha256', mockEnv.XENDIT_WEBHOOK_TOKEN)
        .update(bodyString)
        .digest('hex');

      const isValid = verifyWebhookSignature(
        mockEnv.XENDIT_WEBHOOK_TOKEN,
        bodyString,
        validSignature
      );

      expect(isValid).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should validate complete webhook flow', () => {
      const payload = {
        id: 'xendit_invoice_123',
        external_id: 'order_456',
        status: 'PAID',
        amount: 200,
        paid_amount: 200,
        payment_method: 'GCASH',
        payer_email: 'user@example.com',
      };

      // Step 1: Verify signature
      const isSignatureValid = verifyWebhookSignature(
        mockEnv.XENDIT_WEBHOOK_TOKEN,
        payload,
        null
      );
      expect(isSignatureValid).toBe(true);

      // Step 2: Validate payload structure
      const isPayloadValid = validateWebhookPayload(payload);
      expect(isPayloadValid).toBe(true);

      // Step 3: Extract webhook ID
      const webhookId = extractWebhookId(payload);
      expect(webhookId).toBe('xendit_invoice_123');

      // Step 4: Extract external order ID
      const orderId = extractExternalId(payload);
      expect(orderId).toBe('order_456');

      // Step 5: Get event type
      const eventType = getEventTypeFromStatus(payload.status);
      expect(eventType).toBe('invoice.paid');
    });

    it('should reject malicious webhook attempts', () => {
      const maliciousPayload = {
        id: 'webhook_malicious',
        external_id: 'order_789; DROP TABLE orders;--',
        status: 'PAID',
      };

      // Valid signature but payload structure should still be validated
      const isValid = verifyWebhookSignature(
        'wrong_token',
        maliciousPayload,
        null
      );

      // Should reject due to wrong token
      expect(isValid).toBe(false);

      // But payload structure is technically valid (SQL injection handled elsewhere)
      const isPayloadValid = validateWebhookPayload(maliciousPayload);
      expect(isPayloadValid).toBe(true); // Structure is valid
    });
  });
});
