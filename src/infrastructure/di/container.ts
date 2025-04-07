import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { CategoryRepository } from '@/domain/repositories/CategoryRepository';
import { TableRepository } from '@/domain/repositories/TableRepository';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { TenantRepository } from '@/domain/repositories/TenantRepository';
import { CustomerRepository } from '@/domain/repositories/CustomerRepository';
import { AuthRepository } from '@/domain/repositories/AuthRepository';
import { MenuRepository } from '@/domain/repositories/MenuRepository';

import {
  ApiProductRepository,
  ApiCategoryRepository,
  ApiTableRepository,
  ApiOrderRepository,
  ApiTenantRepository,
  ApiCustomerRepository,
  ApiAuthRepository,
  ApiMenuRepository
} from '../repositories';

// Singleton instances
const productRepository: ProductRepository = new ApiProductRepository();
const categoryRepository: CategoryRepository = new ApiCategoryRepository();
const tableRepository: TableRepository = new ApiTableRepository();
const orderRepository: OrderRepository = new ApiOrderRepository();
const tenantRepository: TenantRepository = new ApiTenantRepository();
const customerRepository: CustomerRepository = new ApiCustomerRepository();
const authRepository: AuthRepository = new ApiAuthRepository();
const menuRepository: MenuRepository = new ApiMenuRepository();

// Container de dependências
export const container = {
  // Repositórios
  productRepository,
  categoryRepository,
  tableRepository,
  orderRepository,
  tenantRepository,
  customerRepository,
  authRepository,
  menuRepository,
};

// Tipo para o container
export type DIContainer = typeof container; 