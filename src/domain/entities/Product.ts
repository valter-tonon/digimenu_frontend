export interface AdditionalItem {
  id: number;
  name: string;
  price: number;
}

/** @deprecated Use AdditionalItem */
export type Additional = AdditionalItem;

export interface AdditionalGroup {
  id: number;
  name: string;
  description?: string;
  min_qty: number;
  max_qty?: number;
  additionals: AdditionalItem[];
}

export type ProductTag = 
  | 'vegetariano'
  | 'vegano'
  | 'sem_gluten'
  | 'sem_lactose'
  | 'picante'
  | 'organico'
  | 'promocao'
  | 'novo';

export interface Product {
  id: number;
  uuid: string;
  name: string;
  description: string;
  price: number;
  promotional_price?: number;
  is_on_promotion?: boolean;
  current_price?: number;
  promotion_starts_at?: string;
  promotion_ends_at?: string;
  is_featured?: boolean;
  is_popular?: boolean;
  tags?: ProductTag[];
  image: string | null;
  active: boolean;
  category_id: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    uuid: string;
    name: string;
    description: string;
  };
  extras?: string[];
  additional_groups?: AdditionalGroup[];
  additionals?: AdditionalItem[];
} 