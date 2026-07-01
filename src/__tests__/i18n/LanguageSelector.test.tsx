import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import i18n from '@/i18n/config';

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

describe('LanguageSelector', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    localStorage.clear();
  });

  it('mostra apenas os idiomas disponíveis e troca ao selecionar', () => {
    render(<LanguageSelector available={['pt-BR', 'es']} primary="pt-BR" />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(['pt-BR', 'es']); // 'en' NÃO aparece

    fireEvent.change(select, { target: { value: 'es' } });
    expect(localStorage.getItem('dm-locale')).toBe('es');
    expect(i18n.language).toBe('es');
  });

  it('não renderiza com um único idioma', () => {
    const { container } = render(<LanguageSelector available={['pt-BR']} primary="pt-BR" />);
    expect(container.firstChild).toBeNull();
  });
});
