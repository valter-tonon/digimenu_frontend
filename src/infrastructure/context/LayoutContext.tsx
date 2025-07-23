'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LayoutConfig, LayoutContextType } from '@/types/layout';
import { availableLayouts, getDefaultLayout, getLayoutById } from '@/config/layouts';

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
  initialLayoutId?: string;
}

export function LayoutProvider({ children, initialLayoutId }: LayoutProviderProps) {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(getDefaultLayout());
  const [isLoading, setIsLoading] = useState(true);

  // Carregar layout salvo do localStorage
  useEffect(() => {
    const loadSavedLayout = () => {
      try {
        const savedLayoutId = localStorage.getItem('digimenu_layout');
        const layoutToUse = initialLayoutId || savedLayoutId || 'default';
        
        const layout = getLayoutById(layoutToUse);
        if (layout) {
          setCurrentLayout(layout);
        }
      } catch (error) {
        console.error('Erro ao carregar layout salvo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLayout();
  }, [initialLayoutId]);

  // Aplicar variáveis CSS do tema atual
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyThemeVariables = () => {
      const root = document.documentElement;
      const theme = currentLayout.theme;

      // Aplicar cores
      root.style.setProperty('--color-primary', theme.colors.primary);
      root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
      root.style.setProperty('--color-secondary', theme.colors.secondary);
      root.style.setProperty('--color-accent', theme.colors.accent);
      root.style.setProperty('--color-background', theme.colors.background);
      root.style.setProperty('--color-surface', theme.colors.surface);
      root.style.setProperty('--color-text-primary', theme.colors.text.primary);
      root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
      root.style.setProperty('--color-text-muted', theme.colors.text.muted);
      root.style.setProperty('--color-border', theme.colors.border);
      root.style.setProperty('--color-success', theme.colors.success);
      root.style.setProperty('--color-warning', theme.colors.warning);
      root.style.setProperty('--color-error', theme.colors.error);

      // Aplicar espaçamentos
      root.style.setProperty('--spacing-xs', theme.spacing.xs);
      root.style.setProperty('--spacing-sm', theme.spacing.sm);
      root.style.setProperty('--spacing-md', theme.spacing.md);
      root.style.setProperty('--spacing-lg', theme.spacing.lg);
      root.style.setProperty('--spacing-xl', theme.spacing.xl);
      root.style.setProperty('--spacing-xxl', theme.spacing.xxl);

      // Aplicar border radius
      root.style.setProperty('--radius-sm', theme.borderRadius.sm);
      root.style.setProperty('--radius-md', theme.borderRadius.md);
      root.style.setProperty('--radius-lg', theme.borderRadius.lg);
      root.style.setProperty('--radius-xl', theme.borderRadius.xl);
      root.style.setProperty('--radius-full', theme.borderRadius.full);

      // Aplicar sombras
      root.style.setProperty('--shadow-sm', theme.shadows.sm);
      root.style.setProperty('--shadow-md', theme.shadows.md);
      root.style.setProperty('--shadow-lg', theme.shadows.lg);
      root.style.setProperty('--shadow-xl', theme.shadows.xl);

      // Aplicar tipografia
      root.style.setProperty('--font-family-sans', theme.typography.fontFamily.sans);
      root.style.setProperty('--font-family-serif', theme.typography.fontFamily.serif);
      root.style.setProperty('--font-family-mono', theme.typography.fontFamily.mono);
    };

    applyThemeVariables();
  }, [currentLayout]);

  const setLayout = (layoutId: string) => {
    const layout = getLayoutById(layoutId);
    if (layout) {
      setCurrentLayout(layout);
      
      // Salvar no localStorage
      try {
        localStorage.setItem('digimenu_layout', layoutId);
      } catch (error) {
        console.error('Erro ao salvar layout:', error);
      }
    }
  };

  const updateLayoutConfig = (updates: Partial<LayoutConfig>) => {
    setCurrentLayout(prev => ({
      ...prev,
      ...updates,
      theme: updates.theme ? { ...prev.theme, ...updates.theme } : prev.theme,
      components: updates.components ? { ...prev.components, ...updates.components } : prev.components,
    }));
  };

  const resetToDefault = () => {
    setLayout('default');
  };

  const contextValue: LayoutContextType = {
    currentLayout,
    availableLayouts,
    setLayout,
    updateLayoutConfig,
    resetToDefault,
    isLoading,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout deve ser usado dentro de um LayoutProvider');
  }
  return context;
}

// Hook para acessar apenas o tema atual
export function useTheme() {
  const { currentLayout } = useLayout();
  return currentLayout.theme;
}

// Hook para acessar apenas a configuração de componentes
export function useLayoutComponents() {
  const { currentLayout } = useLayout();
  return currentLayout.components;
}