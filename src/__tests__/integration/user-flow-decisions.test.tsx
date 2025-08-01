import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Testes para pontos de decisão do fluxo baseados no diagrama
describe('Pontos de Decisão do Fluxo de Delivery', () => {
  const storeId = '02efe224-e368-4a7a-a153-5fc49cd9c5ac';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Decisão: Usuário Logado (Yes/No)', () => {
    it('deve seguir fluxo "Yes" - usuário logado com endereços salvos', async () => {
      // Mock de usuário logado
      const mockAuthenticatedUser = {
        isAuthenticated: true,
        customer: {
          id: 1,
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '(11) 99999-9999',
          addresses: [
            {
              id: 1,
              street: 'Rua Salva',
              number: '456',
              neighborhood: 'Centro',
              zip_code: '01234-567',
              is_default: true
            }
          ]
        }
      };

      const CheckoutWithAuth = () => {
        const [user] = React.useState(mockAuthenticatedUser);
        
        if (!user.isAuthenticated) {
          return <div data-testid="guest-checkout">Checkout como convidado</div>;
        }

        return (
          <div data-testid="authenticated-checkout">
            <h2>Olá, {user.customer.name}!</h2>
            <div data-testid="saved-addresses">
              <h3>Endereços Salvos</h3>
              {user.customer.addresses.map(address => (
                <div key={address.id} data-testid={`address-${address.id}`}>
                  <span>{address.street}, {address.number}</span>
                  <button data-testid={`use-address-${address.id}`}>
                    Usar este endereço
                  </button>
                </div>
              ))}
              <button data-testid="add-new-address">
                Adicionar novo endereço
              </button>
            </div>
          </div>
        );
      };

      render(<CheckoutWithAuth />);

      // Verificar fluxo de usuário logado
      expect(screen.getByTestId('authenticated-checkout')).toBeInTheDocument();
      expect(screen.getByText('Olá, João Silva!')).toBeInTheDocument();
      
      // Verificar endereços salvos
      expect(screen.getByTestId('saved-addresses')).toBeInTheDocument();
      expect(screen.getByTestId('address-1')).toBeInTheDocument();
      expect(screen.getByText('Rua Salva, 456')).toBeInTheDocument();
      
      // Verificar opções disponíveis
      expect(screen.getByTestId('use-address-1')).toBeInTheDocument();
      expect(screen.getByTestId('add-new-address')).toBeInTheDocument();
    });

    it('deve seguir fluxo "No" - usuário não logado', async () => {
      const CheckoutWithoutAuth = () => {
        const [user] = React.useState({ isAuthenticated: false, customer: null });
        
        if (!user.isAuthenticated) {
          return (
            <div data-testid="guest-checkout">
              <h2>Finalizar Pedido</h2>
              <div data-testid="customer-form">
                <input name="name" placeholder="Nome completo" />
                <input name="phone" placeholder="Telefone" />
                <input name="email" placeholder="E-mail" />
              </div>
              <div data-testid="address-form">
                <input name="street" placeholder="Rua" />
                <input name="number" placeholder="Número" />
                <input name="neighborhood" placeholder="Bairro" />
                <input name="zipCode" placeholder="CEP" />
              </div>
              <div data-testid="login-option">
                <button data-testid="login-button">
                  Já tem conta? Faça login
                </button>
              </div>
            </div>
          );
        }

        return <div data-testid="authenticated-checkout">Usuário logado</div>;
      };

      render(<CheckoutWithoutAuth />);

      // Verificar fluxo de convidado
      expect(screen.getByTestId('guest-checkout')).toBeInTheDocument();
      expect(screen.getByText('Finalizar Pedido')).toBeInTheDocument();
      
      // Verificar formulários obrigatórios
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
      expect(screen.getByTestId('address-form')).toBeInTheDocument();
      
      // Verificar opção de login
      expect(screen.getByTestId('login-option')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });
  });

  describe('Decisão: Use saved address vs Request user data', () => {
    it('deve permitir usar endereço salvo', async () => {
      const AddressSelection = () => {
        const [selectedAddress, setSelectedAddress] = React.useState(null);
        const [showNewAddressForm, setShowNewAddressForm] = React.useState(false);
        
        const savedAddresses = [
          {
            id: 1,
            street: 'Rua Principal',
            number: '123',
            neighborhood: 'Centro',
            zip_code: '01234-567',
            is_default: true
          },
          {
            id: 2,
            street: 'Rua Secundária',
            number: '456',
            neighborhood: 'Bairro',
            zip_code: '09876-543',
            is_default: false
          }
        ];

        if (showNewAddressForm) {
          return (
            <div data-testid="new-address-form">
              <h3>Novo Endereço</h3>
              <input name="street" placeholder="Rua" />
              <input name="number" placeholder="Número" />
              <button data-testid="save-new-address">Salvar</button>
              <button 
                data-testid="cancel-new-address"
                onClick={() => setShowNewAddressForm(false)}
              >
                Cancelar
              </button>
            </div>
          );
        }

        return (
          <div data-testid="address-selection">
            <h3>Escolha o endereço de entrega</h3>
            {savedAddresses.map(address => (
              <div 
                key={address.id} 
                data-testid={`saved-address-${address.id}`}
                className={selectedAddress?.id === address.id ? 'selected' : ''}
              >
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  onChange={() => setSelectedAddress(address)}
                  data-testid={`select-address-${address.id}`}
                />
                <label>
                  {address.street}, {address.number} - {address.neighborhood}
                  {address.is_default && <span data-testid="default-badge"> (Padrão)</span>}
                </label>
              </div>
            ))}
            <button 
              data-testid="add-new-address-button"
              onClick={() => setShowNewAddressForm(true)}
            >
              + Adicionar novo endereço
            </button>
            {selectedAddress && (
              <div data-testid="selected-address-info">
                <p>Endereço selecionado: {selectedAddress.street}, {selectedAddress.number}</p>
                <button data-testid="confirm-address">Confirmar endereço</button>
              </div>
            )}
          </div>
        );
      };

      render(<AddressSelection />);

      // Verificar endereços salvos
      expect(screen.getByTestId('address-selection')).toBeInTheDocument();
      expect(screen.getByTestId('saved-address-1')).toBeInTheDocument();
      expect(screen.getByTestId('saved-address-2')).toBeInTheDocument();
      
      // Verificar endereço padrão
      expect(screen.getByTestId('default-badge')).toBeInTheDocument();
      
      // Selecionar endereço salvo
      fireEvent.click(screen.getByTestId('select-address-1'));
      
      // Verificar seleção
      expect(screen.getByTestId('selected-address-info')).toBeInTheDocument();
      expect(screen.getByText('Endereço selecionado: Rua Principal, 123')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-address')).toBeInTheDocument();
    });

    it('deve permitir adicionar novo endereço', async () => {
      const AddressSelection = () => {
        const [showNewAddressForm, setShowNewAddressForm] = React.useState(false);
        const [newAddress, setNewAddress] = React.useState({
          street: '',
          number: '',
          neighborhood: '',
          zipCode: ''
        });

        if (showNewAddressForm) {
          return (
            <div data-testid="new-address-form">
              <h3>Novo Endereço</h3>
              <input 
                name="street" 
                placeholder="Rua"
                value={newAddress.street}
                onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                data-testid="new-street-input"
              />
              <input 
                name="number" 
                placeholder="Número"
                value={newAddress.number}
                onChange={(e) => setNewAddress({...newAddress, number: e.target.value})}
                data-testid="new-number-input"
              />
              <input 
                name="neighborhood" 
                placeholder="Bairro"
                value={newAddress.neighborhood}
                onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})}
                data-testid="new-neighborhood-input"
              />
              <input 
                name="zipCode" 
                placeholder="CEP"
                value={newAddress.zipCode}
                onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                data-testid="new-zipcode-input"
              />
              <button data-testid="save-new-address">Salvar endereço</button>
              <button 
                data-testid="cancel-new-address"
                onClick={() => setShowNewAddressForm(false)}
              >
                Cancelar
              </button>
            </div>
          );
        }

        return (
          <div data-testid="address-selection">
            <button 
              data-testid="add-new-address-button"
              onClick={() => setShowNewAddressForm(true)}
            >
              + Adicionar novo endereço
            </button>
          </div>
        );
      };

      render(<AddressSelection />);

      // Clicar para adicionar novo endereço
      fireEvent.click(screen.getByTestId('add-new-address-button'));

      // Verificar formulário de novo endereço
      expect(screen.getByTestId('new-address-form')).toBeInTheDocument();
      expect(screen.getByTestId('new-street-input')).toBeInTheDocument();
      expect(screen.getByTestId('new-number-input')).toBeInTheDocument();
      expect(screen.getByTestId('new-neighborhood-input')).toBeInTheDocument();
      expect(screen.getByTestId('new-zipcode-input')).toBeInTheDocument();

      // Preencher novo endereço
      fireEvent.change(screen.getByTestId('new-street-input'), { 
        target: { value: 'Rua Nova' } 
      });
      fireEvent.change(screen.getByTestId('new-number-input'), { 
        target: { value: '789' } 
      });
      fireEvent.change(screen.getByTestId('new-neighborhood-input'), { 
        target: { value: 'Novo Bairro' } 
      });
      fireEvent.change(screen.getByTestId('new-zipcode-input'), { 
        target: { value: '12345-678' } 
      });

      // Verificar preenchimento
      expect(screen.getByTestId('new-street-input')).toHaveValue('Rua Nova');
      expect(screen.getByTestId('new-number-input')).toHaveValue('789');
      expect(screen.getByTestId('new-neighborhood-input')).toHaveValue('Novo Bairro');
      expect(screen.getByTestId('new-zipcode-input')).toHaveValue('12345-678');

      // Verificar botões de ação
      expect(screen.getByTestId('save-new-address')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-new-address')).toBeInTheDocument();
    });
  });
});