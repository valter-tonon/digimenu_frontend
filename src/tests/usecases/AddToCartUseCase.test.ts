import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddToCartUseCaseImpl } from '@/domain/usecases/cart/AddToCartUseCase';
import { CartRepository } from '@/domain/repositories/CartRepository';
import { CartItem } from '@/domain/entities/CartItem';

describe('AddToCartUseCase', () => {
  const mockCartRepository: CartRepository = {
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    findSimilarItem: vi.fn(),
    getItems: vi.fn(),
    clear: vi.fn(),
  };

  const useCase = new AddToCartUseCaseImpl(mockCartRepository);

  beforeEach(() => {
    vi.clearAllMocks(); // Limpa todos os mocks antes de cada teste
  });

  it('should add new item to cart when it does not exist', () => {
    const newItem: CartItem = {
      id: '1',
      name: 'Test Product',
      price: 10,
      quantity: 1,
      totalPrice: 10,
    };

    vi.mocked(mockCartRepository.findSimilarItem).mockReturnValue(undefined);
    
    useCase.execute(newItem);

    expect(mockCartRepository.addItem).toHaveBeenCalledWith({
      ...newItem,
      totalPrice: 10
    });
    expect(mockCartRepository.updateItem).not.toHaveBeenCalled();
  });

  it('should update quantity when adding existing item', () => {
    const existingItem: CartItem = {
      id: '1',
      name: 'Test Product',
      price: 10,
      quantity: 1,
      totalPrice: 10,
    };

    const newItem: CartItem = {
      ...existingItem,
      quantity: 2,
    };

    vi.mocked(mockCartRepository.findSimilarItem).mockReturnValue(existingItem);
    
    useCase.execute(newItem);

    expect(mockCartRepository.updateItem).toHaveBeenCalledWith({
      ...existingItem,
      quantity: 3,
      totalPrice: 30,
    });
    expect(mockCartRepository.addItem).not.toHaveBeenCalled();
  });

  it('should calculate total price including additionals', () => {
    const itemWithAdditionals: CartItem = {
      id: '1',
      name: 'Test Product',
      price: 10,
      quantity: 1,
      additionals: [
        { id: 'add1', name: 'Extra 1', price: 2 },
        { id: 'add2', name: 'Extra 2', price: 3 },
      ],
      totalPrice: 15,
    };

    vi.mocked(mockCartRepository.findSimilarItem).mockReturnValue(undefined);
    
    useCase.execute(itemWithAdditionals);

    expect(mockCartRepository.addItem).toHaveBeenCalledWith({
      ...itemWithAdditionals,
      totalPrice: 15 // 10 (base) + 2 + 3 (additionals) = 15
    });
  });
}); 