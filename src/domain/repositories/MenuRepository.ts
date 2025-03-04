import { Category } from '../entities/Category';
import { Product } from '../entities/Product';

export interface MenuRepository {
  getMenu(params: { store?: string, table?: string }): Promise<{
    categories: Category[];
    products: Product[];
  }>;
} 