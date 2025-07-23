import { LayoutConfig } from '@/types/layout';

// Layout padrão (atual)
export const defaultLayout: LayoutConfig = {
  id: 'default',
  name: 'Layout Padrão',
  description: 'Layout tradicional com todas as funcionalidades',
  theme: {
    colors: {
      primary: '#f59e0b', // amber-500
      primaryHover: '#d97706', // amber-600
      secondary: '#374151', // gray-700
      accent: '#10b981', // emerald-500
      background: '#f9fafb', // gray-50
      surface: '#ffffff',
      text: {
        primary: '#111827', // gray-900
        secondary: '#374151', // gray-700
        muted: '#6b7280', // gray-500
      },
      border: '#e5e7eb', // gray-200
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
    typography: {
      fontFamily: {
        sans: 'Inter, system-ui, sans-serif',
        serif: 'Georgia, serif',
        mono: 'Monaco, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
  components: {
    header: {
      style: 'default',
      position: 'sticky',
      showLogo: true,
      showSearch: true,
    },
    navigation: {
      style: 'tabs',
      position: 'top',
      showIcons: true,
    },
    productCard: {
      style: 'default',
      showImage: true,
      showDescription: true,
      imageAspectRatio: 'landscape',
    },
    cart: {
      style: 'floating',
      position: 'right',
      showItemCount: true,
      showTotal: true,
    },
    layout: {
      maxWidth: '1200px',
      padding: '1rem',
      gap: '1.5rem',
      columns: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
      },
    },
  },
};

// Layout compacto
export const compactLayout: LayoutConfig = {
  ...defaultLayout,
  id: 'compact',
  name: 'Layout Compacto',
  description: 'Layout otimizado para menus menores com menos espaçamento',
  theme: {
    ...defaultLayout.theme,
    spacing: {
      xs: '0.125rem',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      xxl: '1.5rem',
    },
  },
  components: {
    ...defaultLayout.components,
    header: {
      ...defaultLayout.components.header,
      style: 'compact',
    },
    productCard: {
      ...defaultLayout.components.productCard,
      style: 'compact',
      showDescription: false,
      imageAspectRatio: 'square',
    },
    layout: {
      ...defaultLayout.components.layout,
      padding: '0.5rem',
      gap: '0.75rem',
      columns: {
        mobile: 2,
        tablet: 3,
        desktop: 4,
      },
    },
  },
};

// Layout moderno
export const modernLayout: LayoutConfig = {
  ...defaultLayout,
  id: 'modern',
  name: 'Layout Moderno',
  description: 'Design moderno com bordas arredondadas e sombras suaves',
  theme: {
    ...defaultLayout.theme,
    colors: {
      ...defaultLayout.theme.colors,
      primary: '#6366f1', // indigo-500
      primaryHover: '#4f46e5', // indigo-600
      accent: '#ec4899', // pink-500
    },
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    },
  },
  components: {
    ...defaultLayout.components,
    productCard: {
      ...defaultLayout.components.productCard,
      style: 'detailed',
      imageAspectRatio: 'portrait',
    },
    cart: {
      ...defaultLayout.components.cart,
      style: 'sidebar',
    },
  },
};

// Layout minimalista
export const minimalLayout: LayoutConfig = {
  ...defaultLayout,
  id: 'minimal',
  name: 'Layout Minimalista',
  description: 'Design limpo e minimalista com foco no conteúdo',
  theme: {
    ...defaultLayout.theme,
    colors: {
      ...defaultLayout.theme.colors,
      primary: '#000000',
      primaryHover: '#374151',
      secondary: '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      lg: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      xl: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
  },
  components: {
    ...defaultLayout.components,
    header: {
      ...defaultLayout.components.header,
      style: 'minimal',
    },
    navigation: {
      ...defaultLayout.components.navigation,
      style: 'underline',
      showIcons: false,
    },
    productCard: {
      ...defaultLayout.components.productCard,
      style: 'compact',
      showDescription: false,
    },
    cart: {
      ...defaultLayout.components.cart,
      style: 'modal',
    },
  },
};

// Layout clássico
export const classicLayout: LayoutConfig = {
  ...defaultLayout,
  id: 'classic',
  name: 'Layout Clássico',
  description: 'Design tradicional com elementos clássicos',
  theme: {
    ...defaultLayout.theme,
    colors: {
      ...defaultLayout.theme.colors,
      primary: '#dc2626', // red-600
      primaryHover: '#b91c1c', // red-700
      secondary: '#92400e', // amber-800
      accent: '#059669', // emerald-600
    },
    typography: {
      ...defaultLayout.theme.typography,
      fontFamily: {
        sans: 'Georgia, serif',
        serif: 'Georgia, serif',
        mono: 'Monaco, monospace',
      },
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      xl: '0.5rem',
      full: '9999px',
    },
  },
  components: {
    ...defaultLayout.components,
    navigation: {
      ...defaultLayout.components.navigation,
      style: 'pills',
    },
    productCard: {
      ...defaultLayout.components.productCard,
      style: 'detailed',
    },
  },
};

export const availableLayouts: LayoutConfig[] = [
  defaultLayout,
  compactLayout,
  modernLayout,
  minimalLayout,
  classicLayout,
];

export const getLayoutById = (id: string): LayoutConfig | undefined => {
  return availableLayouts.find(layout => layout.id === id);
};

export const getDefaultLayout = (): LayoutConfig => defaultLayout;