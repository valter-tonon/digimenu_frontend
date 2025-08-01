import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { 
  SuccessCelebration, 
  MicroCelebration, 
  SuccessMessage 
} from '@/components/ui/SuccessCelebration';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

describe('SuccessCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should not render when not visible', () => {
    render(<SuccessCelebration isVisible={false} />);
    
    expect(screen.queryByText('Sucesso!')).not.toBeInTheDocument();
  });

  it('should render with default props when visible', async () => {
    render(<SuccessCelebration isVisible={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
      expect(screen.getByText('Operação realizada com sucesso')).toBeInTheDocument();
    });
  });

  it('should render custom title and message', async () => {
    render(
      <SuccessCelebration 
        isVisible={true} 
        title="Custom Title" 
        message="Custom message" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });

  it('should render different variants correctly', async () => {
    const { rerender } = render(
      <SuccessCelebration isVisible={true} variant="order" />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Pedido Confirmado!')).toBeInTheDocument();
    });

    rerender(<SuccessCelebration isVisible={true} variant="payment" />);
    
    await waitFor(() => {
      expect(screen.getByText('Pagamento Aprovado!')).toBeInTheDocument();
    });

    rerender(<SuccessCelebration isVisible={true} variant="achievement" />);
    
    await waitFor(() => {
      expect(screen.getByText('Parabéns!')).toBeInTheDocument();
    });
  });

  it('should auto-hide after duration', async () => {
    const onComplete = vi.fn();
    
    render(
      <SuccessCelebration 
        isVisible={true} 
        duration={1000} 
        onComplete={onComplete} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should hide when clicked', async () => {
    const onComplete = vi.fn();
    
    render(
      <SuccessCelebration 
        isVisible={true} 
        onComplete={onComplete} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Toque para continuar').closest('div')!.parentElement!);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should not hide when clicking on content', async () => {
    const onComplete = vi.fn();
    
    render(
      <SuccessCelebration 
        isVisible={true} 
        onComplete={onComplete} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sucesso!'));

    // Should not call onComplete immediately
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should trigger confetti when showConfetti is true', async () => {
    const confetti = await import('canvas-confetti');
    
    render(
      <SuccessCelebration 
        isVisible={true} 
        showConfetti={true} 
      />
    );
    
    await waitFor(() => {
      expect(confetti.default).toHaveBeenCalled();
    });
  });

  it('should not trigger confetti when showConfetti is false', async () => {
    const confetti = await import('canvas-confetti');
    
    render(
      <SuccessCelebration 
        isVisible={true} 
        showConfetti={false} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    });

    expect(confetti.default).not.toHaveBeenCalled();
  });

  it('should render different icons based on variant', async () => {
    const { rerender } = render(
      <SuccessCelebration isVisible={true} variant="order" />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Pedido Confirmado!')).toBeInTheDocument();
    });

    rerender(<SuccessCelebration isVisible={true} variant="achievement" />);
    
    await waitFor(() => {
      expect(screen.getByText('Parabéns!')).toBeInTheDocument();
    });
  });

  it('should handle custom confetti options', async () => {
    const confetti = await import('canvas-confetti');
    const customOptions = { particleCount: 200, spread: 90 };
    
    render(
      <SuccessCelebration 
        isVisible={true} 
        showConfetti={true}
        confettiOptions={customOptions}
      />
    );
    
    await waitFor(() => {
      expect(confetti.default).toHaveBeenCalledWith(
        expect.objectContaining(customOptions)
      );
    });
  });
});

describe('MicroCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render children normally when not triggered', () => {
    render(
      <MicroCelebration trigger={false}>
        <div>Test Content</div>
      </MicroCelebration>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply animation when triggered', () => {
    const { rerender } = render(
      <MicroCelebration trigger={false}>
        <div>Test Content</div>
      </MicroCelebration>
    );
    
    rerender(
      <MicroCelebration trigger={true}>
        <div>Test Content</div>
      </MicroCelebration>
    );
    
    const container = screen.getByText('Test Content').parentElement;
    expect(container).toHaveClass('animate-bounce');
  });

  it('should remove animation after duration', () => {
    const { rerender } = render(
      <MicroCelebration trigger={false} duration={500}>
        <div>Test Content</div>
      </MicroCelebration>
    );
    
    rerender(
      <MicroCelebration trigger={true} duration={500}>
        <div>Test Content</div>
      </MicroCelebration>
    );
    
    const container = screen.getByText('Test Content').parentElement;
    expect(container).toHaveClass('animate-bounce');

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(container).not.toHaveClass('animate-bounce');
  });

  it('should apply different animation variants', () => {
    const { rerender } = render(
      <MicroCelebration trigger={true} variant="pulse">
        <div>Test Content</div>
      </MicroCelebration>
    );
    
    let container = screen.getByText('Test Content').parentElement;
    expect(container).toHaveClass('animate-pulse');

    rerender(
      <MicroCelebration trigger={true} variant="glow">
        <div>Test Content</div>
      </MicroCelebration>
    );
    
    container = screen.getByText('Test Content').parentElement;
    expect(container).toHaveClass('animate-pulse');
    expect(container).toHaveClass('shadow-lg');
  });
});

describe('SuccessMessage', () => {
  it('should render title and message', () => {
    render(
      <SuccessMessage 
        title="Order Complete" 
        message="Your order has been placed successfully" 
      />
    );
    
    expect(screen.getByText('Order Complete')).toBeInTheDocument();
    expect(screen.getByText('Your order has been placed successfully')).toBeInTheDocument();
  });

  it('should render order details when provided', () => {
    render(
      <SuccessMessage 
        title="Order Complete"
        orderNumber="12345"
        trackingCode="TRK123456"
        estimatedTime="30-45 min"
      />
    );
    
    expect(screen.getByText('#12345')).toBeInTheDocument();
    expect(screen.getByText('TRK123456')).toBeInTheDocument();
    expect(screen.getByText('30-45 min')).toBeInTheDocument();
  });

  it('should render action buttons when callbacks provided', () => {
    const onTrackOrder = vi.fn();
    const onContinueShopping = vi.fn();
    
    render(
      <SuccessMessage 
        title="Order Complete"
        onTrackOrder={onTrackOrder}
        onContinueShopping={onContinueShopping}
      />
    );
    
    expect(screen.getByText('Acompanhar Pedido')).toBeInTheDocument();
    expect(screen.getByText('Continuar Comprando')).toBeInTheDocument();
  });

  it('should call callbacks when buttons are clicked', () => {
    const onTrackOrder = vi.fn();
    const onContinueShopping = vi.fn();
    
    render(
      <SuccessMessage 
        title="Order Complete"
        onTrackOrder={onTrackOrder}
        onContinueShopping={onContinueShopping}
      />
    );
    
    fireEvent.click(screen.getByText('Acompanhar Pedido'));
    expect(onTrackOrder).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Continuar Comprando'));
    expect(onContinueShopping).toHaveBeenCalled();
  });

  it('should not render buttons when callbacks not provided', () => {
    render(
      <SuccessMessage title="Order Complete" />
    );
    
    expect(screen.queryByText('Acompanhar Pedido')).not.toBeInTheDocument();
    expect(screen.queryByText('Continuar Comprando')).not.toBeInTheDocument();
  });

  it('should render with custom className', () => {
    render(
      <SuccessMessage 
        title="Order Complete" 
        className="custom-class"
      />
    );
    
    const container = screen.getByText('Order Complete').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });
});