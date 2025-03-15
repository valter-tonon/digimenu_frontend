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
    };
  }>;
} 