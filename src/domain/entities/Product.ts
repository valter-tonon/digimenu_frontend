export interface Additional {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: number;
  uuid: string;
  name: string;
  description: string;
  price: number;
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
  additionals?: Additional[];
} 