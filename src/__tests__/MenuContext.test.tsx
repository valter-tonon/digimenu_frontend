import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MenuProvider, useMenu } from '@/infrastructure/context/MenuContext';
import { useCartStore } from '@/store/cart-store';

// Mock do Zustand
vi.mock('@/store/cart-store', () => {
  const mockStore = {
    items: [],
    setContext: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    clearCart: vi.fn(),
  };
  
  return {
    useCartStore: () => mockStore,
  };
});

// Componente de teste para acessar o contexto
const TestComponent = () => {
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart,
    isCartOpen,
    setIsCartOpen
  } = useMenu();
  
  return (
    <div>
      <div data-testid="cart-count">{cartItems.length}</div>
      <button 
        data-testid="add-item" 
        onClick={() => addToCart({
          id: '1',
          name: 'Produto de Teste',
          price: 10.99,
          quantity: 1
        })}
      >
        Adicionar Item
      </button>
      <button 
        data-testid="remove-item" 
        onClick={() => removeFromCart('1')}
      >
        Remover Item
      </button>
      <button 
        data-testid="update-quantity" 
        onClick={() => updateCartItemQuantity('1', 3)}
      >
        Atualizar Quantidade
      </button>
      <button 
        data-testid="clear-cart" 
        onClick={() => clearCart()}
      >
        Limpar Carrinho
      </button>
      <button
        data-testid="toggle-cart"
        onClick={() => setIsCartOpen(!isCartOpen)}
      >
        {isCartOpen ? 'Fechar Carrinho' : 'Abrir Carrinho'}
      </button>
    </div>
  );
};

describe('MenuContext', () => {
  beforeEach(() => {
    // Resetar o estado do store mockado antes de cada teste
    const store = useCartStore();
    store.items = [];
    
    // Limpar as chamadas de função mockadas
    vi.clearAllMocks();
  });
  
  it('deve renderizar o provider sem erros', () => {
    render(
      <MenuProvider initialStoreSlug="loja-teste" initialTableId="mesa-1">
        <TestComponent />
      </MenuProvider>
    );
    
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });
  
  it('deve chamar setContext na inicialização', async () => {
    render(
      <MenuProvider initialStoreSlug="loja-teste" initialTableId="mesa-1">
        <TestComponent />
      </MenuProvider>
    );
    
    const store = useCartStore();
    await waitFor(() => {
      expect(store.setContext).toHaveBeenCalledWith('loja-teste', 'mesa-1');
    });
  });
  
  it('deve adicionar um item ao carrinho corretamente', async () => {
    render(
      <MenuProvider initialStoreSlug="loja-teste" initialTableId="mesa-1">
        <TestComponent />
      </MenuProvider>
    );
    
    const addButton = screen.getByTestId('add-item');
    fireEvent.click(addButton);
    
    const store = useCartStore();
    expect(store.addItem).toHaveBeenCalledTimes(1);
    expect(store.addItem).toHaveBeenCalledWith(expect.objectContaining({
      productId: 1,
      identify: '1',
      name: 'Produto de Teste',
      price: 10.99,
      quantity: 1
    }));
  });
  
  it('deve remover um item do carrinho corretamente', async () => {
    // Simular um item no carrinho
    const store = useCartStore();
    store.items = [{
      id: 1,
      productId: 1,
      identify: '1',
      name: 'Produto de Teste',
      price: 10.99,
      quantity: 1
    }];
    
    render(
      <MenuProvider initialStoreSlug="loja-teste" initialTableId="mesa-1">
        <TestComponent />
      </MenuProvider>
    );
    
    const removeButton = screen.getByTestId('remove-item');
    fireEvent.click(removeButton);
    
    expect(store.removeItem).toHaveBeenCalledTimes(1);
    expect(store.removeItem).toHaveBeenCalledWith(1);
  });
  
  it('deve atualizar a quantidade de um item corretamente', async () => {
    // Simular um item no carrinho
    const store = useCartStore();
    store.items = [{
      id: 1,
      productId: 1,
      identify: '1',
      name: 'Produto de Teste',
      price: 10.99,
      quantity: 1
    }];
    
    render(
      <MenuProvider initialStoreSlug="loja-teste" initialTableId="mesa-1">
        <TestComponent />
      </MenuProvider>
    );
    
    const updateButton = screen.getByTestId('update-quantity');
    fireEvent.click(updateButton);
    
    expect(store.updateItem).toHaveBeenCalledTimes(1);
    expect(store.updateItem).toHaveBeenCalledWith(1, { quantity: 3 });
  });
  
  it('deve limpar o carrinho corretamente', async () => {
    // Simular itens no carrinho
    const store = useCartStore();
    store.items = [
      {
        id: 1,
        productId: 1,
        identify: '1',
        name: 'Produto 1',
        price: 10.99,
        quantity: 1
      },
      {
        id: 2,
        productId: 2,
        identify: '2',
        name: 'Produto 2',
        price: 15.99,
        quantity: 2
      }
    ];
    
    render(
      <MenuProvider initialStoreSlug="loja-teste" initialTableId="mesa-1">
        <TestComponent />
      </MenuProvider>
    );
    
    const clearButton = screen.getByTestId('clear-cart');
    fireEvent.click(clearButton);
    
    expect(store.clearCart).toHaveBeenCalledTimes(1);
  });
  
  it('deve controlar o estado isCartOpen corretamente', () => {
    render(
      <MenuProvider initialStoreSlug="loja-teste" initialTableId="mesa-1">
        <TestComponent />
      </MenuProvider>
    );
    
    const toggleButton = screen.getByTestId('toggle-cart');
    expect(toggleButton).toHaveTextContent('Abrir Carrinho');
    
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Fechar Carrinho');
    
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Abrir Carrinho');
  });
}); 