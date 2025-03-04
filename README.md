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

### Usando Docker

O projeto inclui um Dockerfile para facilitar a implantação em contêineres:

```bash
# Construir a imagem
docker build -t restaurante-delivery-frontend .

# Executar o contêiner
docker run -p 3000:3000 restaurante-delivery-frontend
```

## Configuração

O aplicativo usa variáveis de ambiente para configuração. Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_API_URL=http://localhost/api/v1
```

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
