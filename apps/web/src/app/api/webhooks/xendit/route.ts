import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  validateWebhookPayload,
  extractWebhookId,
  extractExternalId,
  getEventTypeFromStatus,
} from '@/lib/webhookVerification';
import {
  getOrderService,
  getWebhookLogService,
  UserService,
} from '@/lib/db/services';
import { PLAN_DURATION, type Order } from '@/lib/db/schema/payments';
import { getEmailService } from '@/lib/email';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

interface XenditWebhookPayload {
  id: string;
  external_id: string;
  status: string;
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  failure_code?: string;
  [key: string]: unknown;
}

/**
 * POST /api/webhooks/xendit
 * Handles Xendit payment webhook notifications
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see docs/architecture/xendit-payment-integration.md#webhook-handler
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Extract headers
    const callbackToken = request.headers.get('x-callback-token');
    const signature = request.headers.get('x-signature');

    // 2. Get raw body for signature verification
    const rawBody = await request.text();
    let payload: XenditWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('[Webhook] Invalid JSON payload');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 3. Verify webhook signature
    const isValid = verifyWebhookSignature(callbackToken, rawBody, signature);

    if (!isValid) {
      console.error('[Webhook] Signature verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Validate payload structure
    if (!validateWebhookPayload(payload)) {
      console.error('[Webhook] Invalid payload structure');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 5. Extract webhook ID and order ID
    const webhookId = extractWebhookId(payload);
    const orderId = extractExternalId(payload);

    if (!webhookId || !orderId) {
      console.error('[Webhook] Missing webhook ID or order ID');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Log webhook received with structured data
    const eventType = getEventTypeFromStatus(payload.status);
    logger.webhookReceived({
      webhookId,
      orderId,
      status: payload.status,
      eventType,
    });

    // 6. Check idempotency
    const webhookLogService = getWebhookLogService();
    const alreadyProcessed = await webhookLogService.isProcessed(webhookId);

    if (alreadyProcessed) {
      logger.info('Webhook already processed (idempotency check)', {
        webhookId,
        orderId,
      });
      return NextResponse.json(
        { message: 'Webhook already processed' },
        { status: 200 }
      );
    }

    // 7. Log webhook for idempotency
    await webhookLogService.create({
      webhookId,
      eventType,
      payload,
      processed: false,
    });

    // 8. Get order from database
    const orderService = getOrderService();
    const order = await orderService.findByOrderId(orderId);

    if (!order) {
      console.error(`[Webhook] Order not found: ${orderId}`);
      // Mark as processed to avoid retries
      await webhookLogService.markAsProcessed(webhookId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 9. Process webhook based on status
    const status = payload.status;
    const startTime = Date.now();

    try {
      if (status === 'PAID') {
        await handlePaidInvoice(order, payload);
      } else if (status === 'EXPIRED') {
        await handleExpiredInvoice(order);
      } else if (status === 'FAILED') {
        await handleFailedInvoice(order, payload);
      }

      // 10. Mark webhook as processed
      await webhookLogService.markAsProcessed(webhookId);

      // Log successful processing with duration
      const duration = Date.now() - startTime;
      logger.webhookProcessed({
        webhookId,
        orderId,
        status,
        duration,
      });

      return NextResponse.json(
        { message: 'Webhook processed' },
        { status: 200 }
      );
    } catch (error: unknown) {
      // Log webhook processing error
      const errorObj = error as {
        code?: string;
        message?: string;
        stack?: string;
      };
      logger.webhookError({
        webhookId,
        orderId,
        error: {
          code: errorObj.code,
          message: errorObj.message || 'Processing failed',
          stack: errorObj.stack,
        },
      });

      // Return 500 to trigger Xendit retry
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  } catch (error: unknown) {
    // Log unexpected webhook error
    logger.error('Webhook unexpected error', error);

    // Return 500 to trigger Xendit retry
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle paid invoice - activate premium subscription
 */
async function handlePaidInvoice(
  order: Order,
  payload: XenditWebhookPayload
): Promise<void> {
  const orderService = getOrderService();
  const userService = new UserService();

  // 1. Update order status
  await orderService.update(order.orderId, {
    status: 'paid',
    paidAmount: payload.paid_amount || order.amount,
    paidAt: payload.paid_at ? new Date(payload.paid_at) : new Date(),
    paymentMethod: payload.payment_method,
  });

  // 2. Calculate subscription expiration
  const now = new Date();
  const duration = PLAN_DURATION[order.planType as keyof typeof PLAN_DURATION];
  const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

  // 3. Activate premium subscription
  const autoRenew = order.planType === 'monthly_premium';

  await userService.activatePremiumSubscription(
    order.userId,
    order.planType,
    expiresAt,
    autoRenew
  );

  // Log subscription activation with structured data
  logger.subscriptionActivated({
    userId: order.userId,
    planType: order.planType,
    expiresAt,
    autoRenew,
  });

  // Log payment completion
  logger.paymentCompleted({
    userId: order.userId,
    orderId: order.orderId,
    planType: order.planType,
    amount: order.amount,
    paymentMethod: payload.payment_method,
    xenditInvoiceId: order.xenditInvoiceId || '',
  });

  // 4. Send confirmation email
  try {
    const user = await userService.findUserById(order.userId);
    if (user?.email) {
      const emailService = getEmailService();
      await emailService.sendPremiumConfirmationEmail({
        userEmail: user.email,
        userName: undefined, // Optional: Add name field to user schema later
        planType: order.planType,
        amount: order.amount,
        paymentMethod: payload.payment_method,
        orderId: order.orderId,
        subscriptionStartDate: now,
        subscriptionExpiresAt: expiresAt,
        autoRenew,
      });
      logger.info('Confirmation email sent', {
        email: user.email,
        orderId: order.orderId,
      });
    }
  } catch (emailError) {
    // Log error but don't fail the webhook - email is non-critical
    logger.warn('Failed to send confirmation email', { error: emailError });
  }
}

/**
 * Handle expired invoice - mark order as expired
 */
async function handleExpiredInvoice(order: Order): Promise<void> {
  const orderService = getOrderService();

  await orderService.update(order.orderId, {
    status: 'expired',
  });

  logger.info('Order expired', {
    orderId: order.orderId,
    planType: order.planType,
  });
}

/**
 * Handle failed invoice - mark order as failed
 */
async function handleFailedInvoice(
  order: Order,
  payload: XenditWebhookPayload
): Promise<void> {
  const orderService = getOrderService();

  await orderService.update(order.orderId, {
    status: 'failed',
    failureCode: payload.failure_code || 'PAYMENT_FAILED',
  });

  logger.paymentFailed({
    userId: order.userId,
    orderId: order.orderId,
    planType: order.planType,
    error: {
      code: payload.failure_code || 'PAYMENT_FAILED',
      message: 'Payment failed via webhook',
    },
  });
}

// Method not allowed for GET
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
