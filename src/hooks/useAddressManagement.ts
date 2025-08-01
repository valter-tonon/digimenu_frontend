/**
 * Address Management Hook
 * 
 * Provides comprehensive address management functionality including
 * CRUD operations, guest address handling, and integration with authentication state.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { addressService } from '@/services/addressService';
import { 
  DeliveryAddress, 
  AddressFormData 
} from '@/types/address';
import { toast } from 'react-hot-toast';

export interface UseAddressManagementReturn {
  // State
  addresses: DeliveryAddress[];
  selectedAddress: DeliveryAddress | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  loadAddresses: () => Promise<void>;
  selectAddress: (address: DeliveryAddress) => void;
  createAddress: (addressData: AddressFormData) => Promise<DeliveryAddress>;
  updateAddress: (addressId: number, addressData: Partial<AddressFormData>) => Promise<DeliveryAddress>;
  deleteAddress: (addressId: number) => Promise<void>;
  setDefaultAddress: (addressId: number) => Promise<void>;
  clearAddresses: () => void;

  // Utilities
  getDefaultAddress: () => DeliveryAddress | null;
  hasAddresses: boolean;
  isGuest: boolean;
}

export const useAddressManagement = (): UseAddressManagementReturn => {
  const { isAuthenticated, customer } = useAuth();
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGuest = !isAuthenticated || !customer;

  /**
   * Loads addresses based on authentication state
   */
  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let loadedAddresses: DeliveryAddress[] = [];

      if (isGuest) {
        // Load guest addresses from session storage
        loadedAddresses = addressService.getGuestAddresses();
      } else if (customer?.uuid) {
        // Load customer addresses from API
        loadedAddresses = await addressService.getCustomerAddresses(customer.uuid);
      }

      setAddresses(loadedAddresses);

      // Auto-select default address if none is selected
      if (!selectedAddress && loadedAddresses.length > 0) {
        const defaultAddress = loadedAddresses.find(addr => addr.is_default) || loadedAddresses[0];
        setSelectedAddress(defaultAddress);
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar endereços';
      setError(errorMessage);
      console.error('Error loading addresses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, customer?.uuid, selectedAddress]);

  /**
   * Selects an address
   */
  const selectAddress = useCallback((address: DeliveryAddress) => {
    setSelectedAddress(address);
  }, []);

  /**
   * Creates a new address
   */
  const createAddress = useCallback(async (addressData: AddressFormData): Promise<DeliveryAddress> => {
    setIsSubmitting(true);
    setError(null);

    try {
      let newAddress: DeliveryAddress;

      if (isGuest) {
        // Create guest address
        newAddress = {
          ...addressData,
          id: Date.now(), // Temporary ID for guest
          created_at: new Date().toISOString()
        };
        addressService.saveGuestAddress(newAddress);
      } else if (customer?.uuid) {
        // Create customer address via API
        newAddress = await addressService.createAddress(customer.uuid, addressData);
      } else {
        throw new Error('Usuário não autenticado');
      }

      // Reload addresses to get updated list
      await loadAddresses();

      // Auto-select the new address if it's the first one or marked as default
      if (addresses.length === 0 || newAddress.is_default) {
        setSelectedAddress(newAddress);
      }

      toast.success('Endereço criado com sucesso!');
      return newAddress;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar endereço';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isGuest, customer?.uuid, addresses.length, loadAddresses]);

  /**
   * Updates an existing address
   */
  const updateAddress = useCallback(async (
    addressId: number, 
    addressData: Partial<AddressFormData>
  ): Promise<DeliveryAddress> => {
    setIsSubmitting(true);
    setError(null);

    try {
      let updatedAddress: DeliveryAddress;

      if (isGuest) {
        // Update guest address
        addressService.updateGuestAddress(addressId, addressData);
        const guestAddresses = addressService.getGuestAddresses();
        updatedAddress = guestAddresses.find(addr => addr.id === addressId)!;
      } else {
        // Update customer address via API
        updatedAddress = await addressService.updateAddress(addressId, addressData);
      }

      // Reload addresses to get updated list
      await loadAddresses();

      // Update selected address if it was the one being edited
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(updatedAddress);
      }

      toast.success('Endereço atualizado com sucesso!');
      return updatedAddress;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar endereço';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isGuest, selectedAddress?.id, loadAddresses]);

  /**
   * Deletes an address
   */
  const deleteAddress = useCallback(async (addressId: number): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isGuest) {
        // Delete guest address
        addressService.deleteGuestAddress(addressId);
      } else {
        // Delete customer address via API
        await addressService.deleteAddress(addressId);
      }

      // Reload addresses to get updated list
      await loadAddresses();

      // Clear selected address if it was the one being deleted
      if (selectedAddress?.id === addressId) {
        const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
        const newSelected = remainingAddresses.find(addr => addr.is_default) || remainingAddresses[0] || null;
        setSelectedAddress(newSelected);
      }

      toast.success('Endereço excluído com sucesso!');

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir endereço';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isGuest, selectedAddress?.id, addresses, loadAddresses]);

  /**
   * Sets an address as default
   */
  const setDefaultAddress = useCallback(async (addressId: number): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isGuest) {
        // Update guest addresses to set new default
        const guestAddresses = addressService.getGuestAddresses();
        const updatedAddresses = guestAddresses.map(addr => ({
          ...addr,
          is_default: addr.id === addressId
        }));
        
        // Save updated addresses
        sessionStorage.setItem('guest_addresses', JSON.stringify(updatedAddresses));
      } else {
        // Set default via API
        await addressService.setDefaultAddress(addressId);
      }

      // Reload addresses to get updated list
      await loadAddresses();

      toast.success('Endereço padrão definido!');

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao definir endereço padrão';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isGuest, loadAddresses]);

  /**
   * Clears all addresses
   */
  const clearAddresses = useCallback(() => {
    setAddresses([]);
    setSelectedAddress(null);
    setError(null);

    if (isGuest) {
      addressService.clearGuestAddresses();
    }
  }, [isGuest]);

  /**
   * Gets the default address
   */
  const getDefaultAddress = useCallback((): DeliveryAddress | null => {
    return addresses.find(addr => addr.is_default) || null;
  }, [addresses]);

  // Load addresses when authentication state changes
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Clear guest addresses when user logs in
  useEffect(() => {
    if (!isGuest && addresses.length === 0) {
      addressService.clearGuestAddresses();
    }
  }, [isGuest, addresses.length]);

  return {
    // State
    addresses,
    selectedAddress,
    isLoading,
    isSubmitting,
    error,

    // Actions
    loadAddresses,
    selectAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    clearAddresses,

    // Utilities
    getDefaultAddress,
    hasAddresses: addresses.length > 0,
    isGuest
  };
};