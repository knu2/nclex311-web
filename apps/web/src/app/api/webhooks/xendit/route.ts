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

    console.log(
      `[Webhook] Received: ${webhookId} for order ${orderId} - status: ${payload.status}`
    );

    // 6. Check idempotency
    const webhookLogService = getWebhookLogService();
    const alreadyProcessed = await webhookLogService.isProcessed(webhookId);

    if (alreadyProcessed) {
      console.log(`[Webhook] Already processed: ${webhookId}`);
      return NextResponse.json(
        { message: 'Webhook already processed' },
        { status: 200 }
      );
    }

    // 7. Log webhook for idempotency
    const eventType = getEventTypeFromStatus(payload.status);
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

      console.log(`[Webhook] Processed successfully: ${webhookId}`);

      return NextResponse.json(
        { message: 'Webhook processed' },
        { status: 200 }
      );
    } catch (error: unknown) {
      console.error('[Webhook] Processing error:', error);

      // Return 500 to trigger Xendit retry
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('[Webhook] Unexpected error:', error);

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

  console.log(`[Webhook] Order paid: ${order.orderId} - ${order.planType}`);

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

  console.log(
    `[Webhook] Premium activated for user ${order.userId} until ${expiresAt.toISOString()}`
  );

  // TODO: Send confirmation email (Task 8)
  // await sendPremiumConfirmationEmail(order.userId, order.planType, expiresAt);
}

/**
 * Handle expired invoice - mark order as expired
 */
async function handleExpiredInvoice(order: Order): Promise<void> {
  const orderService = getOrderService();

  await orderService.update(order.orderId, {
    status: 'expired',
  });

  console.log(`[Webhook] Order expired: ${order.orderId}`);
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

  console.log(
    `[Webhook] Order failed: ${order.orderId} - ${payload.failure_code || 'unknown'}`
  );
}

// Method not allowed for GET
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
