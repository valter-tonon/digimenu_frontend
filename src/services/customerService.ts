/**
 * Serviço de API para gerenciamento de clientes e endereços
 * 
 * Conecta o frontend com os endpoints públicos e autenticados do backend
 */

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';

// ============ INTERFACES ============

export interface CustomerData {
  id: number;
  name: string;
  email: string;
  document?: string;
  phone: string;
  mobile_phone?: string;
  active: boolean;
  image?: string;
  birth_date?: string;
  preferences?: CustomerPreferences;
  created_at?: string;
}

export interface CustomerPreferences {
  dietary_restrictions?: string[];
  allergies?: string[];
  favorite_items?: number[];
  preferred_payment_method?: string;
  favorite_categories?: string[];
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  reference?: string;
  delivery_instructions?: string;
  coordinates?: { lat: number; lng: number };
  phone?: string;
  is_default: boolean;
  full_address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AddressFormData {
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  reference?: string;
  delivery_instructions?: string;
  phone?: string;
  is_default?: boolean;
}

export interface CustomerUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  birth_date?: string;
  preferences?: CustomerPreferences;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// ============ FUNÇÕES DE CLIENTE ============

/**
 * Buscar cliente por telefone (endpoint público)
 */
export async function findCustomerByPhone(
  phone: string, 
  tenantId?: string
): Promise<ApiResponse<CustomerData>> {
  try {
    const params: Record<string, string> = { phone };
    if (tenantId) {
      params.tenant_id = tenantId;
    }

    const response = await axios.get(`${API_BASE}/customers/find-by-phone`, { params });
    
    return {
      success: response.data.success,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Erro ao buscar cliente por telefone:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao buscar cliente',
    };
  }
}

/**
 * Obter perfil completo do cliente (endpoint autenticado)
 */
export async function getCustomerProfile(
  customerId: number, 
  token: string
): Promise<ApiResponse<CustomerData>> {
  try {
    const response = await axios.get(`${API_BASE}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: response.data.success,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Erro ao obter perfil do cliente:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao obter perfil',
    };
  }
}

/**
 * Atualizar perfil do cliente (endpoint autenticado)
 */
export async function updateCustomerProfile(
  customerId: number, 
  data: CustomerUpdateData, 
  token: string
): Promise<ApiResponse<CustomerData>> {
  try {
    const response = await axios.put(`${API_BASE}/customers/${customerId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar perfil',
      errors: error.response?.data?.errors,
    };
  }
}

// ============ FUNÇÕES DE ENDEREÇO ============

/**
 * Listar endereços do cliente (endpoint público)
 */
export async function getCustomerAddresses(
  customerId: number
): Promise<ApiResponse<CustomerAddress[]>> {
  try {
    const response = await axios.get(`${API_BASE}/customers/${customerId}/addresses`);

    // A rota pública retorna a collection diretamente (ResourceCollection)
    const addresses = response.data.data || response.data;

    return {
      success: true,
      data: Array.isArray(addresses) ? addresses : [],
    };
  } catch (error: any) {
    console.error('Erro ao listar endereços:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Erro ao listar endereços',
    };
  }
}

/**
 * Adicionar novo endereço (endpoint público)
 */
export async function addCustomerAddress(
  customerId: number, 
  data: AddressFormData
): Promise<ApiResponse<CustomerAddress>> {
  try {
    const response = await axios.post(
      `${API_BASE}/customers/${customerId}/addresses`, 
      data
    );

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Erro ao adicionar endereço:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao adicionar endereço',
      errors: error.response?.data?.errors,
    };
  }
}

/**
 * Atualizar endereço existente (endpoint público)
 */
export async function updateCustomerAddress(
  customerId: number, 
  addressId: number, 
  data: AddressFormData
): Promise<ApiResponse<CustomerAddress>> {
  try {
    const response = await axios.put(
      `${API_BASE}/customers/${customerId}/addresses/${addressId}`, 
      data
    );

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar endereço:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao atualizar endereço',
      errors: error.response?.data?.errors,
    };
  }
}

/**
 * Excluir endereço (endpoint público)
 */
export async function deleteCustomerAddress(
  customerId: number, 
  addressId: number
): Promise<ApiResponse<void>> {
  try {
    const response = await axios.delete(
      `${API_BASE}/customers/${customerId}/addresses/${addressId}`
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Erro ao excluir endereço:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao excluir endereço',
    };
  }
}

/**
 * Definir endereço como padrão (endpoint público)
 */
export async function setDefaultAddress(
  customerId: number, 
  addressId: number
): Promise<ApiResponse<CustomerAddress>> {
  try {
    const response = await axios.post(
      `${API_BASE}/customers/${customerId}/addresses/${addressId}/set-default`
    );

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Erro ao definir endereço padrão:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Erro ao definir endereço padrão',
    };
  }
}

/**
 * Obter endereço padrão do cliente (endpoint público)
 */
export async function getDefaultAddress(
  customerId: number
): Promise<ApiResponse<CustomerAddress>> {
  try {
    const response = await axios.get(
      `${API_BASE}/customers/${customerId}/addresses/default`
    );

    return {
      success: response.data.success,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Erro ao obter endereço padrão:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Nenhum endereço padrão encontrado',
    };
  }
}

/**
 * Validar CEP via ViaCEP (endpoint público)
 */
export async function validateAddressByCep(
  cep: string
): Promise<ApiResponse<Partial<CustomerAddress>>> {
  try {
    // Usar ViaCEP diretamente para validação rápida
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return { success: false, message: 'CEP deve ter 8 dígitos' };
    }

    const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (response.data.erro) {
      return { success: false, message: 'CEP não encontrado' };
    }

    return {
      success: true,
      data: {
        street: response.data.logradouro,
        neighborhood: response.data.bairro,
        city: response.data.localidade,
        state: response.data.uf,
        zip_code: cleanCep,
      },
    };
  } catch (error: any) {
    console.error('Erro ao validar CEP:', error);
    return {
      success: false,
      message: 'Erro ao consultar CEP',
    };
  }
}
