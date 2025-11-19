'use client';

import CheckoutWizard from './components/CheckoutWizard';

/**
 * Página de checkout refatorada
 *
 * ANTES: Múltiplas rotas
 * - /checkout/authentication
 * - /checkout/customer-data
 * - /checkout/address
 * - /checkout/payment
 * - /checkout/confirmation
 *
 * DEPOIS: Única rota com State Machine
 * Esta página renderiza CheckoutWizard que gerencia todos os steps
 */
export default function CheckoutPage() {
  return <CheckoutWizard />;
}