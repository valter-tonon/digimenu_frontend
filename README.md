# Restaurante Delivery - Frontend

Este é o frontend do sistema Restaurante Delivery, desenvolvido com [Next.js](https://nextjs.org).

## Começando

Primeiro, instale as dependências:

```bash
npm install
```

Em seguida, execute o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## Estrutura do Projeto

O projeto segue uma arquitetura limpa com as seguintes camadas:

- **app**: Páginas e rotas da aplicação
- **components**: Componentes reutilizáveis da UI
- **domain**: Entidades e interfaces de domínio
- **infrastructure**: Implementações concretas (repositórios, serviços, etc.)

## Compilação e Implantação

### Método 1: Usando o script de implantação

Você pode usar o script de implantação incluído para compilar e implantar o aplicativo:

```bash
# Tornar o script executável (se ainda não estiver)
chmod +x deploy.sh

# Executar o script de implantação
./deploy.sh

# Para compilar e iniciar o servidor em um único comando
./deploy.sh --start
```

### Método 2: Comandos manuais

Para compilar o aplicativo manualmente:

```bash
# Instalar dependências
npm install

# Compilar o aplicativo
npm run build

# Iniciar o servidor de produção
npm run start
```

### Método 3: Usando Docker

O projeto inclui um Dockerfile para facilitar a implantação em contêineres. Você pode usar o script de implantação com Docker:

```bash
# Tornar o script executável (se ainda não estiver)
chmod +x deploy-docker.sh

# Executar o script de implantação com Docker
./deploy-docker.sh

# Para construir e iniciar o contêiner em um único comando
./deploy-docker.sh --start
```

Ou manualmente:

```bash
# Construir a imagem
docker build -t restaurante-delivery-frontend:latest -f Dockerfile --target production .

# Executar o contêiner
docker run -d -p 3000:3000 --name restaurante-delivery-frontend restaurante-delivery-frontend:latest
```

### Método 4: Usando Docker com Nginx

Para uma implantação mais robusta em produção, você pode usar o Nginx como servidor web para servir o aplicativo Next.js. O projeto inclui um Dockerfile alternativo e configurações do Nginx para isso:

```bash
# Tornar o script executável (se ainda não estiver)
chmod +x deploy-nginx.sh

# Executar o script de implantação com Docker e Nginx
./deploy-nginx.sh

# Para construir e iniciar o contêiner em um único comando
./deploy-nginx.sh --start
```

Ou manualmente:

```bash
# Tornar o script de inicialização executável
chmod +x docker-entrypoint.sh

# Construir a imagem
docker build -t restaurante-delivery-frontend-nginx:latest -f Dockerfile.nginx .

# Executar o contêiner
docker run -d -p 80:80 --name restaurante-delivery-frontend-nginx restaurante-delivery-frontend-nginx:latest
```

Com esta configuração, o aplicativo estará disponível em http://localhost (porta 80).

### Método 5: Deploy no Netlify

O projeto está configurado para ser facilmente implantado no Netlify. Siga estas etapas:

1. **Conecte seu repositório ao Netlify**:
   - Crie uma conta no [Netlify](https://www.netlify.com/)
   - Clique em "New site from Git"
   - Selecione seu provedor Git (GitHub, GitLab, etc.)
   - Selecione o repositório do projeto

2. **Configure as opções de build**:
   - Branch: `main` (ou a branch que você deseja implantar)
   - Comando de build: `npm run build`
   - Diretório de publicação: `.next`

3. **Configure as variáveis de ambiente**:
   - Vá para Site settings > Build & deploy > Environment
   - Adicione as variáveis de ambiente necessárias:
     - `NEXT_PUBLIC_API_URL`: URL da sua API em produção
     - `NEXT_PUBLIC_API_BASE_URL`: URL base do servidor backend
     - `NODE_VERSION`: `18`

4. **Deploy manual**:
   - Se preferir fazer deploy manualmente, você pode usar o Netlify CLI:
   ```bash
   # Instalar o Netlify CLI
   npm install -g netlify-cli
   
   # Login no Netlify
   netlify login
   
   # Deploy do site
   netlify deploy --prod
   ```

O projeto já inclui os arquivos de configuração necessários para o Netlify:
- `netlify.toml`: Configuração do build e plugins
- `.nvmrc`: Especifica a versão do Node.js
- `public/_redirects`: Configuração de redirecionamentos

## Configuração

O aplicativo usa variáveis de ambiente para configuração. Existem três arquivos de configuração:

### `.env.local` (Desenvolvimento local)

```
# API Backend - Configuração para desenvolvimento
NEXT_PUBLIC_API_URL="http://localhost/api/v1"
NEXT_PUBLIC_API_BASE_URL="http://localhost"

# Desativar regras estritas em desenvolvimento
NODE_ENV="development"
```

### `.env.production` (Produção)

```
# API Backend - Configuração para produção
NEXT_PUBLIC_API_URL="https://api.seudominio.com/api/v1"
NEXT_PUBLIC_API_BASE_URL="https://api.seudominio.com"

# Ambiente de produção
NODE_ENV="production"
```

### Variáveis de ambiente necessárias

- `NEXT_PUBLIC_API_URL`: URL base da API do backend
- `NEXT_PUBLIC_API_BASE_URL`: URL base do servidor backend
- `NODE_ENV`: Ambiente de execução (`development` ou `production`)

## Testes

Para executar os testes:

```bash
# Executar testes unitários
npm run test

# Executar testes com interface visual
npm run test:ui

# Verificar cobertura de testes
npm run test:coverage
```
