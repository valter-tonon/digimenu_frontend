'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useMenuParams } from '@/infrastructure/hooks/useMenuParams';
import { MenuProvider, useMenu } from '@/infrastructure/context/MenuContext';
import { MenuHeader, CategoryList, ProductList } from '@/components/menu';
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
  
  useEffect(() => {
    if (!isValid) {
      return;
    }
    
    loadMenu();
  }, [isValid, tableId, storeSlug]);
  
  async function loadMenu() {
    try {
      setLoading(true);
      setError(null);
      
      const data = await menuRepository.getMenu(params);
      
      setCategories(data.categories || []);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Erro ao carregar menu:', err);
      setError('Não foi possível carregar o menu. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }
  
  const handleSelectCategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };
  
  const handleCartItemsChange = (count: number) => {
    setCartItemsCount(count);
  };
  
  if (!isValid) {
    return <NotFound />;
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ops! Algo deu errado</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadMenu}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <MenuProvider initialTableId={tableId} initialStoreSlug={storeSlug}>
      <MenuContent 
        categories={categories} 
        products={products} 
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        onCartItemsChange={handleCartItemsChange}
        cartItemsCount={cartItemsCount}
      />
    </MenuProvider>
  );
}

function MenuContent({
  categories,
  products,
  selectedCategoryId,
  onSelectCategory,
  onCartItemsChange,
  cartItemsCount
}: {
  categories: Category[];
  products: Product[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number) => void;
  onCartItemsChange: (count: number) => void;
  cartItemsCount: number;
}) {
  const { setIsCartOpen } = useMenu();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleCartClick = () => {
    setIsCartOpen(true);
  };
  
  return (
    <div className="w-full">
      <MenuHeader 
        cartItemsCount={cartItemsCount} 
        onCartClick={handleCartClick} 
      />
      
      <div className="container mx-auto px-4 pb-20">
        {/* Campo de busca de produtos */}
        <div className="mt-6 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input 
              type="search" 
              className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-amber-500 focus:border-amber-500" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <CategoryList 
            categories={categories} 
            onSelectCategory={onSelectCategory} 
            selectedCategoryId={selectedCategoryId} 
          />
        </div>
        
        <div className="mt-6">
          <ProductList 
            products={products} 
            selectedCategoryId={selectedCategoryId}
            onCartItemsChange={onCartItemsChange}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </div>
  );
} 