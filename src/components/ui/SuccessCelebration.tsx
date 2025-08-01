'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Star, Trophy, Gift, Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface SuccessCelebrationProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  icon?: 'check' | 'star' | 'trophy' | 'gift' | 'heart' | 'sparkles';
  variant?: 'default' | 'order' | 'payment' | 'achievement';
  duration?: number;
  onComplete?: () => void;
  className?: string;
  showConfetti?: boolean;
  confettiOptions?: any;
}

const iconMap = {
  check: CheckCircle,
  star: Star,
  trophy: Trophy,
  gift: Gift,
  heart: Heart,
  sparkles: Sparkles
};

const variantConfig = {
  default: {
    title: 'Sucesso!',
    message: 'Operação realizada com sucesso',
    icon: 'check' as const,
    colors: ['#10B981', '#34D399', '#6EE7B7'],
    confettiColors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
  },
  order: {
    title: 'Pedido Confirmado!',
    message: 'Seu pedido foi realizado com sucesso',
    icon: 'check' as const,
    colors: ['#3B82F6', '#60A5FA', '#93C5FD'],
    confettiColors: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE']
  },
  payment: {
    title: 'Pagamento Aprovado!',
    message: 'Seu pagamento foi processado com sucesso',
    icon: 'check' as const,
    colors: ['#059669', '#10B981', '#34D399'],
    confettiColors: ['#059669', '#10B981', '#34D399', '#A7F3D0']
  },
  achievement: {
    title: 'Parabéns!',
    message: 'Você conquistou um novo marco',
    icon: 'trophy' as const,
    colors: ['#F59E0B', '#FBBF24', '#FCD34D'],
    confettiColors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7']
  }
};

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  isVisible,
  title,
  message,
  icon,
  variant = 'default',
  duration = 3000,
  onComplete,
  className,
  showConfetti = true,
  confettiOptions = {}
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const config = variantConfig[variant];
  const IconComponent = iconMap[icon || config.icon];
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsAnimating(true), 50);

      // Trigger confetti
      if (showConfetti) {
        triggerConfetti();
      }

      // Auto-hide after duration
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleComplete();
        }, duration);
      }
    } else {
      handleComplete();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, [isVisible, duration, showConfetti]);

  const triggerConfetti = () => {
    const colors = config.confettiColors;
    
    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      ...confettiOptions
    });

    // Secondary burst with delay
    confettiTimeoutRef.current = setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors,
        ...confettiOptions
      });
    }, 200);

    // Continuous small bursts
    const continuousBursts = () => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          confetti({
            particleCount: 20,
            spread: 40,
            origin: { 
              x: Math.random() * 0.6 + 0.2, 
              y: Math.random() * 0.4 + 0.3 
            },
            colors,
            ...confettiOptions
          });
        }, i * 300);
      }
    };

    setTimeout(continuousBursts, 400);
  };

  const handleComplete = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShouldRender(false);
      onComplete?.();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isAnimating ? 'opacity-100' : 'opacity-0',
        className
      )}
      onClick={handleComplete}
    >
      <div
        className={cn(
          'relative bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4',
          'transform transition-all duration-500 ease-out',
          isAnimating 
            ? 'scale-100 translate-y-0' 
            : 'scale-75 translate-y-8'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-10 animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${config.colors.join(', ')})`
          }}
        />

        {/* Content */}
        <div className="relative text-center">
          {/* Icon with animation */}
          <div className="mb-4 flex justify-center">
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                'transform transition-all duration-700 ease-out',
                isAnimating 
                  ? 'scale-100 rotate-0' 
                  : 'scale-0 rotate-180'
              )}
              style={{
                backgroundColor: config.colors[0],
                animationDelay: '200ms'
              }}
            >
              <IconComponent 
                className="w-8 h-8 text-white" 
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            </div>
          </div>

          {/* Title */}
          <h2 
            className={cn(
              'text-2xl font-bold mb-2 transition-all duration-500',
              isAnimating 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            )}
            style={{ 
              color: config.colors[0],
              animationDelay: '400ms'
            }}
          >
            {displayTitle}
          </h2>

          {/* Message */}
          <p 
            className={cn(
              'text-gray-600 mb-6 transition-all duration-500',
              isAnimating 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            )}
            style={{ animationDelay: '600ms' }}
          >
            {displayMessage}
          </p>

          {/* Success indicator */}
          <div 
            className={cn(
              'flex items-center justify-center space-x-2 text-sm font-medium',
              'transition-all duration-500',
              isAnimating 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            )}
            style={{ 
              color: config.colors[1],
              animationDelay: '800ms'
            }}
          >
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>Toque para continuar</span>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce" 
             style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-pink-400 rounded-full animate-bounce" 
             style={{ animationDelay: '1.2s' }} />
      </div>
    </div>
  );
};

export interface MicroCelebrationProps {
  trigger: boolean;
  children: React.ReactNode;
  variant?: 'bounce' | 'pulse' | 'shake' | 'glow';
  duration?: number;
  className?: string;
}

export const MicroCelebration: React.FC<MicroCelebrationProps> = ({
  trigger,
  children,
  variant = 'bounce',
  duration = 600,
  className
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [trigger, duration]);

  const getAnimationClass = () => {
    if (!isAnimating) return '';
    
    switch (variant) {
      case 'bounce':
        return 'animate-bounce';
      case 'pulse':
        return 'animate-pulse';
      case 'shake':
        return 'animate-shake';
      case 'glow':
        return 'animate-pulse shadow-lg shadow-green-500/50';
      default:
        return 'animate-bounce';
    }
  };

  return (
    <div className={cn('transition-all duration-300', getAnimationClass(), className)}>
      {children}
    </div>
  );
};

export interface SuccessMessageProps {
  title: string;
  message?: string;
  trackingCode?: string;
  orderNumber?: string;
  estimatedTime?: string;
  className?: string;
  onTrackOrder?: () => void;
  onContinueShopping?: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  message,
  trackingCode,
  orderNumber,
  estimatedTime,
  className,
  onTrackOrder,
  onContinueShopping
}) => {
  return (
    <div className={cn('bg-white rounded-lg p-6 shadow-lg max-w-md w-full', className)}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {message && (
          <p className="text-gray-600">{message}</p>
        )}
      </div>

      {/* Order Details */}
      <div className="space-y-3 mb-6">
        {orderNumber && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Número do Pedido:</span>
            <span className="font-semibold text-gray-900">#{orderNumber}</span>
          </div>
        )}
        
        {trackingCode && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Código de Rastreamento:</span>
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {trackingCode}
            </span>
          </div>
        )}
        
        {estimatedTime && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Tempo Estimado:</span>
            <span className="font-semibold text-green-600">{estimatedTime}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {onTrackOrder && (
          <button
            onClick={onTrackOrder}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Acompanhar Pedido
          </button>
        )}
        
        {onContinueShopping && (
          <button
            onClick={onContinueShopping}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Continuar Comprando
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessCelebration;