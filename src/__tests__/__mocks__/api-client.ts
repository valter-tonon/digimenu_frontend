import { vi } from 'vitest';

export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

// Mock para o fetch global
export const mockFetch = vi.fn();

// Respostas padrão para diferentes endpoints
export const mockApiResponses = {
  menu: {
    categories: [
      {
        id: 1,
        name: 'Lanches',
        description: 'Deliciosos lanches',
        image: 'lanches.jpg',
        is_active: true,
        order: 1
      }
    ],
    products: [
      {
        id: 1,
        uuid: 'test-product-uuid',
        name: 'X-Bacon',
        description: 'Hambúrguer com bacon',
        price: 30.00,
        promotional_price: null,
        is_featured: true,
        is_popular: false,
        is_on_promotion: false,
        category_id: 1,
        image: 'x-bacon.jpg',
        tags: ['picante', 'novo'],
        additionals: []
      }
    ],
    tenant: {
      id: 1,
      uuid: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
      name: 'Empresa X',
      opening_hours: {
        opens_at: '00:00:00',
        closes_at: '23:59:00',
        is_open: true
      },
      min_order_value: 20.00,
      delivery_fee: 5.00,
      estimated_delivery_time: '30-45 min'
    }
  },
  orderSuccess: {
    success: true,
    data: {
      id: 1,
      identify: 'ORDER-123',
      status: 'pending',
      total: 35.00
    }
  },
  customerAddresses: [
    {
      id: 1,
      street: 'Rua Teste',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      is_default: true,
      label: 'Casa'
    }
  ]
};