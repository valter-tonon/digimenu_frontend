import { createOrder as apiCreateOrder } from './api';
import { CartItem } from '@/store/cart-store';
import { CustomerData, Address } from '@/store/checkout-store';

export interface CreateOrderPayload {
  token_company: string;
  type: 'delivery' | 'takeout' | 'table';
  customer?: CustomerData;
  customer_address_id?: number;
  customer_address?: Address;
  table_id?: string;
  payment_method: string;
  products: Array<{
    identify: string;
    quantity: number;
    notes?: string;
    additionals?: Array<{
      id: number;
      quantity: number;
    }>;
  }>;
  comment?: string;
}

/**
 * Maps cart items to order product payload including additionals
 */
function mapCartItemsToProducts(cartItems: CartItem[]) {
  return cartItems.map(item => ({
    identify: item.identify,
    quantity: item.quantity,
    notes: item.notes,
    additionals: item.additionals && item.additionals.length > 0
      ? item.additionals.map(add => ({
          id: add.id,
          quantity: add.quantity || 1,
        }))
      : undefined,
  }));
}

/**
 * Service for creating orders
 */
export const orderService = {
  /**
   * Create a delivery order
   */
  async createDeliveryOrder(
    storeId: string,
    customer: CustomerData,
    address: Address,
    cartItems: CartItem[],
    paymentMethod: string,
    notes?: string
  ) {
    const payload: CreateOrderPayload = {
      token_company: storeId,
      type: 'delivery',
      customer: {
        phone: customer.phone,
        name: customer.name,
        email: customer.email
      },
      customer_address: {
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zip_code: address.zip_code
      },
      payment_method: paymentMethod,
      products: mapCartItemsToProducts(cartItems),
      comment: notes
    };

    console.log('📤 Creating delivery order:', payload);
    const response = await apiCreateOrder(payload);
    console.log('📥 Order created:', response);

    return response;
  },

  /**
   * Create a takeout (retirada/balcão) order
   */
  async createTakeoutOrder(
    storeId: string,
    customer: CustomerData,
    cartItems: CartItem[],
    paymentMethod: string,
    notes?: string
  ) {
    const payload: CreateOrderPayload = {
      token_company: storeId,
      type: 'takeout',
      customer: {
        phone: customer.phone,
        name: customer.name,
        email: customer.email
      },
      payment_method: paymentMethod,
      products: mapCartItemsToProducts(cartItems),
      comment: notes
    };

    console.log('📤 Creating takeout order:', payload);
    const response = await apiCreateOrder(payload);
    console.log('📥 Order created:', response);

    return response;
  },

  /**
   * Create a table order (anonymous, no customer data)
   */
  async createTableOrder(
    storeId: string,
    tableId: string,
    cartItems: CartItem[],
    paymentMethod: string,
    notes?: string
  ) {
    const payload: CreateOrderPayload = {
      token_company: storeId,
      type: 'table',
      table_id: tableId,
      payment_method: paymentMethod,
      products: mapCartItemsToProducts(cartItems),
      comment: notes
    };

    console.log('📤 Creating table order:', payload);
    const response = await apiCreateOrder(payload);
    console.log('📥 Order created:', response);

    return response;
  }
};
