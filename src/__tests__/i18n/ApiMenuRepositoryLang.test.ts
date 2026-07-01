import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn().mockResolvedValue({
  data: { categories: [], products: [], locales: { available: ['pt-BR'], primary: 'pt-BR' } },
});

vi.mock('@/infrastructure/api/apiClient', () => ({
  apiClient: { get: (url: string, config: any) => getMock(url, config) },
}));

vi.mock('@/i18n/config', () => ({
  default: { language: 'es' },
  SUPPORTED_LOCALES: ['pt-BR', 'es', 'en'],
}));

import { ApiMenuRepository } from '@/infrastructure/repositories/ApiMenuRepository';

describe('ApiMenuRepository lang', () => {
  beforeEach(() => getMock.mockClear());

  it('envia o locale atual como param lang', async () => {
    const repo = new ApiMenuRepository();
    await repo.getMenu({ store: 'abc' });

    const [, config] = getMock.mock.calls[0];
    expect(config.params.lang).toBe('es');
  });

  it('surface os locales retornados pela API', async () => {
    const repo = new ApiMenuRepository();
    const result = await repo.getMenu({ store: 'abc' });
    expect(result.locales?.primary).toBe('pt-BR');
    expect(result.locales?.available).toEqual(['pt-BR']);
  });
});
