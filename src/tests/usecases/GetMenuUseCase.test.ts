import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiMenuRepository } from '@/infrastructure/repositories/ApiMenuRepository';
import { apiClient } from '@/infrastructure/api/apiClient';

// Mock do apiClient
vi.mock('@/infrastructure/api/apiClient', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

describe('ApiMenuRepository', () => {
  let menuRepository: ApiMenuRepository;

  beforeEach(() => {
    menuRepository = new ApiMenuRepository();
    vi.clearAllMocks();
  });

  it('deve retornar informações de horário de funcionamento do tenant', async () => {
    // Arrange - Preparar
    const mockResponse = {
      data: {
        categories: [],
        products: [],
        tenant: {
          id: 1,
          uuid: 'abc123',
          name: 'Restaurante Teste',
          url: 'restaurante-teste',
          logo: 'logo.png',
          opening_hours: {
            opens_at: '10:00',
            closes_at: '22:00',
            is_open: true
          }
        }
      }
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    // Act - Agir
    const result = await menuRepository.getMenu({ store: 'restaurante-teste' });

    // Assert - Verificar
    expect(result.tenant).toBeDefined();
    expect(result.tenant?.opening_hours).toBeDefined();
    expect(result.tenant?.opening_hours?.opens_at).toBe('10:00');
    expect(result.tenant?.opening_hours?.closes_at).toBe('22:00');
    expect(result.tenant?.opening_hours?.is_open).toBe(true);
  });

  it('deve retornar valor mínimo de pedido e taxa de entrega', async () => {
    // Arrange - Preparar
    const mockResponse = {
      data: {
        categories: [],
        products: [],
        tenant: {
          id: 1,
          uuid: 'abc123',
          name: 'Restaurante Teste',
          url: 'restaurante-teste',
          logo: 'logo.png',
          min_order_value: 25.00,
          delivery_fee: 5.00,
          estimated_delivery_time: '30-45 min'
        }
      }
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    // Act - Agir
    const result = await menuRepository.getMenu({ store: 'restaurante-teste' });

    // Assert - Verificar
    expect(result.tenant).toBeDefined();
    expect(result.tenant?.min_order_value).toBe(25.00);
    expect(result.tenant?.delivery_fee).toBe(5.00);
    expect(result.tenant?.estimated_delivery_time).toBe('30-45 min');
  });

  it('deve tratar corretamente quando o tenant não possui horário de funcionamento', async () => {
    // Arrange - Preparar
    const mockResponse = {
      data: {
        categories: [],
        products: [],
        tenant: {
          id: 1,
          uuid: 'abc123',
          name: 'Restaurante Teste',
          url: 'restaurante-teste',
          logo: 'logo.png'
          // Sem opening_hours
        }
      }
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    // Act - Agir
    const result = await menuRepository.getMenu({ store: 'restaurante-teste' });

    // Assert - Verificar
    expect(result.tenant).toBeDefined();
    expect(result.tenant?.opening_hours).toBeUndefined();
  });

  it('deve chamar a API com os parâmetros corretos', async () => {
    // Arrange - Preparar
    const mockResponse = {
      data: {
        categories: [],
        products: [],
        tenant: {}
      }
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);
    
    // Act - Agir
    await menuRepository.getMenu({ 
      store: 'restaurante-teste',
      table: '123',
      isDelivery: true
    });

    // Assert - Verificar
    expect(apiClient.get).toHaveBeenCalledWith('/menu', { 
      params: { 
        store: 'restaurante-teste',
        table: '123',
        isDelivery: true
      } 
    });
  });
}); 