'use client';

import { Star, TrendingUp, Tag } from 'lucide-react';

interface ProductBadgeProps {
  type: 'featured' | 'popular' | 'promotion';
  className?: string;
}

export function ProductBadge({ type, className = '' }: ProductBadgeProps) {
  const badgeConfig = {
    featured: {
      text: 'Destaque',
      icon: Star,
      colors: 'bg-amber-500 text-white'
    },
    popular: {
      text: 'Popular',
      icon: TrendingUp,
      colors: 'bg-blue-500 text-white'
    },
    promotion: {
      text: 'Promoção',
      icon: Tag,
      colors: 'bg-red-500 text-white'
    }
  };

  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`absolute top-2 left-2 z-10 flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.colors} ${className} shadow-sm`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </div>
  );
} 