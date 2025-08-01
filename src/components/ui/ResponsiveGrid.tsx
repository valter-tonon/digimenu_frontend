'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'products' | 'categories' | 'cards' | 'auto';
  gap?: 'sm' | 'md' | 'lg';
  minItemWidth?: string;
}

/**
 * Responsive Grid Component with mobile-first approach
 * Automatically adjusts columns based on screen size and content
 */
export function ResponsiveGrid({ 
  children, 
  className,
  variant = 'products',
  gap = 'md',
  minItemWidth = '280px'
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6'
    };

    const variantClasses = {
      // Product grid: 1 col mobile, 2 col tablet, 3+ col desktop
      products: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      // Category grid: 2 col mobile, 3 col tablet, 4+ col desktop  
      categories: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
      // Card grid: 1 col mobile, 2 col tablet, 3 col desktop
      cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      // Auto-fit grid based on min width
      auto: `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`
    };

    return cn(
      'grid',
      gapClasses[gap],
      variantClasses[variant],
      className
    );
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
}

/**
 * Responsive Container with proper padding and max-width
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({ 
  children, 
  className,
  size = 'lg',
  padding = 'md'
}: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      sizeClasses[size],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Responsive Stack for vertical layouts
 */
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export function ResponsiveStack({ 
  children, 
  className,
  spacing = 'md',
  align = 'stretch'
}: ResponsiveStackProps) {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center', 
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={cn(
      'flex flex-col',
      spacingClasses[spacing],
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Responsive Flex for horizontal layouts
 */
interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  gap?: 'sm' | 'md' | 'lg';
  responsive?: {
    sm?: Partial<ResponsiveFlexProps>;
    md?: Partial<ResponsiveFlexProps>;
    lg?: Partial<ResponsiveFlexProps>;
  };
}

export function ResponsiveFlex({ 
  children, 
  className,
  direction = 'row',
  wrap = false,
  justify = 'start',
  align = 'stretch',
  gap = 'md',
  responsive
}: ResponsiveFlexProps) {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      wrap && 'flex-wrap',
      justifyClasses[justify],
      alignClasses[align],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}