import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCartStore } from '@/store/cart-store';
import { act, renderHook } from '@testing-library/react';

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do Date.now para testes consistentes
const mockNow = 1640995200000; // 2022-01-01 00:00:00
vi.spyOn(Date, 'now').mockReturnValue(mockNow);

describe('Cart Store - Persistência', () => {
  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset do store
    useCartStore.getState().clearCart();
  });

  afterEach(() => {
    // Limpar o store após cada teste
    useCartStore.getState().clearCart();
  });

  describe('TTL (Time To Live)', () => {
    it('deve definir TTL padrão de 24 horas ao criar o store', () => {
      const { result } = renderHook(() => useCartStore());
      
      expect(result.current.expiresAt).toBe(mockNow + (24 * 60 * 60 * 1000));
    });

    it('deve permitir configurar TTL personalizado', () => {
      const { result } = renderHook(() => useCartStore());
      const customHours = 48;
      
      act(() => {
        result.current.setCartTTL(customHours);
      });
      
      expect(result.current.expiresAt).toBe(mockNow + (customHours * 60 * 60 * 1000));
    });

    it('deve detectar quando o carrinho expirou', () => {
      const { result } = renderHook(() => useCartStore());
      
      // Definir TTL no passado
      act(() => {
        result.current.setCartTTL(-1); // -1 hora (no passado)
      });
      
      expect(result.current.isExpired()).toBe(true);
    });

    it('deve detectar quando o carrinho não expirou', () => {
      const { result } = renderHook(() => useCartStore());
      
      // TTL padrão (24 horas no futuro)
      expect(result.current.isExpired()).toBe(false);
    });
  });

  describe('Persistência de Dados', () => {
    it('deve persistir itens do carrinho no localStorage', () => {
      const { result } = renderHook(() => useCartStore());
      
      const testItem = {
        productId: 1,
        identify: 'test-product',
        name: 'Produto Teste',
        price: 10.99,
        quantity: 2,
      };

      act(() => {
        result.current.addItem(testItem);
      });

      // Verificar se localStorage.setItem foi chamado
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Verificar se o item foi adicionado ao store
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toMatchObject(testItem);
    });

    it('deve recuperar dados do localStorage com TTL válido', () => {
      // Simular dados salvos no localStorage
      const savedData = {
        state: {
          items: [{
            id: 1,
            productId: 1,
            identify: 'test-product',
            name: 'Produto Teste',
            price: 10.99,
            quantity: 1,
          }],
          storeId: 'test-store',
          tableId: 'test-table',
          deliveryMode: false,
          lastUpdated: mockNow,
          expiresAt: mockNow + (24 * 60 * 60 * 1000), // 24 horas no futuro
        },
        expiresAt: mockNow + (24 * 60 * 60 * 1000),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      // Criar nova instância do hook para simular carregamento
      const { result } = renderHook(() => useCartStore());

      // Verificar se os dados foram recuperados
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe('Produto Teste');
      expect(result.current.storeId).toBe('test-store');
    });

    it('deve remover dados expirados do localStorage', () => {
      // Simular dados expirados no localStorage
      const expiredData = {
        state: {
          items: [{ id: 1, name: 'Produto Expirado' }],
          expiresAt: mockNow - 1000, // No passado
        },
        expiresAt: mockNow - 1000, // No passado
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

      // Criar nova instância do hook
      const { result } = renderHook(() => useCartStore());

      // Verificar se localStorage.removeItem foi chamado para limpar dados expirados
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('digimenu-cart');
      
      // Verificar se o carrinho está vazio
      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Sincronização do Carrinho', () => {
    it('deve atualizar lastUpdated ao sincronizar', () => {
      const { result } = renderHook(() => useCartStore());
      const initialLastUpdated = result.current.lastUpdated;

      // Avançar o tempo
      vi.spyOn(Date, 'now').mockReturnValue(mockNow + 5000);

      act(() => {
        result.current.syncCart();
      });

      expect(result.current.lastUpdated).toBeGreaterThan(initialLastUpdated);
    });

    it('deve limpar carrinho expirado ao sincronizar', () => {
      const { result } = renderHook(() => useCartStore());
      
      // Adicionar item
      act(() => {
        result.current.addItem({
          productId: 1,
          identify: 'test',
          name: 'Test',
          price: 10,
          quantity: 1,
        });
      });

      expect(result.current.items).toHaveLength(1);

      // Definir TTL no passado
      act(() => {
        result.current.setCartTTL(-1);
      });

      // Sincronizar
      act(() => {
        result.current.syncCart();
      });

      // Verificar se o carrinho foi limpo
      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Contexto do Store', () => {
    it('deve definir contexto da loja e mesa', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setContext('store-123', 'table-456');
      });

      expect(result.current.storeId).toBe('store-123');
      expect(result.current.tableId).toBe('table-456');
    });

    it('deve definir modo de delivery', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setDeliveryMode(true);
      });

      expect(result.current.deliveryMode).toBe(true);
    });
  });

  describe('Operações do Carrinho', () => {
    it('deve calcular total de itens corretamente', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({
          productId: 1,
          identify: 'item1',
          name: 'Item 1',
          price: 10,
          quantity: 2,
        });
        result.current.addItem({
          productId: 2,
          identify: 'item2',
          name: 'Item 2',
          price: 15,
          quantity: 3,
        });
      });

      expect(result.current.totalItems()).toBe(5); // 2 + 3
    });

    it('deve calcular preço total corretamente', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem({
          productId: 1,
          identify: 'item1',
          name: 'Item 1',
          price: 10,
          quantity: 2,
        });
        result.current.addItem({
          productId: 2,
          identify: 'item2',
          name: 'Item 2',
          price: 15,
          quantity: 1,
          additionals: [{
            id: 1,
            name: 'Extra',
            price: 5,
            quantity: 1,
          }],
        });
      });

      // (10 * 2) + (15 * 1) + (5 * 1) = 20 + 15 + 5 = 40
      expect(result.current.totalPrice()).toBe(40);
    });

    it('deve consolidar itens idênticos', () => {
      const { result } = renderHook(() => useCartStore());

      const item = {
        productId: 1,
        identify: 'same-item',
        name: 'Item Igual',
        price: 10,
        quantity: 1,
        notes: 'sem cebola',
      };

      act(() => {
        result.current.addItem(item);
        result.current.addItem(item);
      });

      // Deve ter apenas 1 item com quantidade 2
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });
  });
});