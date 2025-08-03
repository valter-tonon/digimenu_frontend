import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthenticationFlow } from '@/components/checkout/AuthenticationFlow';
import { useWhatsAppAuth } from '@/hooks/use-whatsapp-auth';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'react-hot-toast';

// Mock the hooks
jest.mock('@/hooks/use-whatsapp-auth');
jest.mock('@/hooks/use-auth');
jest.mock('react-hot-toast');
jest.mock('@/services/api');

const mockUseWhatsAppAuth = useWhatsAppAuth as jest.MockedFunction<typeof useWhatsAppAuth>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('AuthenticationFlow - WhatsApp Magic Links', () => {
  const mockProps = {
    storeId: 'test-store',
    onAuthenticationComplete: jest.fn(),
    onSkipAuthentication: jest.fn(),
    allowGuestCheckout: true,
    initialStep: 'phone_input' as const,
  };

  const mockWhatsAppState = {
    isLoading: false,
    isSuccess: false,
    error: null,
    expiresAt: null,
    isAuthenticated: false,
    user: null,
  };

  const mockWhatsAppActions = {
    requestMagicLink: jest.fn(),
    verifyToken: jest.fn(),
    validateStoredAuth: jest.fn(),
    logout: jest.fn(),
    reset: jest.fn(),
  };

  const mockAuthState = {
    isAuthenticated: false,
    customer: null,
    login: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseWhatsAppAuth.mockReturnValue({
      state: mockWhatsAppState,
      ...mockWhatsAppActions,
    });

    mockUseAuth.mockReturnValue(mockAuthState);
  });

  it('should render phone input step with WhatsApp branding', () => {
    render(<AuthenticationFlow {...mockProps} />);
    
    expect(screen.getByText('Autenticação via WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Digite seu telefone para receber um link mágico')).toBeInTheDocument();
    expect(screen.getByText('Como funciona:')).toBeInTheDocument();
    expect(screen.getByText('Enviaremos um link seguro para seu WhatsApp')).toBeInTheDocument();
  });

  it('should call requestMagicLink when phone is submitted', async () => {
    render(<AuthenticationFlow {...mockProps} />);
    
    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    const submitButton = screen.getByText('Enviar Link');
    
    fireEvent.change(phoneInput, { target: { value: '11999999999' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockWhatsAppActions.requestMagicLink).toHaveBeenCalledWith('11999999999', 'test-store');
    });
  });

  it('should show waiting verification step after successful magic link send', () => {
    const successState = {
      ...mockWhatsAppState,
      isSuccess: true,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    };

    mockUseWhatsAppAuth.mockReturnValue({
      state: successState,
      ...mockWhatsAppActions,
    });

    render(<AuthenticationFlow {...mockProps} initialStep="waiting_verification" />);
    
    expect(screen.getByText('Link Enviado!')).toBeInTheDocument();
    expect(screen.getByText('Enviamos um link mágico para seu WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Como continuar:')).toBeInTheDocument();
    expect(screen.getByText('Abra o WhatsApp no seu celular')).toBeInTheDocument();
  });

  it('should show authenticated step when user is authenticated', () => {
    const authenticatedState = {
      ...mockWhatsAppState,
      isAuthenticated: true,
      user: {
        id: 1,
        uuid: 'test-uuid',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@test.com',
        tenant_id: 'test-store',
      },
    };

    mockUseWhatsAppAuth.mockReturnValue({
      state: authenticatedState,
      ...mockWhatsAppActions,
    });

    render(<AuthenticationFlow {...mockProps} initialStep="authenticated" />);
    
    expect(screen.getByText('Autenticado com Sucesso!')).toBeInTheDocument();
    expect(screen.getByText('Confirme seus dados para continuar')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('11999999999')).toBeInTheDocument();
  });

  it('should show error step when magic link sending fails', () => {
    const errorState = {
      ...mockWhatsAppState,
      error: 'Falha ao enviar mensagem WhatsApp',
    };

    mockUseWhatsAppAuth.mockReturnValue({
      state: errorState,
      ...mockWhatsAppActions,
    });

    render(<AuthenticationFlow {...mockProps} initialStep="error" />);
    
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Não conseguimos enviar o link mágico')).toBeInTheDocument();
    expect(screen.getByText('Falha ao enviar mensagem WhatsApp')).toBeInTheDocument();
  });

  it('should handle "Use another number" action', () => {
    const authenticatedState = {
      ...mockWhatsAppState,
      isAuthenticated: true,
      user: {
        id: 1,
        uuid: 'test-uuid',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@test.com',
        tenant_id: 'test-store',
      },
    };

    mockUseWhatsAppAuth.mockReturnValue({
      state: authenticatedState,
      ...mockWhatsAppActions,
    });

    render(<AuthenticationFlow {...mockProps} initialStep="authenticated" />);
    
    const useAnotherNumberButton = screen.getByText('Usar Outro Número');
    fireEvent.click(useAnotherNumberButton);
    
    expect(mockWhatsAppActions.logout).toHaveBeenCalled();
    expect(mockWhatsAppActions.reset).toHaveBeenCalled();
  });

  it('should call onAuthenticationComplete when user confirms authentication', () => {
    const authenticatedState = {
      ...mockWhatsAppState,
      isAuthenticated: true,
      user: {
        id: 1,
        uuid: 'test-uuid',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@test.com',
        tenant_id: 'test-store',
      },
    };

    mockUseWhatsAppAuth.mockReturnValue({
      state: authenticatedState,
      ...mockWhatsAppActions,
    });

    render(<AuthenticationFlow {...mockProps} initialStep="authenticated" />);
    
    const confirmButton = screen.getByText('Confirmar e Continuar');
    fireEvent.click(confirmButton);
    
    expect(mockProps.onAuthenticationComplete).toHaveBeenCalledWith(authenticatedState.user, false);
  });

  it('should handle retry magic link action', async () => {
    render(<AuthenticationFlow {...mockProps} initialStep="error" />);
    
    const retryButton = screen.getByText('Tentar Novamente');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockWhatsAppActions.reset).toHaveBeenCalled();
    });
  });

  it('should validate phone number before sending magic link', async () => {
    render(<AuthenticationFlow {...mockProps} />);
    
    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    const submitButton = screen.getByText('Enviar Link');
    
    // Try with invalid phone
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Telefone deve ter pelo menos 10 dígitos')).toBeInTheDocument();
    });
    
    expect(mockWhatsAppActions.requestMagicLink).not.toHaveBeenCalled();
  });
});