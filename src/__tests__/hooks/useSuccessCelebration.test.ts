import { renderHook, act } from '@testing-library/react';
import { useSuccessCelebration, confettiEffects } from '@/hooks/useSuccessCelebration';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve()),
  shapeFromText: vi.fn().mockReturnValue('emoji-shape'),
  shapeFromPath: vi.fn().mockReturnValue('custom-shape')
}));

describe('useSuccessCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    expect(result.current.celebrationState).toEqual({
      isVisible: false,
      variant: 'default',
      duration: 3000,
      showConfetti: true
    });
  });

  it('should show celebration with default options', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebrate();
    });
    
    expect(result.current.celebrationState.isVisible).toBe(true);
    expect(result.current.celebrationState.variant).toBe('default');
    expect(result.current.celebrationState.duration).toBe(3000);
    expect(result.current.celebrationState.showConfetti).toBe(true);
  });

  it('should show celebration with custom options', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    const onComplete = vi.fn();
    
    act(() => {
      result.current.celebrate({
        title: 'Custom Title',
        message: 'Custom Message',
        variant: 'order',
        duration: 5000,
        showConfetti: false,
        onComplete
      });
    });
    
    expect(result.current.celebrationState).toEqual({
      isVisible: true,
      title: 'Custom Title',
      message: 'Custom Message',
      variant: 'order',
      duration: 5000,
      showConfetti: false,
      onComplete
    });
  });

  it('should hide celebration', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebrate();
    });
    
    expect(result.current.celebrationState.isVisible).toBe(true);
    
    act(() => {
      result.current.hide();
    });
    
    expect(result.current.celebrationState.isVisible).toBe(false);
  });

  it('should celebrate order with default message', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebrateOrder();
    });
    
    expect(result.current.celebrationState.isVisible).toBe(true);
    expect(result.current.celebrationState.variant).toBe('order');
    expect(result.current.celebrationState.title).toBe('Pedido Confirmado!');
    expect(result.current.celebrationState.message).toBe('Seu pedido foi realizado com sucesso');
    expect(result.current.celebrationState.duration).toBe(4000);
  });

  it('should celebrate order with order number and estimated time', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebrateOrder('12345', '30-45 min');
    });
    
    expect(result.current.celebrationState.message).toBe(
      'Pedido #12345 realizado com sucesso. Tempo estimado: 30-45 min'
    );
  });

  it('should celebrate order with only order number', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebrateOrder('12345');
    });
    
    expect(result.current.celebrationState.message).toBe(
      'Pedido #12345 realizado com sucesso'
    );
  });

  it('should celebrate payment with default message', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebratePayment();
    });
    
    expect(result.current.celebrationState.isVisible).toBe(true);
    expect(result.current.celebrationState.variant).toBe('payment');
    expect(result.current.celebrationState.title).toBe('Pagamento Aprovado!');
    expect(result.current.celebrationState.message).toBe('Seu pagamento foi processado com sucesso');
    expect(result.current.celebrationState.duration).toBe(3000);
  });

  it('should celebrate payment with amount', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebratePayment('R$ 50,00');
    });
    
    expect(result.current.celebrationState.message).toBe(
      'Pagamento de R$ 50,00 processado com sucesso'
    );
  });

  it('should celebrate achievement', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebrateAchievement('Primeiro pedido realizado!');
    });
    
    expect(result.current.celebrationState.isVisible).toBe(true);
    expect(result.current.celebrationState.variant).toBe('achievement');
    expect(result.current.celebrationState.title).toBe('Parabéns!');
    expect(result.current.celebrationState.message).toBe('Primeiro pedido realizado!');
    expect(result.current.celebrationState.duration).toBe(4000);
  });

  it('should clear existing timeout when celebrating again', () => {
    const { result } = renderHook(() => useSuccessCelebration());
    
    act(() => {
      result.current.celebrate({ duration: 1000 });
    });
    
    expect(result.current.celebrationState.isVisible).toBe(true);
    
    // Celebrate again before first timeout
    act(() => {
      result.current.celebrate({ title: 'New Celebration' });
    });
    
    expect(result.current.celebrationState.title).toBe('New Celebration');
    expect(result.current.celebrationState.isVisible).toBe(true);
  });
});

describe('confettiEffects', () => {
  let mockConfetti: any;

  beforeEach(() => {
    vi.useFakeTimers();
    mockConfetti = vi.mocked((await import('canvas-confetti')).default);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should trigger basic confetti', () => {
    confettiEffects.basic();
    
    expect(mockConfetti).toHaveBeenCalledWith({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  });

  it('should trigger basic confetti with custom options', () => {
    const customOptions = { particleCount: 200, spread: 90 };
    
    confettiEffects.basic(customOptions);
    
    expect(mockConfetti).toHaveBeenCalledWith({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 }
    });
  });

  it('should trigger fireworks confetti', () => {
    confettiEffects.fireworks(1000);
    
    // Should start interval
    expect(mockConfetti).not.toHaveBeenCalled();
    
    // Advance time to trigger first burst
    act(() => {
      vi.advanceTimersByTime(250);
    });
    
    expect(mockConfetti).toHaveBeenCalledTimes(2);
    
    // Advance time to trigger second burst
    act(() => {
      vi.advanceTimersByTime(250);
    });
    
    expect(mockConfetti).toHaveBeenCalledTimes(4);
  });

  it('should trigger stars confetti', () => {
    confettiEffects.stars();
    
    // Should trigger immediately and with delays
    expect(mockConfetti).toHaveBeenCalledTimes(2);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(mockConfetti).toHaveBeenCalledTimes(4);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(mockConfetti).toHaveBeenCalledTimes(6);
  });

  it('should trigger side cannons confetti', () => {
    confettiEffects.sideCannons(1000);
    
    // Should start animation frame loop
    expect(mockConfetti).not.toHaveBeenCalled();
    
    // Mock requestAnimationFrame
    const mockRAF = vi.fn((callback) => {
      callback();
      return 1;
    });
    global.requestAnimationFrame = mockRAF;
    
    // Trigger first frame
    act(() => {
      vi.advanceTimersByTime(16);
    });
    
    // Should have called confetti twice (left and right cannons)
    expect(mockConfetti).toHaveBeenCalledTimes(2);
  });

  it('should trigger emoji confetti', async () => {
    const mockShapeFromText = vi.mocked((await import('canvas-confetti')).shapeFromText);
    
    confettiEffects.emoji('🎉');
    
    expect(mockShapeFromText).toHaveBeenCalledWith({ text: '🎉', scalar: 2 });
    expect(mockConfetti).toHaveBeenCalledTimes(2);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(mockConfetti).toHaveBeenCalledTimes(4);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(mockConfetti).toHaveBeenCalledTimes(6);
  });

  it('should trigger custom shapes confetti', async () => {
    const mockShapeFromPath = vi.mocked((await import('canvas-confetti')).shapeFromPath);
    
    confettiEffects.customShapes();
    
    expect(mockShapeFromPath).toHaveBeenCalledTimes(3);
    expect(mockConfetti).toHaveBeenCalledTimes(2);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(mockConfetti).toHaveBeenCalledTimes(4);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(mockConfetti).toHaveBeenCalledTimes(6);
  });

  it('should use default emoji when none provided', async () => {
    const mockShapeFromText = vi.mocked((await import('canvas-confetti')).shapeFromText);
    
    confettiEffects.emoji();
    
    expect(mockShapeFromText).toHaveBeenCalledWith({ text: '🎉', scalar: 2 });
  });

  it('should clear fireworks interval after duration', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    
    confettiEffects.fireworks(500);
    
    act(() => {
      vi.advanceTimersByTime(600);
    });
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should stop side cannons after duration', () => {
    confettiEffects.sideCannons(100);
    
    const mockRAF = vi.fn();
    global.requestAnimationFrame = mockRAF;
    
    act(() => {
      vi.advanceTimersByTime(150);
    });
    
    // Should not call requestAnimationFrame after duration
    expect(mockRAF).not.toHaveBeenCalled();
  });
});