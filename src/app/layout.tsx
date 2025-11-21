import type { Metadata } from 'next';
import './globals.css';
import '../styles/z-index.css';

import { AppProviders } from '@/components/providers/AppProviders';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';
import { SkipToContent } from '@/components/ui/AccessibilityEnhancements';
import { GlobalErrorBoundary } from '@/components/error-boundaries/GlobalErrorBoundary';

export const metadata: Metadata = {
  title: 'DigiMenu - Sistema de Pedidos',
  description: 'Sistema de pedidos para restaurantes e estabelecimentos',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning={true}>
        <SkipToContent />
        <GlobalErrorBoundary>
          <AppProviders>
            <main id="main-content">
              {children}
            </main>
            <CookieConsentBanner />
          </AppProviders>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
