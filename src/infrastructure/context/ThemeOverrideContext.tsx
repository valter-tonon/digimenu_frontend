'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LayoutConfig } from '@/types/layout';
import { useLayout } from './LayoutContext';

// Interface para definir overrides específicos por loja
export interface ThemeOverrides {
  storeId: string;
  overrides: Partial<LayoutConfig>;
  components?: {
    [key: string]: {
      component: React.ComponentType<any>;
      props?: Record<string, any>;
    };
  };
}

interface ThemeOverrideContextType {
  overrides: ThemeOverrides | null;
  setOverrides: (storeId: string, overrides: Partial<LayoutConfig>) => void;
  clearOverrides: () => void;
  getComponentOverride: <T>(componentName: string) => {
    Component: React.ComponentType<T> | null;
    props: Record<string, any>;
  };
}

const ThemeOverrideContext = createContext<ThemeOverrideContextType | undefined>(undefined);

interface ThemeOverrideProviderProps {
  children: ReactNode;
  storeId: string;
}

export function ThemeOverrideProvider({ children, storeId }: ThemeOverrideProviderProps) {
  const { currentLayout, updateLayoutConfig } = useLayout();
  const [overrides, setOverridesState] = useState<ThemeOverrides | null>(null);

  // Carregar overrides do localStorage
  useEffect(() => {
    if (!storeId) return;

    try {
      const savedOverrides = localStorage.getItem(`digimenu_theme_overrides_${storeId}`);
      if (savedOverrides) {
        const parsedOverrides = JSON.parse(savedOverrides);
        setOverridesState(parsedOverrides);
        
        // Aplicar overrides ao layout atual
        if (parsedOverrides.overrides) {
          updateLayoutConfig(parsedOverrides.overrides);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar overrides de tema:', error);
    }
  }, [storeId, updateLayoutConfig]);

  // Função para definir overrides
  const setOverrides = (storeId: string, newOverrides: Partial<LayoutConfig>) => {
    const themeOverrides: ThemeOverrides = {
      storeId,
      overrides: newOverrides,
    };

    setOverridesState(themeOverrides);
    
    // Aplicar overrides ao layout atual
    updateLayoutConfig(newOverrides);
    
    // Salvar no localStorage
    try {
      localStorage.setItem(`digimenu_theme_overrides_${storeId}`, JSON.stringify(themeOverrides));
    } catch (error) {
      console.error('Erro ao salvar overrides de tema:', error);
    }
  };

  // Função para limpar overrides
  const clearOverrides = () => {
    setOverridesState(null);
    
    // Remover do localStorage
    if (storeId) {
      localStorage.removeItem(`digimenu_theme_overrides_${storeId}`);
    }
  };

  // Função para obter override de componente
  const getComponentOverride = <T,>(componentName: string) => {
    if (!overrides || !overrides.components || !overrides.components[componentName]) {
      return {
        Component: null,
        props: {},
      };
    }

    const override = overrides.components[componentName];
    return {
      Component: override.component as React.ComponentType<T>,
      props: override.props || {},
    };
  };

  const contextValue: ThemeOverrideContextType = {
    overrides,
    setOverrides,
    clearOverrides,
    getComponentOverride,
  };

  return (
    <ThemeOverrideContext.Provider value={contextValue}>
      {children}
    </ThemeOverrideContext.Provider>
  );
}

export function useThemeOverride() {
  const context = useContext(ThemeOverrideContext);
  if (context === undefined) {
    throw new Error('useThemeOverride deve ser usado dentro de um ThemeOverrideProvider');
  }
  return context;
}

// Hook para criar componentes com suporte a override
export function withThemeOverride<T>(
  componentName: string,
  DefaultComponent: React.ComponentType<T>
) {
  return function OverridableComponent(props: T) {
    const { getComponentOverride } = useThemeOverride();
    const { Component: OverrideComponent, props: overrideProps } = getComponentOverride<T>(componentName);

    if (OverrideComponent) {
      return <OverrideComponent {...props} {...overrideProps} />;
    }

    return <DefaultComponent {...props} />;
  };
}