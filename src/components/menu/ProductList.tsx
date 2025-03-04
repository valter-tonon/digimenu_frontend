'use client';

import { Product, Additional } from '@/domain/entities/Product';
import { useMemo, useState, useEffect } from 'react';
import { useMenu } from '@/infrastructure/context/MenuContext';
import { useMenuParams } from '@/infrastructure/hooks/useMenuParams';

// Função para formatar o preço com segurança
const formatPrice = (price: any): string => {
  // Se for null ou undefined, retorna "0.00"
  if (price == null) return "0.00";
  
  // Tenta converter para número
  const numPrice = typeof price === 'number' ? price : Number(price);
  
  // Verifica se é um número válido
  if (isNaN(numPrice)) return "0.00";
  
  // Formata o número com 2 casas decimais
  return numPrice.toFixed(2);
};

// Interface para itens do carrinho
interface CartItem {
  product: Product;
  quantity: number;
  selectedAdditionals?: Additional[];
}

interface ProductListProps {
  products: Product[];
  selectedCategoryId: number | null;
  onCartItemsChange?: (count: number) => void;
  searchTerm?: string;
}

export function ProductList({ products, selectedCategoryId, onCartItemsChange, searchTerm = '' }: ProductListProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAdditionals, setSelectedAdditionals] = useState<Additional[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  
  // Obter os parâmetros do menu no nível do componente
  const menuParams = useMenuParams();
  
  // Adicionar estado para controlar o carregamento e feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    success: boolean;
    message: string;
    orderIdentify?: string;
  } | null>(null);

  // Usar o termo de busca das props se fornecido, caso contrário usar o interno
  const effectiveSearchTerm = searchTerm !== undefined ? searchTerm : internalSearchTerm;

  // Notificar o componente pai sobre mudanças no carrinho
  useEffect(() => {
    if (onCartItemsChange) {
      const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
      onCartItemsChange(itemCount);
    }
  }, [cartItems, onCartItemsChange]);

  // Garantir que temos produtos válidos
  const validProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return [];
    }
    
    // Filtrar produtos inválidos
    return products.filter(product => 
      product && (typeof product === 'object')
    );
  }, [products]);
  
  // Filtrar produtos com base na categoria selecionada e termo de busca
  const filteredProducts = useMemo(() => {
    // Garantir que temos produtos válidos
    const validProducts = products.filter(product => product && product.id);
    
    // Filtrar por categoria
    let filtered = validProducts;
    if (selectedCategoryId) {
      filtered = filtered.filter(product => product.category_id === selectedCategoryId);
    }
    
    // Filtrar por termo de busca
    if (effectiveSearchTerm.trim()) {
      const term = effectiveSearchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(term) || 
        product.description?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [products, selectedCategoryId, effectiveSearchTerm]);

  // Função para abrir a modal com os detalhes do produto
  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setSelectedAdditionals([]); // Limpar adicionais selecionados ao abrir nova modal
  };

  // Função para fechar a modal
  const closeModal = () => {
    setSelectedProduct(null);
    setSelectedAdditionals([]);
  };
  
  // Função para alternar a seleção de um adicional
  const toggleAdditional = (additional: Additional) => {
    setSelectedAdditionals(prev => {
      const isSelected = prev.some(item => item.id === additional.id);
      if (isSelected) {
        return prev.filter(item => item.id !== additional.id);
      } else {
        return [...prev, additional];
      }
    });
  };
  
  // Calcular o preço total do produto com adicionais
  const calculateTotalPrice = (basePrice: number, additionals: Additional[] = []) => {
    // Garantir que o preço base seja um número válido
    const validBasePrice = Number(basePrice) || 0;
    
    // Calcular o total dos adicionais com validação de cada preço
    const additionalsTotal = additionals.reduce((sum, item) => {
      const additionalPrice = Number(item.price) || 0;
      return sum + additionalPrice;
    }, 0);
    
    return validBasePrice + additionalsTotal;
  };
  
  // Função para adicionar produto ao carrinho
  const addToCart = (product: Product, additionals: Additional[] = []) => {
    setCartItems(prevItems => {
      // Verificar se o produto já está no carrinho com os mesmos adicionais
      const existingItemIndex = prevItems.findIndex(item => {
        if (item.product.id !== product.id) return false;
        
        // Se não tem adicionais selecionados e o item também não tem, são iguais
        if (!additionals.length && (!item.selectedAdditionals || !item.selectedAdditionals.length)) {
          return true;
        }
        
        // Se a quantidade de adicionais é diferente, são diferentes
        if (additionals.length !== (item.selectedAdditionals?.length || 0)) {
          return false;
        }
        
        // Verificar se todos os adicionais são os mesmos
        return additionals.every(additional => 
          item.selectedAdditionals?.some(itemAdditional => itemAdditional.id === additional.id)
        );
      });
      
      if (existingItemIndex >= 0) {
        // Se já existe, aumenta a quantidade
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // Se não existe, adiciona novo item
        return [...prevItems, { 
          product, 
          quantity: 1,
          selectedAdditionals: additionals.length > 0 ? [...additionals] : undefined
        }];
      }
    });
    
    // Abre o carrinho automaticamente ao adicionar um item
    setIsCartOpen(true);
  };
  
  // Função para remover item do carrinho
  const removeFromCart = (productId: number, additionals?: Additional[]) => {
    setCartItems(prevItems => {
      if (!additionals || additionals.length === 0) {
        // Se não tem adicionais, remove o item pelo ID do produto
        return prevItems.filter(item => item.product.id !== productId);
      } else {
        // Se tem adicionais, remove apenas o item específico com esses adicionais
        return prevItems.filter(item => {
          if (item.product.id !== productId) return true;
          
          // Se o item não tem adicionais, mas estamos procurando por um com adicionais, manter
          if (!item.selectedAdditionals) return true;
          
          // Verificar se os adicionais são os mesmos
          const hasSameAdditionals = additionals.every(additional => 
            item.selectedAdditionals?.some(itemAdditional => itemAdditional.id === additional.id)
          );
          
          // Manter se não for o mesmo conjunto de adicionais
          return !hasSameAdditionals;
        });
      }
    });
  };
  
  // Função para alterar a quantidade de um item
  const updateQuantity = (productId: number, newQuantity: number, additionals?: Additional[]) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, additionals);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => {
        // Se o ID do produto não corresponde, manter o item inalterado
        if (item.product.id !== productId) return item;
        
        // Se não tem adicionais para verificar
        if (!additionals || additionals.length === 0) {
          // Se o item também não tem adicionais, atualizar a quantidade
          if (!item.selectedAdditionals || item.selectedAdditionals.length === 0) {
            return { ...item, quantity: newQuantity };
          }
          return item; // Manter inalterado se o item tem adicionais
        }
        
        // Verificar se os adicionais são os mesmos
        const hasSameAdditionals = additionals.every(additional => 
          item.selectedAdditionals?.some(itemAdditional => itemAdditional.id === additional.id)
        ) && item.selectedAdditionals?.length === additionals.length;
        
        // Atualizar apenas se for o mesmo conjunto de adicionais
        return hasSameAdditionals ? { ...item, quantity: newQuantity } : item;
      })
    );
  };
  
  // Calcular o total do carrinho
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const basePrice = Number(item.product.price) || 0;
      const additionalsPrice = item.selectedAdditionals?.reduce(
        (sum, additional) => {
          // Garantir que o preço do adicional seja um número válido
          const additionalPrice = Number(additional.price) || 0;
          return sum + additionalPrice;
        }, 
        0
      ) || 0;
      
      // Calcular o preço total do item (preço base + adicionais) * quantidade
      const itemTotal = (basePrice + additionalsPrice) * item.quantity;
      return total + itemTotal;
    }, 0);
  }, [cartItems]);

  // Adicionar a função finishOrder antes do return final
  const finishOrder = async () => {
    try {
      // Iniciar o processo de submissão
      setIsSubmitting(true);
      setOrderSuccess(null);
      
      // Fechar o carrinho
      setIsCartOpen(false);
      
      // Usar os parâmetros do menu obtidos no nível do componente
      const { tableId, storeSlug } = menuParams;
      
      if (!storeSlug) {
        throw new Error('Identificador da loja não encontrado');
      }
      
      // Preparar os dados do pedido
      const orderData = {
        token_company: storeSlug, // Identificador da empresa/loja
        ...(tableId ? { table: tableId } : {}), // Adicionar mesa apenas se existir
        products: cartItems.map(item => ({
          identify: item.product.uuid || item.product.id.toString(), // Usar UUID ou ID do produto como string
          quantity: item.quantity,
          additionals: item.selectedAdditionals ? item.selectedAdditionals.map(add => add.id.toString()) : []
        }))
      };
      
      console.log('Enviando pedido:', orderData);
      
      // Enviar para a API
      const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
      // A variável NEXT_PUBLIC_API_URL já inclui o prefixo 'api/v1'
      const url = `${baseURL}/orders-kanban`;
      console.log('URL da API:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      console.log('Resposta da API:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Texto do erro:', errorText);
        
        let errorMessage = 'Erro ao finalizar o pedido';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Erro ao processar resposta de erro:', errorText);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Dados da resposta:', data);
      
      // Limpar o carrinho
      setCartItems([]);
      
      // Definir sucesso
      setOrderSuccess({
        success: true,
        message: 'Pedido finalizado com sucesso!',
        orderIdentify: data.data?.identify || 'N/A'
      });
      
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      
      // Definir erro
      setOrderSuccess({
        success: false,
        message: `Erro ao finalizar o pedido: ${error.message || 'Tente novamente mais tarde'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adicionar componente de feedback após o carrinho
  const OrderFeedback = () => {
    if (!orderSuccess) return null;
    
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50`}>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className={`text-2xl mb-4 ${orderSuccess.success ? 'text-green-600' : 'text-red-600'}`}>
            {orderSuccess.success ? '✓ Sucesso!' : '✗ Erro!'}
          </div>
          <p className="text-gray-800 mb-4">{orderSuccess.message}</p>
          {orderSuccess.success && orderSuccess.orderIdentify && (
            <p className="text-gray-600 mb-4">Número do pedido: <span className="font-bold">{orderSuccess.orderIdentify}</span></p>
          )}
          <button
            onClick={() => setOrderSuccess(null)}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  };

  if (validProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nenhum produto disponível.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 relative">
      {/* Campo de busca de produtos (mostrar apenas se não for fornecido via props) */}
      {searchTerm === undefined && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={internalSearchTerm}
              onChange={(e) => setInternalSearchTerm(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Nenhum produto encontrado para os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((product, index) => {
            // Garantir que temos uma chave única para cada item
            const uniqueKey = `product-${
              product.uuid || 
              product.id?.toString() || 
              product.name?.replace(/\s+/g, '-').toLowerCase() || 
              index
            }`;
            
            return (
              <div 
                key={uniqueKey} 
                className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-full h-40 relative">
                  <img 
                    src={product.image || 'https://via.placeholder.com/400?text=Sem+Imagem'} 
                    alt={product.name || 'Produto sem nome'} 
                    className="w-full h-full object-cover"
                    onClick={() => openProductDetails(product)}
                  />
                </div>
                <div className="p-3 flex flex-col justify-between">
                  <h3 className="font-semibold text-gray-800 text-base line-clamp-1">{product.name || 'Produto sem nome'}</h3>
                  {product.category && (
                    <div className="text-xs text-gray-500 mt-1">
                      {product.additionals && product.additionals.length > 0 && (
                        <span>{product.additionals.length} adicionais disponíveis</span>
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-base font-bold text-green-600">
                      R$ {formatPrice(product.price)}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="text-amber-500 text-xs hover:text-amber-600 transition-colors"
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalhes do produto */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <img 
                  src={selectedProduct.image || 'https://via.placeholder.com/400x300?text=Sem+Imagem'} 
                  alt={selectedProduct.name} 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Descrição</h3>
                <p className="text-gray-600 mt-1">{selectedProduct.description || 'Sem descrição disponível.'}</p>
              </div>
              
              {/* Adicionais */}
              {selectedProduct.additionals && selectedProduct.additionals.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Adicionais</h3>
                  <p className="text-sm text-gray-500 mb-3">Selecione os adicionais desejados:</p>
                  
                  <div className="space-y-2">
                    {selectedProduct.additionals.map(additional => {
                      const isSelected = selectedAdditionals.some(item => item.id === additional.id);
                      
                      return (
                        <div 
                          key={additional.id} 
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-amber-500 bg-amber-50' 
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                          onClick={() => toggleAdditional(additional)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium text-gray-800">{additional.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600 font-medium">
                                + R$ {formatPrice(additional.price)}
                              </span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-amber-500 border-amber-500' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Preço</h3>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold text-amber-600">
                    R$ {formatPrice(calculateTotalPrice(
                      Number(selectedProduct.price) || 0, 
                      selectedAdditionals
                    ))}
                  </p>
                  
                  {selectedAdditionals.length > 0 && (
                    <p className="ml-2 text-sm text-gray-500">
                      (R$ {formatPrice(selectedProduct.price)} + R$ {formatPrice(
                        selectedAdditionals.reduce((sum, item) => {
                          const additionalPrice = Number(item.price) || 0;
                          return sum + additionalPrice;
                        }, 0)
                      )} em adicionais)
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(selectedProduct, selectedAdditionals);
                    closeModal();
                  }}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                >
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar do carrinho */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsCartOpen(false)}
            ></div>
            
            <div className="fixed inset-y-0 right-0 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
                  <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Seu carrinho</h2>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          <span className="sr-only">Fechar painel</span>
                          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-8">
                      {cartItems.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Carrinho vazio</h3>
                          <p className="mt-1 text-sm text-gray-500">Seu carrinho está vazio no momento.</p>
                          <div className="mt-6">
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none"
                              onClick={() => setIsCartOpen(false)}
                            >
                              Continuar comprando
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flow-root">
                          <ul className="-my-6 divide-y divide-gray-200">
                            {cartItems.map((item, index) => {
                              const basePrice = Number(item.product.price) || 0;
                              const additionalsPrice = item.selectedAdditionals?.reduce(
                                (sum, additional) => {
                                  // Garantir que o preço do adicional seja um número válido
                                  const additionalPrice = Number(additional.price) || 0;
                                  return sum + additionalPrice;
                                }, 
                                0
                              ) || 0;
                              const totalItemPrice = (basePrice + additionalsPrice) * item.quantity;
                              
                              return (
                                <li key={`${item.product.id}-${index}`} className="py-6 flex">
                                  <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                                    <img
                                      src={item.product.image || 'https://via.placeholder.com/150?text=Sem+Imagem'}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <div className="ml-4 flex-1 flex flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>{item.product.name}</h3>
                                        <p className="ml-4">R$ {formatPrice(totalItemPrice)}</p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500 line-clamp-1">{item.product.description}</p>
                                      
                                      {/* Mostrar adicionais selecionados */}
                                      {item.selectedAdditionals && item.selectedAdditionals.length > 0 && (
                                        <div className="mt-1">
                                          <p className="text-xs text-gray-500">Adicionais:</p>
                                          <ul className="mt-1 space-y-1">
                                            {item.selectedAdditionals.map(additional => (
                                              <li key={additional.id} className="text-xs text-gray-600 flex justify-between">
                                                <span>{additional.name}</span>
                                                <span>+R$ {formatPrice(additional.price)}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 flex items-end justify-between text-sm">
                                      <div className="flex items-center">
                                        <button
                                          onClick={() => updateQuantity(
                                            item.product.id, 
                                            item.quantity - 1, 
                                            item.selectedAdditionals
                                          )}
                                          className="text-gray-500 hover:text-gray-700 p-1"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                        <span className="mx-2 text-gray-700">{item.quantity}</span>
                                        <button
                                          onClick={() => updateQuantity(
                                            item.product.id, 
                                            item.quantity + 1, 
                                            item.selectedAdditionals
                                          )}
                                          className="text-gray-500 hover:text-gray-700 p-1"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </div>

                                      <div className="flex">
                                        <button
                                          onClick={() => removeFromCart(item.product.id, item.selectedAdditionals)}
                                          type="button"
                                          className="font-medium text-red-600 hover:text-red-500"
                                        >
                                          Remover
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {cartItems.length > 0 && (
                    <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Subtotal</p>
                        <p>R$ {formatPrice(cartTotal)}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">Frete e taxas calculados no checkout.</p>
                      <div className="mt-6">
                        <a
                          href="#"
                          className="flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-amber-500 hover:bg-amber-600"
                          onClick={(e) => {
                            e.preventDefault();
                            finishOrder();
                          }}
                        >
                          Finalizar pedido
                        </a>
                      </div>
                      <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                        <p>
                          ou{' '}
                          <button
                            type="button"
                            className="text-amber-600 font-medium hover:text-amber-500"
                            onClick={() => setIsCartOpen(false)}
                          >
                            Continuar comprando<span aria-hidden="true"> &rarr;</span>
                          </button>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback de pedido */}
      {orderSuccess && <OrderFeedback />}
    </div>
  );
} 