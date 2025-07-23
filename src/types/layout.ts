export interface LayoutTheme {
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
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

export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  theme: LayoutTheme;
  components: {
    header: {
      style: 'default' | 'compact' | 'minimal';
      position: 'sticky' | 'fixed' | 'static';
      showLogo: boolean;
      showSearch: boolean;
    };
    navigation: {
      style: 'tabs' | 'pills' | 'underline';
      position: 'top' | 'side';
      showIcons: boolean;
    };
    productCard: {
      style: 'default' | 'compact' | 'detailed';
      showImage: boolean;
      showDescription: boolean;
      imageAspectRatio: 'square' | 'landscape' | 'portrait';
    };
    cart: {
      style: 'modal' | 'sidebar' | 'floating';
      position: 'right' | 'left' | 'bottom';
      showItemCount: boolean;
      showTotal: boolean;
    };
    layout: {
      maxWidth: string;
      padding: string;
      gap: string;
      columns: {
        mobile: number;
        tablet: number;
        desktop: number;
      };
    };
  };
}

export type LayoutPreset = 'default' | 'compact' | 'modern' | 'minimal' | 'classic';

export interface LayoutContextType {
  currentLayout: LayoutConfig;
  availableLayouts: LayoutConfig[];
  setLayout: (layoutId: string) => void;
  updateLayoutConfig: (updates: Partial<LayoutConfig>) => void;
  resetToDefault: () => void;
  isLoading: boolean;
}