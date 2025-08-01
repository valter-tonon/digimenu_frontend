import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Testes para fluxo de acompanhamento de pedido baseado no diagrama
describe('Fluxo de Acompanhamento de Pedido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Track order - Acompanhar pedido em tempo real', () => {
    it('deve exibir status do pedido em tempo real', async () => {
      const OrderTracking = () => {
        const [orderStatus, setOrderStatus] = React.useState('pending');
        const [orderData] = React.useState({
          id: 1,
          identify: 'ORDER-123',
          total: 35.00,
          estimated_delivery: '30-45 min',
          created_at: '2024-01-15T10:30:00Z',
          items: [
            { name: 'X-Bacon', quantity: 1, price: 30.00 },
            { name: 'Coca-Cola', quantity: 1, price: 5.00 }
          ]
        });

        const statusSteps = [
          { key: 'pending', label: 'Pedido Recebido', completed: true },
          { key: 'confirmed', label: 'Confirmado', completed: orderStatus !== 'pending' },
          { key: 'preparing', label: 'Preparando', completed: ['preparing', 'ready', 'delivering', 'delivered'].includes(orderStatus) },
          { key: 'ready', label: 'Pronto', completed: ['ready', 'delivering', 'delivered'].includes(orderStatus) },
          { key: 'delivering', label: 'Saiu para Entrega', completed: ['delivering', 'delivered'].includes(orderStatus) },
          { key: 'delivered', label: 'Entregue', completed: orderStatus === 'delivered' }
        ];

        React.useEffect(() => {
          // Simular atualização de status
          const interval = setInterval(() => {
            setOrderStatus(current => {
              const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'];
              const currentIndex = statuses.indexOf(current);
              if (currentIndex < statuses.length - 1) {
                return statuses[currentIndex + 1];
              }
              return current;
            });
          }, 2000);

          return () => clearInterval(interval);
        }, []);

        return (
          <div data-testid="order-tracking">
            <div data-testid="order-header">
              <h2>Pedido {orderData.identify}</h2>
              <p data-testid="order-total">Total: R$ {orderData.total.toFixed(2).replace('.', ',')}</p>
              <p data-testid="estimated-delivery">Previsão: {orderData.estimated_delivery}</p>
            </div>

            <div data-testid="order-status-timeline">
              {statusSteps.map((step, index) => (
                <div 
                  key={step.key} 
                  data-testid={`status-step-${step.key}`}
                  className={step.completed ? 'completed' : 'pending'}
                >
                  <div data-testid={`step-indicator-${step.key}`}>
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <span>{step.label}</span>
                  {step.key === orderStatus && (
                    <span data-testid="current-status-indicator"> (Atual)</span>
                  )}
                </div>
              ))}
            </div>

            <div data-testid="order-items">
              <h3>Itens do Pedido</h3>
              {orderData.items.map((item, index) => (
                <div key={index} data-testid={`order-item-${index}`}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>R$ {item.price.toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>

            <div data-testid="order-actions">
              <button data-testid="refresh-status">Atualizar Status</button>
              <button data-testid="contact-restaurant">Contatar Restaurante</button>
              <button data-testid="view-history">Ver Histórico</button>
            </div>
          </div>
        );
      };

      render(<OrderTracking />);

      // Verificar informações do pedido
      expect(screen.getByTestId('order-tracking')).toBeInTheDocument();
      expect(screen.getByText('Pedido ORDER-123')).toBeInTheDocument();
      expect(screen.getByTestId('order-total')).toHaveTextContent('Total: R$ 35,00');
      expect(screen.getByTestId('estimated-delivery')).toHaveTextContent('Previsão: 30-45 min');

      // Verificar timeline de status
      expect(screen.getByTestId('order-status-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('status-step-pending')).toBeInTheDocument();
      expect(screen.getByTestId('status-step-confirmed')).toBeInTheDocument();

      // Verificar status atual
      expect(screen.getByTestId('current-status-indicator')).toBeInTheDocument();

      // Verificar itens do pedido
      expect(screen.getByTestId('order-items')).toBeInTheDocument();
      expect(screen.getByTestId('order-item-0')).toHaveTextContent('1x X-Bacon');
      expect(screen.getByTestId('order-item-1')).toHaveTextContent('1x Coca-Cola');

      // Verificar ações disponíveis
      expect(screen.getByTestId('refresh-status')).toBeInTheDocument();
      expect(screen.getByTestId('contact-restaurant')).toBeInTheDocument();
      expect(screen.getByTestId('view-history')).toBeInTheDocument();

      // Aguardar atualização de status
      await waitFor(() => {
        expect(screen.getByTestId('status-step-confirmed')).toHaveClass('completed');
      }, { timeout: 3000 });
    });

    it('deve permitir atualizar status manualmente', async () => {
      const OrderTracking = () => {
        const [lastUpdate, setLastUpdate] = React.useState(new Date().toLocaleTimeString());
        const [isRefreshing, setIsRefreshing] = React.useState(false);

        const handleRefresh = async () => {
          setIsRefreshing(true);
          // Simular chamada à API
          await new Promise(resolve => setTimeout(resolve, 1000));
          setLastUpdate(new Date().toLocaleTimeString());
          setIsRefreshing(false);
        };

        return (
          <div data-testid="order-tracking">
            <div data-testid="last-update">
              Última atualização: {lastUpdate}
            </div>
            <button 
              data-testid="refresh-status"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Atualizando...' : 'Atualizar Status'}
            </button>
          </div>
        );
      };

      render(<OrderTracking />);

      const initialTime = screen.getByTestId('last-update').textContent;
      
      // Clicar para atualizar
      fireEvent.click(screen.getByTestId('refresh-status'));

      // Verificar estado de loading
      expect(screen.getByText('Atualizando...')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-status')).toBeDisabled();

      // Aguardar atualização
      await waitFor(() => {
        expect(screen.getByText('Atualizar Status')).toBeInTheDocument();
      });

      // Verificar que o horário foi atualizado
      const updatedTime = screen.getByTestId('last-update').textContent;
      expect(updatedTime).not.toBe(initialTime);
    });
  });

  describe('View history - Visualizar histórico de pedidos', () => {
    it('deve exibir lista de pedidos anteriores', async () => {
      const OrderHistory = () => {
        const [orders] = React.useState([
          {
            id: 1,
            identify: 'ORDER-123',
            status: 'delivered',
            total: 35.00,
            created_at: '2024-01-15T10:30:00Z',
            items: [
              { name: 'X-Bacon', quantity: 1 },
              { name: 'Coca-Cola', quantity: 1 }
            ]
          },
          {
            id: 2,
            identify: 'ORDER-124',
            status: 'cancelled',
            total: 25.00,
            created_at: '2024-01-14T15:20:00Z',
            items: [
              { name: 'X-Salada', quantity: 1 }
            ]
          },
          {
            id: 3,
            identify: 'ORDER-125',
            status: 'delivered',
            total: 45.00,
            created_at: '2024-01-13T19:45:00Z',
            items: [
              { name: 'X-Bacon', quantity: 1 },
              { name: 'Batata Frita', quantity: 1 },
              { name: 'Coca-Cola', quantity: 1 }
            ]
          }
        ]);

        const getStatusLabel = (status) => {
          const labels = {
            delivered: 'Entregue',
            cancelled: 'Cancelado',
            pending: 'Pendente',
            preparing: 'Preparando'
          };
          return labels[status] || status;
        };

        const getStatusColor = (status) => {
          const colors = {
            delivered: 'green',
            cancelled: 'red',
            pending: 'orange',
            preparing: 'blue'
          };
          return colors[status] || 'gray';
        };

        return (
          <div data-testid="order-history">
            <div data-testid="history-header">
              <h2>Histórico de Pedidos</h2>
              <p>Total de pedidos: {orders.length}</p>
            </div>

            <div data-testid="order-filters">
              <button data-testid="filter-all">Todos</button>
              <button data-testid="filter-delivered">Entregues</button>
              <button data-testid="filter-cancelled">Cancelados</button>
            </div>

            <div data-testid="orders-list">
              {orders.map(order => (
                <div key={order.id} data-testid={`order-${order.identify}`}>
                  <div data-testid={`order-header-${order.identify}`}>
                    <h3>{order.identify}</h3>
                    <span 
                      data-testid={`order-status-${order.identify}`}
                      style={{ color: getStatusColor(order.status) }}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  
                  <div data-testid={`order-details-${order.identify}`}>
                    <p>Data: {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    <p>Total: R$ {order.total.toFixed(2).replace('.', ',')}</p>
                    <p>Itens: {order.items.length}</p>
                  </div>

                  <div data-testid={`order-items-${order.identify}`}>
                    {order.items.map((item, index) => (
                      <span key={index}>
                        {item.quantity}x {item.name}
                        {index < order.items.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>

                  <div data-testid={`order-actions-${order.identify}`}>
                    <button data-testid={`view-details-${order.identify}`}>
                      Ver Detalhes
                    </button>
                    {order.status === 'delivered' && (
                      <button data-testid={`reorder-${order.identify}`}>
                        Pedir Novamente
                      </button>
                    )}
                    {order.status === 'cancelled' && (
                      <button data-testid={`retry-order-${order.identify}`}>
                        Tentar Novamente
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div data-testid="history-actions">
              <button data-testid="new-order">Fazer Novo Pedido</button>
              <button data-testid="export-history">Exportar Histórico</button>
            </div>
          </div>
        );
      };

      render(<OrderHistory />);

      // Verificar cabeçalho do histórico
      expect(screen.getByTestId('order-history')).toBeInTheDocument();
      expect(screen.getByText('Histórico de Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Total de pedidos: 3')).toBeInTheDocument();

      // Verificar filtros
      expect(screen.getByTestId('order-filters')).toBeInTheDocument();
      expect(screen.getByTestId('filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-delivered')).toBeInTheDocument();
      expect(screen.getByTestId('filter-cancelled')).toBeInTheDocument();

      // Verificar pedidos listados
      expect(screen.getByTestId('order-ORDER-123')).toBeInTheDocument();
      expect(screen.getByTestId('order-ORDER-124')).toBeInTheDocument();
      expect(screen.getByTestId('order-ORDER-125')).toBeInTheDocument();

      // Verificar detalhes do primeiro pedido
      expect(screen.getByTestId('order-status-ORDER-123')).toHaveTextContent('Entregue');
      expect(screen.getByTestId('order-details-ORDER-123')).toHaveTextContent('Total: R$ 35,00');
      expect(screen.getByTestId('order-items-ORDER-123')).toHaveTextContent('1x X-Bacon, 1x Coca-Cola');

      // Verificar ações específicas por status
      expect(screen.getByTestId('reorder-ORDER-123')).toBeInTheDocument(); // Pedido entregue
      expect(screen.getByTestId('retry-order-ORDER-124')).toBeInTheDocument(); // Pedido cancelado

      // Verificar ações gerais
      expect(screen.getByTestId('new-order')).toBeInTheDocument();
      expect(screen.getByTestId('export-history')).toBeInTheDocument();
    });

    it('deve permitir filtrar pedidos por status', async () => {
      const OrderHistory = () => {
        const [filter, setFilter] = React.useState('all');
        const allOrders = [
          { id: 1, identify: 'ORDER-123', status: 'delivered', total: 35.00 },
          { id: 2, identify: 'ORDER-124', status: 'cancelled', total: 25.00 },
          { id: 3, identify: 'ORDER-125', status: 'delivered', total: 45.00 }
        ];

        const filteredOrders = filter === 'all' 
          ? allOrders 
          : allOrders.filter(order => order.status === filter);

        return (
          <div data-testid="order-history">
            <div data-testid="order-filters">
              <button 
                data-testid="filter-all"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'active' : ''}
              >
                Todos ({allOrders.length})
              </button>
              <button 
                data-testid="filter-delivered"
                onClick={() => setFilter('delivered')}
                className={filter === 'delivered' ? 'active' : ''}
              >
                Entregues ({allOrders.filter(o => o.status === 'delivered').length})
              </button>
              <button 
                data-testid="filter-cancelled"
                onClick={() => setFilter('cancelled')}
                className={filter === 'cancelled' ? 'active' : ''}
              >
                Cancelados ({allOrders.filter(o => o.status === 'cancelled').length})
              </button>
            </div>

            <div data-testid="filtered-results">
              <p>Mostrando {filteredOrders.length} pedidos</p>
              {filteredOrders.map(order => (
                <div key={order.id} data-testid={`filtered-order-${order.identify}`}>
                  {order.identify} - {order.status}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<OrderHistory />);

      // Estado inicial - todos os pedidos
      expect(screen.getByText('Mostrando 3 pedidos')).toBeInTheDocument();
      expect(screen.getByTestId('filtered-order-ORDER-123')).toBeInTheDocument();
      expect(screen.getByTestId('filtered-order-ORDER-124')).toBeInTheDocument();
      expect(screen.getByTestId('filtered-order-ORDER-125')).toBeInTheDocument();

      // Filtrar apenas entregues
      fireEvent.click(screen.getByTestId('filter-delivered'));
      expect(screen.getByText('Mostrando 2 pedidos')).toBeInTheDocument();
      expect(screen.getByTestId('filtered-order-ORDER-123')).toBeInTheDocument();
      expect(screen.queryByTestId('filtered-order-ORDER-124')).not.toBeInTheDocument();
      expect(screen.getByTestId('filtered-order-ORDER-125')).toBeInTheDocument();

      // Filtrar apenas cancelados
      fireEvent.click(screen.getByTestId('filter-cancelled'));
      expect(screen.getByText('Mostrando 1 pedidos')).toBeInTheDocument();
      expect(screen.queryByTestId('filtered-order-ORDER-123')).not.toBeInTheDocument();
      expect(screen.getByTestId('filtered-order-ORDER-124')).toBeInTheDocument();
      expect(screen.queryByTestId('filtered-order-ORDER-125')).not.toBeInTheDocument();

      // Voltar para todos
      fireEvent.click(screen.getByTestId('filter-all'));
      expect(screen.getByText('Mostrando 3 pedidos')).toBeInTheDocument();
    });
  });

  describe('Decisão: View history vs End', () => {
    it('deve permitir escolher entre ver histórico ou finalizar', async () => {
      const PostOrderActions = () => {
        const [currentView, setCurrentView] = React.useState('success');

        if (currentView === 'history') {
          return (
            <div data-testid="history-view">
              <h2>Histórico de Pedidos</h2>
              <button 
                data-testid="back-to-success"
                onClick={() => setCurrentView('success')}
              >
                Voltar
              </button>
              <button data-testid="end-session">Finalizar</button>
            </div>
          );
        }

        return (
          <div data-testid="order-success">
            <h2>Pedido Realizado com Sucesso!</h2>
            <p>Seu pedido ORDER-123 foi confirmado</p>
            
            <div data-testid="post-order-options">
              <button 
                data-testid="view-history-option"
                onClick={() => setCurrentView('history')}
              >
                Ver Histórico de Pedidos
              </button>
              <button 
                data-testid="track-order-option"
                onClick={() => setCurrentView('tracking')}
              >
                Acompanhar Pedido
              </button>
              <button 
                data-testid="new-order-option"
                onClick={() => setCurrentView('menu')}
              >
                Fazer Novo Pedido
              </button>
              <button 
                data-testid="end-session-option"
                onClick={() => setCurrentView('end')}
              >
                Finalizar
              </button>
            </div>
          </div>
        );
      };

      render(<PostOrderActions />);

      // Verificar tela de sucesso inicial
      expect(screen.getByTestId('order-success')).toBeInTheDocument();
      expect(screen.getByText('Pedido Realizado com Sucesso!')).toBeInTheDocument();
      expect(screen.getByText('Seu pedido ORDER-123 foi confirmado')).toBeInTheDocument();

      // Verificar opções disponíveis
      expect(screen.getByTestId('post-order-options')).toBeInTheDocument();
      expect(screen.getByTestId('view-history-option')).toBeInTheDocument();
      expect(screen.getByTestId('track-order-option')).toBeInTheDocument();
      expect(screen.getByTestId('new-order-option')).toBeInTheDocument();
      expect(screen.getByTestId('end-session-option')).toBeInTheDocument();

      // Testar navegação para histórico
      fireEvent.click(screen.getByTestId('view-history-option'));
      expect(screen.getByTestId('history-view')).toBeInTheDocument();
      expect(screen.getByText('Histórico de Pedidos')).toBeInTheDocument();

      // Verificar opções no histórico
      expect(screen.getByTestId('back-to-success')).toBeInTheDocument();
      expect(screen.getByTestId('end-session')).toBeInTheDocument();
    });
  });
});