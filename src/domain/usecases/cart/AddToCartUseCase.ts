import { CartItem } from '@/domain/entities/CartItem';
import { CartRepository } from '@/domain/repositories/CartRepository';

export interface AddToCartUseCase {
  execute(item: CartItem): void;
}

export class AddToCartUseCaseImpl implements AddToCartUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  execute(item: CartItem): void {
    const existingItem = this.cartRepository.findSimilarItem(item);
    
    if (existingItem) {
      const updatedQuantity = existingItem.quantity + item.quantity;
      const updatedTotalPrice = this.calculateTotalPrice({
        ...existingItem,
        quantity: updatedQuantity
      });
      
      this.cartRepository.updateItem({
        ...existingItem,
        quantity: updatedQuantity,
        totalPrice: updatedTotalPrice
      });
      return;
    }

    const totalPrice = this.calculateTotalPrice(item);
    this.cartRepository.addItem({
      ...item,
      totalPrice
    });
  }

  private calculateTotalPrice(item: CartItem): number {
    const additionalsTotal = item.additionals?.reduce((sum, add) => sum + add.price, 0) || 0;
    return (item.price + additionalsTotal) * item.quantity;
  }
} 