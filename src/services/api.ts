import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Funções de autenticação via WhatsApp
export const requestWhatsAppAuth = async (
  phone: string, 
  storeId: string, 
  fingerprint: string, 
  sessionId?: string,
  sessionContext?: {
    tableId?: string;
    isDelivery: boolean;
  }
) => {
  return api.post('/auth/whatsapp/request', {
    phone,
    store_id: storeId,
    fingerprint,
    session_id: sessionId,
    session_context: sessionContext
  });
};

export const validateWhatsAppToken = async (token: string) => {
  return api.post('/auth/whatsapp/validate', { token });
};

// Novas funções de autenticação WhatsApp com magic links
export const requestWhatsAppMagicLink = async (phone: string, tenantId: string) => {
  return api.post('/auth/whatsapp/request', {
    phone,
    tenant_id: tenantId
  });
};

export const verifyWhatsAppMagicLink = async (token: string) => {
  return api.get(`/auth/whatsapp/verify/${token}`);
};

export const validateAuthToken = async (token: string) => {
  return api.post('/auth/token/validate', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const refreshAuthToken = async (token: string) => {
  return api.post('/auth/token/refresh', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Funções do usuário
export const getMe = async (token: string) => {
  return api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const logout = async (token: string) => {
  return api.post('/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Funções de restaurantes
export const getTenant = async (uuid: string) => {
  return api.get(`/tenant/${uuid}`);
};

export const getCategories = async (filters = {}) => {
  return api.get('/categories', { params: filters });
};

export const getProducts = async (filters = {}) => {
  return api.get('/products', { params: filters });
};

export const getMenu = async (filters = {}) => {
  return api.get('/menu', { params: filters });
};

// Funções de pedidos
export const createOrder = async (orderData: any) => {
  return api.post('/orders', orderData);
};

export const getOrderStatus = async (storeId: string, tableId: string) => {
  return api.get('/orders/status', {
    params: { store_id: storeId, table_id: tableId }
  });
};

export const getOrder = async (identify: string) => {
  return api.get(`/orders/${identify}`);
};

export const getMyOrders = async (token: string) => {
  return api.get('/my-orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const repeatOrder = async (token: string, identify: string) => {
  return api.post(`/repeat-order/${identify}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Funções de mesas
export const getTables = async (filters = {}) => {
  return api.get('/tables', { params: filters });
};

export const getTable = async (tableId: string) => {
  return api.get(`/tables/${tableId}`);
};

// Função para chamar garçom
export const callWaiter = async (data: any) => {
  return api.post('/waiter-calls', data);
};

// Funções de sessão
export const createSession = async (sessionData: {
  store_id: string;
  table_id?: string;
  is_delivery: boolean;
  fingerprint: string;
  customer_id?: string;
}) => {
  return api.post('/sessions', sessionData);
};

export const getSession = async (sessionId: string) => {
  return api.get(`/sessions/${sessionId}`);
};

export const validateSessionContext = async (sessionId: string, storeId: string, tableId?: string) => {
  return api.post(`/sessions/${sessionId}/validate`, {
    store_id: storeId,
    table_id: tableId
  });
};

export const updateSessionActivity = async (sessionId: string) => {
  return api.post(`/sessions/${sessionId}/activity`);
};

export const associateCustomerToSession = async (sessionId: string, customerId: string) => {
  return api.post(`/sessions/${sessionId}/associate-customer`, {
    customer_id: customerId
  });
};

export const extendSession = async (sessionId: string, additionalMinutes: number = 30) => {
  return api.post(`/sessions/${sessionId}/extend`, {
    additional_minutes: additionalMinutes
  });
};

export const invalidateSession = async (sessionId: string) => {
  return api.delete(`/sessions/${sessionId}`);
};

// Funções de cadastro rápido de clientes
export const quickRegisterCustomer = async (customerData: {
  name: string;
  phone: string;
  email?: string;
  tenant_id: string;
}) => {
  return api.post('/customers/quick-register', customerData);
};

export const findCustomerByPhone = async (phone: string, storeId: string) => {
  return api.get('/customers/find-by-phone', {
    params: { phone, tenant_id: storeId }
  });
};

// Funções de endereços
export const getCustomerAddresses = async (customerId: string) => {
  return api.get(`/customers/${customerId}/addresses`);
};

export const createCustomerAddress = async (customerId: string, addressData: any) => {
  return api.post(`/customers/${customerId}/addresses`, addressData);
};

export const updateAddress = async (addressId: number, addressData: any) => {
  return api.put(`/addresses/${addressId}`, addressData);
};

export const deleteAddress = async (addressId: number) => {
  return api.delete(`/addresses/${addressId}`);
};

export const setDefaultAddress = async (addressId: number) => {
  return api.post(`/addresses/${addressId}/set-default`);
};

export default api; 