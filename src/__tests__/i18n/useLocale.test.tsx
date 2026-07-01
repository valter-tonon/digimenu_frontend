import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocale } from '@/hooks/useLocale';

// O setup global substitui window.localStorage por mocks sem estado.
// Aqui instalamos um localStorage em memória para validar a persistência real.
function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  });
}

describe('useLocale', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    localStorage.clear();
  });

  it('resolveInitial prioriza persistido, depois navegador, depois primary', () => {
    const { result } = renderHook(() => useLocale());

    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES');
    expect(result.current.resolveInitial(['pt-BR', 'es'], 'pt-BR')).toBe('es');

    vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    expect(result.current.resolveInitial(['pt-BR', 'es'], 'pt-BR')).toBe('pt-BR');
  });

  it('resolveInitial usa o valor persistido quando permitido', () => {
    localStorage.setItem('dm-locale', 'es');
    const { result } = renderHook(() => useLocale());
    expect(result.current.resolveInitial(['pt-BR', 'es'], 'pt-BR')).toBe('es');
  });

  it('setLocale persiste em localStorage', () => {
    const { result } = renderHook(() => useLocale());
    act(() => result.current.setLocale('es'));
    expect(localStorage.getItem('dm-locale')).toBe('es');
    expect(result.current.locale).toBe('es');
  });
});
