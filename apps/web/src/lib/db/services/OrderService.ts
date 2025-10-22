import { eq, and, desc } from 'drizzle-orm';
import { BaseService, ServiceError } from './BaseService';
import {
  orders,
  type Order,
  type NewOrder,
  type OrderUpdate,
  type OrderStatus,
  type PlanType,
} from '../schema/payments';

/**
 * OrderService - Handles all database operations for payment orders
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see Migration 008_add_payment_tables.sql
 */
export class OrderService extends BaseService {
  /**
   * Create a new order
   *
   * @param orderData - Order data to insert
   * @returns Created order
   *
   * @example
   * ```typescript
   * const orderService = new OrderService();
   * const order = await orderService.create({
   *   orderId: 'order_123',
   *   userId: 'user_abc',
   *   amount: 20000,
   *   status: 'pending',
   *   planType: 'monthly_premium',
   *   isRecurring: true,
   * });
   * ```
   */
  async create(orderData: NewOrder): Promise<Order> {
    return this.executeOperation(async () => {
      const [order] = await this.db
        .insert(orders)
        .values(orderData)
        .returning();

      if (!order) {
        throw new ServiceError(
          'Failed to create order',
          'ORDER_CREATION_FAILED',
          500
        );
      }

      return order;
    }, 'OrderService.create');
  }

  /**
   * Find an order by its ID (UUID primary key)
   *
   * @param id - Order UUID
   * @returns Order or null if not found
   */
  async findById(id: string): Promise<Order | null> {
    return this.executeOperation(async () => {
      const [order] = await this.db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      return order || null;
    }, 'OrderService.findById');
  }

  /**
   * Find an order by its order ID (external identifier)
   *
   * @param orderId - Order ID string
   * @returns Order or null if not found
   *
   * @example
   * ```typescript
   * const order = await orderService.findByOrderId('order_123');
   * ```
   */
  async findByOrderId(orderId: string): Promise<Order | null> {
    return this.executeOperation(async () => {
      const [order] = await this.db
        .select()
        .from(orders)
        .where(eq(orders.orderId, orderId))
        .limit(1);

      return order || null;
    }, 'OrderService.findByOrderId');
  }

  /**
   * Find an order by Xendit invoice ID
   *
   * @param xenditInvoiceId - Xendit invoice ID
   * @returns Order or null if not found
   */
  async findByXenditInvoiceId(xenditInvoiceId: string): Promise<Order | null> {
    return this.executeOperation(async () => {
      const [order] = await this.db
        .select()
        .from(orders)
        .where(eq(orders.xenditInvoiceId, xenditInvoiceId))
        .limit(1);

      return order || null;
    }, 'OrderService.findByXenditInvoiceId');
  }

  /**
   * Find all orders for a specific user
   *
   * @param userId - User UUID
   * @param status - Optional status filter
   * @returns Array of orders
   *
   * @example
   * ```typescript
   * // Get all orders
   * const allOrders = await orderService.findByUser(userId);
   *
   * // Get only paid orders
   * const paidOrders = await orderService.findByUser(userId, 'paid');
   * ```
   */
  async findByUser(userId: string, status?: OrderStatus): Promise<Order[]> {
    return this.executeOperation(async () => {
      const whereConditions = status
        ? and(eq(orders.userId, userId), eq(orders.status, status))
        : eq(orders.userId, userId);

      const userOrders = await this.db
        .select()
        .from(orders)
        .where(whereConditions)
        .orderBy(desc(orders.createdAt));

      return userOrders;
    }, 'OrderService.findByUser');
  }

  /**
   * Update an order
   *
   * @param orderId - Order ID to update
   * @param updates - Fields to update
   * @returns Updated order
   *
   * @example
   * ```typescript
   * const updated = await orderService.update('order_123', {
   *   status: 'paid',
   *   paidAmount: 20000,
   *   paidAt: new Date(),
   *   paymentMethod: 'GCASH',
   * });
   * ```
   */
  async update(orderId: string, updates: OrderUpdate): Promise<Order> {
    return this.executeOperation(async () => {
      const [updatedOrder] = await this.db
        .update(orders)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(orders.orderId, orderId))
        .returning();

      if (!updatedOrder) {
        throw new ServiceError('Order not found', 'ORDER_NOT_FOUND', 404, {
          orderId,
        });
      }

      return updatedOrder;
    }, 'OrderService.update');
  }

  /**
   * Update an order by UUID
   *
   * @param id - Order UUID
   * @param updates - Fields to update
   * @returns Updated order
   */
  async updateById(id: string, updates: OrderUpdate): Promise<Order> {
    return this.executeOperation(async () => {
      const [updatedOrder] = await this.db
        .update(orders)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      if (!updatedOrder) {
        throw new ServiceError('Order not found', 'ORDER_NOT_FOUND', 404, {
          id,
        });
      }

      return updatedOrder;
    }, 'OrderService.updateById');
  }

  /**
   * Check if a user has an active premium subscription
   *
   * @param userId - User UUID
   * @returns true if user has active paid order
   *
   * @example
   * ```typescript
   * const hasActive = await orderService.hasActiveSubscription(userId);
   * if (hasActive) {
   *   throw new Error('User already has active subscription');
   * }
   * ```
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const activeOrders = await this.db
        .select()
        .from(orders)
        .where(and(eq(orders.userId, userId), eq(orders.status, 'paid')))
        .limit(1);

      return activeOrders.length > 0;
    }, 'OrderService.hasActiveSubscription');
  }

  /**
   * Find the most recent paid order for a user
   *
   * @param userId - User UUID
   * @returns Most recent paid order or null
   *
   * @example
   * ```typescript
   * const lastPaid = await orderService.findLatestPaidOrder(userId);
   * if (lastPaid) {
   *   console.log(`Last payment: ${lastPaid.planType}`);
   * }
   * ```
   */
  async findLatestPaidOrder(userId: string): Promise<Order | null> {
    return this.executeOperation(async () => {
      const [order] = await this.db
        .select()
        .from(orders)
        .where(and(eq(orders.userId, userId), eq(orders.status, 'paid')))
        .orderBy(desc(orders.paidAt))
        .limit(1);

      return order || null;
    }, 'OrderService.findLatestPaidOrder');
  }

  /**
   * Get orders by status
   *
   * @param status - Order status to filter
   * @param limit - Maximum number of results
   * @returns Array of orders with specified status
   */
  async findByStatus(
    status: OrderStatus,
    limit: number = 100
  ): Promise<Order[]> {
    return this.executeOperation(async () => {
      const statusOrders = await this.db
        .select()
        .from(orders)
        .where(eq(orders.status, status))
        .orderBy(desc(orders.createdAt))
        .limit(limit);

      return statusOrders;
    }, 'OrderService.findByStatus');
  }

  /**
   * Get orders by plan type
   *
   * @param planType - Plan type to filter
   * @param limit - Maximum number of results
   * @returns Array of orders with specified plan
   */
  async findByPlanType(
    planType: PlanType,
    limit: number = 100
  ): Promise<Order[]> {
    return this.executeOperation(async () => {
      const planOrders = await this.db
        .select()
        .from(orders)
        .where(eq(orders.planType, planType))
        .orderBy(desc(orders.createdAt))
        .limit(limit);

      return planOrders;
    }, 'OrderService.findByPlanType');
  }

  /**
   * Delete an order (use with caution)
   *
   * @param orderId - Order ID to delete
   * @returns true if deleted
   */
  async delete(orderId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(orders)
        .where(eq(orders.orderId, orderId))
        .returning();

      return result.length > 0;
    }, 'OrderService.delete');
  }
}

/**
 * Singleton instance of OrderService
 */
let orderServiceInstance: OrderService | null = null;

/**
 * Get singleton instance of OrderService
 *
 * @returns OrderService instance
 */
export function getOrderService(): OrderService {
  if (!orderServiceInstance) {
    orderServiceInstance = new OrderService();
  }
  return orderServiceInstance;
}
