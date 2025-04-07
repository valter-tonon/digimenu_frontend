# Resumo das Alterações para Deploy no Netlify

Este documento resume as alterações feitas para resolver o problema de deploy no Netlify.

## Problema Encontrado

O deploy no Netlify estava falhando com o seguinte erro:
```
Failed during stage 'building site': Build script returned non-zero exit code: 2
Deploy did not succeed: Deploy directory 'dist' does not exist
```

O problema ocorreu porque o Netlify estava procurando pelo diretório `dist`, mas o Next.js usa `.next` como diretório de build.

## Soluções Implementadas

### 1. Configuração do Netlify

Criamos o arquivo `netlify.toml` com as seguintes configurações:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_USE_NETLIFY_EDGE = "true"
  NODE_VERSION = "18"
```

### 2. Adição do Plugin do Next.js

Adicionamos o plugin oficial do Netlify para Next.js como dependência de desenvolvimento:
```bash
npm install -D @netlify/plugin-nextjs
```

### 3. Configuração da Versão do Node.js

Criamos o arquivo `.nvmrc` para especificar a versão do Node.js:
```
18
```

### 4. Configuração de Redirecionamentos

Criamos o arquivo `public/_redirects` para garantir que as rotas do Next.js funcionem corretamente:
```
/*    /index.html   200
```

### 5. Atualização do Next.js Config

Atualizamos o arquivo `next.config.js` para incluir configurações específicas para o Netlify:
```javascript
// Configurações para permitir imagens de domínios externos
images: {
  domains: ['localhost'],
  unoptimized: process.env.NODE_ENV === 'production',
},
// Configuração para lidar com erros de CORS
rewrites: async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiUrl = isProduction 
    ? process.env.NEXT_PUBLIC_API_URL || 'https://api.seudominio.com'
    : 'http://localhost';
  
  return [
    {
      source: '/api/:path*',
      destination: `${apiUrl}/api/:path*`,
    },
  ];
},
// Configuração para o Netlify
output: 'standalone',
```

### 6. Configuração de Variáveis de Ambiente

Criamos o arquivo `.env.production` com as variáveis de ambiente necessárias para produção:
```
# API Backend - Configuração para produção
NEXT_PUBLIC_API_URL="https://api.seudominio.com/api/v1"
NEXT_PUBLIC_API_BASE_URL="https://api.seudominio.com"

# Ambiente de produção
NODE_ENV="production"

# URL base do frontend
NEXT_PUBLIC_BASE_URL="https://seudominio.netlify.app"
```

### 7. Script de Deploy Automatizado

Criamos o script `deploy-netlify.sh` para facilitar o deploy usando o Netlify CLI:
```bash
# Inicializar um novo site no Netlify (apenas na primeira vez)
./deploy-netlify.sh --init

# Deploy para preview
./deploy-netlify.sh

# Deploy para produção
./deploy-netlify.sh --prod
```

### 8. Documentação de Solução de Problemas

Criamos o arquivo `TROUBLESHOOTING.md` com soluções para problemas comuns que podem ocorrer durante o deploy.

## Próximos Passos

1. Execute o script de deploy para inicializar o site no Netlify:
   ```bash
   chmod +x deploy-netlify.sh
   ./deploy-netlify.sh --init
   ```

2. Configure as variáveis de ambiente no painel do Netlify:
   - `NEXT_PUBLIC_API_URL`: URL da sua API em produção
   - `NEXT_PUBLIC_API_BASE_URL`: URL base do servidor backend

3. Faça o deploy para produção:
   ```bash
   ./deploy-netlify.sh --prod
   ```

4. Verifique se o site está funcionando corretamente no domínio fornecido pelo Netlify.

5. Se necessário, configure um domínio personalizado no painel do Netlify. 