import { Table } from '@/domain/entities/Table';
import { TableRepository } from '@/domain/repositories/TableRepository';
import { apiClient } from '../api/apiClient';

export class ApiTableRepository implements TableRepository {
  async getTables(): Promise<Table[]> {
    try {
      const response = await apiClient.get<{ data: Table[] }>('/tables');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
      throw error;
    }
  }

  async getTableByUuid(uuid: string, storeId?: string): Promise<Table> {
    try {
      const params: any = {};
      if (storeId) {
        params.token_company = storeId;
      }
      
      const response = await apiClient.get<{ data: Table }>(`/tables/${uuid}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar mesa ${uuid}:`, error);
      throw error;
    }
  }
} 