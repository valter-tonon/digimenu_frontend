export interface Category {
  id: number;
  uuid: string;
  name: string;
  description: string;
  image: string | null;
  active: boolean;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  products?: Array<{
    id: number;
    uuid: string;
    name: string;
    description: string;
    price: number;
    image: string | null;
  }>;
} 