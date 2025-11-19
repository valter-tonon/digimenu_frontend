'use client';

import CheckoutWizard from '../components/CheckoutWizard';

/**
 * Catch-all route for /checkout/*
 * Ensures that sub-paths like /checkout/authentication don't match the /:storeId/:tableId route
 * All internal navigation is handled by CheckoutWizard's state machine
 */
export default function CheckoutCatchAllPage() {
  return <CheckoutWizard />;
}
