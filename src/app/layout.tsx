import { Header } from '@/components/layout/Header';
import { Providers } from './providers';
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Restaurante App",
  description: "Aplicativo de delivery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning={true}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
