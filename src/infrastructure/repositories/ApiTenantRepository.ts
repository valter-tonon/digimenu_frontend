import { Tenant } from '@/domain/entities/Tenant';
import { TenantRepository } from '@/domain/repositories/TenantRepository';
import { apiClient } from '../api/apiClient';

export class ApiTenantRepository implements TenantRepository {
  async getTenants(): Promise<Tenant[]> {
    try {
      const response = await apiClient.get<{ data: Tenant[] }>('/tenants');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tenants:', error);
      throw error;
    }
  }

  async getTenantByUuid(uuid: string): Promise<Tenant> {
    try {
      const response = await apiClient.get<{ data: Tenant }>(`/tenants/${uuid}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar tenant ${uuid}:`, error);
      throw error;
    }
  }
} 