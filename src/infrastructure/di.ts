// Dependency Injection Container
import { MenuRepository } from '@/domain/repositories/MenuRepository';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { TableRepository } from '@/domain/repositories/TableRepository';
import { TenantRepository } from '@/domain/repositories/TenantRepository';

// Implementações concretas dos repositórios
import { ApiMenuRepository } from '@/infrastructure/repositories/ApiMenuRepository';
import { ApiOrderRepository } from '@/infrastructure/repositories/ApiOrderRepository';
import { ApiTableRepository } from '@/infrastructure/repositories/ApiTableRepository';
import { ApiTenantRepository } from '@/infrastructure/repositories/ApiTenantRepository';

export interface Container {
  menuRepository: MenuRepository;
  orderRepository: OrderRepository;
  tableRepository: TableRepository;
  tenantRepository: TenantRepository;
}

// Container singleton
let container: Container | null = null;

export function getContainer(): Container {
  if (!container) {
    container = {
      menuRepository: new ApiMenuRepository(),
      orderRepository: new ApiOrderRepository(),
      tableRepository: new ApiTableRepository(),
      tenantRepository: new ApiTenantRepository(),
    };
  }
  return container;
}

// Hook para usar o container em componentes React
export function useContainer(): Container {
  return getContainer();
}

// Função para resetar o container (útil para testes)
export function resetContainer(): void {
  container = null;
}