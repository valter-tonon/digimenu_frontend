import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Limpar após cada teste para garantir um ambiente limpo
afterEach(() => {
  cleanup();
}); 