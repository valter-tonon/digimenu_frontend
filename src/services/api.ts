import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
export const requestWhatsAppCode = async (phone: string, tenantId: string) => {
  return api.post('/whatsapp/request-code', { phone, tenant_id: tenantId });
};

export const verifyWhatsAppCode = async (
  phone: string, 
  code: string, 
  tenantId: string, 
  deviceName: string = 'web'
) => {
  return api.post('/whatsapp/verify-code', { 
    phone, 
    code, 
    tenant_id: tenantId, 
    device_name: deviceName 
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

// Função para chamar garçom
export const callWaiter = async (data: any) => {
  return api.post('/waiter-calls', data);
};

export default api; 