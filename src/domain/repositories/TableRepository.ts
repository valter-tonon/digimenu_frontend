import { Table } from '../entities/Table';

export interface TableRepository {
  getTables(): Promise<Table[]>;
  getTableByUuid(uuid: string, storeId?: string): Promise<Table>;
} 