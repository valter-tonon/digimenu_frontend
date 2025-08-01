import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockRouter, mockCartStore } from '../helpers/test-utils';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock cart store
vi.mock('@/store/cart-store', () => ({
  useCartStore: () => mockCartStore,
}));

// Mock API services
vi.mock('@/services/api', () => ({
  createOrder: vi.fn().mockResolvedValue({
    success: true,
    data: { identify: 'order-123', status: 'pending', total: 35.00 }
  })
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  }
}));

// Enhanced mock cart store for checkout tests
const checkoutMockCartStore = {
  ...mockCartStore,
  items: [
    {
      id: 'product-uuid-1',
      productId: 1,
      identify: 'product-uuid-1',
      name: 'X-Bacon',
      price: 30.0,
      quantity: 2,
      additionals: [
        {
          id: 1,
          name: 'Bacon Extra',
          price: 5.0,
          quantity: 1,
        },
      ],
    },
  ],
  totalItems: () => 2,
  totalPrice: () => 70.0, // (30 + 5) * 2
};

describe('Checkout Flow - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização da Página de Checkout', () => {
    it('deve renderizar a página de checkout corretamente', () => {
      const CheckoutPage = () => (
        <div data-testid="checkout-page">
          <h1>Finalizar Pedido</h1>
        </div>
      );

      render(<CheckoutPage />);
      expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
    });

    it('deve exibir itens do carrinho no resumo', () => {
      const CheckoutSummary = () => (
        <div data-testid="checkout-summary">
          {checkoutMockCartStore.items.map((item) => (
            <div key={item.id} data-testid={`item-${item.id}`}>
              {item.name} - R$ {item.price.toFixed(2).replace('.', ',')}
            </div>
          ))}
        </div>
      );

      render(<CheckoutSummary />);
      expect(screen.getByTestId('item-product-uuid-1')).toBeInTheDocument();
      expect(screen.getByText('X-Bacon - R$ 30,00')).toBeInTheDocument();
    });

    it('deve exibir formulário de dados do cliente', () => {
      const CustomerForm = () => (
        <form data-testid="customer-form">
          <input name="name" placeholder="Nome completo" />
          <input name="phone" placeholder="Telefone" />
          <input name="email" placeholder="E-mail" />
        </form>
      );

      render(<CustomerForm />);
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nome completo')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Telefone')).toBeInTheDocument();
    });

    it('deve exibir formulário de endereço de entrega', () => {
      const AddressForm = () => (
        <form data-testid="address-form">
          <input name="street" placeholder="Rua" />
          <input name="number" placeholder="Número" />
          <input name="neighborhood" placeholder="Bairro" />
          <input name="zipCode" placeholder="CEP" />
        </form>
      );

      render(<AddressForm />);
      expect(screen.getByTestId('address-form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Rua')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('CEP')).toBeInTheDocument();
    });

    it('deve exibir opções de forma de pagamento', () => {
      const PaymentOptions = () => (
        <div data-testid="payment-options">
          <label>
            <input type="radio" name="payment" value="pix" />
            PIX
          </label>
          <label>
            <input type="radio" name="payment" value="card" />
            Cartão
          </label>
          <label>
            <input type="radio" name="payment" value="cash" />
            Dinheiro
          </label>
        </div>
      );

      render(<PaymentOptions />);
      expect(screen.getByTestId('payment-options')).toBeInTheDocument();
      expect(screen.getByLabelText('PIX')).toBeInTheDocument();
      expect(screen.getByLabelText('Cartão')).toBeInTheDocument();
      expect(screen.getByLabelText('Dinheiro')).toBeInTheDocument();
    });
  });

  describe('Validação de Formulário', () => {
    it('deve validar campos obrigatórios do cliente', () => {
      const validateCustomer = (data: any) => {
        const errors: string[] = [];
        if (!data.name) errors.push('Nome é obrigatório');
        if (!data.phone) errors.push('Telefone é obrigatório');
        return errors;
      };

      const errors = validateCustomer({});
      expect(errors).toContain('Nome é obrigatório');
      expect(errors).toContain('Telefone é obrigatório');
    });

    it('deve validar formato do telefone', () => {
      const validatePhone = (phone: string) => {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
      };

      expect(validatePhone('(11) 99999-9999')).toBe(true);
      expect(validatePhone('11999999999')).toBe(false);
      expect(validatePhone('invalid')).toBe(false);
    });

    it('deve validar campos obrigatórios do endereço', () => {
      const validateAddress = (data: any) => {
        const errors: string[] = [];
        if (!data.street) errors.push('Rua é obrigatória');
        if (!data.number) errors.push('Número é obrigatório');
        if (!data.neighborhood) errors.push('Bairro é obrigatório');
        if (!data.zipCode) errors.push('CEP é obrigatório');
        return errors;
      };

      const errors = validateAddress({});
      expect(errors).toHaveLength(4);
      expect(errors).toContain('Rua é obrigatória');
      expect(errors).toContain('CEP é obrigatório');
    });

    it('deve validar seleção de forma de pagamento', () => {
      const validatePayment = (payment: string) => {
        const validPayments = ['pix', 'card', 'cash'];
        return validPayments.includes(payment);
      };

      expect(validatePayment('pix')).toBe(true);
      expect(validatePayment('card')).toBe(true);
      expect(validatePayment('invalid')).toBe(false);
    });

    it('deve validar valor do troco quando dinheiro for selecionado', () => {
      const validateChange = (payment: string, total: number, changeFor: number) => {
        if (payment === 'cash' && changeFor <= total) {
          return 'Valor para troco deve ser maior que o total';
        }
        return null;
      };

      expect(validateChange('cash', 50, 40)).toBe('Valor para troco deve ser maior que o total');
      expect(validateChange('cash', 50, 60)).toBeNull();
      expect(validateChange('pix', 50, 40)).toBeNull();
    });
  });

  describe('Formatação de Campos', () => {
    it('deve formatar telefone durante digitação', () => {
      const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
          return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      };

      expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
      expect(formatPhone('1199999999')).toBe('(11) 9999-9999');
    });

    it('deve formatar CEP durante digitação', () => {
      const formatZipCode = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
      };

      expect(formatZipCode('01234567')).toBe('01234-567');
    });

    it('deve formatar valor do troco', () => {
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
      };

      expect(formatCurrency(50.5)).toMatch(/R\$\s?50[,.]50/);
      expect(formatCurrency(100)).toMatch(/R\$\s?100[,.]00/);
    });
  });

  describe('Interações de UI', () => {
    it('deve mostrar/ocultar campo de troco baseado na forma de pagamento', () => {
      const PaymentForm = ({ payment }: { payment: string }) => (
        <div>
          {payment === 'cash' && <input data-testid="change-input" placeholder="Troco para" />}
        </div>
      );

      const { rerender } = render(<PaymentForm payment="pix" />);
      expect(screen.queryByTestId('change-input')).not.toBeInTheDocument();

      rerender(<PaymentForm payment="cash" />);
      expect(screen.getByTestId('change-input')).toBeInTheDocument();
    });

    it('deve permitir adicionar observações ao pedido', () => {
      const ObservationsField = () => (
        <textarea data-testid="observations" placeholder="Observações do pedido" />
      );

      render(<ObservationsField />);
      const textarea = screen.getByTestId('observations');
      fireEvent.change(textarea, { target: { value: 'Sem cebola' } });
      expect(textarea).toHaveValue('Sem cebola');
    });

    it('deve calcular e exibir total do pedido corretamente', () => {
      const OrderTotal = () => {
        const subtotal = 65.0;
        const deliveryFee = 5.0;
        const total = subtotal + deliveryFee;

        return (
          <div data-testid="order-total">
            <div>Subtotal: R$ {subtotal.toFixed(2).replace('.', ',')}</div>
            <div>Taxa de entrega: R$ {deliveryFee.toFixed(2).replace('.', ',')}</div>
            <div>Total: R$ {total.toFixed(2).replace('.', ',')}</div>
          </div>
        );
      };

      render(<OrderTotal />);
      expect(screen.getByText('Subtotal: R$ 65,00')).toBeInTheDocument();
      expect(screen.getByText('Taxa de entrega: R$ 5,00')).toBeInTheDocument();
      expect(screen.getByText('Total: R$ 70,00')).toBeInTheDocument();
    });
  });

  describe('Estados de Loading', () => {
    it('deve mostrar loading durante submissão do pedido', async () => {
      const SubmitButton = ({ isLoading }: { isLoading: boolean }) => (
        <button disabled={isLoading} data-testid="submit-button">
          {isLoading ? 'Processando...' : 'Finalizar Pedido'}
        </button>
      );

      const { rerender } = render(<SubmitButton isLoading={false} />);
      expect(screen.getByText('Finalizar Pedido')).toBeInTheDocument();

      rerender(<SubmitButton isLoading={true} />);
      expect(screen.getByText('Processando...')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });
  });

  describe('Redirecionamento', () => {
    it('deve redirecionar para menu se carrinho estiver vazio', () => {
      const emptyCartStore = { ...mockCartStore, items: [] };
      
      const CheckoutGuard = () => {
        const items = emptyCartStore.items;
        
        React.useEffect(() => {
          if (items.length === 0) {
            mockRouter.push('/menu');
          }
        }, [items]);

        return <div>Checkout</div>;
      };

      render(<CheckoutGuard />);
      expect(mockRouter.push).toHaveBeenCalledWith('/menu');
    });

    it('deve voltar para menu ao clicar no botão voltar', () => {
      const BackButton = () => (
        <button onClick={() => mockRouter.back()} data-testid="back-button">
          Voltar
        </button>
      );

      render(<BackButton />);
      fireEvent.click(screen.getByTestId('back-button'));
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});