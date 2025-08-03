import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useWhatsAppAuth } from '@/hooks/use-whatsapp-auth';
import WhatsAppCallbackPage from '@/app/auth/whatsapp/callback/[...params]/page';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  useParams: vi.fn(),
}));

// Mock WhatsApp auth hook
vi.mock('@/hooks/use-whatsapp-auth', () => ({
  useWhatsAppAuth: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

const mockParams = {
  params: [],
};

const mockWhatsAppAuth = {
  verifyToken: jest.fn(),
};

describe('WhatsApp Callback Page', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
    vi.mocked(useParams).mockReturnValue(mockParams);
    vi.mocked(useWhatsAppAuth).mockReturnValue(mockWhatsAppAuth);
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('should render loading state initially', () => {
    mockSearchParams.get.mockReturnValue(null);
    
    render(<WhatsAppCallbackPage />);
    
    expect(screen.getByText('Verificando Autenticação')).toBeInTheDocument();
    expect(screen.getByText('Aguarde enquanto validamos seu link mágico...')).toBeInTheDocument();
  });

  it('should handle direct token callback from backend', async () => {
    const mockToken = 'mock-jwt-token';
    const mockUser = JSON.stringify({
      id: 1,
      name: 'Test User',
      phone: '5511999999999',
      tenant_id: 1
    });
    
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'token') return mockToken;
      if (key === 'user') return encodeURIComponent(mockUser);
      return null;
    });
    
    render(<WhatsAppCallbackPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Autenticação Realizada!')).toBeInTheDocument();
    });
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'whatsapp_auth_jwt',
      expect.stringContaining(mockToken)
    );
  });

  it('should handle magic link verification', async () => {
    const mockToken = 'magic-link-token';
    
    mockSearchParams.get.mockReturnValue(null);
    mockParams.params = [mockToken];
    mockWhatsAppAuth.verifyToken.mockResolvedValue({
      success: true,
      jwt: 'verified-jwt',
      user: { id: 1, name: 'Test User' }
    });
    
    render(<WhatsAppCallbackPage />);
    
    await waitFor(() => {
      expect(mockWhatsAppAuth.verifyToken).toHaveBeenCalledWith(mockToken);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Autenticação Realizada!')).toBeInTheDocument();
    });
  });

  it('should handle expired token error', async () => {
    const mockToken = 'expired-token';
    
    mockSearchParams.get.mockReturnValue(null);
    mockParams.params = [mockToken];
    mockWhatsAppAuth.verifyToken.mockRejectedValue(new Error('Token expired'));
    
    render(<WhatsAppCallbackPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Link Expirado')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Este link expirou. Links mágicos são válidos por apenas 10 minutos')).toBeInTheDocument();
  });

  it('should handle invalid token error', async () => {
    const mockToken = 'invalid-token';
    
    mockSearchParams.get.mockReturnValue(null);
    mockParams.params = [mockToken];
    mockWhatsAppAuth.verifyToken.mockRejectedValue(new Error('Token invalid'));
    
    render(<WhatsAppCallbackPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Link Inválido')).toBeInTheDocument();
    });
    
    expect(screen.getByText('O link que você clicou é inválido ou já foi usado')).toBeInTheDocument();
  });

  it('should handle backend error codes', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'code') return 'TOKEN_INVALID';
      if (key === 'message') return 'Link inválido ou expirado';
      return null;
    });
    
    render(<WhatsAppCallbackPage />);
    
    expect(screen.getByText('Link Inválido')).toBeInTheDocument();
    expect(screen.getByText('O link que você clicou é inválido ou já foi usado')).toBeInTheDocument();
  });

  it('should redirect to checkout after successful authentication', async () => {
    const mockToken = 'mock-jwt-token';
    const mockUser = JSON.stringify({
      id: 1,
      name: 'Test User',
      phone: '5511999999999',
      tenant_id: 1
    });
    
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'token') return mockToken;
      if (key === 'user') return encodeURIComponent(mockUser);
      return null;
    });
    
    render(<WhatsAppCallbackPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Autenticação Realizada!')).toBeInTheDocument();
    });
    
    // Wait for redirect timeout
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/checkout/authentication');
    }, { timeout: 3000 });
  });

  it('should clear auth data when returning to checkout', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'code') return 'TOKEN_INVALID';
      return null;
    });
    
    render(<WhatsAppCallbackPage />);
    
    const returnButton = screen.getByText('Solicitar Novo Link');
    returnButton.click();
    
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('whatsapp_auth_jwt');
    expect(mockRouter.push).toHaveBeenCalledWith('/checkout/authentication');
  });
});