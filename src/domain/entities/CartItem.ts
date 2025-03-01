import { Additional } from './Product';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  additionals?: Additional[];
  observations?: string;
  totalPrice: number;
} 