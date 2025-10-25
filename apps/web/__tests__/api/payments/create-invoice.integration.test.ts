/**
 * Integration Tests for Payment Invoice Creation
 * Tests authentication, validation, invoice creation, and error handling
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see docs/qa/test-specifications/2.1-payment-integration-tests.md
 */

import { jest } from '@jest/globals';

// Mock dependencies before imports
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: jest.fn(),
  })),
}));
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@/lib/database', () => ({
  supabase: {
    from: jest.fn(),
  },
}));
jest.mock('@/lib/auth-utils');
jest.mock('@/lib/db/services');
jest.mock('@/lib/xendit');
jest.mock('@/lib/logger');

describe('POST /api/payments/create-invoice - Integration Tests', () => {
  let POST: any;
  let getCurrentSession: any;
  let getOrderService: any;
  let getXenditClient: any;
  let getLogger: any;

  const mockEnv = {
    XENDIT_SECRET_KEY: 'xnd_test_key',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  };

  // Mock service instances
  const mockOrderService = {
    hasActiveSubscription: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockXenditClient = {
    createInvoice: jest.fn(),
  };

  const mockLogger = {
    paymentInitiated: jest.fn(),
    paymentFailed: jest.fn(),
    invoiceCreated: jest.fn(),
    error: jest.fn(),
  };

  // Mock session
  const authenticatedSession = {
    user: {
      id: 'user_123',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    // Set environment variables
    process.env.XENDIT_SECRET_KEY = mockEnv.XENDIT_SECRET_KEY;
    process.env.NEXT_PUBLIC_APP_URL = mockEnv.NEXT_PUBLIC_APP_URL;

    // Clear all mocks
    jest.clearAllMocks();

    // Mock auth
    const authModule = await import('@/lib/auth-utils');
    getCurrentSession = authModule.getCurrentSession as jest.Mock;
    getCurrentSession.mockResolvedValue(authenticatedSession);

    // Mock services
    const servicesModule = await import('@/lib/db/services');
    getOrderService = servicesModule.getOrderService as jest.Mock;
    getOrderService.mockReturnValue(mockOrderService);

    // Mock Xendit client
    const xenditModule = await import('@/lib/xendit');
    getXenditClient = xenditModule.getXenditClient as jest.Mock;
    getXenditClient.mockReturnValue(mockXenditClient);

    // Mock logger
    const loggerModule = await import('@/lib/logger');
    getLogger = loggerModule.getLogger as jest.Mock;
    getLogger.mockReturnValue(mockLogger);

    // Reset mock implementations
    mockOrderService.hasActiveSubscription.mockResolvedValue(false);
    mockOrderService.create.mockResolvedValue({
      id: 'order-uuid-123',
      orderId: 'order_123456_abc',
      userId: 'user_123',
      amount: 20000,
      status: 'pending',
      planType: 'monthly_premium',
    });

    // Dynamic import after env and mocks are set
    const invoiceModule = await import(
      '@/app/api/payments/create-invoice/route'
    );
    POST = invoiceModule.POST;
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.XENDIT_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  /**
   * Helper: Create mock Request for invoice creation testing
   */
  function createInvoiceRequest(body: object | null): Request {
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    };

    if (body !== null) {
      init.body = JSON.stringify(body);
    }

    return new Request(
      'http://localhost:3000/api/payments/create-invoice',
      init
    ) as any;
  }

  describe('Test Case 2.1: Successful Invoice Creation (Monthly Plan)', () => {
    it('should create monthly premium invoice successfully', async () => {
      const mockXenditInvoice = {
        id: 'xendit_inv_456',
        invoice_url: 'https://checkout.xendit.co/web/invoice_456',
        expiry_date: '2025-10-26T08:00:00Z',
      };

      mockXenditClient.createInvoice.mockResolvedValue(mockXenditInvoice);

      const request = createInvoiceRequest({ planType: 'monthly_premium' });
      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.orderId).toBeDefined();
      expect(data.checkoutUrl).toBe(
        'https://checkout.xendit.co/web/invoice_456'
      );
      expect(data.planType).toBe('monthly_premium');
      expect(data.amount).toBe(20000);

      // Verify order created
      expect(mockOrderService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_123',
          amount: 20000,
          status: 'pending',
          planType: 'monthly_premium',
          isRecurring: true, // Monthly subscriptions are recurring
        })
      );

      // Verify Xendit invoice created
      expect(mockXenditClient.createInvoice).toHaveBeenCalledWith(
        expect.any(String),
        'monthly_premium',
        'test@example.com'
      );

      // Verify order updated with Xendit details
      expect(mockOrderService.update).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          xenditInvoiceId: 'xendit_inv_456',
          xenditInvoiceUrl: 'https://checkout.xendit.co/web/invoice_456',
        })
      );

      // Verify logging
      expect(mockLogger.paymentInitiated).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_123',
          planType: 'monthly_premium',
          amount: 20000,
        })
      );
      expect(mockLogger.invoiceCreated).toHaveBeenCalled();
    });
  });

  describe('Test Case 2.2: Successful Invoice Creation (Annual Plan)', () => {
    it('should create annual premium invoice with correct pricing', async () => {
      const mockXenditInvoice = {
        id: 'xendit_inv_annual',
        invoice_url: 'https://checkout.xendit.co/web/invoice_annual',
        expiry_date: '2025-10-26T08:00:00Z',
      };

      mockXenditClient.createInvoice.mockResolvedValue(mockXenditInvoice);

      const request = createInvoiceRequest({ planType: 'annual_premium' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.planType).toBe('annual_premium');
      expect(data.amount).toBe(192000); // ₱1,920 in centavos

      // Verify order created with correct amount and isRecurring=false
      expect(mockOrderService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 192000,
          planType: 'annual_premium',
          isRecurring: false, // Annual plans are not recurring
        })
      );
    });
  });

  describe('Test Case 2.3: Unauthenticated Request', () => {
    it('should return 401 when user is not authenticated', async () => {
      getCurrentSession.mockResolvedValue(null);

      const request = createInvoiceRequest({ planType: 'monthly_premium' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');

      // Verify no database operations performed
      expect(mockOrderService.hasActiveSubscription).not.toHaveBeenCalled();
      expect(mockOrderService.create).not.toHaveBeenCalled();
      expect(mockXenditClient.createInvoice).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 2.4: Invalid Plan Type', () => {
    it('should return 400 for invalid plan type', async () => {
      const request = createInvoiceRequest({ planType: 'invalid_plan' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Plan');
      expect(data.message).toContain('monthly_premium');
      expect(data.message).toContain('annual_premium');

      // Verify no order created
      expect(mockOrderService.create).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 2.5: User Already Has Active Subscription', () => {
    it('should return 409 when user already has active subscription', async () => {
      mockOrderService.hasActiveSubscription.mockResolvedValue(true);

      const request = createInvoiceRequest({ planType: 'monthly_premium' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Subscription Exists');
      expect(data.message).toContain('active premium subscription');

      // Verify no duplicate order created
      expect(mockOrderService.create).not.toHaveBeenCalled();
      expect(mockXenditClient.createInvoice).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 2.6: Xendit API Failure', () => {
    it('should return 500 and update order to failed when Xendit API fails', async () => {
      mockXenditClient.createInvoice.mockRejectedValue(
        new Error('Xendit API timeout')
      );

      const request = createInvoiceRequest({ planType: 'monthly_premium' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Payment Gateway Error');
      expect(data.message).toContain('Failed to create payment invoice');

      // Verify order created initially as pending
      expect(mockOrderService.create).toHaveBeenCalled();

      // Verify order updated to failed
      expect(mockOrderService.update).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'failed',
          failureCode: 'XENDIT_ERROR',
        })
      );

      // Verify failure logged
      expect(mockLogger.paymentFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_123',
          error: expect.objectContaining({
            code: 'XENDIT_ERROR',
          }),
        })
      );
    });
  });

  describe('Test Case 2.7: Malformed JSON Request Body', () => {
    it('should return 400 for malformed JSON', async () => {
      // Create request with invalid JSON
      const request = new Request(
        'http://localhost:3000/api/payments/create-invoice',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: 'not valid json {',
        }
      ) as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Request');
      expect(data.message).toContain('valid JSON');

      // Verify no operations performed
      expect(mockOrderService.create).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 2.8: Missing Plan Type in Request', () => {
    it('should return 400 when planType is missing', async () => {
      const request = createInvoiceRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Plan');

      // Verify no order created
      expect(mockOrderService.create).not.toHaveBeenCalled();
    });

    it('should return 400 when planType is null', async () => {
      const request = createInvoiceRequest({ planType: null });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Plan');

      // Verify no order created
      expect(mockOrderService.create).not.toHaveBeenCalled();
    });
  });
});
