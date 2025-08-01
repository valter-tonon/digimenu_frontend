/**
 * @jest-environment jsdom
 */

import { addressService } from '@/services/addressService';
import { AddressFormData, DeliveryAddress, ViaCepResponse } from '@/types/address';
import api from '@/services/api';

// Mock dependencies
jest.mock('@/services/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock fetch for CEP lookup
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('AddressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('CEP Lookup', () => {
    const mockCepResponse: ViaCepResponse = {
      cep: '01234-567',
      logradouro: 'Rua das Flores',
      complemento: '',
      bairro: 'Centro',
      localidade: 'São Paulo',
      uf: 'SP',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107'
    };

    it('successfully looks up valid CEP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCepResponse
      } as Response);

      const result = await addressService.lookupCep('01234567');

      expect(mockFetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01234567/json/');
      expect(result).toEqual(mockCepResponse);
    });

    it('throws error for invalid CEP format', async () => {
      await expect(addressService.lookupCep('123')).rejects.toThrow('CEP deve ter 8 dígitos');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws error when CEP is not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ erro: true })
      } as Response);

      await expect(addressService.lookupCep('00000000')).rejects.toThrow('CEP não encontrado');
    });

    it('throws error when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      await expect(addressService.lookupCep('01234567')).rejects.toThrow('Erro ao consultar CEP');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(addressService.lookupCep('01234567')).rejects.toThrow('Network error');
    });
  });

  describe('Address Validation', () => {
    const validAddressData: AddressFormData = {
      label: 'Casa',
      zip_code: '01234-567',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      reference: 'Próximo ao mercado',
      delivery_instructions: 'Tocar campainha',
      is_default: true
    };

    it('validates correct address data', () => {
      const result = addressService.validateAddress(validAddressData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates required fields', () => {
      const invalidData: AddressFormData = {
        label: '',
        zip_code: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        is_default: false
      };

      const result = addressService.validateAddress(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { field: 'label', message: 'Nome do endereço é obrigatório' },
          { field: 'zip_code', message: 'CEP é obrigatório' },
          { field: 'street', message: 'Rua é obrigatória' },
          { field: 'number', message: 'Número é obrigatório' },
          { field: 'neighborhood', message: 'Bairro é obrigatório' },
          { field: 'city', message: 'Cidade é obrigatória' },
          { field: 'state', message: 'Estado é obrigatório' }
        ])
      );
    });

    it('validates CEP format', () => {
      const invalidCepData = { ...validAddressData, zip_code: '123' };
      const result = addressService.validateAddress(invalidCepData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'zip_code',
        message: 'CEP deve ter 8 dígitos'
      });
    });

    it('validates state codes', () => {
      const invalidStateData = { ...validAddressData, state: 'XX' };
      const result = addressService.validateAddress(invalidStateData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'state',
        message: 'Estado inválido'
      });
    });

    it('validates field length limits', () => {
      const longData = {
        ...validAddressData,
        label: 'A'.repeat(51),
        street: 'B'.repeat(256),
        complement: 'C'.repeat(101),
        neighborhood: 'D'.repeat(101),
        city: 'E'.repeat(101),
        reference: 'F'.repeat(256),
        delivery_instructions: 'G'.repeat(501)
      };

      const result = addressService.validateAddress(longData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { field: 'label', message: 'Nome do endereço deve ter no máximo 50 caracteres' },
          { field: 'street', message: 'Rua deve ter no máximo 255 caracteres' },
          { field: 'complement', message: 'Complemento deve ter no máximo 100 caracteres' },
          { field: 'neighborhood', message: 'Bairro deve ter no máximo 100 caracteres' },
          { field: 'city', message: 'Cidade deve ter no máximo 100 caracteres' },
          { field: 'reference', message: 'Referência deve ter no máximo 255 caracteres' },
          { field: 'delivery_instructions', message: 'Instruções devem ter no máximo 500 caracteres' }
        ])
      );
    });
  });

  describe('CEP Formatting', () => {
    it('formats 8-digit CEP correctly', () => {
      expect(addressService.formatCep('01234567')).toBe('01234-567');
    });

    it('returns original value for invalid CEP', () => {
      expect(addressService.formatCep('123')).toBe('123');
      expect(addressService.formatCep('abc')).toBe('abc');
    });

    it('handles already formatted CEP', () => {
      expect(addressService.formatCep('01234-567')).toBe('01234-567');
    });
  });

  describe('Address Display Formatting', () => {
    const mockAddress: DeliveryAddress = {
      id: 1,
      label: 'Casa',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234567',
      is_default: true
    };

    it('formats address for display', () => {
      const formatted = addressService.formatAddressForDisplay(mockAddress);
      expect(formatted).toBe('Rua das Flores, 123, Apto 45, Centro, São Paulo, SP');
    });

    it('handles missing complement', () => {
      const addressWithoutComplement = { ...mockAddress, complement: undefined };
      const formatted = addressService.formatAddressForDisplay(addressWithoutComplement);
      expect(formatted).toBe('Rua das Flores, 123, Centro, São Paulo, SP');
    });
  });

  describe('Customer Address API Operations', () => {
    const mockAddresses: DeliveryAddress[] = [
      {
        id: 1,
        label: 'Casa',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234567',
        is_default: true
      }
    ];

    it('gets customer addresses successfully', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { data: mockAddresses } });

      const result = await addressService.getCustomerAddresses('customer-123');

      expect(mockApi.get).toHaveBeenCalledWith('/customers/customer-123/addresses');
      expect(result).toEqual(mockAddresses);
    });

    it('handles API error when getting addresses', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(addressService.getCustomerAddresses('customer-123'))
        .rejects.toThrow('Erro ao carregar endereços');
    });

    it('creates address successfully', async () => {
      const addressData: AddressFormData = {
        label: 'Casa',
        zip_code: '01234567',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        is_default: true
      };

      const createdAddress = { ...addressData, id: 1 };
      mockApi.post.mockResolvedValueOnce({ data: { data: createdAddress } });

      const result = await addressService.createAddress('customer-123', addressData);

      expect(mockApi.post).toHaveBeenCalledWith('/customers/customer-123/addresses', {
        ...addressData,
        customer_id: 'customer-123'
      });
      expect(result).toEqual(createdAddress);
    });

    it('validates address before creating', async () => {
      const invalidData: AddressFormData = {
        label: '',
        zip_code: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        is_default: false
      };

      await expect(addressService.createAddress('customer-123', invalidData))
        .rejects.toThrow('Nome do endereço é obrigatório');

      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('updates address successfully', async () => {
      const updatedAddress = { id: 1, label: 'Trabalho' };
      mockApi.put.mockResolvedValueOnce({ data: { data: updatedAddress } });

      const result = await addressService.updateAddress(1, { label: 'Trabalho' });

      expect(mockApi.put).toHaveBeenCalledWith('/addresses/1', { label: 'Trabalho' });
      expect(result).toEqual(updatedAddress);
    });

    it('deletes address successfully', async () => {
      mockApi.delete.mockResolvedValueOnce({});

      await addressService.deleteAddress(1);

      expect(mockApi.delete).toHaveBeenCalledWith('/addresses/1');
    });

    it('sets default address successfully', async () => {
      mockApi.post.mockResolvedValueOnce({});

      await addressService.setDefaultAddress(1);

      expect(mockApi.post).toHaveBeenCalledWith('/addresses/1/set-default');
    });
  });

  describe('Guest Address Management', () => {
    const mockGuestAddress: DeliveryAddress = {
      id: 1,
      label: 'Casa',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234567',
      is_default: true
    };

    it('saves guest address to session storage', () => {
      mockSessionStorage.getItem.mockReturnValue('[]');

      addressService.saveGuestAddress(mockGuestAddress);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'guest_addresses',
        expect.stringContaining('"label":"Casa"')
      );
    });

    it('gets guest addresses from session storage', () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify([mockGuestAddress]));

      const result = addressService.getGuestAddresses();

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('guest_addresses');
      expect(result).toEqual([mockGuestAddress]);
    });

    it('returns empty array when no guest addresses exist', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = addressService.getGuestAddresses();

      expect(result).toEqual([]);
    });

    it('handles JSON parse errors gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json');

      const result = addressService.getGuestAddresses();

      expect(result).toEqual([]);
    });

    it('updates guest address in session storage', () => {
      const existingAddresses = [mockGuestAddress];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(existingAddresses));

      addressService.updateGuestAddress(1, { label: 'Trabalho' });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'guest_addresses',
        expect.stringContaining('"label":"Trabalho"')
      );
    });

    it('deletes guest address from session storage', () => {
      const existingAddresses = [mockGuestAddress, { ...mockGuestAddress, id: 2 }];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(existingAddresses));

      addressService.deleteGuestAddress(1);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'guest_addresses',
        expect.not.stringContaining('"id":1')
      );
    });

    it('clears all guest addresses', () => {
      addressService.clearGuestAddresses();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('guest_addresses');
    });

    it('sets first address as default automatically', () => {
      mockSessionStorage.getItem.mockReturnValue('[]');

      const newAddress = { ...mockGuestAddress, is_default: false };
      addressService.saveGuestAddress(newAddress);

      const savedData = JSON.parse(mockSessionStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].is_default).toBe(true);
    });

    it('updates default address when new default is added', () => {
      const existingAddresses = [{ ...mockGuestAddress, id: 1, is_default: true }];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(existingAddresses));

      const newDefaultAddress = { ...mockGuestAddress, id: 2, is_default: true };
      addressService.saveGuestAddress(newDefaultAddress);

      const savedData = JSON.parse(mockSessionStorage.setItem.mock.calls[0][1]);
      expect(savedData.find((addr: any) => addr.id === 1)?.is_default).toBe(false);
      expect(savedData.find((addr: any) => addr.id === 2)?.is_default).toBe(true);
    });
  });
});