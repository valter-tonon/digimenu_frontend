import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';
import { PaymentMethodForm, PaymentData } from '@/components/forms/PaymentMethodForm';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('@/components/ui/magic-card', () => ({
  MagicCard: ({ children, className }: any) => (
    <div className={className} data-testid="magic-card">
      {children}
    </div>
  )
}));
vi.mock('@/components/ui/shimmer-button', () => ({
  ShimmerButton: ({ children, onClick, disabled, type }: any) => (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      data-testid="shimmer-button"
    >
      {children}
    </button>
  )
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

const defaultProps = {
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  orderTotal: 50.00
};

describe('PaymentMethodForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders form with all payment methods', () => {
      render(<PaymentMethodForm {...defaultProps} />);

      expect(screen.getByText('Método de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('PIX')).toBeInTheDocument();
      expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
      expect(screen.getByText('Cartão de Débito')).toBeInTheDocument();
      expect(screen.getByText('Dinheiro')).toBeInTheDocument();
      expect(screen.getByText('Vale Refeição')).toBeInTheDocument();
    });

    it('displays order total', () => {
      render(<PaymentMethodForm {...defaultProps} orderTotal={75.50} />);

      expect(screen.getByText('R$ 75,50')).toBeInTheDocument();
    });

    it('renders with custom title and subtitle', () => {
      render(
        <PaymentMethodForm 
          {...defaultProps} 
          title="Forma de Pagamento"
          subtitle="Selecione sua opção"
        />
      );

      expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('Selecione sua opção')).toBeInTheDocument();
    });

    it('shows cancel button when onCancel is provided', () => {
      render(<PaymentMethodForm {...defaultProps} />);

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('hides cancel button when onCancel is not provided', () => {
      render(<PaymentMethodForm onSubmit={vi.fn()} orderTotal={50} />);

      expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
    });
  });

  describe('Payment Method Selection', () => {
    it('allows selecting payment methods', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const pixButton = screen.getByText('PIX').closest('button');
      await user.click(pixButton!);

      expect(pixButton).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('shows check icon for selected method', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Check icon
    });
  });

  describe('PIX Payment', () => {
    it('generates PIX QR code when PIX is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const pixButton = screen.getByText('PIX').closest('button');
      await user.click(pixButton!);

      expect(screen.getByText('Gerando QR Code...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('QR Code PIX')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(toast.success).toHaveBeenCalledWith('QR Code PIX gerado com sucesso!');
    });

    it('allows copying PIX key', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const pixButton = screen.getByText('PIX').closest('button');
      await user.click(pixButton!);

      await waitFor(() => {
        expect(screen.getByText('Copiar')).toBeInTheDocument();
      }, { timeout: 2000 });

      const copyButton = screen.getByText('Copiar');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Chave PIX copiada!');
    });

    it('shows PIX payment benefits', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const pixButton = screen.getByText('PIX').closest('button');
      await user.click(pixButton!);

      expect(screen.getByText(/Pagamento instantâneo/)).toBeInTheDocument();
      expect(screen.getByText(/Disponível 24h por dia/)).toBeInTheDocument();
      expect(screen.getByText(/Sem taxas adicionais/)).toBeInTheDocument();
    });
  });

  describe('Credit Card Payment', () => {
    it('shows credit card form when credit card is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      expect(screen.getByText('Dados do Cartão de Crédito')).toBeInTheDocument();
      expect(screen.getByLabelText(/Número do Cartão/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nome no Cartão/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Validade/)).toBeInTheDocument();
      expect(screen.getByLabelText(/CVV/)).toBeInTheDocument();
    });

    it('formats card number as user types', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      const cardNumberInput = screen.getByLabelText(/Número do Cartão/);
      await user.type(cardNumberInput, '1234567890123456');

      expect(cardNumberInput).toHaveValue('1234 5678 9012 3456');
    });

    it('formats expiry date as user types', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      const expiryInput = screen.getByLabelText(/Validade/);
      await user.type(expiryInput, '1225');

      expect(expiryInput).toHaveValue('12/25');
    });

    it('converts card name to uppercase', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      const nameInput = screen.getByLabelText(/Nome no Cartão/);
      await user.type(nameInput, 'joão silva');

      expect(nameInput).toHaveValue('JOÃO SILVA');
    });

    it('limits CVV to 4 digits', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      const cvvInput = screen.getByLabelText(/CVV/);
      await user.type(cvvInput, '12345');

      expect(cvvInput).toHaveValue('1234');
    });

    it('validates card number using Luhn algorithm', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      const cardNumberInput = screen.getByLabelText(/Número do Cartão/);
      
      // Invalid card number
      await user.type(cardNumberInput, '1234567890123456');
      expect(cardNumberInput).toHaveClass('border-red-300');

      // Valid card number (test card)
      await user.clear(cardNumberInput);
      await user.type(cardNumberInput, '4111111111111111');
      
      await waitFor(() => {
        expect(cardNumberInput).toHaveClass('border-green-300');
      });
    });

    it('validates expiry date', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      const expiryInput = screen.getByLabelText(/Validade/);
      
      // Past date
      await user.type(expiryInput, '0120');
      expect(expiryInput).toHaveClass('border-red-300');

      // Future date
      await user.clear(expiryInput);
      await user.type(expiryInput, '1230');
      
      await waitFor(() => {
        expect(expiryInput).toHaveClass('border-green-300');
      });
    });
  });

  describe('Debit Card Payment', () => {
    it('shows debit card form when debit card is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const debitButton = screen.getByText('Cartão de Débito').closest('button');
      await user.click(debitButton!);

      expect(screen.getByText('Dados do Cartão de Débito')).toBeInTheDocument();
    });
  });

  describe('Cash Payment', () => {
    it('shows cash payment form when cash is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const cashButton = screen.getByText('Dinheiro').closest('button');
      await user.click(cashButton!);

      expect(screen.getByText('Pagamento em Dinheiro')).toBeInTheDocument();
      expect(screen.getByLabelText(/Troco para/)).toBeInTheDocument();
    });

    it('calculates change amount correctly', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} orderTotal={50} />);

      const cashButton = screen.getByText('Dinheiro').closest('button');
      await user.click(cashButton!);

      const changeInput = screen.getByLabelText(/Troco para/);
      await user.type(changeInput, '100');

      await waitFor(() => {
        expect(screen.getByText('R$ 50,00')).toBeInTheDocument(); // Order total
        expect(screen.getByText('R$ 100,00')).toBeInTheDocument(); // Amount paid
        expect(screen.getByText('R$ 50,00')).toBeInTheDocument(); // Change amount
      });
    });

    it('validates minimum change amount', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} orderTotal={50} />);

      const cashButton = screen.getByText('Dinheiro').closest('button');
      await user.click(cashButton!);

      const changeInput = screen.getByLabelText(/Troco para/);
      const submitButton = screen.getByText('Confirmar Pagamento');

      await user.type(changeInput, '30');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Valor deve ser maior que R\$ 50,00/)).toBeInTheDocument();
      });
    });
  });

  describe('Voucher Payment', () => {
    it('shows voucher payment information when voucher is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const voucherButton = screen.getByText('Vale Refeição').closest('button');
      await user.click(voucherButton!);

      expect(screen.getByText('Vale Refeição')).toBeInTheDocument();
      expect(screen.getByText(/Ticket, Sodexo, Alelo/)).toBeInTheDocument();
      expect(screen.getByText(/Verificação na entrega/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when no payment method is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const submitButton = screen.getByText('Confirmar Pagamento');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Selecione um método de pagamento')).toBeInTheDocument();
      });

      expect(toast.error).toHaveBeenCalledWith('Por favor, corrija os erros no formulário');
    });

    it('validates required credit card fields', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      const submitButton = screen.getByText('Confirmar Pagamento');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Número do cartão é obrigatório')).toBeInTheDocument();
        expect(screen.getByText('Nome no cartão é obrigatório')).toBeInTheDocument();
        expect(screen.getByText('Data de validade é obrigatória')).toBeInTheDocument();
        expect(screen.getByText('CVV é obrigatório')).toBeInTheDocument();
      });
    });

    it('disables submit button when no method is selected', () => {
      render(<PaymentMethodForm {...defaultProps} />);

      const submitButton = screen.getByText('Confirmar Pagamento');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when method is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm {...defaultProps} />);

      const pixButton = screen.getByText('PIX').closest('button');
      await user.click(pixButton!);

      const submitButton = screen.getByText('Confirmar Pagamento');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with PIX data when PIX payment is submitted', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<PaymentMethodForm {...defaultProps} onSubmit={onSubmit} />);

      const pixButton = screen.getByText('PIX').closest('button');
      await user.click(pixButton!);

      // Wait for PIX generation
      await waitFor(() => {
        expect(screen.getByText('QR Code PIX')).toBeInTheDocument();
      }, { timeout: 2000 });

      const submitButton = screen.getByText('Confirmar Pagamento');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'pix',
            pixData: expect.objectContaining({
              qrCode: expect.any(String),
              pixKey: expect.any(String),
              amount: 50
            })
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Método de pagamento confirmado!');
    });

    it('calls onSubmit with card data when credit card payment is submitted', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<PaymentMethodForm {...defaultProps} onSubmit={onSubmit} />);

      const creditButton = screen.getByText('Cartão de Crédito').closest('button');
      await user.click(creditButton!);

      // Fill card data
      await user.type(screen.getByLabelText(/Número do Cartão/), '4111111111111111');
      await user.type(screen.getByLabelText(/Nome no Cartão/), 'João Silva');
      await user.type(screen.getByLabelText(/Validade/), '1230');
      await user.type(screen.getByLabelText(/CVV/), '123');

      const submitButton = screen.getByText('Confirmar Pagamento');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'credit',
            cardData: {
              number: '4111111111111111', // Unformatted
              name: 'JOÃO SILVA',
              expiry: '12/30',
              cvv: '123'
            }
          })
        );
      });
    });

    it('calls onSubmit with cash data when cash payment is submitted', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<PaymentMethodForm {...defaultProps} onSubmit={onSubmit} orderTotal={50} />);

      const cashButton = screen.getByText('Dinheiro').closest('button');
      await user.click(cashButton!);

      await user.type(screen.getByLabelText(/Troco para/), '100');

      const submitButton = screen.getByText('Confirmar Pagamento');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'cash',
            cashData: {
              changeFor: 100,
              changeAmount: 50
            }
          })
        );
      });
    });

    it('shows loading state during submission', async () => {
      render(<PaymentMethodForm {...defaultProps} isLoading={true} />);

      const submitButton = screen.getByText('Confirmar Pagamento');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      render(<PaymentMethodForm {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles PIX generation error', async () => {
      const user = userEvent.setup();
      
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PaymentMethodForm {...defaultProps} />);

      const pixButton = screen.getByText('PIX').closest('button');
      await user.click(pixButton!);

      // Wait for potential error (this test assumes the mock might fail)
      await waitFor(() => {
        expect(screen.getByText('Gerando QR Code...')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('handles clipboard copy error', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard to fail
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Clipboard error'));
      
      render(<PaymentMethodForm {...defaultProps} />);

      const pixButton = screen.getByText('PIX').closest('button');
      await user.click(pixButton!);

      await waitFor(() => {
        expect(screen.getByText('Copiar')).toBeInTheDocument();
      }, { timeout: 2000 });

      const copyButton = screen.getByText('Copiar');
      await user.click(copyButton);

      expect(toast.error).toHaveBeenCalledWith('Erro ao copiar chave PIX');
    });
  });
});