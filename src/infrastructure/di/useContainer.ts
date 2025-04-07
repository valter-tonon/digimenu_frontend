import { container, DIContainer } from './container';

/**
 * Hook para acessar o container de injeção de dependências
 * @returns O container de dependências
 */
export function useContainer(): DIContainer {
  return container;
}

/**
 * Função para acessar o container de injeção de dependências
 * Útil para contextos onde hooks não podem ser usados
 * @returns O container de dependências
 */
export function getContainer(): DIContainer {
  return container;
} 