# WhatsApp Authentication Service

Este documento descreve como usar o serviço de autenticação via WhatsApp com magic links.

## Visão Geral

O `WhatsAppAuthService` implementa autenticação via magic links enviados pelo WhatsApp, com:
- Armazenamento de JWT no localStorage
- Auto-refresh automático de tokens
- Retry logic para requisições
- Tratamento de erros robusto

## Uso Básico

### 1. Importar o serviço

```typescript
import { whatsappAuthService } from '@/services/whatsappAuth';
import { useWhatsAppAuth } from '@/hooks/use-whatsapp-auth';
```

### 2. Usar o hook (recomendado)

```typescript
const MyComponent = () => {
  const { state, requestMagicLink, verifyToken, validateStoredAuth, logout } = useWhatsAppAuth();

  const handleAuth = async () => {
    await requestMagicLink('5511999999999', 'tenant123');
  };

  return (
    <div>
      {state.isAuthenticated ? (
        <p>Olá, {state.user?.name}!</p>
      ) : (
        <button onClick={handleAuth}>
          Entrar com WhatsApp
        </button>
      )}
    </div>
  );
};
```

### 3. Usar o serviço diretamente

```typescript
// Solicitar magic link
const response = await whatsappAuthService.requestMagicLink('5511999999999', 'tenant123');
if (response.success) {
  console.log('Link enviado!');
}

// Verificar token (geralmente feito automaticamente via URL)
const verification = await whatsappAuthService.verifyToken('token-from-url');
if (verification.success) {
  console.log('Autenticado!', verification.user);
}

// Verificar se há autenticação válida armazenada
const isValid = await whatsappAuthService.validateStoredJWT();
if (isValid) {
  const user = whatsappAuthService.getAuthenticatedUser();
  console.log('Usuário autenticado:', user);
}
```

## API do Serviço

### Métodos Principais

#### `requestMagicLink(phone: string, tenantId: string)`
Solicita o envio de um magic link via WhatsApp.

**Parâmetros:**
- `phone`: Número de telefone (formato brasileiro)
- `tenantId`: ID do tenant/loja

**Retorna:**
```typescript
{
  success: boolean;
  message: string;
  expiresAt?: Date;
}
```

#### `verifyToken(token: string)`
Verifica um token de magic link e autentica o usuário.

**Parâmetros:**
- `token`: Token recebido via URL do magic link

**Retorna:**
```typescript
{
  success: boolean;
  jwt?: string;
  user?: User;
  message?: string;
}
```

#### `validateStoredJWT()`
Valida o JWT armazenado no localStorage.

**Retorna:** `Promise<boolean>`

#### `clearAuth()`
Limpa a autenticação armazenada.

#### `isAuthenticated()`
Verifica se o usuário está autenticado (sem fazer requisição).

**Retorna:** `boolean`

#### `getAuthenticatedUser()`
Obtém os dados do usuário autenticado.

**Retorna:** `User | null`

#### `getCurrentJWT()`
Obtém o JWT atual.

**Retorna:** `string | null`

## Hook useWhatsAppAuth

### Estado

```typescript
interface WhatsAppAuthState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  expiresAt: Date | null;
  isAuthenticated: boolean;
  user: User | null;
}
```

### Métodos

- `requestMagicLink(phone, tenantId)`: Solicita magic link
- `verifyToken(token)`: Verifica token
- `validateStoredAuth()`: Valida auth armazenada
- `logout()`: Faz logout
- `reset()`: Reseta o estado

## Funcionalidades Avançadas

### Auto-refresh de JWT
O serviço automaticamente renova o JWT quando está próximo do vencimento (30 minutos antes).

### Retry Logic
Todas as requisições têm retry automático (até 3 tentativas) em caso de falha de rede.

### Tratamento de Erros
Erros são capturados e tratados adequadamente, com mensagens amigáveis para o usuário.

### Integração com Sistema de Auth Existente
O serviço se integra automaticamente com o hook `useAuth` existente, mantendo compatibilidade.

## Exemplo Completo

Veja o arquivo `frontend/src/components/auth/WhatsAppAuthExample.tsx` para um exemplo completo de uso.

## Configuração

### Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost/api/v1
```

### Endpoints Backend Necessários

- `POST /auth/whatsapp/request` - Solicitar magic link
- `GET /auth/whatsapp/verify/{token}` - Verificar token
- `POST /auth/token/validate` - Validar JWT
- `POST /auth/token/refresh` - Renovar JWT

## Tipos TypeScript

```typescript
interface User {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  tenant_id: string;
}

interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nbf: number;
  jti: string;
  user: User;
  permissions: string[];
  auth_method: string;
}
```

## Segurança

- JWTs são armazenados de forma segura no localStorage
- Auto-refresh previne expiração inesperada
- Tokens são validados no backend
- Rate limiting é implementado no backend
- Logs de auditoria são mantidos