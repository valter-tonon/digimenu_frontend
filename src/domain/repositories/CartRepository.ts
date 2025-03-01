import { CartItem } from '../entities/CartItem';

export interface CartRepository {
  addItem(item: CartItem): void;
  removeItem(item: CartItem): void;
  updateItem(item: CartItem): void;
  findSimilarItem(item: CartItem): CartItem | undefined;
  getItems(): CartItem[];
  clear(): void;
} 