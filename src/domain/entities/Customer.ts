export interface Customer {
  id: number;
  name: string;
  email: string;
  document?: string;
  phone?: string;
  mobile_phone?: string;
  active: boolean;
  image?: string | null;
  token?: string;
  token_created_at?: string;
  email_verified_at?: string;
  tenant_id: number;
  created_at: string;
  updated_at: string;
} 