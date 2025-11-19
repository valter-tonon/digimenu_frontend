'use client';

import { useState, useEffect } from 'react';
import { useMenuAuth } from '@/infrastructure/hooks/useMenuAuth';

interface FavoriteItem {
  product_id: number;
  product_name: string;
  product_image: string;
  product_price: number;
  times_ordered: number;
  total_quantity: number;
}

interface FavoritesIntegrationProps {
  onAddToCart?: (item: any) => void;
}

export default function FavoritesIntegration({
  onAddToCart,
}: FavoritesIntegrationProps) {
  const { getAuthToken } = useMenuAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError('Não autenticado');
        return;
      }

      const response = await fetch('/api/v1/orders-v2/favorites/list?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar favoritos');
      }

      const data = await response.json();
      setFavorites(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: FavoriteItem) => {
    if (onAddToCart) {
      onAddToCart({
        id: item.product_id,
        name: item.product_name,
        price: item.product_price,
        image: item.product_image,
        quantity: 1,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>❌ {error}</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">⭐ Você não tem itens favoritos ainda</p>
        <p className="text-gray-400 text-sm mt-2">Seus itens mais pedidos aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((item) => (
        <div
          key={item.product_id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* Image */}
          <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
            {item.product_image ? (
              <img
                src={item.product_image}
                alt={item.product_name}
                className="w-full h-full object-cover hover:scale-110 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-400">
                🍽️
              </div>
            )}

            {/* Badge */}
            <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <span>⭐</span>
              <span>{item.times_ordered}x</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
              {item.product_name}
            </h3>

            {/* Stats */}
            <div className="flex gap-4 text-xs text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <span>🛒</span>
                <span>{item.total_quantity} unidades</span>
              </div>
            </div>

            {/* Price and Action */}
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-orange-600">
                R$ {item.product_price.toFixed(2)}
              </p>
              <button
                onClick={() => handleAddToCart(item)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              >
                ➕ Adicionar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
