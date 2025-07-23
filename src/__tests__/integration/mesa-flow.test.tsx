import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import CartPage from '@/app/[storeId]/[tableId]/cart/page';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { useUserTracking } from '@/hooks/useUserTracking';
import { createOrder } from '@/services/api';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock('@/store/cart-store');
vi.mock('@/hooks/use-auth');
vi.mock('@/hooks/useUserTracking');
vi.mock('@/services/api');
vi.mock('@/components/layout/BottomNavigation', () => ({
  BottomNavigation: () => <div data-testid="bottom-navigation">Bottom Navigation</div>,
}));
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Fluxo Completo de Mesa (Integração)', () => {
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
    deliveryMode: false,
    removeItem: vi.fn(),
    updateItem: vi.fn(),
  };

  const mockAuth = {
    isAuthenticated: true,
    customer: {
      id: 'customer-123',
      name: 'João Silva',
    },
  };

  const mockUserTracking = {
    userId: 'user-123',
    source: 'direct',
    associateWithOrder: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useParams).mockReturnValue({
      storeId: 'test-store',
      tableId: 'test-table',
    });
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

  it('deve renderizar a página do carrinho para mesa corretamente', () => {
    render(<CartPage />);

    expect(screen.getByText('Seu carrinho')).toBeInTheDocument();
    expect(screen.getByText('Tipo de pedido')).toBeInTheDocument();
    expect(screen.getByText('Retirada no local')).toBeInTheDocument();
    expect(screen.getByText('2x Produto Teste')).toBeInTheDocument();
    expect(screen.getByText('Finalizar pedido')).toBeInTheDocument();
  });

  it('deve configurar o contexto do carrinho ao carregar', () => {
    render(<CartPage />);

    expect(mockCartStore.setContext).toHaveBeenCalledWith('test-store', 'test-table');
  });

  it('deve permitir alterar a quantidade de itens', () => {
    render(<CartPage />);

    const increaseButton = screen.getAllByRole('button', { name: '+' })[0];
    fireEvent.click(increaseButton);

    expect(mockCartStore.updateItem).toHaveBeenCalledWith(1, { quantity: 3 });
  });

  it('deve permitir remover itens do carrinho', () => {
    render(<CartPage />);

    const removeButton = screen.getByRole('button', { name: 'Remover' });
    fireEvent.click(removeButton);

    expect(mockCartStore.removeItem).toHaveBeenCalledWith(1);
  });

  it('deve processar o pedido para mesa corretamente', async () => {
    render(<CartPage />);

    // Adicionar observação ao pedido
    const commentInput = screen.getByPlaceholderText('Alguma observação? Ex: sem cebola, bem passado, etc.');
    fireEvent.change(commentInput, { target: { value: 'Sem cebola, por favor' } });

    // Finalizar pedido
    const submitButton = screen.getByText('Finalizar pedido');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith({
        token_company: 'test-store',
        table: 'test-table',
        products: [
          {
            identify: 'test-product',
            quantity: 2,
            notes: undefined,
            additionals: undefined,
          },
        ],
        comment: 'Sem cebola, por favor',
        type: 'local',
        customer_id: 'customer-123',
        user_tracking: {
          user_id: 'user-123',
          source: 'direct',
          device_id: 'user-123',
        },
      });
    });

    expect(mockCartStore.clearCart).toHaveBeenCalled();
    expect(mockUserTracking.associateWithOrder).toHaveBeenCalledWith('order-123');
    expect(mockRouter.push).toHaveBeenCalledWith('/test-store/test-table/orders/order-123');
  });

  it('deve alternar para modo delivery quando solicitado', () => {
    render(<CartPage />);

    const deliveryButton = screen.getByText('Delivery');
    fireEvent.click(deliveryButton);

    expect(mockCartStore.setDeliveryMode).toHaveBeenCalledWith(true);
  });

  it('deve mostrar modal de login quando alternar para delivery sem autenticação', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...mockAuth,
      isAuthenticated: false,
    });

    render(<CartPage />);

    const deliveryButton = screen.getByText('Delivery');
    fireEvent.click(deliveryButton);

    expect(screen.getByText('Identificação necessária')).toBeInTheDocument();
    expect(screen.getByText('Para pedidos de delivery, é necessário fazer login para identificarmos seu endereço de entrega.')).toBeInTheDocument();
  });

  it('deve redirecionar para checkout quando em modo delivery', () => {
    vi.mocked(useCartStore).mockReturnValue({
      ...mockCartStore,
      deliveryMode: true,
    });

    render(<CartPage />);

    const checkoutButton = screen.getByText('Ir para Checkout');
    fireEvent.click(checkoutButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/test-store/checkout');
  });
});