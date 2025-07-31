import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupTestEnvironment, resetAllMocks } from './helpers/test-utils';

// Limpar após cada teste para garantir um ambiente limpo
afterEach(() => {
  cleanup();
  resetAllMocks();
});

// Setup global mocks
beforeAll(() => {
  // Setup complete test environment
  setupTestEnvironment();

  // Mock fetch
  global.fetch = vi.fn();

  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
}); 