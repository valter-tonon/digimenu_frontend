import { Customer } from '@/domain/entities/Customer';
import { CustomerRepository } from '@/domain/repositories/CustomerRepository';
import { apiClient } from '../api/apiClient';

export class ApiCustomerRepository implements CustomerRepository {
  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    try {
      const response = await apiClient.post<{ data: Customer }>('/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }
} 