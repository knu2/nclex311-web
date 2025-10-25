import { eq } from 'drizzle-orm';
import { BaseService, ServiceError } from './BaseService';
import {
  webhookLogs,
  type WebhookLog,
  type NewWebhookLog,
  type WebhookLogUpdate,
} from '../schema/payments';

/**
 * WebhookLogService - Handles webhook log operations for idempotency
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see Migration 008_add_payment_tables.sql
 */
export class WebhookLogService extends BaseService {
  /**
   * Create a new webhook log entry
   *
   * @param logData - Webhook log data
   * @returns Created webhook log
   *
   * @example
   * ```typescript
   * const service = new WebhookLogService();
   * const log = await service.createLog({
   *   webhookId: 'webhook_123',
   *   eventType: 'invoice.paid',
   *   payload: { ...webhookData },
   *   processed: false,
   * });
   * ```
   */
  async createLog(logData: NewWebhookLog): Promise<WebhookLog> {
    return this.executeOperation(async () => {
      const [log] = await this.db
        .insert(webhookLogs)
        .values(logData)
        .returning();

      if (!log) {
        throw new ServiceError(
          'Failed to create webhook log',
          'WEBHOOK_LOG_CREATION_FAILED',
          500
        );
      }

      return log;
    }, 'WebhookLogService.create');
  }

  /**
   * Find a webhook log by its unique webhook ID
   *
   * @param webhookId - Unique webhook identifier from Xendit
   * @returns Webhook log or null if not found
   *
   * @example
   * ```typescript
   * const log = await service.findByWebhookId('webhook_123');
   * if (log && log.processed) {
   *   // This webhook was already processed
   * }
   * ```
   */
  async findByWebhookId(webhookId: string): Promise<WebhookLog | null> {
    return this.executeOperation(async () => {
      const [log] = await this.db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.webhookId, webhookId))
        .limit(1);

      return log || null;
    }, 'WebhookLogService.findByWebhookId');
  }

  /**
   * Find a webhook log by its UUID
   *
   * @param id - Webhook log UUID
   * @returns Webhook log or null if not found
   */
  async findLogById(id: string): Promise<WebhookLog | null> {
    return this.executeOperation(async () => {
      const [log] = await this.db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.id, id))
        .limit(1);

      return log || null;
    }, 'WebhookLogService.findById');
  }

  /**
   * Check if a webhook has already been processed (idempotency check)
   *
   * @param webhookId - Unique webhook identifier
   * @returns true if webhook was already processed
   *
   * @example
   * ```typescript
   * const alreadyProcessed = await service.isProcessed('webhook_123');
   * if (alreadyProcessed) {
   *   return Response.json({ message: 'Already processed' }, { status: 200 });
   * }
   * ```
   */
  async isProcessed(webhookId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const log = await this.findByWebhookId(webhookId);
      return log?.processed === true;
    }, 'WebhookLogService.isProcessed');
  }

  /**
   * Mark a webhook as processed
   *
   * @param webhookId - Unique webhook identifier
   * @returns Updated webhook log
   *
   * @example
   * ```typescript
   * await service.markAsProcessed('webhook_123');
   * ```
   */
  async markAsProcessed(webhookId: string): Promise<WebhookLog> {
    return this.executeOperation(async () => {
      const [updatedLog] = await this.db
        .update(webhookLogs)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(webhookLogs.webhookId, webhookId))
        .returning();

      if (!updatedLog) {
        throw new ServiceError(
          'Webhook log not found',
          'WEBHOOK_LOG_NOT_FOUND',
          404,
          { webhookId }
        );
      }

      return updatedLog;
    }, 'WebhookLogService.markAsProcessed');
  }

  /**
   * Update a webhook log
   *
   * @param webhookId - Unique webhook identifier
   * @param updates - Fields to update
   * @returns Updated webhook log
   */
  async update(
    webhookId: string,
    updates: WebhookLogUpdate
  ): Promise<WebhookLog> {
    return this.executeOperation(async () => {
      const [updatedLog] = await this.db
        .update(webhookLogs)
        .set(updates)
        .where(eq(webhookLogs.webhookId, webhookId))
        .returning();

      if (!updatedLog) {
        throw new ServiceError(
          'Webhook log not found',
          'WEBHOOK_LOG_NOT_FOUND',
          404,
          { webhookId }
        );
      }

      return updatedLog;
    }, 'WebhookLogService.update');
  }

  /**
   * Get all unprocessed webhook logs
   *
   * @param limit - Maximum number of results
   * @returns Array of unprocessed webhook logs
   */
  async findUnprocessed(limit: number = 100): Promise<WebhookLog[]> {
    return this.executeOperation(async () => {
      const logs = await this.db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.processed, false))
        .limit(limit);

      return logs;
    }, 'WebhookLogService.findUnprocessed');
  }

  /**
   * Delete a webhook log (use with caution - for cleanup only)
   *
   * @param webhookId - Webhook ID to delete
   * @returns true if deleted
   */
  async delete(webhookId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(webhookLogs)
        .where(eq(webhookLogs.webhookId, webhookId))
        .returning();

      return result.length > 0;
    }, 'WebhookLogService.delete');
  }
}

/**
 * Singleton instance of WebhookLogService
 */
let webhookLogServiceInstance: WebhookLogService | null = null;

/**
 * Get singleton instance of WebhookLogService
 *
 * @returns WebhookLogService instance
 */
export function getWebhookLogService(): WebhookLogService {
  if (!webhookLogServiceInstance) {
    webhookLogServiceInstance = new WebhookLogService();
  }
  return webhookLogServiceInstance;
}
