/**
 * Structured Logging Utility
 * Provides JSON-formatted logging for payment events and monitoring
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see QA Review - Monitoring Requirements
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  [key: string]: unknown;
}

export interface PaymentLogData {
  event: string;
  userId?: string;
  orderId?: string;
  planType?: string;
  amount?: number;
  status?: string;
  webhookId?: string;
  xenditInvoiceId?: string;
  paymentMethod?: string;
  timestamp?: string;
  duration?: number;
  error?: {
    code?: string;
    message?: string;
    stack?: string;
  };
  metadata?: LogContext;
}

/**
 * Structured logger for payment and subscription events
 * Outputs JSON for easy parsing by monitoring tools
 */
class Logger {
  private serviceName: string;

  constructor(serviceName: string = 'nclex311-web') {
    this.serviceName = serviceName;
  }

  /**
   * Log a structured message
   */
  private log(level: LogLevel, message: string, data?: LogContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...data,
    };

    // Output to console (will be captured by Vercel/monitoring tools)
    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log payment initiation event
   */
  paymentInitiated(data: {
    userId: string;
    orderId: string;
    planType: string;
    amount: number;
  }): void {
    this.log('info', 'Payment initiated', {
      event: 'payment.initiated',
      ...data,
      amountPHP: data.amount / 100,
    });
  }

  /**
   * Log payment completion event
   */
  paymentCompleted(data: {
    userId: string;
    orderId: string;
    planType: string;
    amount: number;
    paymentMethod?: string;
    xenditInvoiceId: string;
    duration?: number;
  }): void {
    this.log('info', 'Payment completed', {
      event: 'payment.completed',
      ...data,
      amountPHP: data.amount / 100,
    });
  }

  /**
   * Log payment failure event
   */
  paymentFailed(data: {
    userId?: string;
    orderId: string;
    planType?: string;
    error: {
      code?: string;
      message: string;
    };
  }): void {
    this.log('error', 'Payment failed', {
      event: 'payment.failed',
      ...data,
    });
  }

  /**
   * Log subscription activation event
   */
  subscriptionActivated(data: {
    userId: string;
    planType: string;
    expiresAt: Date;
    autoRenew: boolean;
  }): void {
    this.log('info', 'Subscription activated', {
      event: 'subscription.activated',
      ...data,
      expiresAt: data.expiresAt.toISOString(),
    });
  }

  /**
   * Log subscription cancellation event
   */
  subscriptionCancelled(data: {
    userId: string;
    planType: string;
    expiresAt: Date;
  }): void {
    this.log('info', 'Subscription cancelled', {
      event: 'subscription.cancelled',
      ...data,
      expiresAt: data.expiresAt.toISOString(),
    });
  }

  /**
   * Log webhook received event
   */
  webhookReceived(data: {
    webhookId: string;
    orderId: string;
    status: string;
    eventType: string;
  }): void {
    this.log('info', 'Webhook received', {
      event: 'webhook.received',
      ...data,
    });
  }

  /**
   * Log webhook processed event
   */
  webhookProcessed(data: {
    webhookId: string;
    orderId: string;
    status: string;
    duration?: number;
  }): void {
    this.log('info', 'Webhook processed', {
      event: 'webhook.processed',
      ...data,
    });
  }

  /**
   * Log webhook error event
   */
  webhookError(data: {
    webhookId?: string;
    orderId?: string;
    error: {
      code?: string;
      message: string;
      stack?: string;
    };
  }): void {
    this.log('error', 'Webhook processing error', {
      event: 'webhook.error',
      ...data,
    });
  }

  /**
   * Log invoice creation event
   */
  invoiceCreated(data: {
    orderId: string;
    xenditInvoiceId: string;
    planType: string;
    amount: number;
    expiresAt: string;
  }): void {
    this.log('info', 'Invoice created', {
      event: 'invoice.created',
      ...data,
      amountPHP: data.amount / 100,
    });
  }

  /**
   * Log general info message
   */
  info(message: string, data?: LogContext): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: LogContext): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, data?: LogContext): void {
    const errorData =
      error instanceof Error
        ? {
            error: {
              message: error.message,
              stack: error.stack,
              ...('code' in error &&
                error.code && { code: String(error.code) }),
            },
          }
        : { error: { message: String(error) } };

    this.log('error', message, {
      ...errorData,
      ...data,
    });
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, data?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }
}

// Singleton logger instance
let loggerInstance: Logger | null = null;

export function getLogger(serviceName?: string): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(serviceName);
  }
  return loggerInstance;
}

export { Logger };
