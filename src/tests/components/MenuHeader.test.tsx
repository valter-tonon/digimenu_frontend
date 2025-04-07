import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MenuHeader } from '@/components/menu/MenuHeader';

// Mock do useMenu hook
vi.mock('@/infrastructure/context/MenuContext', () => ({
  useMenu: () => ({
    tableId: '123',
    storeSlug: 'teste-restaurante'
  })
}));

// Mock da apiClient
vi.mock('@/infrastructure/api/apiClient', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

describe('MenuHeader', () => {
  it('deve exibir nome e logo do restaurante', () => {
    render(
      <MenuHeader 
        cartItemsCount={0} 
        onCartClick={() => {}} 
        storeName="Restaurante Teste"
        storeLogo="https://example.com/logo.jpg"
      />
    );
    
    expect(screen.getByText('Restaurante Teste')).toBeInTheDocument();
    expect(screen.getByAltText('Restaurante Teste')).toHaveAttribute('src', 'https://example.com/logo.jpg');
  });
  
  it('deve exibir horário de funcionamento quando aberto', () => {
    render(
      <MenuHeader 
        cartItemsCount={0} 
        onCartClick={() => {}} 
        storeName="Restaurante Teste"
        openingHours={{
          opens_at: '10:00',
          closes_at: '22:00',
          is_open: true
        }}
      />
    );
    
    expect(screen.getByText(/Aberto • Fecha às 22:00/)).toBeInTheDocument();
  });
  
  it('deve exibir horário de funcionamento quando fechado', () => {
    render(
      <MenuHeader 
        cartItemsCount={0} 
        onCartClick={() => {}} 
        storeName="Restaurante Teste"
        openingHours={{
          opens_at: '10:00',
          closes_at: '22:00',
          is_open: false
        }}
      />
    );
    
    expect(screen.getByText(/Fechado • Abre às 10:00/)).toBeInTheDocument();
    
    // Verificar se o alerta de loja fechada está presente
    expect(screen.getByText(/Loja fechada, abre hoje às 10:00/)).toBeInTheDocument();
  });
  
  it('deve exibir valor mínimo do pedido', () => {
    render(
      <MenuHeader 
        cartItemsCount={0} 
        onCartClick={() => {}} 
        storeName="Restaurante Teste"
        minOrderValue={25.90}
      />
    );
    
    expect(screen.getByText(/Pedido mínimo: R\$ 25.90/)).toBeInTheDocument();
  });
  
  it('não deve exibir valor mínimo se for zero ou não informado', () => {
    const { rerender } = render(
      <MenuHeader 
        cartItemsCount={0} 
        onCartClick={() => {}} 
        storeName="Restaurante Teste"
        minOrderValue={0}
      />
    );
    
    expect(screen.queryByText(/Pedido mínimo/)).not.toBeInTheDocument();
    
    rerender(
      <MenuHeader 
        cartItemsCount={0} 
        onCartClick={() => {}} 
        storeName="Restaurante Teste"
      />
    );
    
    expect(screen.queryByText(/Pedido mínimo/)).not.toBeInTheDocument();
  });
  
  it('deve exibir o contador de itens no carrinho', () => {
    render(
      <MenuHeader 
        cartItemsCount={5} 
        onCartClick={() => {}} 
        storeName="Restaurante Teste"
      />
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });
  
  it('deve exibir o botão de chamar garçom quando tem tableId', () => {
    render(
      <MenuHeader 
        cartItemsCount={0} 
        onCartClick={() => {}} 
        storeName="Restaurante Teste"
      />
    );
    
    expect(screen.getByText(/Chamar Garçom/)).toBeInTheDocument();
  });
}); 