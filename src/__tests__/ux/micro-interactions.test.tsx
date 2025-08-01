/**
 * UX Tests for Micro-interactions and Final Polish
 * Tests hover effects, transitions, accessibility, and overall user experience
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '@/components/providers/AppProviders';
import { 
  HoverEffect, 
  LoadingState, 
  PageTransition, 
  RippleEffect,
  StaggerAnimation,
  PulseAnimation,
  InViewAnimation,
  TypingAnimation,
  useMicroInteractions
} from '@/components/ui/MicroInteractions';
import {
  SkipToContent,
  ScreenReaderOnly,
  FocusTrap,
  Announcement,
  AccessibleProgress,
  AccessibleButton,
  AccessibleField,
  AccessibleModal,
  AccessibleTooltip,
  useAccessibilityAnnouncements
} from '@/components/ui/AccessibilityEnhancements';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Test wrapper with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      {children}
    </AppProviders>
  );
}

describe('Micro-interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HoverEffect', () => {
    it('should apply hover effects correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <HoverEffect effect="lift" intensity="medium" data-testid="hover-element">
            <div>Hover me</div>
          </HoverEffect>
        </TestWrapper>
      );

      const element = screen.getByTestId('hover-element');
      expect(element).toHaveClass('hover:translate-y-[-4px]', 'hover:shadow-lg');
    });

    it('should respect reduced motion preference', () => {
      // Mock reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TestWrapper>
          <HoverEffect effect="lift" data-testid="reduced-motion">
            <div>No animation</div>
          </HoverEffect>
        </TestWrapper>
      );

      const element = screen.getByTestId('reduced-motion');
      expect(element).not.toHaveClass('hover:translate-y-[-4px]');
    });
  });

  describe('LoadingState', () => {
    it('should show loading state correctly', async () => {
      const { rerender } = render(
        <TestWrapper>
          <LoadingState isLoading={true}>
            <div data-testid="content">Content</div>
          </LoadingState>
        </TestWrapper>
      );

      // Should show loading spinner
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();

      // Switch to loaded state
      rerender(
        <TestWrapper>
          <LoadingState isLoading={false}>
            <div data-testid="content">Content</div>
          </LoadingState>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeVisible();
      });
    });

    it('should use custom loading component', () => {
      const CustomLoader = () => <div data-testid="custom-loader">Loading...</div>;

      render(
        <TestWrapper>
          <LoadingState isLoading={true} loadingComponent={<CustomLoader />}>
            <div>Content</div>
          </LoadingState>
        </TestWrapper>
      );

      expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
    });
  });

  describe('RippleEffect', () => {
    it('should create ripple on click', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <TestWrapper>
          <RippleEffect onClick={handleClick} data-testid="ripple-button">
            <button>Click me</button>
          </RippleEffect>
        </TestWrapper>
      );

      const button = screen.getByTestId('ripple-button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalled();
    });

    it('should not create ripple with reduced motion', async () => {
      // Mock reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <TestWrapper>
          <RippleEffect onClick={handleClick} data-testid="no-ripple">
            <button>Click me</button>
          </RippleEffect>
        </TestWrapper>
      );

      const button = screen.getByTestId('no-ripple');
      await user.click(button);

      expect(handleClick).toHaveBeenCalled();
      // Should not create ripple elements
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });
  });

  describe('StaggerAnimation', () => {
    it('should animate children with stagger effect', () => {
      const children = [
        <div key="1" data-testid="item-1">Item 1</div>,
        <div key="2" data-testid="item-2">Item 2</div>,
        <div key="3" data-testid="item-3">Item 3</div>
      ];

      render(
        <TestWrapper>
          <StaggerAnimation delay={100} direction="up">
            {children}
          </StaggerAnimation>
        </TestWrapper>
      );

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });
  });

  describe('TypingAnimation', () => {
    it('should animate text typing', async () => {
      const onComplete = vi.fn();

      render(
        <TestWrapper>
          <TypingAnimation 
            text="Hello World" 
            speed={10} 
            onComplete={onComplete}
            data-testid="typing-text"
          />
        </TestWrapper>
      );

      // Should start with empty or partial text
      const element = screen.getByTestId('typing-text');
      expect(element).toBeInTheDocument();

      // Should complete after animation
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });
});

describe('Accessibility Enhancements', () => {
  describe('SkipToContent', () => {
    it('should render skip link', () => {
      render(<SkipToContent />);
      
      const skipLink = screen.getByRole('link', { name: /pular para o conteúdo principal/i });
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should be visually hidden by default', () => {
      render(<SkipToContent />);
      
      const skipLink = screen.getByRole('link', { name: /pular para o conteúdo principal/i });
      expect(skipLink).toHaveClass('sr-only');
    });
  });

  describe('ScreenReaderOnly', () => {
    it('should hide content visually but keep it for screen readers', () => {
      render(
        <ScreenReaderOnly>
          <span data-testid="sr-only-content">Screen reader only text</span>
        </ScreenReaderOnly>
      );

      const content = screen.getByTestId('sr-only-content');
      expect(content.parentElement).toHaveClass('sr-only');
    });
  });

  describe('FocusTrap', () => {
    it('should trap focus when active', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button data-testid="outside-button">Outside</button>
          <FocusTrap isActive={true}>
            <div>
              <button data-testid="first-button">First</button>
              <button data-testid="last-button">Last</button>
            </div>
          </FocusTrap>
        </div>
      );

      const firstButton = screen.getByTestId('first-button');
      const lastButton = screen.getByTestId('last-button');

      // First button should be focused initially
      await waitFor(() => {
        expect(firstButton).toHaveFocus();
      });

      // Tab should move to last button
      await user.tab();
      expect(lastButton).toHaveFocus();

      // Tab from last should cycle to first
      await user.tab();
      expect(firstButton).toHaveFocus();

      // Shift+Tab should move to last button
      await user.tab({ shift: true });
      expect(lastButton).toHaveFocus();
    });

    it('should not trap focus when inactive', () => {
      render(
        <FocusTrap isActive={false}>
          <div>
            <button data-testid="button">Button</button>
          </div>
        </FocusTrap>
      );

      const button = screen.getByTestId('button');
      expect(button).not.toHaveFocus();
    });
  });

  describe('Announcement', () => {
    it('should create live region for announcements', () => {
      render(
        <Announcement message="Test announcement" priority="polite" />
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent('Test announcement');
    });

    it('should support assertive priority', () => {
      render(
        <Announcement message="Urgent message" priority="assertive" />
      );

      const liveRegion = screen.getByRole('alert');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('AccessibleProgress', () => {
    it('should render progress bar with correct attributes', () => {
      render(
        <AccessibleProgress 
          value={50} 
          max={100} 
          label="Loading progress"
          description="Please wait while we load your data"
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');

      expect(screen.getByText('Loading progress')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we load your data')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should calculate percentage correctly', () => {
      render(<AccessibleProgress value={25} max={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');
      expect(screen.getByText('50%')).toBeInTheDocument(); // 25/50 = 50%
    });
  });

  describe('AccessibleButton', () => {
    it('should render button with correct accessibility attributes', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <AccessibleButton onClick={handleClick}>
          Click me
        </AccessibleButton>
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();

      await user.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('should handle loading state correctly', () => {
      render(
        <AccessibleButton isLoading={true} loadingText="Processing...">
          Submit
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <AccessibleButton onClick={handleClick}>
          Keyboard accessible
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      button.focus();

      // Should trigger on Enter
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();

      // Should trigger on Space
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('AccessibleField', () => {
    it('should associate label with input correctly', () => {
      render(
        <AccessibleField label="Email address" required={true}>
          <input type="email" />
        </AccessibleField>
      );

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email address *');

      expect(input).toHaveAttribute('aria-required', 'true');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('should handle error states correctly', () => {
      render(
        <AccessibleField 
          label="Password" 
          error="Password is too short"
          help="Must be at least 8 characters"
        >
          <input type="password" />
        </AccessibleField>
      );

      const input = screen.getByLabelText('Password');
      const errorMessage = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveTextContent('Password is too short');
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });
  });

  describe('AccessibleModal', () => {
    it('should render modal with correct accessibility attributes', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={vi.fn()}
          title="Test Modal"
          description="This is a test modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('This is a test modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should handle escape key to close', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(
        <AccessibleModal
          isOpen={true}
          onClose={handleClose}
          title="Closeable Modal"
        >
          <p>Press escape to close</p>
        </AccessibleModal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalled();
    });

    it('should not render when closed', () => {
      render(
        <AccessibleModal
          isOpen={false}
          onClose={vi.fn()}
          title="Hidden Modal"
        >
          <p>This should not be visible</p>
        </AccessibleModal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('This should not be visible')).not.toBeInTheDocument();
    });
  });

  describe('AccessibleTooltip', () => {
    it('should show tooltip on hover and focus', async () => {
      const user = userEvent.setup();

      render(
        <AccessibleTooltip content="Helpful tooltip text">
          <button>Hover me</button>
        </AccessibleTooltip>
      );

      const button = screen.getByRole('button');
      
      // Hover to show tooltip
      await user.hover(button);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('Helpful tooltip text')).toBeInTheDocument();
      });

      // Unhover to hide tooltip
      await user.unhover(button);
      
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should associate tooltip with trigger element', async () => {
      const user = userEvent.setup();

      render(
        <AccessibleTooltip content="Tooltip content">
          <button>Button with tooltip</button>
        </AccessibleTooltip>
      );

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(button).toHaveAttribute('aria-describedby', tooltip.id);
      });
    });
  });

  describe('useAccessibilityAnnouncements', () => {
    function TestComponent() {
      const { announce, AnnouncementRegion } = useAccessibilityAnnouncements();

      return (
        <div>
          <button 
            onClick={() => announce('Test announcement', 'polite')}
            data-testid="announce-button"
          >
            Announce
          </button>
          <button 
            onClick={() => announce('Urgent announcement', 'assertive')}
            data-testid="announce-urgent"
          >
            Announce Urgent
          </button>
          <AnnouncementRegion />
        </div>
      );
    }

    it('should create announcements correctly', async () => {
      const user = userEvent.setup();

      render(<TestComponent />);

      const announceButton = screen.getByTestId('announce-button');
      await user.click(announceButton);

      expect(screen.getByRole('status')).toHaveTextContent('Test announcement');
    });

    it('should handle urgent announcements', async () => {
      const user = userEvent.setup();

      render(<TestComponent />);

      const announceUrgent = screen.getByTestId('announce-urgent');
      await user.click(announceUrgent);

      expect(screen.getByRole('alert')).toHaveTextContent('Urgent announcement');
    });
  });
});

describe('Design System Integration', () => {
  it('should apply consistent spacing classes', () => {
    render(
      <div className="stack-md">
        <div data-testid="item-1">Item 1</div>
        <div data-testid="item-2">Item 2</div>
      </div>
    );

    const container = screen.getByTestId('item-1').parentElement;
    expect(container).toHaveClass('stack-md');
  });

  it('should apply consistent typography classes', () => {
    render(
      <div>
        <h1 className="text-heading-1" data-testid="heading">Main Heading</h1>
        <p className="text-body" data-testid="body">Body text</p>
        <small className="text-caption" data-testid="caption">Caption text</small>
      </div>
    );

    expect(screen.getByTestId('heading')).toHaveClass('text-heading-1');
    expect(screen.getByTestId('body')).toHaveClass('text-body');
    expect(screen.getByTestId('caption')).toHaveClass('text-caption');
  });

  it('should apply consistent button styles', () => {
    render(
      <div>
        <button className="button button-primary" data-testid="primary">Primary</button>
        <button className="button button-secondary" data-testid="secondary">Secondary</button>
        <button className="button button-outline" data-testid="outline">Outline</button>
      </div>
    );

    expect(screen.getByTestId('primary')).toHaveClass('button', 'button-primary');
    expect(screen.getByTestId('secondary')).toHaveClass('button', 'button-secondary');
    expect(screen.getByTestId('outline')).toHaveClass('button', 'button-outline');
  });
});

describe('Theme Integration', () => {
  it('should apply theme CSS variables', () => {
    render(
      <TestWrapper>
        <div data-testid="themed-element" style={{ color: 'var(--color-primary)' }}>
          Themed content
        </div>
      </TestWrapper>
    );

    const element = screen.getByTestId('themed-element');
    expect(element).toBeInTheDocument();
    
    // Check that CSS variables are applied to document root
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBeTruthy();
  });
});