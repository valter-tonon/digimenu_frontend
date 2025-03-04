export enum TableStatus {
  Free = 1,
  Busy = 2,
  Reserved = 3,
  ClosingAccount = 4
}

export interface Table {
  id: number;
  uuid: string;
  identifier: string;
  description: string;
  status: TableStatus;
  tenant_id: number;
  created_at: string;
  updated_at: string;
} 