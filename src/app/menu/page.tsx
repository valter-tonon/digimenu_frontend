'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMenuParams } from '@/infrastructure/hooks/useMenuParams';
import { MenuProvider, useMenu } from '@/infrastructure/context/MenuContext';
import { MenuHeader, CategoryList, ProductList } from '@/components/menu';
import { TableActions } from '@/components/menu/TableActions';
import { OrderSummary } from '@/components/menu/OrderSummary';
import { NotFound } from '@/components/ui/NotFound';
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
  return (
    <Suspense fallback={<MenuLoading />}>
      <MenuPage />
    </Suspense>
  );
}

function MenuPage() {
  const router = useRouter();
  const { tableId, storeSlug, isValid, params } = useMenuParams();
  const { menuRepository } = useContainer();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const hasLoadedMenu = useRef(false);
  
  useEffect(() => {
    if (!isValid || hasLoadedMenu.current) {
      return;
    }
    
    const loadMenu = async () => {
      try {
        setLoading(true);
        
        // Carregar menu completo
        const menuData = await menuRepository.getMenu(params);
        setCategories(menuData.categories || []);
        setProducts(menuData.products || []);
        
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

  // Adicionar botão de resumo do pedido no header
  const handleCartClick = () => {
    openOrderSummary();
  };

  return (
    <MenuProvider initialTableId={tableId} initialStoreSlug={storeSlug}>
      <MenuContent 
        categories={categories}
        products={products}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        cartItemsCount={cartItemsCount}
        setCartItemsCount={setCartItemsCount}
        showOrderSummary={showOrderSummary}
        openOrderSummary={openOrderSummary}
        closeOrderSummary={closeOrderSummary}
        error={error}
        storeSlug={storeSlug}
        tableId={tableId}
      />
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
  tableId
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
}) {
  // Agora podemos usar o hook useMenu com segurança
  const { isCartOpen } = useMenu();
  
  // Função para lidar com o clique no botão do carrinho
  const handleCartClick = () => {
    openOrderSummary();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {error ? (
        <NotFound message={error} />
      ) : (
        <>
          <MenuHeader 
            storeName={storeSlug || ''} 
            cartItemsCount={cartItemsCount} 
            onCartClick={handleCartClick}
          />
          
          <div className="container mx-auto px-4 py-6">
            <CategoryList 
              categories={categories} 
              selectedCategoryId={selectedCategoryId} 
              onSelectCategory={setSelectedCategoryId} 
            />
            
            <ProductList 
              products={products} 
              selectedCategoryId={selectedCategoryId}
              onCartItemsChange={setCartItemsCount}
            />
          </div>
          
          {/* Componente de ações da mesa */}
          {tableId && storeSlug && (
            <TableActions 
              storeId={storeSlug} 
              tableId={tableId} 
            />
          )}
          
          {/* Modal de resumo do pedido */}
          {showOrderSummary && (
            <OrderSummary onClose={closeOrderSummary} />
          )}
        </>
      )}
    </div>
  );
} 