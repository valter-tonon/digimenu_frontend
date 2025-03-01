'use client';

import { useState } from 'react';
import { products } from '@/lib/mock-data';
import { Search } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import RestaurantIcon from '@mui/icons-material/Restaurant';

const categories = [
  { 
    id: 'lanches', 
    name: 'Lanches', 
    icon: LunchDiningIcon, 
    color: 'bg-amber-100',
    iconColor: 'text-amber-600'
  },
  { 
    id: 'pizzas', 
    name: 'Pizzas', 
    icon: LocalPizzaIcon, 
    color: 'bg-rose-100',
    iconColor: 'text-rose-600'
  },
  { 
    id: 'bebidas', 
    name: 'Bebidas', 
    icon: LocalBarIcon, 
    color: 'bg-sky-100',
    iconColor: 'text-sky-600'
  },
  { 
    id: 'saladas', 
    name: 'Saladas', 
    icon: RestaurantIcon, 
    color: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  }
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-4 mb-6">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 px-4 pl-12 rounded-lg border border-gray-200 text-gray-800 placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>

      {/* <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      /> */}

      <div className="max-w-[1200px] mx-auto px-4">
        {/* Categories */}
        <div className="flex gap-4 my-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center shadow-sm
                  ${selectedCategory === category.id ? 'ring-2 ring-primary' : ''}`}>
                  <Icon className={`w-8 h-8 ${category.iconColor}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
