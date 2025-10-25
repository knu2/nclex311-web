/**
 * Unit tests for Xendit API Client
 * Tests invoice creation, status checking, and error handling
 */

import { jest } from '@jest/globals';

// Mock axios before imports
const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
};

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn(),
};

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios,
}));

describe('XenditClient', () => {
  let XenditClient: any;
  let XenditError: any;
  let axios: any;

  const mockEnv = {
    XENDIT_SECRET_KEY: 'xnd_test_secret_key_123',
    NEXT_PUBLIC_APP_URL: 'https://test.nclex311.com',
  };

  beforeEach(async () => {
    // Set environment variables
    process.env.XENDIT_SECRET_KEY = mockEnv.XENDIT_SECRET_KEY;
    process.env.NEXT_PUBLIC_APP_URL = mockEnv.NEXT_PUBLIC_APP_URL;

    // Clear mocks
    jest.clearAllMocks();
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.get.mockReset();
    mockAxios.isAxiosError.mockReset();

    // Dynamic import after env is set (like email tests)
    const xenditModule = await import('../../src/lib/xendit');
    XenditClient = xenditModule.XenditClient;
    XenditError = xenditModule.XenditError;
    const axiosModule = await import('axios');
    axios = axiosModule.default;
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.XENDIT_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('XenditClient initialization', () => {
    it('should initialize with secret key from environment', () => {
      expect(() => new XenditClient()).not.toThrow();
    });

    it('should initialize with explicit secret key', () => {
      const customKey = 'xnd_custom_key';
      const client = new XenditClient(customKey);
      expect(client).toBeDefined();
    });

    it('should throw error when XENDIT_SECRET_KEY is missing', () => {
      delete process.env.XENDIT_SECRET_KEY;

      expect(() => new XenditClient()).toThrow('XENDIT_SECRET_KEY is required');
    });

    it('should create axios instance with correct configuration', () => {
      new XenditClient();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.xendit.co',
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: mockEnv.XENDIT_SECRET_KEY,
          password: '',
        },
      });
    });
  });

  describe('createInvoice', () => {
    let client: any;

    beforeEach(() => {
      client = new XenditClient();
    });

    it('should create monthly premium invoice successfully', async () => {
      const mockResponse = {
        data: {
          id: 'xendit_invoice_123',
          external_id: 'order_123',
          user_id: 'xendit_user_456',
          status: 'PENDING' as const,
          merchant_name: 'NCLEX311',
          amount: 200,
          payer_email: 'user@example.com',
          description: 'NCLEX311 Premium - Monthly Subscription (₱200/month)',
          expiry_date: '2025-10-26T10:00:00Z',
          invoice_url: 'https://checkout.xendit.co/web/invoice_123',
          available_banks: [],
          available_retail_outlets: [],
          available_ewallets: [],
          should_exclude_credit_card: false,
          should_send_email: false,
          created: '2025-10-25T10:00:00Z',
          updated: '2025-10-25T10:00:00Z',
          currency: 'PHP',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const invoice = await client.createInvoice(
        'order_123',
        'monthly_premium',
        'user@example.com'
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v2/invoices',
        expect.objectContaining({
          external_id: 'order_123',
          amount: 200, // 20000 centavos / 100 = 200 PHP
          payer_email: 'user@example.com',
          description: 'NCLEX311 Premium - Monthly Subscription (₱200/month)',
          invoice_duration: 86400, // 24 hours * 60 * 60
          success_redirect_url: `${mockEnv.NEXT_PUBLIC_APP_URL}/payment/success?orderId=order_123`,
          failure_redirect_url: `${mockEnv.NEXT_PUBLIC_APP_URL}/payment/failed?orderId=order_123`,
          currency: 'PHP',
          items: [
            {
              name: 'NCLEX311 Premium - Monthly Subscription (₱200/month)',
              quantity: 1,
              price: 200,
            },
          ],
        })
      );

      expect(invoice).toEqual(mockResponse.data);
      expect(invoice.invoice_url).toBe(
        'https://checkout.xendit.co/web/invoice_123'
      );
    });

    it('should create annual premium invoice with correct pricing', async () => {
      const mockResponse = {
        data: {
          id: 'xendit_invoice_456',
          external_id: 'order_456',
          status: 'PENDING' as const,
          amount: 1920,
          invoice_url: 'https://checkout.xendit.co/web/invoice_456',
          expiry_date: '2025-10-26T10:00:00Z',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const invoice = await client.createInvoice(
        'order_456',
        'annual_premium',
        'user@example.com'
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v2/invoices',
        expect.objectContaining({
          external_id: 'order_456',
          amount: 1920, // 192000 centavos / 100 = 1920 PHP
          description: 'NCLEX311 Premium - Annual Subscription (₱1,920/year)',
          items: [
            {
              name: 'NCLEX311 Premium - Annual Subscription (₱1,920/year)',
              quantity: 1,
              price: 1920,
            },
          ],
        })
      );

      expect(invoice.amount).toBe(1920);
    });

    it('should throw XenditError on API error response', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error_code: 'INVALID_AMOUNT',
            message: 'Amount must be positive',
          },
        },
        isAxiosError: true,
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(
        client.createInvoice('order_789', 'monthly_premium', 'user@example.com')
      ).rejects.toThrow();

      await expect(
        client.createInvoice('order_789', 'monthly_premium', 'user@example.com')
      ).rejects.toMatchObject({
        name: 'XenditError',
        code: 'INVALID_AMOUNT',
        message: 'Amount must be positive',
        statusCode: 400,
      });
    });

    it('should handle network errors without response', async () => {
      const mockError = {
        request: {},
        isAxiosError: true,
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(
        client.createInvoice('order_999', 'monthly_premium', 'user@example.com')
      ).rejects.toMatchObject({
        name: 'XenditError',
        code: 'NETWORK_ERROR',
        message: 'No response received from Xendit API',
      });
    });

    it('should handle unknown errors', async () => {
      const mockError = new Error('Unknown error');

      mockAxiosInstance.post.mockRejectedValue(mockError);
      mockAxios.isAxiosError.mockReturnValue(false);

      await expect(
        client.createInvoice('order_111', 'monthly_premium', 'user@example.com')
      ).rejects.toMatchObject({
        name: 'XenditError',
        code: 'UNKNOWN_ERROR',
        message: 'Failed to create invoice',
      });
    });

    it('should use default APP_URL when environment variable not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      const mockResponse = {
        data: {
          id: 'xendit_invoice_default',
          status: 'PENDING' as const,
          invoice_url: 'https://checkout.xendit.co/web/invoice_default',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.createInvoice(
        'order_default',
        'monthly_premium',
        'user@example.com'
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v2/invoices',
        expect.objectContaining({
          success_redirect_url:
            'http://localhost:3000/payment/success?orderId=order_default',
          failure_redirect_url:
            'http://localhost:3000/payment/failed?orderId=order_default',
        })
      );
    });
  });

  describe('checkInvoiceStatus', () => {
    let client: any;

    beforeEach(() => {
      client = new XenditClient();
    });

    it('should check invoice status successfully', async () => {
      const mockResponse = {
        data: {
          id: 'xendit_invoice_123',
          external_id: 'order_123',
          status: 'PAID' as const,
          amount: 200,
          paid_amount: 200,
          payment_method: 'GCASH',
          updated: '2025-10-25T12:00:00Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const status = await client.checkInvoiceStatus('xendit_invoice_123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/v2/invoices/xendit_invoice_123'
      );

      expect(status).toEqual({
        id: 'xendit_invoice_123',
        external_id: 'order_123',
        status: 'PAID',
        amount: 200,
        paid_amount: 200,
        payment_method: 'GCASH',
        paid_at: '2025-10-25T12:00:00Z',
      });
    });

    it('should return PENDING status for unpaid invoice', async () => {
      const mockResponse = {
        data: {
          id: 'xendit_invoice_456',
          external_id: 'order_456',
          status: 'PENDING' as const,
          amount: 1920,
          updated: '2025-10-25T10:00:00Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const status = await client.checkInvoiceStatus('xendit_invoice_456');

      expect(status.status).toBe('PENDING');
      expect(status.paid_amount).toBeUndefined();
      expect(status.payment_method).toBeUndefined();
    });

    it('should throw XenditError when invoice not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            error_code: 'INVOICE_NOT_FOUND',
            message: 'Invoice does not exist',
          },
        },
        isAxiosError: true,
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(
        client.checkInvoiceStatus('nonexistent_invoice')
      ).rejects.toMatchObject({
        name: 'XenditError',
        code: 'INVOICE_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('should handle network errors', async () => {
      const mockError = {
        request: {},
        isAxiosError: true,
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(
        client.checkInvoiceStatus('xendit_invoice_error')
      ).rejects.toMatchObject({
        name: 'XenditError',
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('XenditClient singleton pattern', () => {
    it('should create separate instances when instantiated directly', () => {
      const client1 = new XenditClient();
      const client2 = new XenditClient();

      expect(client1).not.toBe(client2);
    });
  });

  describe('XenditError class', () => {
    it('should create error with all properties', () => {
      const error = new XenditError(
        'Test error message',
        'TEST_ERROR_CODE',
        400,
        { error_code: 'TEST_ERROR_CODE', message: 'Test error message' }
      );

      expect(error.name).toBe('XenditError');
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.response).toEqual({
        error_code: 'TEST_ERROR_CODE',
        message: 'Test error message',
      });
    });

    it('should work without optional parameters', () => {
      const error = new XenditError('Basic error', 'BASIC_ERROR');

      expect(error.name).toBe('XenditError');
      expect(error.message).toBe('Basic error');
      expect(error.code).toBe('BASIC_ERROR');
      expect(error.statusCode).toBeUndefined();
      expect(error.response).toBeUndefined();
    });
  });
});
