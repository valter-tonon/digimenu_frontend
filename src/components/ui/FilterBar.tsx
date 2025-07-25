'use client';

import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  className?: string;
}

interface FilterOptions {
  onlyFeatured: boolean;
  onlyPromotional: boolean;
  onlyPopular: boolean;
  priceRange: {
    min: number;
    max: number;
  };
}

export function FilterBar({ onFilterChange, className = '' }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    onlyFeatured: false,
    onlyPromotional: false,
    onlyPopular: false,
    priceRange: { min: 0, max: 1000 }
  });

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      onlyFeatured: false,
      onlyPromotional: false,
      onlyPopular: false,
      priceRange: { min: 0, max: 1000 }
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    typeof value === 'boolean' ? value : 
    typeof value === 'object' && value.min > 0 || value.max < 1000
  ).length;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
      >
        <Filter className="w-4 h-4 text-gray-700" />
        <span className="font-medium">Filtros</span>
        {activeFiltersCount > 0 && (
          <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Limpar
            </button>
          </div>

          <div className="space-y-4">
            {/* Filtros de tipo */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.onlyFeatured}
                  onChange={(e) => handleFilterChange({ onlyFeatured: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Apenas em destaque</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.onlyPromotional}
                  onChange={(e) => handleFilterChange({ onlyPromotional: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Apenas promocionais</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.onlyPopular}
                  onChange={(e) => handleFilterChange({ onlyPopular: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Apenas populares</span>
              </label>
            </div>

            {/* Filtro de preço */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Faixa de preço
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min}
                  onChange={(e) => handleFilterChange({
                    priceRange: { ...filters.priceRange, min: Number(e.target.value) }
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max}
                  onChange={(e) => handleFilterChange({
                    priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 