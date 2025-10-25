/**
 * Integration Tests for Xendit Webhook Processing
 * Tests webhook signature verification, idempotency, payment processing, and error handling
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see docs/qa/test-specifications/2.1-payment-integration-tests.md
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';

// Mock dependencies before imports
jest.mock('@/lib/db/services');
jest.mock('@/lib/email');
jest.mock('@/lib/logger');

describe('POST /api/webhooks/xendit - Integration Tests', () => {
  let POST: any;
  let getOrderService: any;
  let getWebhookLogService: any;
  let UserService: any;
  let getEmailService: any;
  let getLogger: any;

  const mockEnv = {
    XENDIT_WEBHOOK_TOKEN: 'test_webhook_token_123',
  };

  // Mock service instances
  const mockOrderService = {
    findByOrderId: jest.fn(),
    update: jest.fn(),
  };

  const mockWebhookLogService = {
    isProcessed: jest.fn(),
    create: jest.fn(),
    markAsProcessed: jest.fn(),
  };

  const mockUserService = {
    activatePremiumSubscription: jest.fn(),
    findUserById: jest.fn(),
  };

  const mockEmailService = {
    sendPremiumConfirmationEmail: jest.fn(),
  };

  const mockLogger = {
    webhookReceived: jest.fn(),
    webhookProcessed: jest.fn(),
    webhookError: jest.fn(),
    subscriptionActivated: jest.fn(),
    paymentCompleted: jest.fn(),
    paymentFailed: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    // Set environment variables
    process.env.XENDIT_WEBHOOK_TOKEN = mockEnv.XENDIT_WEBHOOK_TOKEN;

    // Clear all mocks
    jest.clearAllMocks();

    // Mock service getters
    const servicesModule = await import('@/lib/db/services');
    getOrderService = servicesModule.getOrderService as jest.Mock;
    getWebhookLogService = servicesModule.getWebhookLogService as jest.Mock;
    UserService = servicesModule.UserService;

    getOrderService.mockReturnValue(mockOrderService);
    getWebhookLogService.mockReturnValue(mockWebhookLogService);
    (UserService as jest.Mock).mockImplementation(() => mockUserService);

    // Mock email service
    const emailModule = await import('@/lib/email');
    getEmailService = emailModule.getEmailService as jest.Mock;
    getEmailService.mockReturnValue(mockEmailService);

    // Mock logger
    const loggerModule = await import('@/lib/logger');
    getLogger = loggerModule.getLogger as jest.Mock;
    getLogger.mockReturnValue(mockLogger);

    // Reset mock implementations
    mockWebhookLogService.isProcessed.mockResolvedValue(false);
    mockWebhookLogService.create.mockResolvedValue({ id: 'log_123' });
    mockWebhookLogService.markAsProcessed.mockResolvedValue(undefined);
    mockEmailService.sendPremiumConfirmationEmail.mockResolvedValue(undefined);

    // Dynamic import after env and mocks are set
    const webhookModule = await import('@/app/api/webhooks/xendit/route');
    POST = webhookModule.POST;
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.XENDIT_WEBHOOK_TOKEN;
  });

  /**
   * Helper: Generate valid HMAC signature for webhook payload
   */
  function generateValidSignature(payload: object): string {
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN!;
    return crypto
      .createHmac('sha256', webhookToken)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Helper: Create mock Request for webhook testing
   */
  function createWebhookRequest(options: {
    payload: object;
    callbackToken?: string;
    signature?: string | null;
  }): Request {
    const body = JSON.stringify(options.payload);
    const signature =
      options.signature ?? generateValidSignature(options.payload);

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-callback-token': options.callbackToken || mockEnv.XENDIT_WEBHOOK_TOKEN,
    };

    if (signature) {
      headers['x-signature'] = signature;
    }

    return new Request('http://localhost:3000/api/webhooks/xendit', {
      method: 'POST',
      headers,
      body,
    }) as any;
  }

  describe('Test Case 1.1: Valid PAID Webhook with Correct Signature', () => {
    it('should process paid webhook successfully and activate premium subscription', async () => {
      const validPaidWebhook = {
        id: 'xendit_inv_123',
        external_id: 'order_1234567890_abc123',
        status: 'PAID',
        paid_amount: 20000,
        paid_at: '2025-10-25T08:00:00Z',
        payment_method: 'GCASH',
      };

      const mockOrder = {
        id: 'uuid-123',
        orderId: 'order_1234567890_abc123',
        userId: 'user_456',
        amount: 20000,
        planType: 'monthly_premium',
        status: 'pending',
      };

      const mockUser = {
        id: 'user_456',
        email: 'user@example.com',
      };

      mockOrderService.findByOrderId.mockResolvedValue(mockOrder);
      mockOrderService.update.mockResolvedValue({
        ...mockOrder,
        status: 'paid',
      });
      mockUserService.findUserById.mockResolvedValue(mockUser);

      const request = createWebhookRequest({ payload: validPaidWebhook });
      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data.message).toBe('Webhook processed');

      // Verify order update
      expect(mockOrderService.update).toHaveBeenCalledWith(
        'order_1234567890_abc123',
        expect.objectContaining({
          status: 'paid',
          paidAmount: 20000,
          paymentMethod: 'GCASH',
        })
      );

      // Verify subscription activation (30 days for monthly)
      expect(mockUserService.activatePremiumSubscription).toHaveBeenCalledWith(
        'user_456',
        'monthly_premium',
        expect.any(Date),
        true // autoRenew for monthly
      );

      // Verify email sent
      expect(
        mockEmailService.sendPremiumConfirmationEmail
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: 'user@example.com',
          planType: 'monthly_premium',
          amount: 20000,
          autoRenew: true,
        })
      );

      // Verify webhook marked as processed
      expect(mockWebhookLogService.markAsProcessed).toHaveBeenCalledWith(
        'xendit_inv_123'
      );

      // Verify logging
      expect(mockLogger.webhookReceived).toHaveBeenCalled();
      expect(mockLogger.webhookProcessed).toHaveBeenCalled();
      expect(mockLogger.subscriptionActivated).toHaveBeenCalled();
      expect(mockLogger.paymentCompleted).toHaveBeenCalled();
    });
  });

  describe('Test Case 1.2: Invalid Webhook Signature', () => {
    it('should return 401 when signature verification fails', async () => {
      const payload = {
        id: 'xendit_inv_456',
        external_id: 'order_invalid',
        status: 'PAID',
      };

      const request = createWebhookRequest({
        payload,
        signature: 'wrong_signature_hash',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');

      // Verify no database operations performed
      expect(mockOrderService.findByOrderId).not.toHaveBeenCalled();
      expect(mockOrderService.update).not.toHaveBeenCalled();
      expect(
        mockUserService.activatePremiumSubscription
      ).not.toHaveBeenCalled();
      expect(mockWebhookLogService.create).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 1.3: Duplicate Webhook (Idempotency Check)', () => {
    it('should return 200 without reprocessing when webhook already processed', async () => {
      const duplicateWebhook = {
        id: 'xendit_inv_duplicate',
        external_id: 'order_already_processed',
        status: 'PAID',
        paid_amount: 20000,
      };

      // Mock as already processed
      mockWebhookLogService.isProcessed.mockResolvedValue(true);

      const request = createWebhookRequest({ payload: duplicateWebhook });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Webhook already processed');

      // Verify no duplicate operations
      expect(mockOrderService.update).not.toHaveBeenCalled();
      expect(
        mockUserService.activatePremiumSubscription
      ).not.toHaveBeenCalled();
      expect(
        mockEmailService.sendPremiumConfirmationEmail
      ).not.toHaveBeenCalled();
      expect(mockWebhookLogService.markAsProcessed).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 1.4: Webhook for Non-Existent Order', () => {
    it('should return 404 and mark webhook as processed', async () => {
      const payload = {
        id: 'xendit_inv_notfound',
        external_id: 'order_nonexistent',
        status: 'PAID',
      };

      mockOrderService.findByOrderId.mockResolvedValue(null);

      const request = createWebhookRequest({ payload });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Order not found');

      // Verify webhook marked as processed to prevent retries
      expect(mockWebhookLogService.markAsProcessed).toHaveBeenCalledWith(
        'xendit_inv_notfound'
      );
    });
  });

  describe('Test Case 1.5: EXPIRED Webhook', () => {
    it('should update order to expired without activating subscription', async () => {
      const expiredWebhook = {
        id: 'xendit_inv_789',
        external_id: 'order_expired',
        status: 'EXPIRED',
      };

      const mockOrder = {
        id: 'uuid-789',
        orderId: 'order_expired',
        userId: 'user_789',
        amount: 20000,
        planType: 'monthly_premium',
        status: 'pending',
      };

      mockOrderService.findByOrderId.mockResolvedValue(mockOrder);
      mockOrderService.update.mockResolvedValue({
        ...mockOrder,
        status: 'expired',
      });

      const request = createWebhookRequest({ payload: expiredWebhook });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Webhook processed');

      // Verify order updated to expired
      expect(mockOrderService.update).toHaveBeenCalledWith('order_expired', {
        status: 'expired',
      });

      // Verify no subscription activation
      expect(
        mockUserService.activatePremiumSubscription
      ).not.toHaveBeenCalled();
      expect(
        mockEmailService.sendPremiumConfirmationEmail
      ).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 1.6: FAILED Webhook with Failure Code', () => {
    it('should update order to failed with failure code', async () => {
      const failedWebhook = {
        id: 'xendit_inv_999',
        external_id: 'order_failed',
        status: 'FAILED',
        failure_code: 'CARD_DECLINED',
      };

      const mockOrder = {
        id: 'uuid-999',
        orderId: 'order_failed',
        userId: 'user_999',
        amount: 20000,
        planType: 'monthly_premium',
        status: 'pending',
      };

      mockOrderService.findByOrderId.mockResolvedValue(mockOrder);
      mockOrderService.update.mockResolvedValue({
        ...mockOrder,
        status: 'failed',
      });

      const request = createWebhookRequest({ payload: failedWebhook });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Webhook processed');

      // Verify order updated with failure code
      expect(mockOrderService.update).toHaveBeenCalledWith('order_failed', {
        status: 'failed',
        failureCode: 'CARD_DECLINED',
      });

      // Verify no subscription activation
      expect(
        mockUserService.activatePremiumSubscription
      ).not.toHaveBeenCalled();

      // Verify payment failure logged
      expect(mockLogger.paymentFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'CARD_DECLINED',
          }),
        })
      );
    });
  });

  describe('Test Case 1.7: Database Error During Processing', () => {
    it('should return 500 on database error without marking webhook as processed', async () => {
      const payload = {
        id: 'xendit_inv_error',
        external_id: 'order_db_error',
        status: 'PAID',
        paid_amount: 20000,
      };

      const mockOrder = {
        id: 'uuid-error',
        orderId: 'order_db_error',
        userId: 'user_error',
        amount: 20000,
        planType: 'monthly_premium',
        status: 'pending',
      };

      mockOrderService.findByOrderId.mockResolvedValue(mockOrder);
      mockOrderService.update.mockRejectedValue(
        new Error('Database connection lost')
      );

      const request = createWebhookRequest({ payload });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Processing failed');

      // Verify error logged
      expect(mockLogger.webhookError).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'xendit_inv_error',
          error: expect.objectContaining({
            message: 'Database connection lost',
          }),
        })
      );

      // Verify webhook NOT marked as processed (allows Xendit retry)
      expect(mockWebhookLogService.markAsProcessed).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 1.8: Email Service Failure (Non-Blocking)', () => {
    it('should complete webhook processing despite email failure', async () => {
      const payload = {
        id: 'xendit_inv_email_fail',
        external_id: 'order_email_fail',
        status: 'PAID',
        paid_amount: 20000,
        payment_method: 'CREDIT_CARD',
      };

      const mockOrder = {
        id: 'uuid-email-fail',
        orderId: 'order_email_fail',
        userId: 'user_email_fail',
        amount: 20000,
        planType: 'monthly_premium',
        status: 'pending',
      };

      const mockUser = {
        id: 'user_email_fail',
        email: 'user@example.com',
      };

      mockOrderService.findByOrderId.mockResolvedValue(mockOrder);
      mockOrderService.update.mockResolvedValue({
        ...mockOrder,
        status: 'paid',
      });
      mockUserService.findUserById.mockResolvedValue(mockUser);
      mockEmailService.sendPremiumConfirmationEmail.mockRejectedValue(
        new Error('SendGrid API error')
      );

      const request = createWebhookRequest({ payload });
      const response = await POST(request);
      const data = await response.json();

      // Email failure should not block webhook processing
      expect(response.status).toBe(200);
      expect(data.message).toBe('Webhook processed');

      // Verify order still updated to paid
      expect(mockOrderService.update).toHaveBeenCalledWith(
        'order_email_fail',
        expect.objectContaining({ status: 'paid' })
      );

      // Verify subscription still activated
      expect(mockUserService.activatePremiumSubscription).toHaveBeenCalled();

      // Verify webhook still marked as processed
      expect(mockWebhookLogService.markAsProcessed).toHaveBeenCalledWith(
        'xendit_inv_email_fail'
      );

      // Verify error logged but non-blocking
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to send confirmation email',
        expect.anything()
      );
    });
  });
});
