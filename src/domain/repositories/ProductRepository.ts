import { Product } from '../entities/Product';

export interface ProductRepository {
  getProducts(categories?: string[]): Promise<Product[]>;
  getProductByUuid(uuid: string): Promise<Product>;
} 