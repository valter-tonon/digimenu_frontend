'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface MagicLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  label?: string;
}

export const MagicSpinner: React.FC<MagicLoadingProps> = ({
  size = 'md',
  color = '#3b82f6',
  className,
  label = 'Carregando...'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label={label}>
      <div className={cn('relative', sizeClasses[size])}>
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${color})`,
            animation: 'magic-spin 1s linear infinite'
          }}
        />
        <div
          className="absolute inset-1 rounded-full"
          style={{ backgroundColor: 'white' }}
        />
      </div>
      
      <style jsx>{`
        @keyframes magic-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      
      <span className="sr-only">{label}</span>
    </div>
  );
};

export const MagicPulse: React.FC<MagicLoadingProps> = ({
  size = 'md',
  color = '#3b82f6',
  className,
  label = 'Carregando...'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label={label}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Outer pulse */}
        <div
          className="absolute inset-0 rounded-full opacity-75"
          style={{
            backgroundColor: color,
            animation: 'magic-pulse-outer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
        
        {/* Middle pulse */}
        <div
          className="absolute inset-2 rounded-full opacity-50"
          style={{
            backgroundColor: color,
            animation: 'magic-pulse-middle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s'
          }}
        />
        
        {/* Inner pulse */}
        <div
          className="absolute inset-4 rounded-full"
          style={{
            backgroundColor: color,
            animation: 'magic-pulse-inner 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes magic-pulse-outer {
          0%, 100% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
        }
        
        @keyframes magic-pulse-middle {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.2;
          }
        }
        
        @keyframes magic-pulse-inner {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.4;
          }
        }
      `}</style>
      
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface MagicWaveProps extends MagicLoadingProps {
  bars?: number;
}

export const MagicWave: React.FC<MagicWaveProps> = ({
  size = 'md',
  color = '#3b82f6',
  className,
  label = 'Carregando...',
  bars = 5
}) => {
  const sizeClasses = {
    sm: { height: 'h-4', width: 'w-1' },
    md: { height: 'h-6', width: 'w-1.5' },
    lg: { height: 'h-8', width: 'w-2' }
  };

  return (
    <div className={cn('flex items-center justify-center space-x-1', className)} role="status" aria-label={label}>
      {Array.from({ length: bars }).map((_, index) => (
        <div
          key={index}
          className={cn('rounded-full', sizeClasses[size].width, sizeClasses[size].height)}
          style={{
            backgroundColor: color,
            animation: `magic-wave 1.2s ease-in-out infinite ${index * 0.1}s`
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes magic-wave {
          0%, 40%, 100% {
            transform: scaleY(0.4);
            opacity: 0.5;
          }
          20% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
      
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface MagicOrbitProps extends MagicLoadingProps {
  orbits?: number;
}

export const MagicOrbit: React.FC<MagicOrbitProps> = ({
  size = 'md',
  color = '#3b82f6',
  className,
  label = 'Carregando...',
  orbits = 3
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label={label}>
      <div className={cn('relative', sizeClasses[size])}>
        {Array.from({ length: orbits }).map((_, index) => {
          const delay = index * 0.3;
          const scale = 1 - index * 0.2;
          
          return (
            <div
              key={index}
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={{
                borderTopColor: color,
                transform: `scale(${scale})`,
                animation: `magic-orbit 2s linear infinite ${delay}s`
              }}
            />
          );
        })}
        
        {/* Center dot */}
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
          style={{ backgroundColor: color }}
        />
      </div>
      
      <style jsx>{`
        @keyframes magic-orbit {
          from {
            transform: rotate(0deg) scale(var(--scale, 1));
          }
          to {
            transform: rotate(360deg) scale(var(--scale, 1));
          }
        }
      `}</style>
      
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface MagicGradientProps extends MagicLoadingProps {
  gradient?: string[];
}

export const MagicGradient: React.FC<MagicGradientProps> = ({
  size = 'md',
  className,
  label = 'Carregando...',
  gradient = ['#3b82f6', '#8b5cf6', '#ec4899']
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const gradientString = gradient.join(', ');

  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label={label}>
      <div className={cn('relative', sizeClasses[size])}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${gradientString}, ${gradient[0]})`,
            animation: 'magic-gradient-spin 2s linear infinite'
          }}
        />
        <div className="absolute inset-1 rounded-full bg-white" />
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background: `linear-gradient(45deg, ${gradientString})`,
            animation: 'magic-gradient-pulse 1.5s ease-in-out infinite alternate'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes magic-gradient-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes magic-gradient-pulse {
          from {
            opacity: 0.7;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface MagicLoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  blur?: boolean;
}

export const MagicLoadingOverlay: React.FC<MagicLoadingOverlayProps> = ({
  isLoading,
  children,
  loadingComponent,
  className,
  overlayClassName,
  blur = true
}) => {
  return (
    <div className={cn('relative', className)}>
      <div className={cn(isLoading && blur && 'blur-sm transition-all duration-300')}>
        {children}
      </div>
      
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10',
            overlayClassName
          )}
        >
          {loadingComponent || <MagicSpinner />}
        </div>
      )}
    </div>
  );
};

export default MagicSpinner;