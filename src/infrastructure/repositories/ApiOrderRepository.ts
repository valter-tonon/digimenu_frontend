import { Order } from '@/domain/entities/Order';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { apiClient } from '../api/apiClient';

export class ApiOrderRepository implements OrderRepository {
  async getOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get<{ data: Order[] }>('/orders');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  }

  async getOrderByIdentify(identify: string): Promise<Order> {
    try {
      const response = await apiClient.get<{ data: Order }>(`/orders/${identify}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar pedido ${identify}:`, error);
      throw error;
    }
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    try {
      const response = await apiClient.post<{ data: Order }>('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  async evaluateOrder(orderId: number, evaluationData: { stars: number, comment?: string }): Promise<any> {
    try {
      const response = await apiClient.post<any>(`/orders/${orderId}/evaluations`, evaluationData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao avaliar pedido ${orderId}:`, error);
      throw error;
    }
  }
} 