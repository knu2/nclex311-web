import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { getOrderService } from '@/lib/db/services';
import { getXenditClient } from '@/lib/xendit';
import { PLAN_PRICING, type PlanType } from '@/lib/db/schema/payments';
import { getLogger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const logger = getLogger();

/**
 * POST /api/payments/create-invoice
 * Creates a Xendit invoice for premium subscription payment
 *
 * @see Story 2.1 - Premium Subscription Workflow
 */

interface CreateInvoiceRequest {
  planType: PlanType;
}

interface CreateInvoiceResponse {
  success: boolean;
  orderId: string;
  checkoutUrl: string;
  expiresAt: string;
  planType: PlanType;
  amount: number;
}

interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to create a payment',
        } satisfies ErrorResponse,
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email || '';

    // 2. Parse request body
    let body: CreateInvoiceRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid Request',
          message: 'Request body must be valid JSON',
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const { planType } = body;

    // 3. Validate plan type
    if (
      !planType ||
      !['monthly_premium', 'annual_premium'].includes(planType)
    ) {
      return NextResponse.json(
        {
          error: 'Invalid Plan',
          message: 'planType must be "monthly_premium" or "annual_premium"',
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // 4. Check for existing active subscription
    const orderService = getOrderService();
    const hasActiveSubscription =
      await orderService.hasActiveSubscription(userId);

    if (hasActiveSubscription) {
      return NextResponse.json(
        {
          error: 'Subscription Exists',
          message: 'You already have an active premium subscription',
        } satisfies ErrorResponse,
        { status: 409 }
      );
    }

    // 5. Generate unique order ID
    const orderId = `order_${Date.now()}_${randomUUID().split('-')[0]}`;

    // 6. Get amount based on plan type
    const amount = PLAN_PRICING[planType];

    // 7. Create order record in database (status: pending)
    const order = await orderService.createOrder({
      orderId,
      userId,
      amount,
      currency: 'PHP',
      status: 'pending',
      planType,
      isRecurring: planType === 'monthly_premium',
    });

    // Log payment initiation with structured data
    logger.paymentInitiated({
      userId,
      orderId,
      planType,
      amount,
    });

    // 8. Create Xendit invoice
    let xenditInvoice;
    try {
      const xenditClient = getXenditClient();
      xenditInvoice = await xenditClient.createInvoice(
        orderId,
        planType,
        userEmail
      );
    } catch (error: unknown) {
      // Log payment failure with structured data
      const errorObj = error as { code?: string; message?: string };
      logger.paymentFailed({
        userId,
        orderId,
        planType,
        error: {
          code: errorObj.code || 'XENDIT_ERROR',
          message: errorObj.message || 'Failed to create invoice',
        },
      });

      // Update order status to failed
      await orderService.update(orderId, {
        status: 'failed',
        failureCode: errorObj.code || 'XENDIT_ERROR',
      });

      return NextResponse.json(
        {
          error: 'Payment Gateway Error',
          message: 'Failed to create payment invoice. Please try again.',
          details: errorObj.message,
        } satisfies ErrorResponse,
        { status: 500 }
      );
    }

    // 9. Update order with Xendit details
    await orderService.update(orderId, {
      xenditInvoiceId: xenditInvoice.id,
      xenditInvoiceUrl: xenditInvoice.invoice_url,
      expiresAt: new Date(xenditInvoice.expiry_date),
    });

    // Log invoice creation with structured data
    logger.invoiceCreated({
      orderId,
      xenditInvoiceId: xenditInvoice.id,
      planType,
      amount,
      expiresAt: xenditInvoice.expiry_date,
    });

    // 10. Return checkout URL to frontend
    const response: CreateInvoiceResponse = {
      success: true,
      orderId: order.orderId,
      checkoutUrl: xenditInvoice.invoice_url,
      expiresAt: xenditInvoice.expiry_date,
      planType,
      amount,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    // Log unexpected errors
    logger.error('Create invoice error', error);

    const errorObj = error as { message?: string };
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        details: errorObj.message,
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Use POST to create an invoice',
    } satisfies ErrorResponse,
    { status: 405 }
  );
}
