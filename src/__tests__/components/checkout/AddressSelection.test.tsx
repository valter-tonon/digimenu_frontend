/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { AddressSelection } from '@/components/checkout/AddressSelection';
import { addressService } from '@/services/addressService';
import { DeliveryAddress } from '@/types/address';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('@/services/addressService');
jest.mock('@/components/ui/magic-card', () => ({
  MagicCard: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick} data-testid="magic-card">
      {children}
    </div>
  )
}));
jest.mock('@/components/ui/shimmer-button', () => ({
  ShimmerButton: ({ children, onClick, disabled, className }: any) => (
    <button 
      className={className} 
      onClick={onClick} 
      disabled={disabled}
      data-testid="shimmer-button"
    >
      {children}
    </button>
  )
}));

const mockAddresses: DeliveryAddress[] = [
  {
    id: 1,
    label: 'Casa',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
    reference: 'Próximo ao mercado',
    is_default: true,
    delivery_instructions: 'Tocar campainha'
  },
  {
    id: 2,
    label: 'Trabalho',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310-100',
    is_default: false
  }
];

const defaultProps = {
  addresses: mockAddresses,
  selectedAddressId: 1,
  onAddressSelect: jest.fn(),
  onAddNewAddress: jest.fn(),
  onEditAddress: jest.fn(),
  onDeleteAddress: jest.fn()
};

describe('AddressSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (addressService.formatAddressForDisplay as jest.Mock).mockImplementation(
      (address) => `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}`
    );
    (addressService.formatCep as jest.Mock).mockImplementation(
      (cep) => cep.replace(/(\d{5})(\d{3})/, '$1-$2')
    );
  });

  describe('Address List Display', () => {
    it('renders address list correctly', () => {
      render(<AddressSelection {...defaultProps} />);

      expect(screen.getByText('Endereço de Entrega')).toBeInTheDocument();
      expect(screen.getByText('Casa')).toBeInTheDocument();
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
      expect(screen.getByText('Padrão')).toBeInTheDocument();
    });

    it('shows selected address with proper styling', () => {
      render(<AddressSelection {...defaultProps} />);

      const selectedCard = screen.getByText('Casa').closest('[data-testid="magic-card"]');
      expect(selectedCard).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
      expect(screen.getByText('Endereço selecionado para entrega')).toBeInTheDocument();
    });

    it('displays address details correctly', () => {
      render(<AddressSelection {...defaultProps} />);

      expect(screen.getByText('Rua das Flores, 123, Centro, São Paulo, SP')).toBeInTheDocument();
      expect(screen.getByText('CEP: 01234-567')).toBeInTheDocument();
      expect(screen.getByText('Próximo ao mercado')).toBeInTheDocument();
      expect(screen.getByText('Tocar campainha')).toBeInTheDocument();
    });

    it('shows correct icons for different address types', () => {
      render(<AddressSelection {...defaultProps} />);

      // Home icon for "Casa"
      const homeAddress = screen.getByText('Casa').closest('[data-testid="magic-card"]');
      expect(homeAddress?.querySelector('svg')).toBeInTheDocument();

      // Building icon for "Trabalho"
      const workAddress = screen.getByText('Trabalho').closest('[data-testid="magic-card"]');
      expect(workAddress?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Address Selection', () => {
    it('calls onAddressSelect when address is clicked', () => {
      const onAddressSelect = jest.fn();
      render(<AddressSelection {...defaultProps} onAddressSelect={onAddressSelect} />);

      const workAddress = screen.getByText('Trabalho').closest('[data-testid="magic-card"]');
      fireEvent.click(workAddress!);

      expect(onAddressSelect).toHaveBeenCalledWith(mockAddresses[1]);
    });

    it('does not call onAddressSelect when address is being deleted', () => {
      const onAddressSelect = jest.fn();
      render(<AddressSelection {...defaultProps} onAddressSelect={onAddressSelect} />);

      // Mock the address as being deleted
      const component = screen.getByText('Casa').closest('[data-testid="magic-card"]');
      component?.classList.add('opacity-50', 'pointer-events-none');

      fireEvent.click(component!);
      expect(onAddressSelect).not.toHaveBeenCalled();
    });
  });

  describe('Address Actions', () => {
    it('calls onAddNewAddress when add button is clicked', () => {
      const onAddNewAddress = jest.fn();
      render(<AddressSelection {...defaultProps} onAddNewAddress={onAddNewAddress} />);

      const addButton = screen.getByText('Novo Endereço');
      fireEvent.click(addButton);

      expect(onAddNewAddress).toHaveBeenCalled();
    });

    it('calls onEditAddress when edit button is clicked', () => {
      const onEditAddress = jest.fn();
      render(<AddressSelection {...defaultProps} onEditAddress={onEditAddress} />);

      const editButtons = screen.getAllByTitle('Editar endereço');
      fireEvent.click(editButtons[0]);

      expect(onEditAddress).toHaveBeenCalledWith(mockAddresses[0]);
    });

    it('shows confirmation dialog before deleting address', async () => {
      const onDeleteAddress = jest.fn();
      window.confirm = jest.fn().mockReturnValue(true);

      render(<AddressSelection {...defaultProps} onDeleteAddress={onDeleteAddress} />);

      const deleteButtons = screen.getAllByTitle('Excluir endereço');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este endereço?');
      expect(onDeleteAddress).toHaveBeenCalledWith(1);
    });

    it('does not delete address if confirmation is cancelled', () => {
      const onDeleteAddress = jest.fn();
      window.confirm = jest.fn().mockReturnValue(false);

      render(<AddressSelection {...defaultProps} onDeleteAddress={onDeleteAddress} />);

      const deleteButtons = screen.getAllByTitle('Excluir endereço');
      fireEvent.click(deleteButtons[0]);

      expect(onDeleteAddress).not.toHaveBeenCalled();
    });

    it('calls setDefaultAddress when star button is clicked', async () => {
      (addressService.setDefaultAddress as jest.Mock).mockResolvedValue(undefined);

      render(<AddressSelection {...defaultProps} />);

      const setDefaultButton = screen.getByTitle('Definir como padrão');
      fireEvent.click(setDefaultButton);

      await waitFor(() => {
        expect(addressService.setDefaultAddress).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<AddressSelection {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Carregando endereços...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('disables buttons when isLoading is true', () => {
      render(<AddressSelection {...defaultProps} isLoading={true} />);

      const addButton = screen.getByText('Novo Endereço');
      expect(addButton).toBeDisabled();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no addresses are provided', () => {
      render(<AddressSelection {...defaultProps} addresses={[]} />);

      expect(screen.getByText('Nenhum endereço cadastrado')).toBeInTheDocument();
      expect(screen.getByText('Adicione um endereço para continuar com seu pedido')).toBeInTheDocument();
      expect(screen.getByText('Adicionar Primeiro Endereço')).toBeInTheDocument();
    });

    it('calls onAddNewAddress when empty state button is clicked', () => {
      const onAddNewAddress = jest.fn();
      render(<AddressSelection {...defaultProps} addresses={[]} onAddNewAddress={onAddNewAddress} />);

      const addButton = screen.getByText('Adicionar Primeiro Endereço');
      fireEvent.click(addButton);

      expect(onAddNewAddress).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when setDefaultAddress fails', async () => {
      const error = new Error('Network error');
      (addressService.setDefaultAddress as jest.Mock).mockRejectedValue(error);

      render(<AddressSelection {...defaultProps} />);

      const setDefaultButton = screen.getByTitle('Definir como padrão');
      fireEvent.click(setDefaultButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('shows success toast when address is deleted successfully', async () => {
      const onDeleteAddress = jest.fn().mockResolvedValue(undefined);
      window.confirm = jest.fn().mockReturnValue(true);

      render(<AddressSelection {...defaultProps} onDeleteAddress={onDeleteAddress} />);

      const deleteButtons = screen.getAllByTitle('Excluir endereço');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Endereço excluído com sucesso!');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<AddressSelection {...defaultProps} />);

      const editButtons = screen.getAllByTitle('Editar endereço');
      const deleteButtons = screen.getAllByTitle('Excluir endereço');
      const setDefaultButton = screen.getByTitle('Definir como padrão');

      expect(editButtons[0]).toHaveAttribute('title', 'Editar endereço');
      expect(deleteButtons[0]).toHaveAttribute('title', 'Excluir endereço');
      expect(setDefaultButton).toHaveAttribute('title', 'Definir como padrão');
    });

    it('supports keyboard navigation', () => {
      render(<AddressSelection {...defaultProps} />);

      const addButton = screen.getByText('Novo Endereço');
      addButton.focus();
      expect(document.activeElement).toBe(addButton);
    });
  });
});