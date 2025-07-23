import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CheckoutPage from '@/app/[storeId]/checkout/page';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { useUserTracking } from '@/hooks/useUserTracking';
import { createOrder } from '@/services/api';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: () => ({ storeId: 'test-store' }),
}));

vi.mock('@/store/cart-store');
vi.mock('@/hooks/use-auth');
vi.mock('@/hooks/useUserTracking');
vi.mock('@/services/api');
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
};

const mockCartStore = {
  items: [
    {
      id: 1,
      productId: 1,
      identify: 'test-product',
      name: 'Produto Teste',
      price: 15.99,
      quantity: 2,
    },
  ],
  totalPrice: () => 31.98,
  totalItems: () => 2,
  clearCart: vi.fn(),
  setContext: vi.fn(),
  setDeliveryMode: vi.fn(),
};

const mockAuth = {
  isAuthenticated: true,
  customer: {
    id: 'customer-123',
    name: 'João Silva',
    phone: '11999999999',
    email: 'joao@email.com',
    addresses: [
      {
        address: 'Rua Teste, 123',
        number: '123',
        complement: 'Apto 45',
        district: 'Centro',
        city: 'São Paulo',
        zipcode: '01234-567',
      },
    ],
  },
};

const mockUserTracking = {
  userId: 'user-123',
  source: 'whatsapp',
  associateWithOrder: vi.fn(),
};

describe('Checkout Page', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useCartStore).mockReturnValue(mockCartStore);
    vi.mocked(useAuth).mockReturnValue(mockAuth);
    vi.mocked(useUserTracking).mockReturnValue(mockUserTracking);
    vi.mocked(createOrder).mockResolvedValue({
      data: { identify: 'order-123' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar a página de checkout corretamente', () => {
      render(<CheckoutPage />);

      expect(screen.getByText('Finalizar Pedido')).toBeInTheDocument();
      expect(screen.getByText('Resumo do Pedido')).toBeInTheDocument();
      expect(screen.getByText('Dados do Cliente')).toBeInTheDocument();
      expect(screen.getByText('Endereço de Entrega')).toBeInTheDocument();
      expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
    });

    it('deve exibir itens do carrinho no resumo', () => {
      render(<CheckoutPage />);

      expect(screen.getByText('2x Produto Teste')).toBeInTheDocument();
      expect(screen.getByText('R$ 31,98')).toBeInTheDocument();
      expect(screen.getByText('Total (2 itens)')).toBeInTheDocument();
    });

    it('deve preencher dados do cliente automaticamente', () => {
      render(<CheckoutPage />);

      const nameInput = screen.getByDisplayValue('João Silva');
      const phoneInput = screen.getByDisplayValue('11999999999');
      const emailInput = screen.getByDisplayValue('joao@email.com');

      expect(nameInput).toBeInTheDocument();
      expect(phoneInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });

    it('deve preencher endereço automaticamente se disponível', () => {
      render(<CheckoutPage />);

      expect(screen.getByDisplayValue('Rua Teste, 123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Apto 45')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Centro')).toBeInTheDocument();
    });
  });

  describe('Validações', () => {
    it('deve validar campos obrigatórios', async () => {
      // Mock com dados vazios
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuth,
        customer: { ...mockAuth.customer, name: '', phone: '' },
      });

      render(<CheckoutPage />);

      const submitButton = screen.getByText(/Finalizar Pedido/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Preencha nome e telefone')).toBeInTheDocument();
      });
    });

    it('deve validar endereço de entrega', async () => {
      render(<CheckoutPage />);

      // Limpar campos de endereço
      const streetInput = screen.getByDisplayValue('Rua Teste, 123');
      fireEvent.change(streetInput, { target: { value: '' } });

      const submitButton = screen.getByText(/Finalizar Pedido/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Preencha o endereço de entrega')).toBeInTheDocument();
      });
    });

    it('deve validar seleção de forma de pagamento', async () => {
      render(<CheckoutPage />);

      const submitButton = screen.getByText(/Finalizar Pedido/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Selecione uma forma de pagamento')).toBeInTheDocument();
      });
    });

    it('deve validar campo de troco quando dinheiro for selecionado', async () => {
      render(<CheckoutPage />);

      // Selecionar dinheiro
      const moneyOption = screen.getByLabelText('Dinheiro');
      fireEvent.click(moneyOption);

      const submitButton = screen.getByText(/Finalizar Pedido/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Informe o valor para troco')).toBeInTheDocument();
      });
    });
  });

  describe('Formas de Pagamento', () => {
    it('deve mostrar todas as opções de pagamento', () => {
      render(<CheckoutPage />);

      expect(screen.getByText('Dinheiro')).toBeInTheDocument();
      expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
      expect(screen.getByText('Cartão de Débito')).toBeInTheDocument();
      expect(screen.getByText('PIX')).toBeInTheDocument();
      expect(screen.getByText('Vale Refeição')).toBeInTheDocument();
    });

    it('deve mostrar campo de troco quando dinheiro for selecionado', () => {
      render(<CheckoutPage />);

      const moneyOption = screen.getByLabelText('Dinheiro');
      fireEvent.click(moneyOption);

      expect(screen.getByText('Troco para quanto? *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument();
    });

    it('deve ocultar campo de troco para outras formas de pagamento', () => {
      render(<CheckoutPage />);

      const creditOption = screen.getByLabelText('Cartão de Crédito');
      fireEvent.click(creditOption);

      expect(screen.queryByText('Troco para quanto? *')).not.toBeInTheDocument();
    });
  });

  describe('Finalização do Pedido', () => {
    it('deve finalizar pedido com sucesso', async () => {
      render(<CheckoutPage />);

      // Preencher forma de pagamento
      const pixOption = screen.getByLabelText('PIX');
      fireEvent.click(pixOption);

      // Finalizar pedido
      const submitButton = screen.getByText(/Finalizar Pedido/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createOrder).toHaveBeenCalledWith({
          token_company: 'test-store',
          products: [
            {
              identify: 'test-product',
              quantity: 2,
              notes: undefined,
              additionals: undefined,
            },
          ],
          comment: '',
          type: 'delivery',
          customer_id: 'customer-123',
          delivery_address: {
            street: 'Rua Teste, 123',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            zipCode: '01234-567',
          },
          payment_method: 'pix',
          change_amount: undefined,
          user_tracking: {
            user_id: 'user-123',
            source: 'whatsapp',
            device_id: 'user-123',
          },
        });
      });

      expect(mockCartStore.clearCart).toHaveBeenCalled();
      expect(mockUserTracking.associateWithOrder).toHaveBeenCalledWith('order-123');
      expect(mockRouter.push).toHaveBeenCalledWith('/test-store/orders/order-123');
    });

    it('deve incluir valor do troco quando dinheiro for selecionado', async () => {
      render(<CheckoutPage />);

      // Selecionar dinheiro
      const moneyOption = screen.getByLabelText('Dinheiro');
      fireEvent.click(moneyOption);

      // Preencher valor do troco
      const changeInput = screen.getByPlaceholderText('0,00');
      fireEvent.change(changeInput, { target: { value: '50.00' } });

      // Finalizar pedido
      const submitButton = screen.getByText(/Finalizar Pedido/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_method: 'money',
            change_amount: 50,
          })
        );
      });
    });

    it('deve lidar com erro na finalização do pedido', async () => {
      vi.mocked(createOrder).mockRejectedValue(new Error('Erro no servidor'));

      render(<CheckoutPage />);

      // Preencher forma de pagamento
      const pixOption = screen.getByLabelText('PIX');
      fireEvent.click(pixOption);

      // Finalizar pedido
      const submitButton = screen.getByText(/Finalizar Pedido/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Não foi possível realizar o pedido. Tente novamente.')).toBeInTheDocument();
      });
    });
  });

  describe('Redirecionamento', () => {
    it('deve redirecionar para login se não autenticado', () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuth,
        isAuthenticated: false,
      });

      render(<CheckoutPage />);

      expect(mockRouter.push).toHaveBeenCalledWith('/test-store/login?redirect=checkout');
    });

    it('deve voltar à página anterior ao clicar no botão voltar', () => {
      render(<CheckoutPage />);

      const backButton = screen.getByLabelText('Voltar');
      fireEvent.click(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});