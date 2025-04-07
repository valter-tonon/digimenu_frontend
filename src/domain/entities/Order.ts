export enum OrderStatus {
  PENDING = 1,
  PREPARING = 2,
  READY = 3,
  DELIVERED = 4,
  CANCELED = 5,
  PAYMENT_PENDING = 6,
  PAYMENT_APPROVED = 7
}

export enum OrderType {
  DELIVERY = 1,
  TABLE = 2
}

export enum PaymentMethod {
  CASH = 1,
  CARD = 2,
  PIX = 3
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  price: number;
  quantity: number;
  total: number;
  comment?: string;
  uuid: string;
  addons?: any;
  notes?: string;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    uuid: string;
    name: string;
    description: string;
    price: number;
    image: string | null;
  };
}

export interface Order {
  id: number;
  identify: string;
  total: number;
  status: OrderStatus;
  comment?: string;
  tenant_id: number;
  customer_id?: number;
  origin: number;
  type: OrderType;
  payment_method?: PaymentMethod;
  table_id?: number;
  table_number?: string;
  change_amount?: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  customer?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  table?: {
    id: number;
    uuid: string;
    identifier: string;
    description: string;
    status: number;
  };
} 