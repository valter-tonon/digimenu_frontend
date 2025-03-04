import { Order } from '../entities/Order';

export interface OrderRepository {
  getOrders(): Promise<Order[]>;
  getOrderByIdentify(identify: string): Promise<Order>;
  createOrder(orderData: Partial<Order>): Promise<Order>;
  evaluateOrder(orderId: number, evaluationData: { stars: number, comment?: string }): Promise<any>;
} 