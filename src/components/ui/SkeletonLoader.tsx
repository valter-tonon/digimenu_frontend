'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animated?: boolean;
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full'
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = 'md',
  animated = true
}) => {
  const style: React.CSSProperties = {};
  
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      className={cn(
        'bg-gray-200',
        roundedClasses[rounded],
        {
          'animate-pulse': animated
        },
        className
      )}
      style={style}
      role="status"
      aria-label="Carregando conteúdo..."
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
  animated?: boolean;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className,
  animated = true
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? '75%' : '100%'}
          animated={animated}
        />
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  animated?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = true,
  animated = true
}) => {
  return (
    <div className={cn('border border-gray-200 rounded-lg p-4 space-y-4', className)}>
      {showImage && (
        <Skeleton
          height={200}
          width="100%"
          rounded="md"
          animated={animated}
        />
      )}
      
      <div className="space-y-2">
        {showTitle && (
          <Skeleton
            height={24}
            width="60%"
            animated={animated}
          />
        )}
        
        {showDescription && (
          <SkeletonText
            lines={2}
            animated={animated}
          />
        )}
      </div>
      
      {showActions && (
        <div className="flex gap-2 pt-2">
          <Skeleton
            height={36}
            width={80}
            rounded="md"
            animated={animated}
          />
          <Skeleton
            height={36}
            width={100}
            rounded="md"
            animated={animated}
          />
        </div>
      )}
    </div>
  );
};

export interface SkeletonListProps {
  items?: number;
  className?: string;
  itemClassName?: string;
  showAvatar?: boolean;
  animated?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  className,
  itemClassName,
  showAvatar = true,
  animated = true
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={cn('flex items-center space-x-4', itemClassName)}>
          {showAvatar && (
            <Skeleton
              width={40}
              height={40}
              rounded="full"
              animated={animated}
            />
          )}
          
          <div className="flex-1 space-y-2">
            <Skeleton
              height={16}
              width="40%"
              animated={animated}
            />
            <Skeleton
              height={14}
              width="80%"
              animated={animated}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
  animated?: boolean;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className,
  showHeader = true,
  animated = true
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        {showHeader && (
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, index) => (
                <Skeleton
                  key={index}
                  height={16}
                  width={`${100 / columns}%`}
                  animated={animated}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="flex space-x-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    height={16}
                    width={`${100 / columns}%`}
                    animated={animated}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export interface SkeletonProductCardProps {
  className?: string;
  animated?: boolean;
}

export const SkeletonProductCard: React.FC<SkeletonProductCardProps> = ({
  className,
  animated = true
}) => {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Product Image */}
      <Skeleton
        height={200}
        width="100%"
        rounded="none"
        animated={animated}
      />
      
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <Skeleton
          height={20}
          width="80%"
          animated={animated}
        />
        
        {/* Product Description */}
        <SkeletonText
          lines={2}
          animated={animated}
        />
        
        {/* Price and Button */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton
            height={24}
            width={80}
            animated={animated}
          />
          <Skeleton
            height={36}
            width={100}
            rounded="md"
            animated={animated}
          />
        </div>
      </div>
    </div>
  );
};

export interface SkeletonMenuProps {
  categories?: number;
  productsPerCategory?: number;
  className?: string;
  animated?: boolean;
}

export const SkeletonMenu: React.FC<SkeletonMenuProps> = ({
  categories = 3,
  productsPerCategory = 4,
  className,
  animated = true
}) => {
  return (
    <div className={cn('space-y-8', className)}>
      {Array.from({ length: categories }).map((_, categoryIndex) => (
        <div key={categoryIndex} className="space-y-4">
          {/* Category Title */}
          <Skeleton
            height={32}
            width="30%"
            animated={animated}
          />
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: productsPerCategory }).map((_, productIndex) => (
              <SkeletonProductCard
                key={productIndex}
                animated={animated}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;