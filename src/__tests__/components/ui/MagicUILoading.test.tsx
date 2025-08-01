/**
 * Unit Tests for MagicUILoading Component
 * Tests Magic UI loading animations and states
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MagicUILoading } from '@/components/ui/MagicUILoading';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock Magic UI components
vi.mock('@/components/ui/particles', () => ({
  Particles: ({ className, quantity, ease, color, refresh, ...props }: any) => (
    <div 
      className={`particles ${className || ''}`}
      data-quantity={quantity}
      data-ease={ease}
      data-color={color}
      data-refresh={refresh}
      {...props}
    />
  )
}));

vi.mock('@/components/ui/animated-beam', () => ({
  AnimatedBeam: ({ 
    className, 
    containerRef, 
    fromRef, 
    toRef, 
    curvature, 
    reverse,
    ...props 
  }: any) => (
    <div 
      className={`animated-beam ${className || ''}`}
      data-curvature={curvature}
      data-reverse={reverse}
      {...props}
    />
  )
}));

vi.mock('@/components/ui/shimmer-button', () => ({
  ShimmerButton: ({ children, className, disabled, ...props }: any) => (
    <button 
      className={`shimmer-button ${className || ''}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}));

describe('MagicUILoading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<MagicUILoading />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<MagicUILoading message="Processando pedido..." />);
      
      expect(screen.getByText('Processando pedido...')).toBeInTheDocument();
    });

    it('should render without message when showMessage is false', () => {
      render(<MagicUILoading showMessage={false} />);
      
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });
  });

  describe('Loading Variants', () => {
    it('should render particles variant', () => {
      render(<MagicUILoading variant="particles" />);
      
      const particles = document.querySelector('.particles');
      expect(particles).toBeInTheDocument();
      expect(particles).toHaveAttribute('data-quantity', '100');
      expect(particles).toHaveAttribute('data-ease', '80');
    });

    it('should render beam variant', () => {
      render(<MagicUILoading variant="beam" />);
      
      const beam = document.querySelector('.animated-beam');
      expect(beam).toBeInTheDocument();
      expect(beam).toHaveAttribute('data-curvature', '-75');
      expect(beam).toHaveAttribute('data-reverse', 'true');
    });

    it('should render shimmer variant', () => {
      render(<MagicUILoading variant="shimmer" />);
      
      const shimmerButton = document.querySelector('.shimmer-button');
      expect(shimmerButton).toBeInTheDocument();
      expect(shimmerButton).toBeDisabled();
    });

    it('should render pulse variant with default styling', () => {
      render(<MagicUILoading variant="pulse" />);
      
      const pulseElement = screen.getByRole('status').querySelector('.animate-pulse');
      expect(pulseElement).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      render(<MagicUILoading size="sm" />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveClass('w-8', 'h-8');
    });

    it('should apply medium size classes', () => {
      render(<MagicUILoading size="md" />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveClass('w-12', 'h-12');
    });

    it('should apply large size classes', () => {
      render(<MagicUILoading size="lg" />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveClass('w-16', 'h-16');
    });

    it('should apply extra large size classes', () => {
      render(<MagicUILoading size="xl" />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveClass('w-24', 'h-24');
    });
  });

  describe('Color Variants', () => {
    it('should apply primary color', () => {
      render(<MagicUILoading color="primary" />);
      
      const particles = document.querySelector('.particles');
      expect(particles).toHaveAttribute('data-color', '#f59e0b');
    });

    it('should apply secondary color', () => {
      render(<MagicUILoading color="secondary" />);
      
      const particles = document.querySelector('.particles');
      expect(particles).toHaveAttribute('data-color', '#6b7280');
    });

    it('should apply success color', () => {
      render(<MagicUILoading color="success" />);
      
      const particles = document.querySelector('.particles');
      expect(particles).toHaveAttribute('data-color', '#10b981');
    });

    it('should apply error color', () => {
      render(<MagicUILoading color="error" />);
      
      const particles = document.querySelector('.particles');
      expect(particles).toHaveAttribute('data-color', '#ef4444');
    });
  });

  describe('Fullscreen Mode', () => {
    it('should render in fullscreen mode', () => {
      render(<MagicUILoading fullscreen />);
      
      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('fixed', 'inset-0', 'z-50');
    });

    it('should render with backdrop in fullscreen mode', () => {
      render(<MagicUILoading fullscreen />);
      
      const backdrop = screen.getByRole('status').parentElement;
      expect(backdrop).toHaveClass('bg-black', 'bg-opacity-50');
    });

    it('should not render fullscreen classes when fullscreen is false', () => {
      render(<MagicUILoading fullscreen={false} />);
      
      const container = screen.getByRole('status').parentElement;
      expect(container).not.toHaveClass('fixed', 'inset-0', 'z-50');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<MagicUILoading className="custom-loading" />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveClass('custom-loading');
    });

    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      
      render(<MagicUILoading style={customStyle} />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveStyle('background-color: red');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<MagicUILoading />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Carregando...');
    });

    it('should have custom ARIA label', () => {
      render(<MagicUILoading message="Salvando dados..." />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Salvando dados...');
    });

    it('should be announced to screen readers', () => {
      render(<MagicUILoading />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Animation Configuration', () => {
    it('should configure particles with custom options', () => {
      render(
        <MagicUILoading 
          variant="particles"
          particleOptions={{
            quantity: 200,
            ease: 60,
            color: '#ff0000'
          }}
        />
      );
      
      const particles = document.querySelector('.particles');
      expect(particles).toHaveAttribute('data-quantity', '200');
      expect(particles).toHaveAttribute('data-ease', '60');
      expect(particles).toHaveAttribute('data-color', '#ff0000');
    });

    it('should configure beam with custom options', () => {
      render(
        <MagicUILoading 
          variant="beam"
          beamOptions={{
            curvature: -50,
            reverse: false
          }}
        />
      );
      
      const beam = document.querySelector('.animated-beam');
      expect(beam).toHaveAttribute('data-curvature', '-50');
      expect(beam).toHaveAttribute('data-reverse', 'false');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<MagicUILoading />);
      
      const initialContainer = screen.getByRole('status');
      
      rerender(<MagicUILoading />);
      
      const rerenderedContainer = screen.getByRole('status');
      expect(rerenderedContainer).toBe(initialContainer);
    });

    it('should handle rapid prop changes', async () => {
      const { rerender } = render(<MagicUILoading variant="particles" />);
      
      rerender(<MagicUILoading variant="beam" />);
      rerender(<MagicUILoading variant="shimmer" />);
      rerender(<MagicUILoading variant="pulse" />);
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Magic UI components gracefully', () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // This should not throw even if Magic UI components fail
      expect(() => {
        render(<MagicUILoading variant="particles" />);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should fallback to basic loading when animations fail', () => {
      // Mock particles to throw an error
      vi.mocked(require('@/components/ui/particles').Particles).mockImplementation(() => {
        throw new Error('Animation failed');
      });
      
      render(<MagicUILoading variant="particles" />);
      
      // Should still render the loading container
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Integration with Loading States', () => {
    it('should work with loading state management', () => {
      const { rerender } = render(<MagicUILoading />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Simulate loading completion
      rerender(<div>Content loaded</div>);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText('Content loaded')).toBeInTheDocument();
    });
  });
});