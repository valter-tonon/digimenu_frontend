import { apiClient } from '@/infrastructure/api/apiClient';

export interface OrderItemAddon {
  name: string;
  price?: number;
  quantity?: number;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  image?: string;
  comments?: string;
  addons?: OrderItemAddon[];
  additionals?: OrderItemAddon[];
}

export interface Order {
  id: number;
  identify: string;
  total: number;
  status: string;
  date: string;
  type: string;
  storeId?: string;
  customer_name?: string;
  payment_method?: string;
  items?: OrderItem[];
  created_at?: string;
  customer?: {
    phone: string;
    name: string;
    email?: string;
  };
}

/**
 * Mapeia items do pedido a partir de 'products' (sempre presente) ou 'items' (quando carregado)
 * products usa: { name, qty, price, image, comments }
 * items usa: { product_name, quantity, price, notes }
 */
function mapOrderItems(order: any): OrderItem[] {
  // Priorizar 'products' que sempre vem na API
  const source = order.products?.length ? order.products : order.items;

  if (!source || !Array.isArray(source)) return [];

  return source.map((item: any) => ({
    product_name: item.product_name || item.name || 'Produto',
    quantity: item.quantity || item.qty || 1,
    price: parseFloat(item.price || 0),
    image: item.image || undefined,
    comments: item.comments || item.notes || undefined,
    addons: item.addons || [],
    additionals: item.additionals || [],
  }));
}

/**
 * Serviço para rastreamento de pedidos do cliente
 */
export const orderTrackingService = {
  /**
   * Buscar pedidos do cliente por telefone
   */
  async getOrdersByPhone(phone: string): Promise<Order[]> {
    try {
      console.log('🔎 Buscando pedidos para telefone:', phone);
      const response = await apiClient.get('/orders/by-phone', {
        params: { phone }
      });

      console.log('📊 Resposta da API:', response);
      console.log('📊 response.data:', response.data);

      // Handle both cases: API returns {success, data: [...]} or direct array
      const ordersData = Array.isArray(response.data) ? response.data : response.data?.data;

      if (ordersData && Array.isArray(ordersData)) {
        return ordersData.map((order: any) => {
          // Handle date - API returns 'date' field or 'created_at'
          let formattedDate = new Date().toLocaleDateString('pt-BR');
          if (order.date) {
            formattedDate = new Date(order.date).toLocaleDateString('pt-BR');
          } else if (order.created_at) {
            formattedDate = new Date(order.created_at).toLocaleDateString('pt-BR');
          }

          return {
            id: order.id,
            identify: order.identify,
            total: parseFloat(order.total || 0),
            status: order.status_code || order.status || 'pendente',
            date: formattedDate,
            type: order.type || 'delivery',
            storeId: order.store_id || order.tenant_id,
            customer_name: order.customer?.name || order.client?.name || 'Cliente',
            payment_method: order.payment_method,
            items: mapOrderItems(order),
            created_at: order.created_at || order.date
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  },

  /**
   * Buscar pedidos do cliente autenticado (usa token/sessão)
   */
  async getMyOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get('/orders/my-orders');

      if (response.data?.data) {
        return response.data.data.map((order: any) => {
          // Handle date - API returns 'date' field or 'created_at'
          let formattedDate = new Date().toLocaleDateString('pt-BR');
          if (order.date) {
            formattedDate = new Date(order.date).toLocaleDateString('pt-BR');
          } else if (order.created_at) {
            formattedDate = new Date(order.created_at).toLocaleDateString('pt-BR');
          }

          return {
            id: order.id,
            identify: order.identify,
            total: parseFloat(order.total || 0),
            status: order.status_code || order.status || 'pendente',
            date: formattedDate,
            type: order.type || 'delivery',
            storeId: order.store_id || order.tenant_id,
            customer_name: order.customer?.name || order.client?.name || 'Cliente',
            payment_method: order.payment_method,
            items: mapOrderItems(order),
            created_at: order.created_at || order.date
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar meus pedidos:', error);
      throw error;
    }
  },

  /**
   * Buscar detalhes de um pedido específico
   */
  async getOrderDetails(orderId: string): Promise<Order | null> {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);

      if (response.data?.data) {
        const order = response.data.data;
        return {
          id: order.id,
          identify: order.identify,
          total: parseFloat(order.total || 0),
          status: order.status || 'pendente',
          date: order.created_at
            ? new Date(order.created_at).toLocaleDateString('pt-BR')
            : new Date().toLocaleDateString('pt-BR'),
          type: order.type || 'delivery',
          customer_name: order.customer?.name || order.client || 'Cliente',
          payment_method: order.payment_method,
          items: mapOrderItems(order),
          created_at: order.created_at
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      throw error;
    }
  }
};
