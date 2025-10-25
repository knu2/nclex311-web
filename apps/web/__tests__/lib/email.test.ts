/**
 * Unit tests for Email Service
 * Tests premium confirmation and renewal reminder email functionality
 */

import { jest } from '@jest/globals';

// Mock fetch before importing the module
global.fetch = jest.fn();

describe('EmailService', () => {
  let EmailService: any;
  let getEmailService: any;
  let PremiumConfirmationData: any;
  let RenewalReminderData: any;

  const mockEnv = {
    SENDGRID_API_KEY: 'SG.test_api_key',
    EMAIL_FROM: 'test@nclex311.com',
    EMAIL_FROM_NAME: 'NCLEX311 Test',
    NEXT_PUBLIC_APP_URL: 'https://test.nclex311.com',
  };

  beforeEach(async () => {
    // Set environment variables
    process.env.SENDGRID_API_KEY = mockEnv.SENDGRID_API_KEY;
    process.env.EMAIL_FROM = mockEnv.EMAIL_FROM;
    process.env.EMAIL_FROM_NAME = mockEnv.EMAIL_FROM_NAME;
    process.env.NEXT_PUBLIC_APP_URL = mockEnv.NEXT_PUBLIC_APP_URL;

    // Clear mocks
    jest.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 202,
      statusText: 'Accepted',
      text: jest.fn().mockResolvedValue(''),
    });

    // Dynamic import after env is set
    const emailModule = await import('../../src/lib/email');
    EmailService = emailModule.EmailService;
    getEmailService = emailModule.getEmailService;
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.SENDGRID_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('EmailService initialization', () => {
    it('should initialize with valid environment variables', () => {
      expect(() => new EmailService()).not.toThrow();
    });

    it('should throw error when SENDGRID_API_KEY is missing', () => {
      delete process.env.SENDGRID_API_KEY;

      expect(() => new EmailService()).toThrow(
        'SENDGRID_API_KEY environment variable is required for email service'
      );
    });

    it('should use default values for EMAIL_FROM when not provided', () => {
      delete process.env.EMAIL_FROM;
      delete process.env.EMAIL_FROM_NAME;

      expect(() => new EmailService()).not.toThrow();
    });
  });

  describe('getEmailService singleton', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = getEmailService();
      const instance2 = getEmailService();

      expect(instance1).toBe(instance2);
    });
  });

  describe('sendPremiumConfirmationEmail', () => {
    let emailService: any;

    beforeEach(() => {
      emailService = new EmailService();
    });

    it('should send monthly premium confirmation email successfully', async () => {
      const confirmationData = {
        userEmail: 'user@example.com',
        userName: 'John Doe',
        planType: 'monthly_premium' as const,
        amount: 20000, // ₱200.00
        paymentMethod: 'GCASH',
        orderId: 'order_123',
        subscriptionStartDate: new Date('2025-10-23'),
        subscriptionExpiresAt: new Date('2025-11-23'),
        autoRenew: true,
      };

      await emailService.sendPremiumConfirmationEmail(confirmationData);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.sendgrid.com/v3/mail/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockEnv.SENDGRID_API_KEY}`,
          }),
        })
      );

      // Verify email content
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse((callArgs[1] as { body: string }).body);

      expect(requestBody.personalizations[0].to[0].email).toBe(
        'user@example.com'
      );
      expect(requestBody.personalizations[0].to[0].name).toBe('John Doe');
      expect(requestBody.personalizations[0].subject).toContain(
        'Monthly Premium'
      );
      expect(requestBody.from.email).toBe(mockEnv.EMAIL_FROM);
      expect(requestBody.content[0].type).toBe('text/html');

      // Verify HTML content includes key information
      const htmlContent = requestBody.content[0].value;
      expect(htmlContent).toContain('₱200.00');
      expect(htmlContent).toContain('GCASH');
      expect(htmlContent).toContain('order_123');
      expect(htmlContent).toContain('Auto-Renewal');
    });

    it('should send annual premium confirmation email successfully', async () => {
      const confirmationData = {
        userEmail: 'user@example.com',
        planType: 'annual_premium' as const,
        amount: 192000, // ₱1,920.00
        paymentMethod: 'CREDIT_CARD',
        orderId: 'order_456',
        subscriptionStartDate: new Date('2025-10-23'),
        subscriptionExpiresAt: new Date('2026-10-23'),
        autoRenew: false,
      };

      await emailService.sendPremiumConfirmationEmail(confirmationData);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse((callArgs[1] as { body: string }).body);

      expect(requestBody.personalizations[0].subject).toContain(
        'Annual Premium'
      );

      const htmlContent = requestBody.content[0].value;
      expect(htmlContent).toContain('₱1,920.00');
      expect(htmlContent).toContain('20% savings');
      expect(htmlContent).toContain('One-time payment');
      expect(htmlContent).toContain('Not Enabled');
    });

    it('should handle optional fields gracefully', async () => {
      const confirmationData = {
        userEmail: 'user@example.com',
        planType: 'monthly_premium' as const,
        amount: 20000,
        orderId: 'order_789',
        subscriptionStartDate: new Date('2025-10-23'),
        subscriptionExpiresAt: new Date('2025-11-23'),
        autoRenew: true,
      };

      await emailService.sendPremiumConfirmationEmail(confirmationData);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse((callArgs[1] as { body: string }).body);

      // Should not have name field when userName is undefined
      expect(requestBody.personalizations[0].to[0].name).toBeUndefined();

      // HTML should handle missing payment method
      const htmlContent = requestBody.content[0].value;
      expect(htmlContent).not.toContain('Payment Method:');
    });

    it('should not throw on SendGrid API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Invalid email'),
      });

      const confirmationData = {
        userEmail: 'invalid-email',
        planType: 'monthly_premium' as const,
        amount: 20000,
        orderId: 'order_999',
        subscriptionStartDate: new Date('2025-10-23'),
        subscriptionExpiresAt: new Date('2025-11-23'),
        autoRenew: true,
      };

      // Should not throw - error should be logged only
      await expect(
        emailService.sendPremiumConfirmationEmail(confirmationData)
      ).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not throw on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const confirmationData = {
        userEmail: 'user@example.com',
        planType: 'monthly_premium' as const,
        amount: 20000,
        orderId: 'order_888',
        subscriptionStartDate: new Date('2025-10-23'),
        subscriptionExpiresAt: new Date('2025-11-23'),
        autoRenew: true,
      };

      await expect(
        emailService.sendPremiumConfirmationEmail(confirmationData)
      ).resolves.not.toThrow();
    });
  });

  describe('sendRenewalReminderEmail', () => {
    let emailService: any;

    beforeEach(() => {
      emailService = new EmailService();
    });

    it('should send renewal reminder email successfully', async () => {
      const reminderData = {
        userEmail: 'user@example.com',
        userName: 'Jane Doe',
        amount: 20000, // ₱200.00
        renewalDate: new Date('2025-10-26'),
        subscriptionExpiresAt: new Date('2025-10-23'),
        cancelUrl: 'https://test.nclex311.com/dashboard/subscription',
      };

      await emailService.sendRenewalReminderEmail(reminderData);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse((callArgs[1] as { body: string }).body);

      expect(requestBody.personalizations[0].to[0].email).toBe(
        'user@example.com'
      );
      expect(requestBody.personalizations[0].to[0].name).toBe('Jane Doe');
      expect(requestBody.personalizations[0].subject).toContain(
        'Renews in 3 Days'
      );

      const htmlContent = requestBody.content[0].value;
      expect(htmlContent).toContain('₱200.00');
      expect(htmlContent).toContain('Manage Subscription');
      expect(htmlContent).toContain(reminderData.cancelUrl);
      expect(htmlContent).toContain('3 days');
    });

    it('should handle missing userName gracefully', async () => {
      const reminderData = {
        userEmail: 'user@example.com',
        amount: 20000,
        renewalDate: new Date('2025-10-26'),
        subscriptionExpiresAt: new Date('2025-10-23'),
        cancelUrl: 'https://test.nclex311.com/dashboard/subscription',
      };

      await emailService.sendRenewalReminderEmail(reminderData);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse((callArgs[1] as { body: string }).body);

      const htmlContent = requestBody.content[0].value;
      expect(htmlContent).toContain('Hi there,');
    });

    it('should not throw on SendGrid API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Server error'),
      });

      const reminderData = {
        userEmail: 'user@example.com',
        amount: 20000,
        renewalDate: new Date('2025-10-26'),
        subscriptionExpiresAt: new Date('2025-10-23'),
        cancelUrl: 'https://test.nclex311.com/dashboard/subscription',
      };

      await expect(
        emailService.sendRenewalReminderEmail(reminderData)
      ).resolves.not.toThrow();
    });
  });

  describe('Currency and date formatting', () => {
    let emailService: any;

    beforeEach(() => {
      emailService = new EmailService();
    });

    it('should format currency correctly for monthly plan', async () => {
      const confirmationData = {
        userEmail: 'user@example.com',
        planType: 'monthly_premium' as const,
        amount: 20000, // Should format as ₱200.00
        orderId: 'order_123',
        subscriptionStartDate: new Date('2025-10-23'),
        subscriptionExpiresAt: new Date('2025-11-23'),
        autoRenew: true,
      };

      await emailService.sendPremiumConfirmationEmail(confirmationData);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse((callArgs[1] as { body: string }).body);
      const htmlContent = requestBody.content[0].value;

      expect(htmlContent).toContain('₱200.00');
    });

    it('should format currency correctly for annual plan', async () => {
      const confirmationData = {
        userEmail: 'user@example.com',
        planType: 'annual_premium' as const,
        amount: 192000, // Should format as ₱1,920.00
        orderId: 'order_456',
        subscriptionStartDate: new Date('2025-10-23'),
        subscriptionExpiresAt: new Date('2026-10-23'),
        autoRenew: false,
      };

      await emailService.sendPremiumConfirmationEmail(confirmationData);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse((callArgs[1] as { body: string }).body);
      const htmlContent = requestBody.content[0].value;

      expect(htmlContent).toContain('₱1,920.00');
    });

    it('should format dates consistently', async () => {
      const testDate = new Date('2025-10-23T10:30:00Z');

      const confirmationData = {
        userEmail: 'user@example.com',
        planType: 'monthly_premium' as const,
        amount: 20000,
        orderId: 'order_123',
        subscriptionStartDate: testDate,
        subscriptionExpiresAt: testDate,
        autoRenew: true,
      };

      await emailService.sendPremiumConfirmationEmail(confirmationData);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse((callArgs[1] as { body: string }).body);
      const htmlContent = requestBody.content[0].value;

      // Date should be formatted with month name (e.g., "October 23, 2025")
      expect(htmlContent).toMatch(/October \d{1,2}, 2025/);
    });
  });
});
