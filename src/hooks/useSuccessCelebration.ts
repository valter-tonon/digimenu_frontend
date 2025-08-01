import { useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

export interface CelebrationOptions {
  title?: string;
  message?: string;
  variant?: 'default' | 'order' | 'payment' | 'achievement';
  duration?: number;
  showConfetti?: boolean;
  confettiOptions?: any;
  onComplete?: () => void;
}

export interface SuccessCelebrationState {
  isVisible: boolean;
  title?: string;
  message?: string;
  variant: 'default' | 'order' | 'payment' | 'achievement';
  duration: number;
  showConfetti: boolean;
  confettiOptions?: any;
  onComplete?: () => void;
}

/**
 * Hook for managing success celebrations and confetti effects
 */
export function useSuccessCelebration() {
  const [celebrationState, setCelebrationState] = useState<SuccessCelebrationState>({
    isVisible: false,
    variant: 'default',
    duration: 3000,
    showConfetti: true
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const celebrate = useCallback((options: CelebrationOptions = {}) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setCelebrationState({
      isVisible: true,
      title: options.title,
      message: options.message,
      variant: options.variant || 'default',
      duration: options.duration || 3000,
      showConfetti: options.showConfetti !== false,
      confettiOptions: options.confettiOptions,
      onComplete: options.onComplete
    });
  }, []);

  const hide = useCallback(() => {
    setCelebrationState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const celebrateOrder = useCallback((orderNumber?: string, estimatedTime?: string) => {
    celebrate({
      variant: 'order',
      title: 'Pedido Confirmado!',
      message: orderNumber 
        ? `Pedido #${orderNumber} realizado com sucesso${estimatedTime ? `. Tempo estimado: ${estimatedTime}` : ''}`
        : 'Seu pedido foi realizado com sucesso',
      duration: 4000
    });
  }, [celebrate]);

  const celebratePayment = useCallback((amount?: string) => {
    celebrate({
      variant: 'payment',
      title: 'Pagamento Aprovado!',
      message: amount 
        ? `Pagamento de ${amount} processado com sucesso`
        : 'Seu pagamento foi processado com sucesso',
      duration: 3000
    });
  }, [celebrate]);

  const celebrateAchievement = useCallback((achievement: string) => {
    celebrate({
      variant: 'achievement',
      title: 'Parabéns!',
      message: achievement,
      duration: 4000
    });
  }, [celebrate]);

  return {
    celebrationState,
    celebrate,
    hide,
    celebrateOrder,
    celebratePayment,
    celebrateAchievement
  };
}

/**
 * Utility functions for triggering confetti effects
 */
export const confettiEffects = {
  /**
   * Basic confetti burst
   */
  basic: (options: any = {}) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      ...options
    });
  },

  /**
   * Fireworks-style confetti
   */
  fireworks: (duration: number = 3000) => {
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  },

  /**
   * Star-shaped confetti
   */
  stars: () => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star'],
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle'],
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  },

  /**
   * Side cannons confetti
   */
  sideCannons: (duration: number = 3000) => {
    const end = Date.now() + duration;
    const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  },

  /**
   * Emoji confetti
   */
  emoji: (emoji: string = '🎉') => {
    const scalar = 2;
    const emojiShape = confetti.shapeFromText({ text: emoji, scalar });

    const defaults = {
      spread: 360,
      ticks: 60,
      gravity: 0,
      decay: 0.96,
      startVelocity: 20,
      shapes: [emojiShape],
      scalar,
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 30,
      });

      confetti({
        ...defaults,
        particleCount: 5,
      });

      confetti({
        ...defaults,
        particleCount: 15,
        scalar: scalar / 2,
        shapes: ['circle'],
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  },

  /**
   * Custom shapes confetti
   */
  customShapes: () => {
    const scalar = 2;
    const triangle = confetti.shapeFromPath({
      path: 'M0 10 L5 0 L10 10z',
    });
    const square = confetti.shapeFromPath({
      path: 'M0 0 L10 0 L10 10 L0 10 Z',
    });
    const coin = confetti.shapeFromPath({
      path: 'M5 0 A5 5 0 1 0 5 10 A5 5 0 1 0 5 0 Z',
    });

    const defaults = {
      spread: 360,
      ticks: 60,
      gravity: 0,
      decay: 0.96,
      startVelocity: 20,
      shapes: [triangle, square, coin],
      scalar,
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 30,
      });

      confetti({
        ...defaults,
        particleCount: 5,
      });

      confetti({
        ...defaults,
        particleCount: 15,
        scalar: scalar / 2,
        shapes: ['circle'],
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  }
};

export default useSuccessCelebration;