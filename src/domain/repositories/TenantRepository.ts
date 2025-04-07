import { Tenant } from '../entities/Tenant';

export interface TenantRepository {
  getTenants(): Promise<Tenant[]>;
  getTenantByUuid(uuid: string): Promise<Tenant>;
} 