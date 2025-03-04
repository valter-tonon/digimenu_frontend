import { Product } from '@/domain/entities/Product';
import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { apiClient } from '../api/apiClient';

export class ApiProductRepository implements ProductRepository {
  async getProducts(categories: string[] = []): Promise<Product[]> {
    try {
      const params: any = {};
      if (categories.length > 0) {
        params.categories = categories;
      }
      
      const response = await apiClient.get<{ data: Product[] }>('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  async getProductByUuid(uuid: string): Promise<Product> {
    try {
      const response = await apiClient.get<{ data: Product }>(`/products/${uuid}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar produto ${uuid}:`, error);
      throw error;
    }
  }
} 