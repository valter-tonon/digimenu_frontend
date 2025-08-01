// API Response Fixtures for Testing
// This file contains mock API responses for different scenarios

import {
  createMockMenuData,
  createMockOrder,
  createMockErrorResponse,
  createMockTenant,
  createMockProductList,
  createMockCategoryList,
  testScenarios
} from '../factories/mockData';

// Menu API Responses
export const menuApiResponse = {
  success: true,
  data: createMockMenuData()
};

export const menuApiResponseEmpty = {
  success: true,
  data: {
    categories: [],
    products: [],
    tenant: createMockTenant()
  }
};

export const menuApiResponseStoreClosed = {
  success: true,
  data: testScenarios.storeClosed()
};

export const menuApiResponseWithPromotions = {
  success: true,
  data: testScenarios.productsOnSale()
};

export const menuApiError = createMockErrorResponse(
  'Não foi possível carregar o menu',
  500
);

export const menuApiNotFound = createMockErrorResponse(
  'Loja não encontrada',
  404
);

// Order API Responses
export const orderApiResponse = {
  success: true,
  data: createMockOrder()
};

export const orderApiResponsePending = {
  success: true,
  data: createMockOrder({
    status: 'pending',
    identify: 'order-pending-123'
  })
};

export const orderApiResponseConfirmed = {
  success: true,
  data: createMockOrder({
    status: 'confirmed',
    identify: 'order-confirmed-456'
  })
};

export const orderApiError = createMockErrorResponse(
  'Erro ao criar pedido',
  500
);

export const orderApiValidationError = createMockErrorResponse(
  'Dados do pedido inválidos',
  422
);

export const orderApiMinimumValueError = createMockErrorResponse(
  'Valor mínimo do pedido não atingido',
  400
);

// Authentication API Responses
export const authApiResponse = {
  success: true,
  data: {
    token: 'mock-jwt-token',
    user: {
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '(11) 99999-9999'
    }
  }
};

export const authApiError = createMockErrorResponse(
  'Credenciais inválidas',
  401
);

// Customer API Responses
export const customerApiResponse = {
  success: true,
  data: {
    id: 1,
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 99999-9999',
    addresses: [
      {
        id: 1,
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        is_default: true
      }
    ]
  }
};

// CEP API Responses (ViaCEP)
export const cepApiResponse = {
  cep: '01234-567',
  logradouro: 'Rua Teste',
  complemento: '',
  bairro: 'Centro',
  localidade: 'São Paulo',
  uf: 'SP',
  ibge: '3550308',
  gia: '1004',
  ddd: '11',
  siafi: '7107'
};

export const cepApiError = {
  erro: true
};

// Payment API Responses
export const paymentApiResponse = {
  success: true,
  data: {
    payment_id: 'payment-123',
    status: 'pending',
    qr_code: 'mock-qr-code-data',
    qr_code_base64: 'data:image/png;base64,mock-base64-data',
    payment_url: 'https://mercadopago.com/payment/123'
  }
};

export const paymentApiError = createMockErrorResponse(
  'Erro ao processar pagamento',
  500
);

// Network Error Responses
export const networkError = new Error('Network Error');
export const timeoutError = new Error('Request Timeout');

// Mock Fetch Responses
export const mockFetchResponses = {
  // Menu endpoint
  '/api/v1/menu': {
    success: menuApiResponse,
    error: menuApiError,
    notFound: menuApiNotFound,
    empty: menuApiResponseEmpty,
    storeClosed: menuApiResponseStoreClosed,
    withPromotions: menuApiResponseWithPromotions
  },
  
  // Order endpoint
  '/api/v1/orders-kanban': {
    success: orderApiResponse,
    pending: orderApiResponsePending,
    confirmed: orderApiResponseConfirmed,
    error: orderApiError,
    validationError: orderApiValidationError,
    minimumValueError: orderApiMinimumValueError
  },
  
  // Auth endpoint
  '/api/v1/auth/login': {
    success: authApiResponse,
    error: authApiError
  },
  
  // Customer endpoint
  '/api/v1/customer': {
    success: customerApiResponse
  },
  
  // CEP endpoint (external)
  'https://viacep.com.br/ws/01234567/json/': {
    success: cepApiResponse,
    error: cepApiError
  },
  
  // Payment endpoint
  '/api/v1/payment/create': {
    success: paymentApiResponse,
    error: paymentApiError
  }
};

// Helper function to create mock fetch implementation
export const createMockFetch = (scenario: 'success' | 'error' | 'timeout' = 'success') => {
  return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    // Handle different scenarios
    if (scenario === 'timeout') {
      return Promise.reject(timeoutError);
    }
    
    if (scenario === 'error') {
      return Promise.reject(networkError);
    }
    
    // Find matching endpoint
    const endpoint = Object.keys(mockFetchResponses).find(key => url.includes(key));
    
    if (!endpoint) {
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }
    
    const responses = mockFetchResponses[endpoint as keyof typeof mockFetchResponses];
    const method = options?.method?.toLowerCase() || 'get';
    
    // Determine response based on method and URL
    let response;
    if (url.includes('/menu')) {
      response = responses.success;
    } else if (url.includes('/orders-kanban')) {
      response = method === 'post' ? responses.success : responses.error;
    } else if (url.includes('/auth/login')) {
      response = method === 'post' ? responses.success : responses.error;
    } else {
      response = responses.success;
    }
    
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response))
    });
  });
};

// Helper function to create error fetch implementation
export const createMockFetchError = (errorType: 'network' | 'server' | 'notFound' = 'server') => {
  return vi.fn().mockImplementation((url: string) => {
    if (errorType === 'network') {
      return Promise.reject(networkError);
    }
    
    if (errorType === 'notFound') {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve(menuApiNotFound)
      });
    }
    
    // Server error
    return Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve(menuApiError)
    });
  });
};

// Test scenarios for different API states
export const apiTestScenarios = {
  // Cenário: Todas as APIs funcionando
  allWorking: () => createMockFetch('success'),
  
  // Cenário: Erro de rede
  networkError: () => createMockFetch('error'),
  
  // Cenário: Timeout
  timeout: () => createMockFetch('timeout'),
  
  // Cenário: Loja não encontrada
  storeNotFound: () => createMockFetchError('notFound'),
  
  // Cenário: Erro do servidor
  serverError: () => createMockFetchError('server'),
  
  // Cenário: Menu vazio
  emptyMenu: () => vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(menuApiResponseEmpty)
  }),
  
  // Cenário: Loja fechada
  storeClosed: () => vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(menuApiResponseStoreClosed)
  })
};

export default {
  menuApiResponse,
  menuApiError,
  orderApiResponse,
  orderApiError,
  authApiResponse,
  authApiError,
  customerApiResponse,
  cepApiResponse,
  paymentApiResponse,
  paymentApiError,
  mockFetchResponses,
  createMockFetch,
  createMockFetchError,
  apiTestScenarios
};