/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    // Removendo a opção inválida
  },
  eslint: {
    // Desabilitar ESLint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desabilitar verificação de tipos durante o build
    ignoreBuildErrors: true,
  },
  // Configurações para permitir imagens de domínios externos
  images: {
    domains: ['localhost', 'digimenu.net.br'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  // Configuração para lidar com erros de CORS
  rewrites: async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const apiUrl = isProduction 
      ? process.env.NEXT_PUBLIC_API_BASE_URL || 'https://digimenu.net.br'
      : 'http://localhost';
    
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      }
    ];
  },
  // Configuração para o Netlify
  output: 'standalone',
  // Desabilitar a compressão de imagens para evitar problemas no Netlify
  swcMinify: true,
  // Configuração para melhorar a compatibilidade com o Netlify
  trailingSlash: false,
  // Configuração para melhorar o desempenho
  poweredByHeader: false,
  // Configuração para melhorar a compatibilidade com o Netlify
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 