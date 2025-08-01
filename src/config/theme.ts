/**
 * Comprehensive theme configuration for Magic UI components and application
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  
  // Secondary colors
  secondary: string;
  secondaryHover: string;
  secondaryForeground: string;
  
  // Accent colors
  accent: string;
  accentHover: string;
  accentForeground: string;
  
  // Background colors
  background: string;
  surface: string;
  surfaceHover: string;
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  
  // Border colors
  border: string;
  borderHover: string;
  
  // Status colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;
  
  // Magic UI specific colors
  magicUI: {
    beam: string;
    beamGradient: string[];
    shimmer: string;
    shimmerGradient: string[];
    particles: string;
    confetti: string[];
    glow: string;
    shadow: string;
  };
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    glow: string;
    magic: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
      bounce: string;
    };
  };
  typography: {
    fontFamily: {
      sans: string;
      serif: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
}

// Light theme configuration
export const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    primary: '#f59e0b', // amber-500
    primaryHover: '#d97706', // amber-600
    primaryForeground: '#ffffff',
    
    secondary: '#6b7280', // gray-500
    secondaryHover: '#4b5563', // gray-600
    secondaryForeground: '#ffffff',
    
    accent: '#3b82f6', // blue-500
    accentHover: '#2563eb', // blue-600
    accentForeground: '#ffffff',
    
    background: '#ffffff',
    surface: '#f9fafb', // gray-50
    surfaceHover: '#f3f4f6', // gray-100
    
    text: {
      primary: '#111827', // gray-900
      secondary: '#6b7280', // gray-500
      muted: '#9ca3af', // gray-400
      inverse: '#ffffff'
    },
    
    border: '#e5e7eb', // gray-200
    borderHover: '#d1d5db', // gray-300
    
    success: '#10b981', // emerald-500
    successForeground: '#ffffff',
    warning: '#f59e0b', // amber-500
    warningForeground: '#ffffff',
    error: '#ef4444', // red-500
    errorForeground: '#ffffff',
    info: '#3b82f6', // blue-500
    infoForeground: '#ffffff',
    
    magicUI: {
      beam: '#f59e0b', // amber-500
      beamGradient: ['#f59e0b', '#d97706', '#92400e'],
      shimmer: '#ffffff',
      shimmerGradient: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)'],
      particles: '#f59e0b',
      confetti: ['#f59e0b', '#d97706', '#92400e', '#3b82f6', '#2563eb'],
      glow: '#f59e0b',
      shadow: 'rgba(245, 158, 11, 0.3)'
    }
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(245, 158, 11, 0.3)',
    magic: '0 0 30px rgba(245, 158, 11, 0.5), 0 0 60px rgba(245, 158, 11, 0.2)'
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },
  typography: {
    fontFamily: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  }
};

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    primary: '#fbbf24', // amber-400
    primaryHover: '#f59e0b', // amber-500
    primaryForeground: '#111827', // gray-900
    
    secondary: '#9ca3af', // gray-400
    secondaryHover: '#6b7280', // gray-500
    secondaryForeground: '#111827', // gray-900
    
    accent: '#60a5fa', // blue-400
    accentHover: '#3b82f6', // blue-500
    accentForeground: '#111827', // gray-900
    
    background: '#111827', // gray-900
    surface: '#1f2937', // gray-800
    surfaceHover: '#374151', // gray-700
    
    text: {
      primary: '#f9fafb', // gray-50
      secondary: '#d1d5db', // gray-300
      muted: '#9ca3af', // gray-400
      inverse: '#111827' // gray-900
    },
    
    border: '#374151', // gray-700
    borderHover: '#4b5563', // gray-600
    
    success: '#34d399', // emerald-400
    successForeground: '#111827',
    warning: '#fbbf24', // amber-400
    warningForeground: '#111827',
    error: '#f87171', // red-400
    errorForeground: '#111827',
    info: '#60a5fa', // blue-400
    infoForeground: '#111827',
    
    magicUI: {
      beam: '#fbbf24', // amber-400
      beamGradient: ['#fbbf24', '#f59e0b', '#d97706'],
      shimmer: '#ffffff',
      shimmerGradient: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)'],
      particles: '#fbbf24',
      confetti: ['#fbbf24', '#f59e0b', '#d97706', '#60a5fa', '#3b82f6'],
      glow: '#fbbf24',
      shadow: 'rgba(251, 191, 36, 0.4)'
    }
  },
  borderRadius: lightTheme.borderRadius,
  spacing: lightTheme.spacing,
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(251, 191, 36, 0.4)',
    magic: '0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3)'
  },
  animations: lightTheme.animations,
  typography: lightTheme.typography
};

// Theme registry
export const themes = {
  light: lightTheme,
  dark: darkTheme
} as const;

export type ThemeName = keyof typeof themes;

/**
 * Get theme configuration by name
 */
export function getTheme(name: ThemeName): ThemeConfig {
  return themes[name];
}

/**
 * Apply theme CSS variables to document root
 */
export function applyTheme(theme: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Apply color variables
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
  root.style.setProperty('--color-primary-foreground', theme.colors.primaryForeground);
  
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-secondary-hover', theme.colors.secondaryHover);
  root.style.setProperty('--color-secondary-foreground', theme.colors.secondaryForeground);
  
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-accent-hover', theme.colors.accentHover);
  root.style.setProperty('--color-accent-foreground', theme.colors.accentForeground);
  
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-surface', theme.colors.surface);
  root.style.setProperty('--color-surface-hover', theme.colors.surfaceHover);
  
  root.style.setProperty('--color-text-primary', theme.colors.text.primary);
  root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--color-text-muted', theme.colors.text.muted);
  root.style.setProperty('--color-text-inverse', theme.colors.text.inverse);
  
  root.style.setProperty('--color-border', theme.colors.border);
  root.style.setProperty('--color-border-hover', theme.colors.borderHover);
  
  root.style.setProperty('--color-success', theme.colors.success);
  root.style.setProperty('--color-success-foreground', theme.colors.successForeground);
  root.style.setProperty('--color-warning', theme.colors.warning);
  root.style.setProperty('--color-warning-foreground', theme.colors.warningForeground);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-error-foreground', theme.colors.errorForeground);
  root.style.setProperty('--color-info', theme.colors.info);
  root.style.setProperty('--color-info-foreground', theme.colors.infoForeground);
  
  // Apply Magic UI specific variables
  root.style.setProperty('--magic-beam-color', theme.colors.magicUI.beam);
  root.style.setProperty('--magic-shimmer-color', theme.colors.magicUI.shimmer);
  root.style.setProperty('--magic-particles-color', theme.colors.magicUI.particles);
  root.style.setProperty('--magic-glow-color', theme.colors.magicUI.glow);
  root.style.setProperty('--magic-shadow-color', theme.colors.magicUI.shadow);
  
  // Apply spacing variables
  Object.entries(theme.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });
  
  // Apply border radius variables
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });
  
  // Apply shadow variables
  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
  
  // Apply animation variables
  Object.entries(theme.animations.duration).forEach(([key, value]) => {
    root.style.setProperty(`--duration-${key}`, value);
  });
  
  Object.entries(theme.animations.easing).forEach(([key, value]) => {
    root.style.setProperty(`--easing-${key}`, value);
  });
  
  // Apply typography variables
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });
  
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    root.style.setProperty(`--font-weight-${key}`, value);
  });
  
  root.style.setProperty('--font-family-sans', theme.typography.fontFamily.sans);
  root.style.setProperty('--font-family-serif', theme.typography.fontFamily.serif);
  root.style.setProperty('--font-family-mono', theme.typography.fontFamily.mono);
}

/**
 * Generate Magic UI component props from theme
 */
export function getMagicUIProps(theme: ThemeConfig) {
  return {
    // BorderBeam props
    borderBeam: {
      size: 250,
      duration: 12,
      delay: 9,
      colorFrom: theme.colors.magicUI.beamGradient[0],
      colorTo: theme.colors.magicUI.beamGradient[1],
    },
    
    // ShimmerButton props
    shimmerButton: {
      shimmerColor: theme.colors.magicUI.shimmer,
      shimmerSize: '100px',
      shimmerDuration: '3s',
      background: theme.colors.primary,
      className: 'transition-all duration-300 hover:scale-105',
    },
    
    // MagicCard props
    magicCard: {
      gradientColor: theme.colors.magicUI.shadow,
      gradientSize: 200,
      gradientOpacity: 0.8,
    },
    
    // Particles props
    particles: {
      quantity: 100,
      ease: 80,
      color: theme.colors.magicUI.particles,
      refresh: true,
    },
    
    // Confetti props
    confetti: {
      colors: theme.colors.magicUI.confetti,
      numberOfPieces: 200,
      recycle: false,
      gravity: 0.3,
    },
    
    // AnimatedBeam props
    animatedBeam: {
      curvature: -75,
      reverse: true,
      duration: 3000,
      gradientStartColor: theme.colors.magicUI.beamGradient[0],
      gradientStopColor: theme.colors.magicUI.beamGradient[1],
    }
  };
}