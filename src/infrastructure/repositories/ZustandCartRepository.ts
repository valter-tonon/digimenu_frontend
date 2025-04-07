import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartRepository } from '@/domain/repositories/CartRepository';
import { CartItem } from '@/domain/entities/CartItem';

interface CartState {
  items: CartItem[];
}

export class ZustandCartRepository implements CartRepository {
  private store = create<CartState>()(
    persist(
      () => ({
        items: [],
      }),
      {
        name: 'cart-storage',
        skipHydration: true,
      }
    )
  );

  private getItemKey(item: CartItem): string {
    const additionalsKey = item.additionals 
      ? item.additionals.map(a => a.id).sort().join(',')
      : '';
    return `${item.id}-${additionalsKey}-${item.observations || ''}`;
  }

  addItem(item: CartItem): void {
    this.store.setState((state) => ({
      items: [...state.items, item],
    }));
  }

  removeItem(item: CartItem): void {
    this.store.setState((state) => ({
      items: state.items.filter(i => this.getItemKey(i) !== this.getItemKey(item)),
    }));
  }

  updateItem(item: CartItem): void {
    this.store.setState((state) => ({
      items: state.items.map(i => 
        this.getItemKey(i) === this.getItemKey(item) ? item : i
      ),
    }));
  }

  findSimilarItem(item: CartItem): CartItem | undefined {
    return this.store.getState().items.find(i => 
      this.getItemKey(i) === this.getItemKey(item)
    );
  }

  getItems(): CartItem[] {
    return this.store.getState().items;
  }

  clear(): void {
    this.store.setState({ items: [] });
  }
} 