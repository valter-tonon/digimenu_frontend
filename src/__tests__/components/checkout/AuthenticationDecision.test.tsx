import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthenticationDecision } from '@/components/checkout/AuthenticationDecision';
import { useAuth } from '@/hooks/use-auth';
import { useCheckoutSession } from '@/services/checkoutSession';
import { toast } from 'react-hot-toast';

// Mock dependencies
vi.mock('@/hooks/use-auth');
vi.mock('@/services/checkoutSession');
vi.mock('react-hot-toast');
vi.mock('@/components/checkout/AuthenticationFlow', () => ({
  AuthenticationFlow: ({ onAuthenticationComplete, onSkipAuthentication }: any) => (
    <div data-testid="authentication-flow">
      <button onClick={() => onAuthenticationComplete({ name: 'Test User', phone: '11999999999' }, false)}>
        Complete Auth
      </button>
      <button onClick={onSkipAuthentication}>Skip Auth</button>
    </div>
  )
}));
vi.mock('@/components/checkout/LoginRegisterModal', () => ({
  LoginRegisterModal: ({ isOpen, onSuccess, onClose }: any) => 
    isOpen ? (
      <div data-testid="login-modal">
        <button onClick={() => onSuccess({ name: 'Modal User', phone: '11888888888' })}>
          Modal Success
        </button>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseCheckoutSession = vi.mocked(useCheckoutSession);
const mockToast = vi.mocked(toast);

describe('AuthenticationDecision', () => {
  const mockProps = {
    storeId: '123',
    onAuthenticationComplete: vi.fn(),
    allowGuestCheckout: true,
    showSessionInfo: false
  };

  const mockSession = {
    id: 'test-session',
    storeId: '123',
    isAuthenticated: false,
    isGuest: false,
    currentStep: 'authentication' as const,
    startedAt: new Date(),
    lastActivity: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  };

  const mockSessionHook = {
    session: mockSession,
    loading: false,
    updateSession: vi.fn(),
    setCustomerAuthentication: vi.fn(),
    setAuthenticationMethod: vi.fn(),
    setCurrentStep: vi.fn(),
    clearSession: vi.fn(),
    extendSession: vi.fn(),
    isValid: true,
    progressPercentage: 20,
    shouldPromptAuthentication: vi.fn(() => true),
    getNextStepAfterAuthentication: vi.fn((isAuth, isGuest) => isGuest ? 'customer_data' : 'address')
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

    mockUseCheckoutSession.mockReturnValue(mockSessionHook);
  });

  describe('Initial State', () => {
    it('should render initial decision options', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      expect(screen.getByText('Identificação')).toBeInTheDocument();
      expect(screen.getByText('Como você gostaria de continuar com seu pedido?')).toBeInTheDocument();
      expect(screen.getByText('Identificar por Telefone')).toBeInTheDocument();
      expect(screen.getByText('Entrar ou Criar Conta')).toBeInTheDocument();
      expect(screen.getByText('Continuar como Visitante')).toBeInTheDocument();
    });

    it('should hide guest checkout option when not allowed', () => {
      render(<AuthenticationDecision {...mockProps} allowGuestCheckout={false} />);
      
      expect(screen.getByText('Identificar por Telefone')).toBeInTheDocument();
      expect(screen.getByText('Entrar ou Criar Conta')).toBeInTheDocument();
      expect(screen.queryByText('Continuar como Visitante')).not.toBeInTheDocument();
    });

    it('should show session info when enabled', () => {
      render(<AuthenticationDecision {...mockProps} showSessionInfo={true} />);
      
      expect(screen.getByText('Progresso: 20%')).toBeInTheDocument();
    });

    it('should show benefits information', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      expect(screen.getByText('Vantagens de se identificar:')).toBeInTheDocument();
      expect(screen.getByText('• Histórico de pedidos')).toBeInTheDocument();
      expect(screen.getByText('• Endereços salvos')).toBeInTheDocument();
      expect(screen.getByText('• Pedidos mais rápidos')).toBeInTheDocument();
      expect(screen.getByText('• Ofertas personalizadas')).toBeInTheDocument();
    });
  });

  describe('Already Authenticated User', () => {
    it('should complete authentication immediately for authenticated user', () => {
      const mockCustomer = { id: 1, name: 'Authenticated User', phone: '11999999999' };
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        customer: mockCustomer,
        login: vi.fn(),
        logoutUser: vi.fn(),
        isLoading: false,
        token: 'test-token'
      });

      render(<AuthenticationDecision {...mockProps} />);
      
      expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument();
      expect(screen.getByText('Authenticated User')).toBeInTheDocument();
      expect(screen.getByText('Você está autenticado e pode continuar com seu pedido.')).toBeInTheDocument();
    });

    it('should call onAuthenticationComplete for authenticated user', () => {
      const mockCustomer = { id: 1, name: 'Authenticated User', phone: '11999999999' };
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        customer: mockCustomer,
        login: vi.fn(),
        logoutUser: vi.fn(),
        isLoading: false,
        token: 'test-token'
      });

      render(<AuthenticationDecision {...mockProps} />);
      
      expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(mockCustomer, false);
    });
  });

  describe('Phone Authentication Flow', () => {
    it('should switch to phone flow when phone authentication is selected', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      
      expect(mockSessionHook.setAuthenticationMethod).toHaveBeenCalledWith('phone');
      expect(screen.getByTestId('authentication-flow')).toBeInTheDocument();
      expect(screen.getByText('← Voltar às opções')).toBeInTheDocument();
    });

    it('should allow going back from phone flow to initial decision', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      expect(screen.getByTestId('authentication-flow')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('← Voltar às opções'));
      expect(screen.getByText('Como você gostaria de continuar com seu pedido?')).toBeInTheDocument();
    });

    it('should handle authentication completion from phone flow', async () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      fireEvent.click(screen.getByText('Complete Auth'));
      
      await waitFor(() => {
        expect(mockSessionHook.setCustomerAuthentication).toHaveBeenCalledWith(
          { name: 'Test User', phone: '11999999999' },
          false,
          'existing_account'
        );
        expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(
          { name: 'Test User', phone: '11999999999' },
          false
        );
        expect(mockToast.success).toHaveBeenCalledWith('Autenticação realizada com sucesso!');
      });
    });

    it('should handle skip authentication from phone flow', async () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      fireEvent.click(screen.getByText('Skip Auth'));
      
      await waitFor(() => {
        expect(mockSessionHook.setCustomerAuthentication).toHaveBeenCalledWith(
          { name: '', phone: '', email: '' },
          true,
          'guest'
        );
        expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(
          { name: '', phone: '', email: '' },
          true
        );
        expect(mockToast.success).toHaveBeenCalledWith('Continuando como visitante');
      });
    });
  });

  describe('Login Modal Flow', () => {
    it('should open login modal when login option is selected', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Entrar ou Criar Conta'));
      
      expect(mockSessionHook.setAuthenticationMethod).toHaveBeenCalledWith('existing_account');
      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    });

    it('should handle successful login from modal', async () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Entrar ou Criar Conta'));
      fireEvent.click(screen.getByText('Modal Success'));
      
      await waitFor(() => {
        expect(mockSessionHook.setCustomerAuthentication).toHaveBeenCalledWith(
          { name: 'Modal User', phone: '11888888888' },
          false,
          'existing_account'
        );
        expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(
          { name: 'Modal User', phone: '11888888888' },
          false
        );
        expect(mockToast.success).toHaveBeenCalledWith('Autenticação realizada com sucesso!');
      });
    });

    it('should close modal when close button is clicked', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Entrar ou Criar Conta'));
      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Close Modal'));
      expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();
    });
  });

  describe('Guest Checkout Flow', () => {
    it('should handle guest checkout selection', async () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Continuar como Visitante'));
      
      await waitFor(() => {
        expect(mockSessionHook.setAuthenticationMethod).toHaveBeenCalledWith('guest');
        expect(mockSessionHook.setCustomerAuthentication).toHaveBeenCalledWith(
          { name: '', phone: '', email: '' },
          true,
          'guest'
        );
        expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(
          { name: '', phone: '', email: '' },
          true
        );
        expect(mockToast.success).toHaveBeenCalledWith('Continuando como visitante');
      });
    });
  });

  describe('Session Management', () => {
    it('should handle existing guest session', () => {
      const guestSession = {
        ...mockSession,
        isGuest: true,
        customerData: { name: 'Guest User', phone: '11777777777', email: '' }
      };

      mockUseCheckoutSession.mockReturnValue({
        ...mockSessionHook,
        session: guestSession,
        shouldPromptAuthentication: vi.fn(() => false)
      });

      render(<AuthenticationDecision {...mockProps} />);
      
      expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(
        { name: 'Guest User', phone: '11777777777', email: '' },
        true
      );
    });

    it('should determine correct authentication method based on customer data', async () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      // Test with customer (no ID means new account)
      fireEvent.click(screen.getByText('Identificar por Telefone'));
      fireEvent.click(screen.getByText('Complete Auth'));
      
      await waitFor(() => {
        expect(mockSessionHook.setCustomerAuthentication).toHaveBeenCalledWith(
          { name: 'Test User', phone: '11999999999' },
          false,
          'new_account'
        );
      });
    });

    it('should handle session without authentication prompt needed', () => {
      mockUseCheckoutSession.mockReturnValue({
        ...mockSessionHook,
        shouldPromptAuthentication: vi.fn(() => false),
        session: {
          ...mockSession,
          isGuest: false,
          isAuthenticated: true,
          customerData: { name: 'Session User', phone: '11666666666', email: 'test@test.com' }
        }
      });

      render(<AuthenticationDecision {...mockProps} />);
      
      // Should not show initial decision since authentication is not needed
      expect(screen.queryByText('Como você gostaria de continuar com seu pedido?')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication method setting errors gracefully', () => {
      mockSessionHook.setAuthenticationMethod.mockImplementation(() => {
        throw new Error('Session error');
      });

      render(<AuthenticationDecision {...mockProps} />);
      
      // Should not crash when setting authentication method fails
      expect(() => {
        fireEvent.click(screen.getByText('Identificar por Telefone'));
      }).not.toThrow();
    });

    it('should handle customer authentication setting errors gracefully', async () => {
      mockSessionHook.setCustomerAuthentication.mockImplementation(() => {
        throw new Error('Authentication error');
      });

      render(<AuthenticationDecision {...mockProps} />);
      
      fireEvent.click(screen.getByText('Continuar como Visitante'));
      
      // Should not crash when setting customer authentication fails
      await waitFor(() => {
        expect(mockSessionHook.setCustomerAuthentication).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and semantic structure', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'Identificação' })).toBeInTheDocument();
      
      // Check for proper button roles
      expect(screen.getByRole('button', { name: /Identificar por Telefone/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Entrar ou Criar Conta/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continuar como Visitante/ })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      const phoneButton = screen.getByRole('button', { name: /Identificar por Telefone/ });
      const loginButton = screen.getByRole('button', { name: /Entrar ou Criar Conta/ });
      const guestButton = screen.getByRole('button', { name: /Continuar como Visitante/ });
      
      // All buttons should be focusable
      expect(phoneButton).not.toHaveAttribute('tabindex', '-1');
      expect(loginButton).not.toHaveAttribute('tabindex', '-1');
      expect(guestButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Visual States', () => {
    it('should show hover effects on buttons', () => {
      render(<AuthenticationDecision {...mockProps} />);
      
      const phoneButton = screen.getByRole('button', { name: /Identificar por Telefone/ });
      
      expect(phoneButton).toHaveClass('hover:bg-blue-50');
    });

    it('should show progress indicator when session info is enabled', () => {
      render(<AuthenticationDecision {...mockProps} showSessionInfo={true} />);
      
      const progressBar = screen.getByText('Progresso: 20%');
      expect(progressBar).toBeInTheDocument();
      
      // Check for the visual progress bar
      const progressDiv = document.querySelector('.bg-blue-600');
      expect(progressDiv).toHaveStyle({ width: '20%' });
    });
  });
});