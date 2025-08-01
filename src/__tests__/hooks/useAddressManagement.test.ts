/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useAddressManagement } from '@/hooks/useAddressManagement';
import { useAuth } from '@/hooks/use-auth';
import { addressService } from '@/services/addressService';
import { DeliveryAddress, AddressFormData } from '@/types/address';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('@/hooks/use-auth');
jest.mock('@/services/addressService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockAddressService = addressService as jest.Mocked<typeof addressService>;

const mockCustomer = {
  uuid: 'customer-123',
  name: 'John Doe',
  email: 'john@example.com'
};

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
  },
  {
    id: 2,
    label: 'Trabalho',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310100',
    is_default: false
  }
];

describe('useAddressManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddressService.getCustomerAddresses.mockResolvedValue(mockAddresses);
    mockAddressService.getGuestAddresses.mockReturnValue([]);
  });

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        customer: mockCustomer,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });
    });

    it('loads customer addresses on mount', async () => {
      const { result } = renderHook(() => useAddressManagement());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isGuest).toBe(false);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAddressService.getCustomerAddresses).toHaveBeenCalledWith('customer-123');
      expect(result.current.addresses).toEqual(mockAddresses);
      expect(result.current.hasAddresses).toBe(true);
    });

    it('auto-selects default address', async () => {
      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.selectedAddress).toEqual(mockAddresses[0]);
      });
    });

    it('auto-selects first address if no default exists', async () => {
      const addressesWithoutDefault = mockAddresses.map(addr => ({ ...addr, is_default: false }));
      mockAddressService.getCustomerAddresses.mockResolvedValue(addressesWithoutDefault);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.selectedAddress).toEqual(addressesWithoutDefault[0]);
      });
    });

    it('creates new address successfully', async () => {
      const newAddressData: AddressFormData = {
        label: 'Novo Endereço',
        zip_code: '12345678',
        street: 'Rua Nova',
        number: '456',
        neighborhood: 'Novo Bairro',
        city: 'Nova Cidade',
        state: 'SP',
        is_default: false
      };

      const createdAddress: DeliveryAddress = { ...newAddressData, id: 3 };
      mockAddressService.createAddress.mockResolvedValue(createdAddress);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createAddress(newAddressData);
      });

      expect(mockAddressService.createAddress).toHaveBeenCalledWith('customer-123', newAddressData);
      expect(toast.success).toHaveBeenCalledWith('Endereço criado com sucesso!');
    });

    it('updates address successfully', async () => {
      const updatedAddress: DeliveryAddress = { ...mockAddresses[0], label: 'Casa Atualizada' };
      mockAddressService.updateAddress.mockResolvedValue(updatedAddress);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateAddress(1, { label: 'Casa Atualizada' });
      });

      expect(mockAddressService.updateAddress).toHaveBeenCalledWith(1, { label: 'Casa Atualizada' });
      expect(toast.success).toHaveBeenCalledWith('Endereço atualizado com sucesso!');
    });

    it('deletes address successfully', async () => {
      mockAddressService.deleteAddress.mockResolvedValue();

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteAddress(2);
      });

      expect(mockAddressService.deleteAddress).toHaveBeenCalledWith(2);
      expect(toast.success).toHaveBeenCalledWith('Endereço excluído com sucesso!');
    });

    it('sets default address successfully', async () => {
      mockAddressService.setDefaultAddress.mockResolvedValue();

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setDefaultAddress(2);
      });

      expect(mockAddressService.setDefaultAddress).toHaveBeenCalledWith(2);
      expect(toast.success).toHaveBeenCalledWith('Endereço padrão definido!');
    });

    it('handles API errors gracefully', async () => {
      const error = new Error('Network error');
      mockAddressService.getCustomerAddresses.mockRejectedValue(error);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('Guest User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        customer: null,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });
    });

    it('loads guest addresses from session storage', async () => {
      const guestAddresses = [mockAddresses[0]];
      mockAddressService.getGuestAddresses.mockReturnValue(guestAddresses);

      const { result } = renderHook(() => useAddressManagement());

      expect(result.current.isGuest).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAddressService.getGuestAddresses).toHaveBeenCalled();
      expect(result.current.addresses).toEqual(guestAddresses);
    });

    it('saves guest address to session storage', async () => {
      const newAddressData: AddressFormData = {
        label: 'Casa',
        zip_code: '12345678',
        street: 'Rua Nova',
        number: '456',
        neighborhood: 'Novo Bairro',
        city: 'Nova Cidade',
        state: 'SP',
        is_default: true
      };

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createAddress(newAddressData);
      });

      expect(mockAddressService.saveGuestAddress).toHaveBeenCalledWith(
        expect.objectContaining(newAddressData)
      );
      expect(toast.success).toHaveBeenCalledWith('Endereço criado com sucesso!');
    });

    it('updates guest address in session storage', async () => {
      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateAddress(1, { label: 'Casa Atualizada' });
      });

      expect(mockAddressService.updateGuestAddress).toHaveBeenCalledWith(1, { label: 'Casa Atualizada' });
      expect(toast.success).toHaveBeenCalledWith('Endereço atualizado com sucesso!');
    });

    it('deletes guest address from session storage', async () => {
      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteAddress(1);
      });

      expect(mockAddressService.deleteGuestAddress).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('Endereço excluído com sucesso!');
    });

    it('clears guest addresses when user logs in', async () => {
      const { result, rerender } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate user login
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        customer: mockCustomer,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      rerender();

      await waitFor(() => {
        expect(mockAddressService.clearGuestAddresses).toHaveBeenCalled();
      });
    });
  });

  describe('Address Selection', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        customer: mockCustomer,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });
    });

    it('selects address correctly', async () => {
      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectAddress(mockAddresses[1]);
      });

      expect(result.current.selectedAddress).toEqual(mockAddresses[1]);
    });

    it('updates selected address when it is edited', async () => {
      const updatedAddress: DeliveryAddress = { ...mockAddresses[0], label: 'Casa Atualizada' };
      mockAddressService.updateAddress.mockResolvedValue(updatedAddress);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.selectedAddress).toEqual(mockAddresses[0]);
      });

      await act(async () => {
        await result.current.updateAddress(1, { label: 'Casa Atualizada' });
      });

      expect(result.current.selectedAddress).toEqual(updatedAddress);
    });

    it('clears selected address when it is deleted', async () => {
      mockAddressService.deleteAddress.mockResolvedValue();
      // Mock loadAddresses to return addresses without the deleted one
      mockAddressService.getCustomerAddresses.mockResolvedValueOnce(mockAddresses)
        .mockResolvedValueOnce([mockAddresses[1]]);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.selectedAddress).toEqual(mockAddresses[0]);
      });

      await act(async () => {
        await result.current.deleteAddress(1);
      });

      expect(result.current.selectedAddress).toEqual(mockAddresses[1]);
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        customer: mockCustomer,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });
    });

    it('gets default address correctly', async () => {
      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const defaultAddress = result.current.getDefaultAddress();
      expect(defaultAddress).toEqual(mockAddresses[0]);
    });

    it('returns null when no default address exists', async () => {
      const addressesWithoutDefault = mockAddresses.map(addr => ({ ...addr, is_default: false }));
      mockAddressService.getCustomerAddresses.mockResolvedValue(addressesWithoutDefault);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const defaultAddress = result.current.getDefaultAddress();
      expect(defaultAddress).toBeNull();
    });

    it('clears addresses correctly', async () => {
      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.addresses.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.clearAddresses();
      });

      expect(result.current.addresses).toEqual([]);
      expect(result.current.selectedAddress).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        customer: mockCustomer,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });
    });

    it('handles create address errors', async () => {
      const error = new Error('Validation error');
      mockAddressService.createAddress.mockRejectedValue(error);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.createAddress({} as AddressFormData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Validation error');
      expect(result.current.error).toBe('Validation error');
    });

    it('handles update address errors', async () => {
      const error = new Error('Update failed');
      mockAddressService.updateAddress.mockRejectedValue(error);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateAddress(1, { label: 'Test' });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Update failed');
      expect(result.current.error).toBe('Update failed');
    });

    it('handles delete address errors', async () => {
      const error = new Error('Delete failed');
      mockAddressService.deleteAddress.mockRejectedValue(error);

      const { result } = renderHook(() => useAddressManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.deleteAddress(1);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Delete failed');
      expect(result.current.error).toBe('Delete failed');
    });
  });
});