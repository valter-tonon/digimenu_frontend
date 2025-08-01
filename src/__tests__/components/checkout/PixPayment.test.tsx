import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PixPayment } from '@/components/checkout/PixPayment';
import { vi } from 'vitest';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('PixPayment', () => {
  const mockProps = {
    orderId: 'order-123',
    amount: 25.50,
    pixCode: '00020126580014BR.GOV.BCB.PIX0136order-123520400005303986540525.505802BR5925RESTAURANTE TESTE6009SAO PAULO62070503***6304',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PIX_CODE_order-123',
    onPaymentConfirmed: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders PIX payment interface', () => {
    render(<PixPayment {...mockProps} />);
    
    expect(screen.getByText('Pagamento PIX')).toBeInTheDocument();
    expect(screen.getByText('Escaneie o QR Code ou copie o código PIX')).toBeInTheDocument();
    expect(screen.getByText('R$ 25,50')).toBeInTheDocument();
  });

  it('displays QR code when provided', () => {
    render(<PixPayment {...mockProps} />);
    
    const qrCodeImage = screen.getByAltText('QR Code PIX');
    expect(qrCodeImage).toBeInTheDocument();
    expect(qrCodeImage).toHaveAttribute('src', mockProps.qrCodeUrl);
  });

  it('shows loading state when QR code is not available', () => {
    render(<PixPayment {...mockProps} qrCodeUrl={undefined} />);
    
    expect(screen.getByText('Gerando QR Code...')).toBeInTheDocument();
  });

  it('displays PIX code input when provided', () => {
    render(<PixPayment {...mockProps} />);
    
    const pixCodeInput = screen.getByDisplayValue(mockProps.pixCode);
    expect(pixCodeInput).toBeInTheDocument();
    expect(pixCodeInput).toHaveAttribute('readonly');
  });

  it('copies PIX code to clipboard when copy button is clicked', async () => {
    render(<PixPayment {...mockProps} />);
    
    const copyButton = screen.getByText('Copiar');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProps.pixCode);
    
    await waitFor(() => {
      expect(screen.getByText('Copiado')).toBeInTheDocument();
    });
  });

  it('shows "Copiado" feedback temporarily after copying', async () => {
    render(<PixPayment {...mockProps} />);
    
    const copyButton = screen.getByText('Copiar');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Copiado')).toBeInTheDocument();
    });
    
    // Fast-forward time to check if it reverts back
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(screen.getByText('Copiar')).toBeInTheDocument();
    });
  });

  it('displays countdown timer', () => {
    render(<PixPayment {...mockProps} />);
    
    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  it('updates countdown timer every second', async () => {
    render(<PixPayment {...mockProps} />);
    
    expect(screen.getByText('15:00')).toBeInTheDocument();
    
    // Advance timer by 1 second
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('14:59')).toBeInTheDocument();
    });
  });

  it('shows expired state when timer reaches zero', async () => {
    render(<PixPayment {...mockProps} />);
    
    // Fast-forward to expiration
    vi.advanceTimersByTime(15 * 60 * 1000);
    
    await waitFor(() => {
      expect(screen.getByText('PIX Expirado')).toBeInTheDocument();
      expect(screen.getByText('O tempo para pagamento expirou. Gere um novo PIX para continuar.')).toBeInTheDocument();
    });
  });

  it('shows confirmed state when payment is confirmed', () => {
    render(<PixPayment {...mockProps} />);
    
    // Simulate payment confirmation in development
    if (process.env.NODE_ENV === 'development') {
      const simulateButton = screen.getByText('[DEV] Simular Pagamento Confirmado');
      fireEvent.click(simulateButton);
      
      expect(screen.getByText('Pagamento Confirmado!')).toBeInTheDocument();
      expect(screen.getByText('Seu pagamento PIX foi processado com sucesso.')).toBeInTheDocument();
      expect(mockProps.onPaymentConfirmed).toHaveBeenCalled();
    }
  });

  it('displays payment instructions', () => {
    render(<PixPayment {...mockProps} />);
    
    expect(screen.getByText('Como pagar:')).toBeInTheDocument();
    expect(screen.getByText('1. Abra o app do seu banco')).toBeInTheDocument();
    expect(screen.getByText('2. Escolha a opção PIX')).toBeInTheDocument();
    expect(screen.getByText('3. Escaneie o QR Code ou cole o código')).toBeInTheDocument();
    expect(screen.getByText('4. Confirme o pagamento')).toBeInTheDocument();
  });

  it('shows waiting status', () => {
    render(<PixPayment {...mockProps} />);
    
    expect(screen.getByText('Aguardando confirmação do pagamento...')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(<PixPayment {...mockProps} amount={1234.56} />);
    
    expect(screen.getByText('R$ 1.234,56')).toBeInTheDocument();
  });

  it('shows time in red when less than 5 minutes remaining', async () => {
    render(<PixPayment {...mockProps} />);
    
    // Fast-forward to 4 minutes remaining
    vi.advanceTimersByTime(11 * 60 * 1000);
    
    await waitFor(() => {
      const timeElement = screen.getByText('04:00');
      expect(timeElement).toHaveClass('text-red-600');
    });
  });

  it('shows time in green when more than 5 minutes remaining', () => {
    render(<PixPayment {...mockProps} />);
    
    const timeElement = screen.getByText('15:00');
    expect(timeElement).toHaveClass('text-green-600');
  });

  it('handles copy error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('Copy failed'));
    
    render(<PixPayment {...mockProps} />);
    
    const copyButton = screen.getByText('Copiar');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy PIX code:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('shows reload button in expired state', async () => {
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });
    
    render(<PixPayment {...mockProps} />);
    
    // Fast-forward to expiration
    vi.advanceTimersByTime(15 * 60 * 1000);
    
    await waitFor(() => {
      const reloadButton = screen.getByText('Gerar Novo PIX');
      expect(reloadButton).toBeInTheDocument();
      
      fireEvent.click(reloadButton);
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  it('does not show development button in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(<PixPayment {...mockProps} />);
    
    expect(screen.queryByText('[DEV] Simular Pagamento Confirmado')).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });
});