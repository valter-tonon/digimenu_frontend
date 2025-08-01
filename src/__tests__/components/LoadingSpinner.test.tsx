import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  LoadingSpinner, 
  LoadingDots, 
  LoadingPulse, 
  LoadingBar 
} from '@/components/ui/LoadingSpinner';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Carregando...');
  });

  it('should render with custom label', () => {
    render(<LoadingSpinner label="Processando..." />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Processando...');
    expect(screen.getByText('Processando...')).toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="lg" />);
    svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8');
  });

  it('should apply color classes correctly', () => {
    render(<LoadingSpinner color="success" />);
    
    const svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('text-green-600');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });
});

describe('LoadingDots', () => {
  it('should render three dots', () => {
    render(<LoadingDots />);
    
    const container = screen.getByRole('status');
    const dots = container.querySelectorAll('div[class*="rounded-full"]');
    expect(dots).toHaveLength(3);
  });

  it('should apply size classes to dots', () => {
    render(<LoadingDots size="lg" />);
    
    const container = screen.getByRole('status');
    const dots = container.querySelectorAll('div[class*="rounded-full"]');
    dots.forEach(dot => {
      expect(dot).toHaveClass('w-3', 'h-3');
    });
  });

  it('should apply color classes to dots', () => {
    render(<LoadingDots color="error" />);
    
    const container = screen.getByRole('status');
    const dots = container.querySelectorAll('div[class*="rounded-full"]');
    dots.forEach(dot => {
      expect(dot).toHaveClass('bg-red-600');
    });
  });

  it('should have staggered animation delays', () => {
    render(<LoadingDots />);
    
    const container = screen.getByRole('status');
    const dots = container.querySelectorAll('div[class*="rounded-full"]');
    
    expect(dots[0]).toHaveStyle('animation-delay: 0s');
    expect(dots[1]).toHaveStyle('animation-delay: 0.2s');
    expect(dots[2]).toHaveStyle('animation-delay: 0.4s');
  });
});

describe('LoadingPulse', () => {
  it('should render pulse animation', () => {
    render(<LoadingPulse />);
    
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
    
    const pulseElements = container.querySelectorAll('div[class*="rounded-full"]');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('should apply size classes correctly', () => {
    render(<LoadingPulse size="lg" />);
    
    const container = screen.getByRole('status');
    const outerPulse = container.querySelector('div[class*="w-16"]');
    expect(outerPulse).toBeInTheDocument();
  });

  it('should apply color classes correctly', () => {
    render(<LoadingPulse color="warning" />);
    
    const container = screen.getByRole('status');
    const pulseElements = container.querySelectorAll('div[class*="bg-yellow-600"]');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

describe('LoadingBar', () => {
  it('should render progress bar', () => {
    render(<LoadingBar progress={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('should show percentage when enabled', () => {
    render(<LoadingBar progress={75} showPercentage />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should handle indeterminate state', () => {
    render(<LoadingBar />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should apply size classes correctly', () => {
    render(<LoadingBar size="lg" />);
    
    const progressBar = screen.getByRole('progressbar');
    const barElement = progressBar.querySelector('div[class*="h-3"]');
    expect(barElement).toBeInTheDocument();
  });

  it('should apply color classes correctly', () => {
    render(<LoadingBar color="success" progress={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    const barElement = progressBar.querySelector('div[class*="bg-green-600"]');
    expect(barElement).toBeInTheDocument();
  });

  it('should clamp progress values', () => {
    const { rerender } = render(<LoadingBar progress={150} />);
    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');

    rerender(<LoadingBar progress={-10} />);
    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should show custom label', () => {
    render(<LoadingBar progress={50} label="Uploading..." showPercentage />);
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('should handle animated indeterminate state', () => {
    render(<LoadingBar animated />);
    
    const progressBar = screen.getByRole('progressbar');
    const barElement = progressBar.querySelector('div[class*="animate-pulse"]');
    expect(barElement).toBeInTheDocument();
  });
});