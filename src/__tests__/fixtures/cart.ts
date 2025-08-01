// Cart fixtures for testing
import { createMockCartItem } from '../factories/mockData';

export const mockCartItem = createMockCartItem();

export const mockCartItems = [
  mockCartItem,
  createMockCartItem({
    id: 'test-cart-item-2',
    productId: 2,
    identify: 'test-product-uuid-2',
    name: 'X-Salada',
    price: 20.00,
    quantity: 1,
    additionals: []
  })
];

export default {
  mockCartItem,
  mockCartItems
};