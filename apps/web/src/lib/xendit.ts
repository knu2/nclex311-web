import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  PLAN_PRICING,
  INVOICE_EXPIRATION_HOURS,
  type PlanType,
} from './db/schema/payments';

/**
 * Xendit API Configuration
 * @see https://developers.xendit.co/api-reference
 */
const XENDIT_API_BASE_URL = 'https://api.xendit.co';
const XENDIT_API_VERSION = 'v2';

/**
 * Xendit Invoice creation request
 */
export interface CreateInvoiceRequest {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  invoiceDuration?: number; // seconds until expiry
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Xendit Invoice response
 */
export interface XenditInvoice {
  id: string;
  external_id: string;
  user_id: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
  merchant_name: string;
  amount: number;
  payer_email: string;
  description: string;
  expiry_date: string;
  invoice_url: string;
  available_banks: Array<{ bank_code: string; collection_type: string }>;
  available_retail_outlets: Array<{ retail_outlet_name: string }>;
  available_ewallets: Array<{ ewallet_type: string }>;
  should_exclude_credit_card: boolean;
  should_send_email: boolean;
  created: string;
  updated: string;
  currency: string;
  paid_amount?: number;
  adjusted_received_amount?: number;
  payment_method?: string;
  payment_channel?: string;
  payment_destination?: string;
}

/**
 * Xendit Invoice status check response
 */
export interface InvoiceStatusResponse {
  id: string;
  external_id: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
  amount: number;
  paid_amount?: number;
  payment_method?: string;
  paid_at?: string;
}

/**
 * Xendit API Error Response
 */
export interface XenditErrorResponse {
  error_code: string;
  message: string;
}

/**
 * Custom error class for Xendit API errors
 */
export class XenditError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public response?: XenditErrorResponse
  ) {
    super(message);
    this.name = 'XenditError';
  }
}

/**
 * Xendit API Client
 * Handles communication with Xendit payment gateway
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see docs/architecture/xendit-payment-integration.md
 */
export class XenditClient {
  private client: AxiosInstance;
  private secretKey: string;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.XENDIT_SECRET_KEY || '';

    if (!this.secretKey) {
      throw new Error('XENDIT_SECRET_KEY is required');
    }

    // Create axios instance with HTTP Basic Auth
    this.client = axios.create({
      baseURL: XENDIT_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: this.secretKey,
        password: '', // Xendit uses secret key as username, password is empty
      },
    });
  }

  /**
   * Create a new invoice for premium subscription payment
   *
   * @param orderId - Unique order identifier (external_id)
   * @param planType - Subscription plan type ('monthly_premium' or 'annual_premium')
   * @param userEmail - User's email address for payment notification
   * @returns Xendit invoice with checkout URL
   *
   * @throws {XenditError} When API request fails
   *
   * @example
   * ```typescript
   * const client = new XenditClient();
   * const invoice = await client.createInvoice(
   *   'order_123',
   *   'monthly_premium',
   *   'user@example.com'
   * );
   * // Redirect user to: invoice.invoice_url
   * ```
   */
  async createInvoice(
    orderId: string,
    planType: PlanType,
    userEmail: string
  ): Promise<XenditInvoice> {
    try {
      // Get amount based on plan type
      const amount = PLAN_PRICING[planType];

      // Calculate expiry duration (24 hours in seconds)
      const invoiceDuration = INVOICE_EXPIRATION_HOURS * 60 * 60;

      // Plan descriptions for invoice
      const planDescriptions: Record<PlanType, string> = {
        monthly_premium: 'NCLEX311 Premium - Monthly Subscription (₱200/month)',
        annual_premium: 'NCLEX311 Premium - Annual Subscription (₱1,920/year)',
      };

      // Create success and failure redirect URLs
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const successRedirectUrl = `${baseUrl}/payment/success?orderId=${orderId}`;
      const failureRedirectUrl = `${baseUrl}/payment/failed?orderId=${orderId}`;

      // Xendit Invoice API expects amount in whole currency units (PHP), not centavos
      // Our database stores amounts in centavos (20000 = ₱200.00)
      // Xendit expects: 200.00 for ₱200
      const amountInPHP = amount / 100;

      // Xendit API requires snake_case field names
      const requestBody = {
        external_id: orderId,
        amount: amountInPHP,
        payer_email: userEmail,
        description: planDescriptions[planType],
        invoice_duration: invoiceDuration,
        success_redirect_url: successRedirectUrl,
        failure_redirect_url: failureRedirectUrl,
        currency: 'PHP',
        items: [
          {
            name: planDescriptions[planType],
            quantity: 1,
            price: amountInPHP,
          },
        ],
      };

      const response = await this.client.post<XenditInvoice>(
        `/${XENDIT_API_VERSION}/invoices`,
        requestBody
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create invoice');
    }
  }

  /**
   * Check the status of an existing invoice
   *
   * @param invoiceId - Xendit invoice ID
   * @returns Invoice status information
   *
   * @throws {XenditError} When API request fails
   *
   * @example
   * ```typescript
   * const client = new XenditClient();
   * const status = await client.checkInvoiceStatus('invoice_xyz');
   * if (status.status === 'PAID') {
   *   // Payment successful
   * }
   * ```
   */
  async checkInvoiceStatus(invoiceId: string): Promise<InvoiceStatusResponse> {
    try {
      const response = await this.client.get<XenditInvoice>(
        `/${XENDIT_API_VERSION}/invoices/${invoiceId}`
      );

      // Return simplified status response
      return {
        id: response.data.id,
        external_id: response.data.external_id,
        status: response.data.status,
        amount: response.data.amount,
        paid_amount: response.data.paid_amount,
        payment_method: response.data.payment_method,
        paid_at: response.data.updated,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to check invoice status');
    }
  }

  /**
   * Handle Axios errors and convert to XenditError
   *
   * @private
   */
  private handleError(error: unknown, defaultMessage: string): XenditError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<XenditErrorResponse>;

      if (axiosError.response) {
        // API returned error response
        const errorData = axiosError.response.data;
        return new XenditError(
          errorData.message || defaultMessage,
          errorData.error_code || 'UNKNOWN_ERROR',
          axiosError.response.status,
          errorData
        );
      } else if (axiosError.request) {
        // Request made but no response received
        return new XenditError(
          'No response received from Xendit API',
          'NETWORK_ERROR',
          undefined,
          undefined
        );
      }
    }

    // Unknown error
    return new XenditError(
      defaultMessage,
      'UNKNOWN_ERROR',
      undefined,
      undefined
    );
  }
}

/**
 * Singleton instance of XenditClient
 * Use this for most operations to avoid creating multiple instances
 */
let xenditClientInstance: XenditClient | null = null;

/**
 * Get singleton instance of XenditClient
 *
 * @returns XenditClient instance
 *
 * @example
 * ```typescript
 * import { getXenditClient } from '@/lib/xendit';
 *
 * const client = getXenditClient();
 * const invoice = await client.createInvoice(...);
 * ```
 */
export function getXenditClient(): XenditClient {
  if (!xenditClientInstance) {
    xenditClientInstance = new XenditClient();
  }
  return xenditClientInstance;
}

/**
 * Helper function to create invoice (convenience wrapper)
 *
 * @param orderId - Unique order identifier
 * @param planType - Subscription plan type
 * @param userEmail - User's email address
 * @returns Xendit invoice with checkout URL
 */
export async function createInvoice(
  orderId: string,
  planType: PlanType,
  userEmail: string
): Promise<XenditInvoice> {
  const client = getXenditClient();
  return client.createInvoice(orderId, planType, userEmail);
}

/**
 * Helper function to check invoice status (convenience wrapper)
 *
 * @param invoiceId - Xendit invoice ID
 * @returns Invoice status information
 */
export async function checkInvoiceStatus(
  invoiceId: string
): Promise<InvoiceStatusResponse> {
  const client = getXenditClient();
  return client.checkInvoiceStatus(invoiceId);
}
