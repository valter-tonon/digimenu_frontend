// Test Utilities and Helpers
// This file contains utility functions and custom render methods for testing

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock implementations for common hooks and services
export const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn()
};

export const mockSearchParams = {
  get: vi.fn(),
  getAll: vi.fn(),
  has: vi.fn(),
  keys: vi.fn(),
  values: vi.fn(),
  entries: vi.fn(),
  forEach: vi.fn(),
  toString: vi.fn()
};

// Mock cart store
export const mockCartStore = {
  items: [],
  storeId: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
  tableId: null,
  deliveryMode: true,
  lastUpdated: Date.now(),
  expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  sessionId: null,
  fingerprint: null,
  // Getters
  totalItems: vi.fn(() => 0),
  totalPrice: vi.fn(() => 0),
  itemsCount: vi.fn(() => 0),
  isExpired: vi.fn(() => false),
  // Setters
  setContext: vi.fn(),
  setDeliveryMode: vi.fn(),
  setCartTTL: vi.fn(),
  setSessionData: vi.fn(),
  // Actions
  addItem: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  syncCart: vi.fn(),
  syncWithSession: vi.fn(),
  // Zustand methods
  getState: vi.fn(() => mockCartStore),
  setState: vi.fn(),
  subscribe: vi.fn(),
  destroy: vi.fn(),
};

// Mock app context
export const mockAppContext = {
  data: {
    storeId: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
    tableId: null,
    isDelivery: true,
    storeName: 'Empresa X'
  },
  isLoading: false,
  error: null,
  isValid: true
};

// Mock container DI
export const mockContainer = {
  menuRepository: {
    getMenu: vi.fn().mockResolvedValue({
      categories: [
        { id: 1, name: 'Lanches', slug: 'lanches' }
      ],
      products: [
        {
          id: 1,
          uuid: 'product-uuid-1',
          name: 'X-Bacon',
          description: 'Delicioso hambúrguer com bacon',
          price: 30.00,
          promotional_price: null,
          is_featured: true,
          is_popular: false,
          is_on_promotion: false,
          category_id: 1,
          image: 'http://localhost/storage/test.webp',
          tags: ['picante', 'novo'],
          additionals: []
        }
      ],
      tenant: {
        id: 1,
        uuid: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
        name: 'Empresa X',
        opening_hours: {
          opens_at: '00:00:00',
          closes_at: '23:59:00',
          is_open: true
        },
        min_order_value: 0,
        delivery_fee: 5.00
      }
    })
  }
};

// Mock auth
export const mockAuth = {
  isAuthenticated: false,
  customer: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
};

// Setup global mocks
export const setupMocks = () => {
  // Mock Next.js navigation
  vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => mockSearchParams,
    usePathname: () => '/02efe224-e368-4a7a-a153-5fc49cd9c5ac'
  }));

  // Mock cart store
  vi.mock('@/store/cart-store', () => ({
    useCartStore: () => mockCartStore
  }));

  // Mock app context
  vi.mock('@/hooks/useAppContext', () => ({
    useAppContext: () => mockAppContext
  }));

  // Mock container DI
  vi.mock('@/infrastructure/di', () => ({
    useContainer: () => mockContainer
  }));

  // Mock auth
  vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => mockAuth
  }));

  // Mock API services
  vi.mock('@/services/api', () => ({
    createOrder: vi.fn().mockResolvedValue({
      success: true,
      data: {
        identify: 'order-123',
        status: 'pending',
        total: 35.00
      }
    })
  }));

  // Mock toast
  vi.mock('react-hot-toast', () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
      dismiss: vi.fn()
    }
  }));
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialState, ...renderOptions } = options || {};

  // You can add providers here if needed
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to create mock events
export const createMockEvent = (overrides?: Partial<Event>) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  ...overrides
});

// Helper to create mock form data
export const createMockFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Helper to simulate user interactions
export const userInteractions = {
  clickButton: (buttonText: string) => {
    const button = screen.getByText(buttonText);
    fireEvent.click(button);
    return button;
  },
  
  fillInput: (labelText: string, value: string) => {
    const input = screen.getByLabelText(labelText);
    fireEvent.change(input, { target: { value } });
    return input;
  },
  
  selectOption: (selectText: string, optionText: string) => {
    const select = screen.getByLabelText(selectText);
    fireEvent.change(select, { target: { value: optionText } });
    return select;
  }
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
  
  // Reset mock implementations
  mockRouter.push.mockClear();
  mockRouter.back.mockClear();
  mockCartStore.addItem.mockClear();
  mockCartStore.removeItem.mockClear();
  mockCartStore.clearCart.mockClear();
  mockContainer.menuRepository.getMenu.mockClear();
};

// Helper to create test IDs
export const testIds = {
  productCard: (id: string) => `product-card-${id}`,
  categoryButton: (slug: string) => `category-${slug}`,
  cartButton: 'cart-button',
  checkoutButton: 'checkout-button',
  searchInput: 'search-input',
  filterButton: 'filter-button'
};

// Helper for localStorage mocking
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Helper for sessionStorage mocking
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Setup storage mocks
export const setupStorageMocks = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage
  });
};

// Helper to create mock intersection observer
export const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Helper to create mock resize observer
export const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Setup DOM mocks
export const setupDOMMocks = () => {
  global.IntersectionObserver = mockIntersectionObserver;
  global.ResizeObserver = mockResizeObserver;
  
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Complete test setup
export const setupTestEnvironment = () => {
  setupMocks();
  setupStorageMocks();
  setupDOMMocks();
};

// Export everything
export * from '@testing-library/react';
export { renderWithProviders as render };

export default {
  setupMocks,
  setupTestEnvironment,
  resetAllMocks,
  mockRouter,
  mockCartStore,
  mockAppContext,
  mockContainer,
  mockAuth,
  testIds,
  userInteractions,
  waitForAsync,
  createMockEvent,
  createMockFormData
};