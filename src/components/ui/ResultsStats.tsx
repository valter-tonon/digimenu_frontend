'use client';

import { Product } from '@/domain/entities/Product';

interface ResultsStatsProps {
  totalProducts: number;
  filteredProducts: number;
  searchTerm?: string;
  activeFilters?: {
    onlyFeatured: boolean;
    onlyPromotional: boolean;
    onlyPopular: boolean;
    priceRange: { min: number; max: number };
  };
}

export function ResultsStats({ 
  totalProducts, 
  filteredProducts, 
  searchTerm, 
  activeFilters 
}: ResultsStatsProps) {
  const hasActiveFilters = searchTerm || 
    (activeFilters && (
      activeFilters.onlyFeatured || 
      activeFilters.onlyPromotional || 
      activeFilters.onlyPopular ||
      activeFilters.priceRange.min > 0 ||
      activeFilters.priceRange.max < 1000
    ));

  if (!hasActiveFilters) return null;

  const activeFiltersList = [];
  
  if (searchTerm) {
    activeFiltersList.push(`Busca: "${searchTerm}"`);
  }
  
  if (activeFilters) {
    if (activeFilters.onlyFeatured) activeFiltersList.push('Em destaque');
    if (activeFilters.onlyPromotional) activeFiltersList.push('Promocionais');
    if (activeFilters.onlyPopular) activeFiltersList.push('Populares');
    if (activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 1000) {
      activeFiltersList.push(`Preço: R$ ${activeFilters.priceRange.min} - R$ ${activeFilters.priceRange.max}`);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <p className="text-sm text-gray-700">
            Mostrando <span className="font-medium text-gray-900">{filteredProducts}</span> de{' '}
            <span className="font-medium text-gray-900">{totalProducts}</span> produtos
          </p>
          
          {activeFiltersList.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {activeFiltersList.map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {filteredProducts === 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Nenhum produto encontrado com os filtros aplicados
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 