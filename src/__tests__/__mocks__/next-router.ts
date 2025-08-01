import { vi } from 'vitest';

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/menu',
  route: '/menu',
  query: {},
  asPath: '/menu',
  basePath: '',
  isLocaleDomain: true,
  isReady: true,
  isPreview: false,
  isFallback: false,
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

export const useRouter = vi.fn(() => mockRouter);
export const usePathname = vi.fn(() => '/menu');
export const useSearchParams = vi.fn(() => new URLSearchParams());