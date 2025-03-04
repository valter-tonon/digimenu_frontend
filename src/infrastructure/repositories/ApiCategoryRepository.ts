import { Category } from '@/domain/entities/Category';
import { CategoryRepository } from '@/domain/repositories/CategoryRepository';
import { apiClient } from '../api/apiClient';

export class ApiCategoryRepository implements CategoryRepository {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<{ data: Category[] }>('/categories');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  async getCategoryByUuid(uuid: string): Promise<Category> {
    try {
      const response = await apiClient.get<{ data: Category }>(`/categories/${uuid}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar categoria ${uuid}:`, error);
      throw error;
    }
  }
} 