import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const userActions = {
  /**
   * Adiciona um produto ao carrinho
   */
  async addProductToCart(productName: string) {
    const user = userEvent.setup();
    
    // Encontrar o produto e clicar em "Ver detalhes"
    const productCard = screen.getByText(productName).closest('[data-testid="product-card"]') ||
                       screen.getByText(productName).closest('.bg-white');
    
    if (!productCard) {
      throw new Error(`Produto "${productName}" não encontrado`);
    }
    
    const detailsButton = productCard.querySelector('button') || 
                         screen.getByText('Ver detalhes');
    
    await user.click(detailsButton);
    
    // Aguardar modal abrir e clicar em adicionar
    await waitFor(() => {
      expect(screen.getByText('Adicionar ao Carrinho')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Adicionar ao Carrinho'));
  },

  /**
   * Abre o carrinho
   */
  async openCart() {
    const user = userEvent.setup();
    
    const cartButton = screen.getByTestId('cart-button') || 
                      screen.getByText('Carrinho') ||
                      screen.getByRole('button', { name: /carrinho/i });
    
    await user.click(cartButton);
  },

  /**
   * Vai para o checkout
   */
  async goToCheckout() {
    const user = userEvent.setup();
    
    await this.openCart();
    
    await waitFor(() => {
      expect(screen.getByText('Finalizar Pedido')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Finalizar Pedido'));
  },

  /**
   * Preenche formulário de entrega
   */
  async fillDeliveryForm(data: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  }) {
    const user = userEvent.setup();
    
    // Preencher nome
    const nameInput = screen.getByLabelText(/nome/i) || 
                     screen.getByPlaceholderText(/nome/i);
    await user.clear(nameInput);
    await user.type(nameInput, data.name);
    
    // Preencher telefone
    const phoneInput = screen.getByLabelText(/telefone|whatsapp/i) || 
                      screen.getByPlaceholderText(/telefone/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, data.phone);
    
    // Preencher endereço
    const addressInput = screen.getByLabelText(/endereço/i) || 
                        screen.getByPlaceholderText(/endereço/i);
    await user.clear(addressInput);
    await user.type(addressInput, data.address);
    
    // Preencher email se fornecido
    if (data.email) {
      const emailInput = screen.getByLabelText(/email/i) || 
                        screen.getByPlaceholderText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, data.email);
    }
  },

  /**
   * Seleciona forma de pagamento
   */
  async selectPaymentMethod(method: 'money' | 'credit' | 'debit' | 'pix') {
    const user = userEvent.setup();
    
    const paymentSelect = screen.getByLabelText(/forma de pagamento/i) ||
                         screen.getByDisplayValue(/dinheiro|cartão|pix/i);
    
    await user.selectOptions(paymentSelect, method);
  },

  /**
   * Finaliza o pedido
   */
  async completeOrder() {
    const user = userEvent.setup();
    
    const completeButton = screen.getByText('Finalizar Pedido') ||
                          screen.getByText('Confirmar Pedido') ||
                          screen.getByRole('button', { name: /finalizar|confirmar/i });
    
    await user.click(completeButton);
  },

  /**
   * Busca por produtos
   */
  async searchProducts(searchTerm: string) {
    const user = userEvent.setup();
    
    const searchInput = screen.getByPlaceholderText(/buscar/i) ||
                       screen.getByRole('searchbox');
    
    await user.clear(searchInput);
    await user.type(searchInput, searchTerm);
  },

  /**
   * Aplica filtros
   */
  async applyFilters(filters: {
    onlyFeatured?: boolean;
    onlyPromotional?: boolean;
    onlyPopular?: boolean;
  }) {
    const user = userEvent.setup();
    
    // Abrir filtros
    const filterButton = screen.getByText('Filtros') ||
                        screen.getByRole('button', { name: /filtros/i });
    await user.click(filterButton);
    
    // Aplicar filtros específicos
    if (filters.onlyFeatured) {
      const featuredFilter = screen.getByLabelText(/destaque/i);
      await user.click(featuredFilter);
    }
    
    if (filters.onlyPromotional) {
      const promotionalFilter = screen.getByLabelText(/promoção/i);
      await user.click(promotionalFilter);
    }
    
    if (filters.onlyPopular) {
      const popularFilter = screen.getByLabelText(/popular/i);
      await user.click(popularFilter);
    }
  },

  /**
   * Seleciona categoria
   */
  async selectCategory(categoryName: string) {
    const user = userEvent.setup();
    
    const categoryButton = screen.getByText(categoryName) ||
                          screen.getByRole('button', { name: new RegExp(categoryName, 'i') });
    
    await user.click(categoryButton);
  },

  /**
   * Chama garçom (para fluxo de mesa)
   */
  async callWaiter(message?: string) {
    const user = userEvent.setup();
    
    const waiterButton = screen.getByText('Chamar Garçom') ||
                        screen.getByRole('button', { name: /chamar garçom/i });
    
    await user.click(waiterButton);
    
    if (message) {
      const messageInput = screen.getByPlaceholderText(/mensagem/i) ||
                          screen.getByLabelText(/mensagem/i);
      await user.type(messageInput, message);
    }
    
    const sendButton = screen.getByText('Enviar') ||
                      screen.getByRole('button', { name: /enviar/i });
    await user.click(sendButton);
  }
};