// Mock Data Factories for Testing
// This file contains factory functions to create realistic test data

export interface MockProduct {
  id: number;
  uuid: string;
  name: string;
  description: string;
  price: number;
  promotional_price?: number | null;
  is_featured: boolean;
  is_popular: boolean;
  is_on_promotion: boolean;
  category_id: number;
  image: string;
  tags: string[];
  additionals: MockAdditional[];
}

export interface MockAdditional {
  id: number;
  name: string;
  price: number;
  quantity?: number;
}

export interface MockCategory {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string;
}

export interface MockTenant {
  id: number;
  uuid: string;
  name: string;
  url: string;
  logo?: string | null;
  opening_hours: {
    opens_at: string;
    closes_at: string;
    is_open: boolean;
  };
  min_order_value: number;
  delivery_fee: number;
  estimated_delivery_time: string;
}

export interface MockCartItem {
  id: string;
  productId: number;
  identify: string;
  name: string;
  price: number;
  quantity: number;
  additionals: MockAdditional[];
}

export interface MockCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: MockAddress;
}

export interface MockAddress {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

export interface MockOrder {
  id: number;
  identify: string;
  status: string;
  total: number;
  items: MockCartItem[];
  customer: MockCustomer;
  delivery_address?: MockAddress;
  payment_method: string;
  observations?: string;
}

// Factory Functions

export const createMockAdditional = (overrides?: Partial<MockAdditional>): MockAdditional => ({
  id: 1,
  name: 'Bacon Extra',
  price: 5.00,
  quantity: 1,
  ...overrides
});

export const createMockProduct = (overrides?: Partial<MockProduct>): MockProduct => ({
  id: 1,
  uuid: 'product-uuid-1',
  name: 'X-Bacon',
  description: 'Delicioso hambúrguer com bacon',
  price: 30.00,
  promotional_price: null,
  is_featured: true,
  is_popular: false,
  is_on_promotion: false,
  category_id: 1,
  image: 'http://localhost/storage/test.webp',
  tags: ['picante', 'novo'],
  additionals: [createMockAdditional()],
  ...overrides
});

export const createMockCategory = (overrides?: Partial<MockCategory>): MockCategory => ({
  id: 1,
  name: 'Lanches',
  slug: 'lanches',
  image: null,
  description: 'Deliciosos lanches',
  ...overrides
});

export const createMockTenant = (overrides?: Partial<MockTenant>): MockTenant => ({
  id: 1,
  uuid: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
  name: 'Empresa X',
  url: 'empresa-x',
  logo: null,
  opening_hours: {
    opens_at: '00:00:00',
    closes_at: '23:59:00',
    is_open: true
  },
  min_order_value: 20.00,
  delivery_fee: 5.00,
  estimated_delivery_time: '30-45 min',
  ...overrides
});

export const createMockCartItem = (overrides?: Partial<MockCartItem>): MockCartItem => ({
  id: 'test-cart-item-1',
  productId: 1,
  identify: 'test-product-uuid-1',
  name: 'X-Bacon',
  price: 30.00,
  quantity: 2,
  additionals: [
    {
      id: 1,
      name: 'Bacon Extra',
      price: 5.00,
      quantity: 1
    }
  ],
  ...overrides
});

export const createMockAddress = (overrides?: Partial<MockAddress>): MockAddress => ({
  id: 1,
  street: 'Rua Teste',
  number: '123',
  complement: 'Apto 45',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01234-567',
  is_default: true,
  ...overrides
});

export const createMockCustomer = (overrides?: Partial<MockCustomer>): MockCustomer => ({
  id: 1,
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999',
  address: createMockAddress(),
  ...overrides
});

export const createMockOrder = (overrides?: Partial<MockOrder>): MockOrder => ({
  id: 1,
  identify: 'order-123',
  status: 'pending',
  total: 70.00,
  items: [createMockCartItem()],
  customer: createMockCustomer(),
  delivery_address: createMockAddress(),
  payment_method: 'pix',
  observations: '',
  ...overrides
});

// Collection Factories

export const createMockProductList = (count: number = 4): MockProduct[] => [
  createMockProduct({
    id: 1,
    uuid: 'product-uuid-1',
    name: 'X-Bacon',
    is_featured: true,
    is_popular: false,
    is_on_promotion: false,
    price: 30.00,
    promotional_price: null
  }),
  createMockProduct({
    id: 2,
    uuid: 'product-uuid-2',
    name: 'X-Salada',
    is_featured: false,
    is_popular: true,
    is_on_promotion: true,
    price: 25.00,
    promotional_price: 20.00,
    tags: ['saudável']
  }),
  createMockProduct({
    id: 3,
    uuid: 'product-uuid-3',
    name: 'Coca-Cola',
    category_id: 2,
    is_featured: false,
    is_popular: true,
    is_on_promotion: false,
    price: 5.00,
    promotional_price: null,
    tags: ['gelado'],
    additionals: []
  }),
  createMockProduct({
    id: 4,
    uuid: 'product-uuid-4',
    name: 'Pudim',
    category_id: 3,
    is_featured: true,
    is_popular: false,
    is_on_promotion: true,
    price: 8.00,
    promotional_price: 6.00,
    tags: ['doce', 'cremoso'],
    additionals: []
  })
].slice(0, count);

export const createMockCategoryList = (count: number = 3): MockCategory[] => [
  createMockCategory({
    id: 1,
    name: 'Lanches',
    slug: 'lanches'
  }),
  createMockCategory({
    id: 2,
    name: 'Bebidas',
    slug: 'bebidas'
  }),
  createMockCategory({
    id: 3,
    name: 'Sobremesas',
    slug: 'sobremesas'
  })
].slice(0, count);

// Menu Data Factory
export const createMockMenuData = () => ({
  categories: createMockCategoryList(),
  products: createMockProductList(),
  tenant: createMockTenant()
});

// API Response Factories
export const createMockMenuApiResponse = () => ({
  success: true,
  data: createMockMenuData()
});

export const createMockOrderApiResponse = (overrides?: Partial<MockOrder>) => ({
  success: true,
  data: createMockOrder(overrides)
});

// Error Response Factory
export const createMockErrorResponse = (message: string = 'Erro interno do servidor', status: number = 500) => ({
  success: false,
  error: {
    message,
    status,
    code: `ERROR_${status}`
  }
});

// Test Scenarios
export const testScenarios = {
  // Cenário: Loja aberta com produtos disponíveis
  storeOpen: () => createMockMenuData(),
  
  // Cenário: Loja fechada
  storeClosed: () => ({
    ...createMockMenuData(),
    tenant: createMockTenant({
      opening_hours: {
        opens_at: '18:00:00',
        closes_at: '23:00:00',
        is_open: false
      }
    })
  }),
  
  // Cenário: Produtos em promoção
  productsOnSale: () => ({
    ...createMockMenuData(),
    products: createMockProductList().map(product => ({
      ...product,
      is_on_promotion: true,
      promotional_price: product.price * 0.8
    }))
  }),
  
  // Cenário: Carrinho com valor mínimo não atingido
  cartBelowMinimum: () => [
    createMockCartItem({
      id: 'item-1',
      price: 15.00,
      quantity: 1
    })
  ],
  
  // Cenário: Carrinho com valor mínimo atingido
  cartAboveMinimum: () => [
    createMockCartItem({
      id: 'item-1',
      price: 30.00,
      quantity: 1
    })
  ]
};

export default {
  createMockProduct,
  createMockCategory,
  createMockTenant,
  createMockCartItem,
  createMockCustomer,
  createMockAddress,
  createMockOrder,
  createMockProductList,
  createMockCategoryList,
  createMockMenuData,
  createMockMenuApiResponse,
  createMockOrderApiResponse,
  createMockErrorResponse,
  testScenarios
};