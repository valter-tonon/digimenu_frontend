import { Category } from '../entities/Category';
import { Product } from '../entities/Product';

export interface MenuRepository {
  getMenu(params: { store?: string, table?: string, isDelivery?: boolean }): Promise<{
    categories: Category[];
    products: Product[];
    tenant?: {
      id: number;
      uuid: string;
      name: string;
      url: string;
      logo: string | null;
      opening_hours?: {
        opens_at: string; // formato "HH:MM"
        closes_at: string; // formato "HH:MM"
        is_open: boolean;
      };
      min_order_value?: number; // valor mínimo do pedido
      delivery_fee?: number; // taxa de entrega
      estimated_delivery_time?: string; // tempo estimado de entrega
    };
  }>;
} 