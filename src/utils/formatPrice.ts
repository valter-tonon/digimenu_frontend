/**
 * Formata um valor em formato de preço
 * @param price Valor a ser formatado
 * @returns String formatada com duas casas decimais
 */
export function formatPrice(price: any): string {
  // Se for null ou undefined, retorna "0.00"
  if (price == null) return "0.00";
  
  // Tenta converter para número
  const numPrice = typeof price === 'number' ? price : Number(price);
  
  // Verifica se é um número válido
  if (isNaN(numPrice)) return "0.00";
  
  // Formata o número com 2 casas decimais
  return numPrice.toFixed(2);
} 