'use client';

import { Category } from '@/domain/entities/Category';
import { useMemo } from 'react';

interface CategoryListProps {
  categories: Category[];
  onSelectCategory: (categoryId: number) => void;
  selectedCategoryId: number | null;
}

// Função para obter ícone baseado no nome da categoria
const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('lanch') || name.includes('hambur')) {
    return '🍔';
  } else if (name.includes('pizza')) {
    return '🍕';
  } else if (name.includes('bebida')) {
    return '🥤';
  } else if (name.includes('salada') || name.includes('vegano')) {
    return '🥗';
  } else if (name.includes('sobremesa') || name.includes('doce')) {
    return '🍰';
  } else if (name.includes('café') || name.includes('cafe')) {
    return '☕';
  } else {
    return '🍽️';
  }
};

export function CategoryList({ categories, onSelectCategory, selectedCategoryId }: CategoryListProps) {
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
  
  if (!validCategories.length) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">Nenhuma categoria disponível.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex overflow-x-auto pb-2 space-x-4">
        {/* Opção "Todos" */}
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => onSelectCategory(0)}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
            selectedCategoryId === 0 || selectedCategoryId === null
              ? 'bg-amber-100' 
              : 'bg-gray-100'
          }`}>
            🍽️
          </div>
          <span className={`mt-2 text-xs font-medium text-center ${
            selectedCategoryId === 0 || selectedCategoryId === null
              ? 'text-amber-600' 
              : 'text-gray-700'
          }`}>
            Todos
          </span>
        </div>
        
        {validCategories.map((category) => {
          const icon = getCategoryIcon(category.name || '');
          const isSelected = selectedCategoryId === category.id;
          
          return (
            <div 
              key={category.id} 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => onSelectCategory(category.id)}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                isSelected 
                  ? 'bg-amber-100' 
                  : 'bg-gray-100'
              }`}>
                {icon}
              </div>
              <span className={`mt-2 text-xs font-medium text-center ${
                isSelected 
                  ? 'text-amber-600' 
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