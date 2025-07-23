'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMenuParams } from '@/infrastructure/hooks/useMenuParams';
import { MenuProvider, useMenu } from '@/infrastructure/context/MenuContext';
import { LayoutProvider } from '@/infrastructure/context/LayoutContext';
import { MenuHeader, CategoryList, ProductList } from '@/components/menu';
import { TableActions } from '@/components/menu/TableActions';
import { OrderSummary } from '@/components/menu/OrderSummary';
import { NotFound } from '@/components/ui/NotFound';
import { FloatingCartButton } from '@/components/ui/FloatingCartButton';
import { LayoutSelector } from '@/components/ui/LayoutSelector';
import { StoreHeader } from '@/components/menu/StoreHeader';
import { useContainer } from '@/infrastructure/di';
import { Category } from '@/domain/entities/Category';
import { Product } from '@/domain/entities/Product';

// Componente de carregamento para o Suspense
function MenuLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando cardápio...</p>
      </div>
    </div>
  );
}

// Componente principal envolvido em Suspense
export default function MenuPageWrapper() {
  console.log('Renderizando MenuPageWrapper');
  return (
    <Suspense fallback={<MenuLoading />}>
      <MenuPage />
    </Suspense>
  );
}

function MenuPage() {
  console.log('Renderizando MenuPage - Início');
  const router = useRouter();
  const { tableId, storeSlug, isDelivery, isValid, params } = useMenuParams();
  console.log('MenuPage - Parâmetros:', { tableId, storeSlug, isDelivery, isValid, params });
  
  const { menuRepository } = useContainer();
  console.log('MenuPage - Container carregado');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [tenantData, setTenantData] = useState<{
    id?: number;
    uuid?: string;
    name?: string;
    url?: string;
    logo?: string | null;
    opening_hours?: {
      opens_at: string;
      closes_at: string;
      is_open: boolean;
    };
    min_order_value?: number;
    delivery_fee?: number;
    estimated_delivery_time?: string;
  } | null>(null);
  const hasLoadedMenu = useRef(false);
  
  useEffect(() => {
    if (!isValid || hasLoadedMenu.current) {
      return;
    }
    
    const loadMenu = async () => {
      try {
        setLoading(true);
        
        // Converter isDelivery de string para booleano
        const menuParams = {
          ...params,
          isDelivery: params.isDelivery === 'true' || params.isDelivery === '1'
        };
        
        // Carregar menu completo
        const menuData = await menuRepository.getMenu(menuParams);
        setCategories(menuData.categories || []);
        setProducts(menuData.products || []);
        
        // Armazenar dados do tenant, se disponíveis
        if (menuData.tenant) {
          setTenantData(menuData.tenant);
          console.log('Dados do tenant carregados:', menuData.tenant);
        }
        
        setLoading(false);
        hasLoadedMenu.current = true;
      } catch (error) {
        console.error('Erro ao carregar o menu:', error);
        setError('Não foi possível carregar o menu. Por favor, tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    loadMenu();
  }, [isValid, menuRepository, params]);
  
  // Se não for válido, mostrar página de erro
  if (!isValid) {
    return <NotFound message="Link inválido. Verifique se o QR code está correto." />;
  }
  
  // Atualizar contador de itens no carrinho
  const handleCartItemsChange = (count: number) => {
    setCartItemsCount(count);
  };
  
  // Função para abrir o resumo do pedido
  const openOrderSummary = () => {
    setShowOrderSummary(true);
  };

  // Função para fechar o resumo do pedido
  const closeOrderSummary = () => {
    setShowOrderSummary(false);
  };

  // Função para lidar com o clique no botão do carrinho
  const handleCartClick = () => {
    // Em vez de abrir o OrderSummary, vamos usar o ProductList para abrir o carrinho lateral
    const productListElement = document.querySelector('.product-list-container');
    if (productListElement) {
      const event = new CustomEvent('toggleCart');
      productListElement.dispatchEvent(event);
    } else {
      // Fallback para o método anterior se não encontrar o elemento
      openOrderSummary();
    }
  };

  // Filtrar produtos pela categoria selecionada
  const filteredProducts = selectedCategoryId === 0
    ? products
    : products.filter(product => product.category_id === selectedCategoryId);
  
  return (
    <MenuProvider initialTableId={tableId} initialStoreSlug={storeSlug}>
      <LayoutProvider>
        <MenuContent 
          categories={categories}
          products={products}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          cartItemsCount={cartItemsCount}
          setCartItemsCount={setCartItemsCount}
          showOrderSummary={showOrderSummary}
          openOrderSummary={handleCartClick}
          closeOrderSummary={closeOrderSummary}
          error={error}
          storeSlug={storeSlug}
          tableId={tableId}
          isDelivery={isDelivery}
          tenantData={tenantData}
        />
      </LayoutProvider>
    </MenuProvider>
  );
}

// Componente que usa o contexto do Menu
function MenuContent({
  categories,
  products,
  selectedCategoryId,
  setSelectedCategoryId,
  cartItemsCount,
  setCartItemsCount,
  showOrderSummary,
  openOrderSummary,
  closeOrderSummary,
  error,
  storeSlug,
  tableId,
  isDelivery,
  tenantData
}: {
  categories: Category[];
  products: Product[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  cartItemsCount: number;
  setCartItemsCount: (count: number) => void;
  showOrderSummary: boolean;
  openOrderSummary: () => void;
  closeOrderSummary: () => void;
  error: string | null;
  storeSlug: string | null;
  tableId: string | null;
  isDelivery: boolean;
  tenantData: {
    id?: number;
    uuid?: string;
    name?: string;
    url?: string;
    logo?: string | null;
    opening_hours?: {
      opens_at: string;
      closes_at: string;
      is_open: boolean;
    };
    min_order_value?: number;
    delivery_fee?: number;
    estimated_delivery_time?: string;
  } | null;
}) {
  // Agora podemos usar o hook useMenu com segurança
  const { cartItems, addToCart, removeFromCart, clearCart, updateCartItemQuantity } = useMenu();
  
  // Estados para armazenar os dados da loja
  const [storeName, setStoreName] = useState<string>('');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  
  // Função para lidar com o clique no botão do carrinho
  const handleCartClick = () => {
    // Em vez de abrir o OrderSummary, vamos usar o ProductList para abrir o carrinho lateral
    const productListElement = document.querySelector('.product-list-container');
    if (productListElement) {
      const event = new CustomEvent('toggleCart');
      productListElement.dispatchEvent(event);
    } else {
      // Fallback para o método anterior se não encontrar o elemento
      openOrderSummary();
    }
  };

  // Função para lidar com mudanças nos itens do carrinho
  const handleCartItemsChange = (count: number) => {
    setCartItemsCount(count);
  };
  
  // Efeito para definir os dados da loja a partir do tenant
  useEffect(() => {
    // Usar os dados do tenant, se disponíveis
    if (tenantData) {
      if (tenantData.name) {
        setStoreName(tenantData.name);
      }
      
      if (tenantData.logo) {
        setStoreLogo(tenantData.logo);
      }
      
      console.log('Usando dados do tenant:', tenantData);
    } else {
      // Fallback para o storeSlug
      setStoreName(storeSlug || '');
      console.log('Usando storeSlug como nome da loja:', storeSlug);
    }
  }, [tenantData, storeSlug]);
  
  // Atualizar contador de itens no carrinho quando o carrinho mudar
  useEffect(() => {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    setCartItemsCount(totalItems);
  }, [cartItems, setCartItemsCount]);
  
  // Filtrar produtos pela categoria selecionada
  const filteredProducts = selectedCategoryId === 0
    ? products
    : products.filter(product => product.category_id === selectedCategoryId);
  
  // Se houver erro, mostrar mensagem
  if (error) {
    return <NotFound message={error} />;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="relative">
        <MenuHeader 
          cartItemsCount={cartItemsCount} 
          onCartClick={handleCartClick}
          storeName={storeName || storeSlug || 'Restaurante'}
          storeLogo={storeLogo || undefined}
          openingHours={tenantData?.opening_hours}
          minOrderValue={tenantData?.min_order_value}
        />
        
        {/* Seletor de layout no canto superior direito */}
        <div className="absolute top-4 right-4">
          <LayoutSelector compact />
        </div>
      </div>
      
      {/* Alerta quando a loja está fechada */}
      {tenantData?.opening_hours && !tenantData.opening_hours.is_open && (
        <div className="bg-red-50 border-t border-b border-red-100 px-4 py-3">
          <div className="flex justify-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600">
              Loja fechada no momento. Você pode ver o cardápio, mas só poderá fazer pedidos a partir das {tenantData.opening_hours.opens_at}.
            </p>
          </div>
        </div>
      )}
      
      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6 mb-16 flex-1">
        <CategoryList 
          categories={categories} 
          selectedCategoryId={selectedCategoryId} 
          onSelectCategory={setSelectedCategoryId} 
        />
        
        <div className="product-list-container">
          <ProductList 
            products={filteredProducts}
            selectedCategoryId={selectedCategoryId}
            onCartItemsChange={handleCartItemsChange}
          />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <StoreHeader 
                storeName={storeName || storeSlug || 'Restaurante'}
                storeLogo={storeLogo}
                subtitle="Cardápio digital"
                className="text-white"
              />
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <div className="flex space-x-4 mb-3">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <span className="text-amber-500 font-bold text-lg mr-1">digi</span>
                  <span className="text-white font-bold text-lg">menu</span>
                </div>
                <p className="text-sm text-gray-400">© {new Date().getFullYear()} Todos os direitos reservados</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Mostrar ações de mesa apenas se não for delivery */}
      {!isDelivery && tableId && (
        <TableActions 
          tableId={tableId}
          storeId={storeSlug || ''}
        />
      )}
      
      {showOrderSummary && (
        <OrderSummary 
          onClose={closeOrderSummary}
          isDelivery={isDelivery}
          isStoreOpen={tenantData?.opening_hours?.is_open ?? false}
          minOrderValue={tenantData?.min_order_value ?? 0}
        />
      )}
      
      {/* Botão flutuante do carrinho */}
      <FloatingCartButton 
        storeId={storeSlug || ''}
        tableId={tableId || undefined}
      />
    </div>
  );
} 