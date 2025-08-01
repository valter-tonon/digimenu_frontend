import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthenticationFlow } from '@/components/checkout/AuthenticationFlow';
import { useAuth } from '@/hooks/use-auth';
import { findCustomerByPhone, quickRegisterCustomer } from '@/services/api';
import { toast } from 'react-hot-toast';

// Mock dependencies
vi.mock('@/hooks/use-auth');
vi.mock('@/services/api');
vi.mock('react-hot-toast');

const mockUseAuth = vi.mocked(useAuth);
const mockFindCustomerByPhone = vi.mocked(findCustomerByPhone);
const mockQuickRegisterCustomer = vi.mocked(quickRegisterCustomer);
const mockToast = vi.mocked(toast);

describe('AuthenticationFlow', () => {
  const mockProps = {
    storeId: '123',
    onAuthenticationComplete: vi.fn(),
    onSkipAuthentication: vi.fn(),
    allowGuestCheckout: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      customer: null,
      login: vi.fn(),
      logoutUser: vi.fn(),
      isLoading: false,
      token: null
    });
  });

  describe('Initial State', () => {
    it('should render decision step by default', () => {
      render(<AuthenticationFlow {...mockProps} />);
      
      expect(screen.getByText('Como deseja continuar?')).toBeInTheDocument();
      expect(screen.getByText('Identificar por Telefone')).toBeInTheDocument();
      expect(screen.getByText('Continuar como Visitante')).toBeInTheDocument();
    });

    it('should hide guest checkout option when not allowed', () => {
      render(<AuthenticationFlow {...mockProps} allowGuestCheckout={false} />);
      
      expect(screen.getByText('Identificar por Telefone')).toBeInTheDocument();
      expect(screen.queryByText('Continuar como Visitante')).not.toBeInTheDocument();
    });

    it('should complete authentication immediately if user is already authenticated', () => {
      const mockCustomer = { id: 1, name: 'Test User', phone: '11999999999' };
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        customer: mockCustomer,
        login: vi.fn(),
        logoutUser: vi.fn(),
        isLoading: false,
        token: 'test-token'
      });

      render(<AuthenticationFlow {...mockProps} />);
      
      expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(mockCustomer, false);
    });
  });

  describe('Phone Input Step', () => {
    beforeEach(() => {
      render(<AuthenticationFlow {...mockProps} />);
      fireEvent.click(screen.getByText('Identificar por Telefone'));
    });

    it('should render phone input form', () => {
      expect(screen.getByText('Identificação')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('(11) 99999-9999')).toBeInTheDocument();
      expect(screen.getByText('Continuar')).toBeInTheDocument();
    });

    it('should format phone number during input', () => {
      const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
      
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      
      expect(phoneInput).toHaveValue('(11) 99999-9999');
    });

    it('should validate phone number before submission', async () => {
      const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
      const continueButton = screen.getByText('Continuar');
      
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Telefone deve ter pelo menos 10 dígitos')).toBeInTheDocument();
      });
    });

    it('should proceed to login step for existing customer', async () => {
      const mockCustomer = { id: 1, name: 'Existing User', phone: '11999999999', email: 'test@test.com' };
      mockFindCustomerByPhone.mockResolvedValue({
        data: { success: true, data: mockCustomer }
      });

      const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
      const continueButton = screen.getByText('Continuar');
      
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Cliente Encontrado')).toBeInTheDocument();
        expect(screen.getByText('Existing User')).toBeInTheDocument();
      });
    });

    it('should proceed to customer data step for new customer', async () => {
      mockFindCustomerByPhone.mockRejectedValue(new Error('Customer not found'));

      const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
      const continueButton = screen.getByText('Continuar');
      
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Seu nome completo')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Data Step', () => {
    beforeEach(async () => {
      mockFindCustomerByPhone.mockRejectedValue(new Error('Customer not found'));
      
      render(<AuthenticationFlow {...mockProps} />);
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      
      const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.click(screen.getByText('Continuar'));
      
      await waitFor(() => {
        expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
      });
    });

    it('should render customer data form', () => {
      expect(screen.getByPlaceholderText('Seu nome completo')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('(11) 99999-9999')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
      expect(screen.getByText('Cadastrar')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      // Clear the name field first
      const nameInput = screen.getByPlaceholderText('Seu nome completo');
      fireEvent.change(nameInput, { target: { value: '' } });
      
      const cadastrarButton = screen.getByText('Cadastrar');
      fireEvent.click(cadastrarButton);
      
      await waitFor(() => {
        expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should validate name length', async () => {
      const nameInput = screen.getByPlaceholderText('Seu nome completo');
      const cadastrarButton = screen.getByText('Cadastrar');
      
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.click(cadastrarButton);
      
      await waitFor(() => {
        expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const nameInput = screen.getByPlaceholderText('Seu nome completo');
      const emailInput = screen.getByPlaceholderText('seu@email.com');
      const cadastrarButton = screen.getByText('Cadastrar');
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(cadastrarButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      });
    });

    it('should register new customer successfully', async () => {
      const mockNewCustomer = { id: 2, name: 'New User', phone: '11999999999' };
      mockQuickRegisterCustomer.mockResolvedValue({
        data: { success: true, data: mockNewCustomer }
      });

      const nameInput = screen.getByPlaceholderText('Seu nome completo');
      const cadastrarButton = screen.getByText('Cadastrar');
      
      fireEvent.change(nameInput, { target: { value: 'New User' } });
      fireEvent.click(cadastrarButton);
      
      await waitFor(() => {
        expect(mockQuickRegisterCustomer).toHaveBeenCalledWith({
          name: 'New User',
          phone: '11999999999',
          email: undefined,
          tenant_id: 123
        });
        expect(mockToast.success).toHaveBeenCalledWith('Cliente cadastrado com sucesso!');
        expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(mockNewCustomer, true);
      });
    });

    it('should handle registration errors', async () => {
      const errorMessage = 'Phone already exists';
      mockQuickRegisterCustomer.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      const nameInput = screen.getByPlaceholderText('Seu nome completo');
      const cadastrarButton = screen.getByText('Cadastrar');
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.click(cadastrarButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Login Step', () => {
    beforeEach(async () => {
      const mockCustomer = { id: 1, name: 'Existing User', phone: '11999999999', email: 'test@test.com' };
      mockFindCustomerByPhone.mockResolvedValue({
        data: { success: true, data: mockCustomer }
      });
      
      render(<AuthenticationFlow {...mockProps} />);
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      
      const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.click(screen.getByText('Continuar'));
      
      await waitFor(() => {
        expect(screen.getByText('Cliente Encontrado')).toBeInTheDocument();
      });
    });

    it('should render existing customer information', () => {
      expect(screen.getByText('Cliente Encontrado')).toBeInTheDocument();
      expect(screen.getByText('Existing User')).toBeInTheDocument();
      expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });

    it('should login existing customer successfully', async () => {
      const mockCustomer = { id: 1, name: 'Existing User', phone: '11999999999' };
      mockFindCustomerByPhone.mockResolvedValue({
        data: { success: true, data: mockCustomer }
      });

      const continueButton = screen.getByText('Continuar');
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Cliente identificado com sucesso!');
        expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(mockCustomer, false);
      });
    });
  });

  describe('Navigation', () => {
    it('should allow going back from phone input to decision', () => {
      render(<AuthenticationFlow {...mockProps} />);
      
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      expect(screen.getByText('Identificação')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Voltar'));
      expect(screen.getByText('Como deseja continuar?')).toBeInTheDocument();
    });

    it('should call onSkipAuthentication when guest checkout is selected', () => {
      render(<AuthenticationFlow {...mockProps} />);
      
      fireEvent.click(screen.getByText('Continuar como Visitante'));
      
      expect(mockProps.onSkipAuthentication).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during phone verification', async () => {
      mockFindCustomerByPhone.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<AuthenticationFlow {...mockProps} />);
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      
      const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
      const continueButton = screen.getByText('Continuar');
      
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(continueButton).toBeDisabled();
        expect(continueButton.querySelector('.animate-spin')).toBeInTheDocument();
      });
    });

    it('should show loading state during customer registration', async () => {
      mockFindCustomerByPhone.mockRejectedValue(new Error('Customer not found'));
      mockQuickRegisterCustomer.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<AuthenticationFlow {...mockProps} />);
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      
      const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.click(screen.getByText('Continuar'));
      
      await waitFor(() => {
        expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByPlaceholderText('Seu nome completo');
      const cadastrarButton = screen.getByText('Cadastrar');
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.click(cadastrarButton);
      
      await waitFor(() => {
        expect(cadastrarButton).toBeDisabled();
      });
    });
  });
});