'use client';

import { Category } from '@/domain/entities/Category';
import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number | null;
}

// Função para obter ícone baseado no nome da categoria
const getCategoryIcon = (categoryName: string): { emoji: string; bgColor: string } => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('lanch') || name.includes('hambur')) {
    return { emoji: '🍔', bgColor: 'bg-amber-100' };
  } else if (name.includes('pizza')) {
    return { emoji: '🍕', bgColor: 'bg-red-100' };
  } else if (name.includes('bebida')) {
    return { emoji: '🥤', bgColor: 'bg-blue-100' };
  } else if (name.includes('salada') || name.includes('vegano')) {
    return { emoji: '🥗', bgColor: 'bg-green-100' };
  } else if (name.includes('sobremesa') || name.includes('doce')) {
    return { emoji: '🍰', bgColor: 'bg-pink-100' };
  } else if (name.includes('café') || name.includes('cafe')) {
    return { emoji: '☕', bgColor: 'bg-amber-100' };
  } else if (name.includes('porção') || name.includes('porcao') || name.includes('porçoes')) {
    return { emoji: '🍟', bgColor: 'bg-yellow-100' };
  } else if (name.includes('combo')) {
    return { emoji: '🍱', bgColor: 'bg-indigo-100' };
  } else if (name.includes('promo')) {
    return { emoji: '🔥', bgColor: 'bg-orange-100' };
  } else {
    return { emoji: '🍽️', bgColor: 'bg-gray-100' };
  }
};

export function CategoryList({ categories, onSelectCategory, selectedCategoryId }: CategoryListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  // Garantir que temos categorias válidas e com chaves únicas
  const validCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) {
      return [];
    }
    
    // Filtrar categorias inválidas e garantir que cada uma tenha um ID
    return categories.filter(category => 
      category && (typeof category === 'object')
    );
  }, [categories]);

  // Verificar se precisa mostrar botões de scroll
  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    setShowScrollButtons(scrollWidth > clientWidth);
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [validCategories]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  
  if (!validCategories.length) {
    return (
              <div className="text-center py-4">
          <p className="text-gray-700">Nenhuma categoria disponível.</p>
        <div className="flex justify-center mt-4">
          <div className="flex space-x-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="h-3 bg-gray-200 rounded w-12 mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative">
      {/* Botão de scroll esquerdo */}
      {showScrollButtons && canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-scroll-buttons scroll-button rounded-full p-2 transition-all"
          aria-label="Rolar categorias para a esquerda"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Botão de scroll direito */}
      {showScrollButtons && canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-scroll-buttons scroll-button rounded-full p-2 transition-all"
          aria-label="Rolar categorias para a direita"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}

      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide pb-2 space-x-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Opção "Todos" */}
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => onSelectCategory(0)}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all ${
            selectedCategoryId === 0 || selectedCategoryId === null
              ? 'ring-2 ring-primary ring-offset-2 scale-105' 
              : 'bg-amber-100'
          }`}>
            🍽️
          </div>
          <span className={`mt-2 text-xs font-medium text-center ${
            selectedCategoryId === 0 || selectedCategoryId === null
              ? 'text-primary font-semibold' 
              : 'text-gray-700'
          }`}>
            Todos
          </span>
        </div>
        
        {validCategories.map((category) => {
          const { emoji, bgColor } = getCategoryIcon(category.name || '');
          const isSelected = selectedCategoryId === category.id;
          
          return (
            <div 
              key={category.id} 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => onSelectCategory(category.id)}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary ring-offset-2 scale-105' 
                  : bgColor
              }`}>
                {emoji}
              </div>
              <span className={`mt-2 text-xs font-medium text-center ${
                isSelected 
                  ? 'text-primary font-semibold' 
                  : 'text-gray-700'
              }`}>
                {category.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
} 