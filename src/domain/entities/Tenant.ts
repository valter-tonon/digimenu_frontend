export interface Tenant {
  id: number;
  uuid: string;
  name: string;
  cnpj: string;
  email: string;
  url: string;
  logo: string | null;
  active: boolean;
  subscription: string;
  expires_at: string;
  subscription_id: string | null;
  subscription_active: boolean;
  subscription_suspended: boolean;
  created_at: string;
  updated_at: string;
  plan?: {
    id: number;
    name: string;
    url: string;
    price: number;
    description: string;
  };
} 