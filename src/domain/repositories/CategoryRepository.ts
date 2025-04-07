import { Category } from '../entities/Category';

export interface CategoryRepository {
  getCategories(): Promise<Category[]>;
  getCategoryByUuid(uuid: string): Promise<Category>;
} 