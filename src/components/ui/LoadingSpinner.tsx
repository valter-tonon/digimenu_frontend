'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white';
  className?: string;
  label?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  white: 'text-white'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  label = 'Carregando...'
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label={label}>
      <svg
        className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white';
  className?: string;
  label?: string;
}

const dotSizeClasses = {
  sm: 'w-1 h-1',
  md: 'w-2 h-2',
  lg: 'w-3 h-3'
};

const dotColorClasses = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600',
  white: 'bg-white'
};

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'primary',
  className,
  label = 'Carregando...'
}) => {
  return (
    <div className={cn('flex items-center justify-center space-x-1', className)} role="status" aria-label={label}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-pulse',
            dotSizeClasses[size],
            dotColorClasses[color]
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface LoadingPulseProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  label?: string;
}

const pulseSizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
};

const pulseColorClasses = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600'
};

export const LoadingPulse: React.FC<LoadingPulseProps> = ({
  size = 'md',
  color = 'primary',
  className,
  label = 'Carregando...'
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label={label}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full animate-ping absolute',
            pulseSizeClasses[size],
            pulseColorClasses[color],
            'opacity-75'
          )}
        />
        <div
          className={cn(
            'rounded-full',
            pulseSizeClasses[size],
            pulseColorClasses[color]
          )}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface LoadingBarProps {
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

const barHeightClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

const barColorClasses = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600'
};

export const LoadingBar: React.FC<LoadingBarProps> = ({
  progress,
  size = 'md',
  color = 'primary',
  className,
  label = 'Carregando...',
  showPercentage = false,
  animated = true
}) => {
  const isIndeterminate = progress === undefined;
  const progressValue = Math.min(Math.max(progress || 0, 0), 100);

  return (
    <div className={cn('w-full', className)} role="progressbar" aria-label={label} aria-valuenow={progressValue} aria-valuemin={0} aria-valuemax={100}>
      {showPercentage && !isIndeterminate && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progressValue)}%</span>
        </div>
      )}
      
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', barHeightClasses[size])}>
        <div
          className={cn(
            'transition-all duration-300 ease-out rounded-full',
            barColorClasses[color],
            barHeightClasses[size],
            {
              'animate-pulse': isIndeterminate && animated,
              'bg-gradient-to-r from-transparent via-current to-transparent': isIndeterminate,
            }
          )}
          style={{
            width: isIndeterminate ? '100%' : `${progressValue}%`,
            ...(isIndeterminate && animated && {
              backgroundSize: '200% 100%',
              animation: 'loading-bar 2s ease-in-out infinite'
            })
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;