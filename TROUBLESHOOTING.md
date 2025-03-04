# Solução de Problemas de Deploy

Este documento contém soluções para problemas comuns que podem ocorrer durante o deploy da aplicação.

## Problemas no Deploy do Netlify

### Erro: "Deploy directory 'dist' does not exist"

**Problema**: O Netlify está procurando pelo diretório `dist`, mas o Next.js usa `.next` como diretório de build.

**Solução**:
1. Verifique se o arquivo `netlify.toml` está configurado corretamente:
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

2. Certifique-se de que o plugin do Next.js está instalado:
   ```bash
   npm install -D @netlify/plugin-nextjs
   ```

3. Verifique se o comando de build está correto nas configurações do Netlify.

### Erro: "Failed during stage 'building site': Build script returned non-zero exit code"

**Problema**: O script de build está falhando.

**Solução**:
1. Verifique os logs de build no Netlify para identificar o erro específico.
2. Certifique-se de que todas as dependências estão instaladas:
   ```bash
   npm install
   ```
3. Teste o build localmente para identificar problemas:
   ```bash
   npm run build
   ```
4. Se houver erros de ESLint ou TypeScript, considere desativá-los durante o build (já configurado no `next.config.js`).

### Erro: "Module not found" ou "Cannot find module"

**Problema**: Dependências ausentes ou incompatíveis.

**Solução**:
1. Verifique se todas as dependências estão listadas no `package.json`.
2. Limpe o cache do Netlify e force um novo build.
3. Verifique se a versão do Node.js está correta (definida como 18 no `.nvmrc`).

### Erro: "API routes not working" ou "404 on API routes"

**Problema**: As rotas da API não estão funcionando corretamente.

**Solução**:
1. Verifique se o plugin do Next.js está configurado corretamente.
2. Certifique-se de que as variáveis de ambiente para a API estão definidas corretamente.
3. Verifique se o arquivo `next.config.js` tem a configuração de `rewrites` correta.

### Erro: "Images not loading" ou "Error with next/image"

**Problema**: Imagens não estão carregando corretamente.

**Solução**:
1. Verifique se a configuração de imagens no `next.config.js` está correta:
   ```javascript
   images: {
     domains: ['localhost', 'seu-dominio-de-imagens.com'],
     unoptimized: process.env.NODE_ENV === 'production',
   },
   ```
2. Para o Netlify, é recomendável usar `unoptimized: true` em produção.

## Problemas Gerais

### Erro: "CORS issues" ou "No 'Access-Control-Allow-Origin' header"

**Problema**: Problemas de CORS ao acessar a API.

**Solução**:
1. Verifique se a API está configurada para permitir solicitações do domínio do Netlify.
2. Certifique-se de que a configuração de `rewrites` no `next.config.js` está correta.
3. Se necessário, use um proxy para contornar problemas de CORS.

### Erro: "Environment variables not working"

**Problema**: Variáveis de ambiente não estão sendo carregadas corretamente.

**Solução**:
1. Certifique-se de que as variáveis de ambiente estão definidas no painel do Netlify.
2. Verifique se as variáveis de ambiente públicas começam com `NEXT_PUBLIC_`.
3. Teste localmente com um arquivo `.env.local` para verificar se a aplicação funciona corretamente.

## Contato para Suporte

Se você encontrar problemas que não estão listados aqui, entre em contato com a equipe de desenvolvimento em [suporte@seudominio.com](mailto:suporte@seudominio.com). 