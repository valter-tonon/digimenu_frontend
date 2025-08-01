/**
 * Checkout API Service with Rate Limiting
 * 
 * Handles all checkout-related API calls with built-in rate limiting
 * to prevent infinite loops from overwhelming the backend
 */

import { createRateLimitedAxios, withRateLimit } from '@/utils/apiRateLimit';
import { toast } from 'react-hot-toast';

const api = createRateLimitedAxios();

export interface CreateOrderRequest {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    notes?: string;
    addons?: any[];
  }>;
  delivery_address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    zip_code: string;
    reference?: string;
  };
  payment_method: string;
  total: number;
  notes?: string;
  store_id: string;
  table_id?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
}

export interface ValidateAddressRequest {
  zip_code: string;
}

class CheckoutApiService {
  /**
   * Create a new order with rate limiting
   */
  async createOrder(orderData: CreateOrderRequest) {
    return withRateLimit(
      async (data: CreateOrderRequest) => {
        try {
          const response = await api.post('/orders', data, {
            headers: {
              'X-Store-ID': data.store_id,
              'Content-Type': 'application/json'
            }
          });
          
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error creating order:', error);
          throw error;
        }
      },
      'POST /orders',
      5 // Max 5 order creation attempts per minute
    )(orderData);
  }

  /**
   * Create a new customer with rate limiting
   */
  async createCustomer(customerData: CreateCustomerRequest) {
    return withRateLimit(
      async (data: CreateCustomerRequest) => {
        try {
          const response = await api.post('/customers', data);
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas tentativas de cadastro. Aguarde alguns minutos.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error creating customer:', error);
          throw error;
        }
      },
      'POST /customers',
      3 // Max 3 customer creation attempts per minute
    )(customerData);
  }

  /**
   * Validate address by ZIP code with rate limiting
   */
  async validateAddress(zipCode: string) {
    return withRateLimit(
      async (zip: string) => {
        try {
          // Use ViaCEP API with rate limiting
          const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
          
          if (!response.ok) {
            throw new Error('CEP service unavailable');
          }
          
          const data = await response.json();
          
          if (data.erro) {
            throw new Error('CEP not found');
          }
          
          return {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            zip_code: zip
          };
        } catch (error: any) {
          console.error('Error validating address:', error);
          throw error;
        }
      },
      'GET /viacep',
      20 // Max 20 CEP lookups per minute
    )(zipCode);
  }

  /**
   * Get order status with rate limiting
   */
  async getOrderStatus(storeId: string, tableId?: string) {
    return withRateLimit(
      async (store: string, table?: string) => {
        try {
          const params = new URLSearchParams({
            store_id: store,
            ...(table && { table_id: table })
          });
          
          const response = await api.get(`/orders/status?${params.toString()}`, {
            headers: {
              'X-Store-ID': store
            }
          });
          
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas consultas de status. Aguarde alguns minutos.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error getting order status:', error);
          throw error;
        }
      },
      'GET /orders/status',
      30 // Max 30 status checks per minute
    )(storeId, tableId);
  }

  /**
   * Request WhatsApp authentication with rate limiting
   */
  async requestWhatsAppAuth(phone: string, storeId: string) {
    return withRateLimit(
      async (phoneNumber: string, store: string) => {
        try {
          const response = await api.post('/auth/whatsapp/request', {
            phone: phoneNumber,
            store_id: store
          }, {
            headers: {
              'X-Store-ID': store
            }
          });
          
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas tentativas de autenticação. Aguarde alguns minutos.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error requesting WhatsApp auth:', error);
          throw error;
        }
      },
      'POST /auth/whatsapp/request',
      3 // Max 3 WhatsApp auth requests per minute
    )(phone, storeId);
  }

  /**
   * Validate WhatsApp token with rate limiting
   */
  async validateWhatsAppToken(phone: string, token: string, storeId: string) {
    return withRateLimit(
      async (phoneNumber: string, authToken: string, store: string) => {
        try {
          const response = await api.post('/auth/whatsapp/validate', {
            phone: phoneNumber,
            token: authToken,
            store_id: store
          }, {
            headers: {
              'X-Store-ID': store
            }
          });
          
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas tentativas de validação. Aguarde alguns minutos.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error validating WhatsApp token:', error);
          throw error;
        }
      },
      'POST /auth/whatsapp/validate',
      5 // Max 5 token validation attempts per minute
    )(phone, token, storeId);
  }

  /**
   * Generate PIX payment with rate limiting
   */
  async generatePixPayment(orderData: any) {
    return withRateLimit(
      async (data: any) => {
        try {
          const response = await api.post('/payments/mercadopago/pix', data, {
            headers: {
              'X-Store-ID': data.store_id
            }
          });
          
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas tentativas de pagamento. Aguarde alguns minutos.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error generating PIX payment:', error);
          throw error;
        }
      },
      'POST /payments/mercadopago/pix',
      10 // Max 10 PIX generation attempts per minute
    )(orderData);
  }

  /**
   * Process credit card payment with rate limiting
   */
  async processCreditCardPayment(paymentData: any) {
    return withRateLimit(
      async (data: any) => {
        try {
          const response = await api.post('/payments/mercadopago/credit-card', data, {
            headers: {
              'X-Store-ID': data.store_id
            }
          });
          
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas tentativas de pagamento. Aguarde alguns minutos.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error processing credit card payment:', error);
          throw error;
        }
      },
      'POST /payments/mercadopago/credit-card',
      5 // Max 5 credit card payment attempts per minute
    )(paymentData);
  }

  /**
   * Get store/tenant information with rate limiting
   */
  async getStoreInfo(storeId: string) {
    return withRateLimit(
      async (store: string) => {
        try {
          const response = await api.get(`/tenant/${store}`);
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas consultas de loja. Aguarde alguns minutos.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error getting store info:', error);
          throw error;
        }
      },
      'GET /tenant',
      60 // Max 60 store info requests per minute
    )(storeId);
  }

  /**
   * Get table information with rate limiting
   */
  async getTableInfo(tableId: string, storeId: string) {
    return withRateLimit(
      async (table: string, store: string) => {
        try {
          const response = await api.get(`/tables/${table}?token_company=${store}`);
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 429) {
            toast.error('Muitas consultas de mesa. Aguarde alguns minutos.');
            throw new Error('Rate limit exceeded');
          }
          
          console.error('Error getting table info:', error);
          throw error;
        }
      },
      'GET /tables',
      60 // Max 60 table info requests per minute
    )(tableId, storeId);
  }
}

// Export singleton instance
export const checkoutApi = new CheckoutApiService();

// Export individual methods for convenience
export const {
  createOrder,
  createCustomer,
  validateAddress,
  getOrderStatus,
  requestWhatsAppAuth,
  validateWhatsAppToken,
  generatePixPayment,
  processCreditCardPayment,
  getStoreInfo,
  getTableInfo
} = checkoutApi;