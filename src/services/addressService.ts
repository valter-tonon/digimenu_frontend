/**
 * Address Service
 * 
 * Handles address management including CEP lookup, validation,
 * and CRUD operations for delivery addresses.
 */

import { 
  DeliveryAddress, 
  ViaCepResponse, 
  AddressFormData, 
  AddressValidationResult,
  AddressValidationError,
  BRAZILIAN_STATES 
} from '@/types/address';
import api from './api';

class AddressService {
  private readonly VIACEP_URL = 'https://viacep.com.br/ws';

  /**
   * Looks up address information by CEP using ViaCEP API
   */
  async lookupCep(cep: string): Promise<ViaCepResponse | null> {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`${this.VIACEP_URL}/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }

      const data: ViaCepResponse = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Error looking up CEP:', error);
      throw error;
    }
  }

  /**
   * Validates address form data
   */
  validateAddress(data: AddressFormData): AddressValidationResult {
    const errors: AddressValidationError[] = [];

    // Validate label
    if (!data.label?.trim()) {
      errors.push({ field: 'label', message: 'Nome do endereço é obrigatório' });
    } else if (data.label.length > 50) {
      errors.push({ field: 'label', message: 'Nome do endereço deve ter no máximo 50 caracteres' });
    }

    // Validate CEP
    const cleanCep = data.zip_code?.replace(/\D/g, '') || '';
    if (!cleanCep) {
      errors.push({ field: 'zip_code', message: 'CEP é obrigatório' });
    } else if (cleanCep.length !== 8) {
      errors.push({ field: 'zip_code', message: 'CEP deve ter 8 dígitos' });
    }

    // Validate street
    if (!data.street?.trim()) {
      errors.push({ field: 'street', message: 'Rua é obrigatória' });
    } else if (data.street.length > 255) {
      errors.push({ field: 'street', message: 'Rua deve ter no máximo 255 caracteres' });
    }

    // Validate number
    if (!data.number?.trim()) {
      errors.push({ field: 'number', message: 'Número é obrigatório' });
    } else if (data.number.length > 20) {
      errors.push({ field: 'number', message: 'Número deve ter no máximo 20 caracteres' });
    }

    // Validate complement (optional)
    if (data.complement && data.complement.length > 100) {
      errors.push({ field: 'complement', message: 'Complemento deve ter no máximo 100 caracteres' });
    }

    // Validate neighborhood
    if (!data.neighborhood?.trim()) {
      errors.push({ field: 'neighborhood', message: 'Bairro é obrigatório' });
    } else if (data.neighborhood.length > 100) {
      errors.push({ field: 'neighborhood', message: 'Bairro deve ter no máximo 100 caracteres' });
    }

    // Validate city
    if (!data.city?.trim()) {
      errors.push({ field: 'city', message: 'Cidade é obrigatória' });
    } else if (data.city.length > 100) {
      errors.push({ field: 'city', message: 'Cidade deve ter no máximo 100 caracteres' });
    }

    // Validate state
    if (!data.state?.trim()) {
      errors.push({ field: 'state', message: 'Estado é obrigatório' });
    } else if (!BRAZILIAN_STATES.find(state => state.code === data.state)) {
      errors.push({ field: 'state', message: 'Estado inválido' });
    }

    // Validate reference (optional)
    if (data.reference && data.reference.length > 255) {
      errors.push({ field: 'reference', message: 'Referência deve ter no máximo 255 caracteres' });
    }

    // Validate delivery instructions (optional)
    if (data.delivery_instructions && data.delivery_instructions.length > 500) {
      errors.push({ field: 'delivery_instructions', message: 'Instruções devem ter no máximo 500 caracteres' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formats CEP for display (12345-678)
   */
  formatCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  }

  /**
   * Formats address for display
   */
  formatAddressForDisplay(address: DeliveryAddress): string {
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Gets customer addresses from API
   */
  async getCustomerAddresses(customerId: string): Promise<DeliveryAddress[]> {
    try {
      const response = await api.get(`/customers/${customerId}/addresses`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      throw new Error('Erro ao carregar endereços');
    }
  }

  /**
   * Creates a new address
   */
  async createAddress(customerId: string, addressData: AddressFormData): Promise<DeliveryAddress> {
    try {
      const validation = this.validateAddress(addressData);
      if (!validation.isValid) {
        throw new Error(validation.errors[0]?.message || 'Dados inválidos');
      }

      const response = await api.post(`/customers/${customerId}/addresses`, {
        ...addressData,
        customer_id: customerId
      });

      return response.data?.data;
    } catch (error: any) {
      console.error('Error creating address:', error);
      throw new Error(error.response?.data?.message || 'Erro ao salvar endereço');
    }
  }

  /**
   * Updates an existing address
   */
  async updateAddress(addressId: number, addressData: Partial<AddressFormData>): Promise<DeliveryAddress> {
    try {
      const response = await api.put(`/addresses/${addressId}`, addressData);
      return response.data?.data;
    } catch (error: any) {
      console.error('Error updating address:', error);
      throw new Error(error.response?.data?.message || 'Erro ao atualizar endereço');
    }
  }

  /**
   * Deletes an address
   */
  async deleteAddress(addressId: number): Promise<void> {
    try {
      await api.delete(`/addresses/${addressId}`);
    } catch (error: any) {
      console.error('Error deleting address:', error);
      throw new Error(error.response?.data?.message || 'Erro ao excluir endereço');
    }
  }

  /**
   * Sets an address as default
   */
  async setDefaultAddress(addressId: number): Promise<void> {
    try {
      await api.post(`/addresses/${addressId}/set-default`);
    } catch (error: any) {
      console.error('Error setting default address:', error);
      throw new Error(error.response?.data?.message || 'Erro ao definir endereço padrão');
    }
  }

  /**
   * Saves address for guest user (in session storage)
   */
  saveGuestAddress(address: DeliveryAddress): void {
    try {
      const guestAddresses = this.getGuestAddresses();
      const newAddress = {
        ...address,
        id: Date.now(), // Temporary ID for guest addresses
        created_at: new Date().toISOString()
      };

      // If this is the first address or marked as default, make it default
      if (guestAddresses.length === 0 || address.is_default) {
        guestAddresses.forEach(addr => addr.is_default = false);
        newAddress.is_default = true;
      }

      guestAddresses.push(newAddress);
      sessionStorage.setItem('guest_addresses', JSON.stringify(guestAddresses));
    } catch (error) {
      console.error('Error saving guest address:', error);
      throw new Error('Erro ao salvar endereço');
    }
  }

  /**
   * Gets guest addresses from session storage
   */
  getGuestAddresses(): DeliveryAddress[] {
    try {
      const stored = sessionStorage.getItem('guest_addresses');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting guest addresses:', error);
      return [];
    }
  }

  /**
   * Updates guest address in session storage
   */
  updateGuestAddress(addressId: number, updates: Partial<DeliveryAddress>): void {
    try {
      const addresses = this.getGuestAddresses();
      const index = addresses.findIndex(addr => addr.id === addressId);
      
      if (index !== -1) {
        addresses[index] = { ...addresses[index], ...updates };
        sessionStorage.setItem('guest_addresses', JSON.stringify(addresses));
      }
    } catch (error) {
      console.error('Error updating guest address:', error);
      throw new Error('Erro ao atualizar endereço');
    }
  }

  /**
   * Deletes guest address from session storage
   */
  deleteGuestAddress(addressId: number): void {
    try {
      const addresses = this.getGuestAddresses();
      const filtered = addresses.filter(addr => addr.id !== addressId);
      sessionStorage.setItem('guest_addresses', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting guest address:', error);
      throw new Error('Erro ao excluir endereço');
    }
  }

  /**
   * Clears all guest addresses
   */
  clearGuestAddresses(): void {
    try {
      sessionStorage.removeItem('guest_addresses');
    } catch (error) {
      console.error('Error clearing guest addresses:', error);
    }
  }
}

export const addressService = new AddressService();