'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Store, History } from 'lucide-react';
import Link from 'next/link';

interface StoreHeaderProps {
  storeName: string;
  storeLogo?: string | null;
  subtitle?: string;
  className?: string;
  showHistoryButton?: boolean;
  storeId?: string;
}

export function StoreHeader({ 
  storeName, 
  storeLogo, 
  subtitle = 'Cardápio Digital',
  className = '',
  showHistoryButton = false,
  storeId
}: StoreHeaderProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Fallback para quando não há logo ou há erro no carregamento
  const LogoFallback = () => (
    <div className="relative h-16 w-16 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-md">
      {storeName ? (
        <span className="text-white font-bold text-xl">
          {storeName.charAt(0).toUpperCase()}
        </span>
      ) : (
        <Store className="w-8 h-8 text-white" />
      )}
    </div>
  );

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center">
        {/* Logo Container */}
        <div className="relative mr-4">
          {storeLogo && !imageError ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-primary/20 shadow-sm bg-white">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />
              )}
              <Image
                src={storeLogo}
                alt={`Logo ${storeName}`}
                fill
                style={{ objectFit: 'contain' }}
                sizes="64px"
                quality={90}
                priority
                onError={handleImageError}
                onLoad={handleImageLoad}
                className={`transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
              />
            </div>
          ) : (
            <LogoFallback />
          )}
        </div>

        {/* Store Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {storeName}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Botão de Histórico */}
      {showHistoryButton && storeId && (
        <Link
          href={`/${storeId}/orders`}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
        >
          <History className="w-4 h-4" />
          Histórico
        </Link>
      )}
    </div>
  );
}

// Versão compacta para uso em headers menores
export function CompactStoreHeader({ 
  storeName, 
  storeLogo, 
  className = '' 
}: Omit<StoreHeaderProps, 'subtitle'>) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const LogoFallback = () => (
    <div className="relative h-10 w-10 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center shadow-sm">
      {storeName ? (
        <span className="text-white font-semibold text-sm">
          {storeName.charAt(0).toUpperCase()}
        </span>
      ) : (
        <Store className="w-5 h-5 text-white" />
      )}
    </div>
  );

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative mr-3">
        {storeLogo && !imageError ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-primary/20 shadow-sm bg-white">
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg" />
            )}
            <Image
              src={storeLogo}
              alt={`Logo ${storeName}`}
              fill
              style={{ objectFit: 'contain' }}
              sizes="40px"
              quality={85}
              onError={handleImageError}
              onLoad={handleImageLoad}
              className={`transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </div>
        ) : (
          <LogoFallback />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 truncate">
          {storeName}
        </h2>
      </div>
    </div>
  );
}