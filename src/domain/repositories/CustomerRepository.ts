import { Customer } from '../entities/Customer';

export interface CustomerRepository {
  createCustomer(customerData: Partial<Customer>): Promise<Customer>;
} 