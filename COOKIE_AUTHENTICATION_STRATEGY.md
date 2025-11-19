# Estratégia de Autenticação com Cookies Persistentes

## 📋 Resumo

Ao salvar o JWT em cookies, podemos configurá-los para **persistir no dispositivo** e manter o usuário autenticado por um período determinado, evitando reautenticação frequente.

## 🍪 Tipos de Cookies

### 1. **Cookie de Sessão** (Não Persiste)
- Expira quando o navegador é fechado
- Não mantém autenticação entre sessões
- **Não recomendado** para este caso

### 2. **Cookie Persistente** (Recomendado)
- Expira em uma data específica ou após X dias
- Mantém autenticação mesmo após fechar o navegador
- **Recomendado** para melhor UX

## ⚙️ Configuração de Cookies Persistentes

### Opção 1: Cookie com MaxAge (Duração em Segundos)

```typescript
// Frontend - Ao autenticar com sucesso
document.cookie = `whatsapp_auth_jwt=${jwt}; max-age=${7 * 24 * 60 * 60}; path=/; secure; samesite=strict`;

// max-age = 7 dias em segundos (604800)
// path = / (disponível em todo o site)
// secure = apenas HTTPS
// samesite = proteção CSRF
```

### Opção 2: Cookie com Expires (Data Específica)

```typescript
// Frontend - Ao autenticar com sucesso
const expiresDate = new Date();
expiresDate.setDate(expiresDate.getDate() + 7); // 7 dias

document.cookie = `whatsapp_auth_jwt=${jwt}; expires=${expiresDate.toUTCString()}; path=/; secure; samesite=strict`;
```

### Opção 3: Cookie HttpOnly (Mais Seguro - Requer API Route)

**Backend (Laravel):**
```php
// Ao autenticar com sucesso
return response()->json([
    'success' => true,
    'token' => $jwt,
    'user' => $user
])->cookie('whatsapp_auth_jwt', $jwt, 60 * 24 * 7, '/', null, true, true);
//                                                      ↑    ↑   ↑   ↑
//                                                      |    |   |   httpOnly
//                                                      |    |   secure
//                                                      |    domain
//                                                      path
//                                                      minutos (7 dias)
```

**Frontend (Next.js API Route):**
```typescript
// app/api/auth/set-cookie/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json();
  
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('whatsapp_auth_jwt', token, {
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: true // Protege contra XSS
  });
  
  return response;
}
```

## 🔄 Duração Recomendada

### Baseado no JWT Atual (24 horas)

O JWT atual expira em **24 horas** (configurado em `config/jwt.php`):

```php
'ttl' => config('jwt.ttl', 1440), // 24 horas em minutos
```

### Estratégias de Duração

#### **Opção A: Cookie = Duração do JWT (24 horas)**
- Cookie expira junto com o JWT
- Usuário precisa reautenticar a cada 24 horas
- **Mais seguro**, mas menos conveniente

#### **Opção B: Cookie > Duração do JWT (7-30 dias)**
- Cookie persiste por 7-30 dias
- JWT expira em 24 horas, mas pode ser renovado automaticamente
- **Melhor UX**, requer implementação de refresh token

#### **Opção C: Cookie Longo + Refresh Automático (Recomendado)**
- Cookie persiste por 30 dias
- JWT expira em 24 horas
- Sistema renova JWT automaticamente quando próximo do vencimento
- **Melhor equilíbrio** entre segurança e UX

## 🎯 Implementação Recomendada

### Estratégia Híbrida: Cookie + Refresh Automático

```typescript
// services/whatsappAuth.ts

class WhatsAppAuthService {
  private readonly COOKIE_NAME = 'whatsapp_auth_jwt';
  private readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 dias
  private readonly JWT_REFRESH_THRESHOLD = 60 * 60; // 1 hora antes de expirar

  /**
   * Armazena JWT em cookie persistente
   */
  private async storeJWTInCookie(jwt: string, user: User): Promise<void> {
    if (typeof window === 'undefined') return;

    // Decodifica JWT para obter expiração
    const payload = this.decodeJWTPayload(jwt);
    const expiresAt = new Date(payload.exp * 1000);
    
    // Calcula dias até expiração do JWT
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    // Cookie expira em 30 dias OU quando JWT expirar (o que for menor)
    const cookieMaxAge = Math.min(
      this.COOKIE_MAX_AGE,
      daysUntilExpiry * 24 * 60 * 60
    );

    // Armazena em cookie
    document.cookie = `${this.COOKIE_NAME}=${jwt}; max-age=${cookieMaxAge}; path=/; secure; samesite=strict`;
    
    // Também armazena em localStorage como backup
    localStorage.setItem(this.JWT_STORAGE_KEY, JSON.stringify({
      jwt,
      user,
      expiresAt: expiresAt.toISOString()
    }));

    // Agenda refresh automático
    this.scheduleAutoRefresh(jwt, expiresAt);
  }

  /**
   * Agenda refresh automático do JWT
   */
  private scheduleAutoRefresh(jwt: string, expiresAt: Date): void {
    const now = Date.now();
    const expiryTime = expiresAt.getTime();
    const timeUntilExpiry = expiryTime - now;
    const refreshTime = timeUntilExpiry - (this.JWT_REFRESH_THRESHOLD * 1000);

    if (refreshTime > 0) {
      setTimeout(async () => {
        await this.refreshJWT();
      }, refreshTime);
    }
  }

  /**
   * Renova JWT automaticamente
   */
  private async refreshJWT(): Promise<boolean> {
    try {
      const currentJWT = this.getCurrentJWT();
      if (!currentJWT) return false;

      const response = await axios.post(
        `${this.API_BASE}/auth/whatsapp-magic/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${currentJWT}` }
        }
      );

      if (response.data.success && response.data.jwt) {
        const user = this.getAuthenticatedUser();
        await this.storeJWTInCookie(response.data.jwt, user!);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao renovar JWT:', error);
      return false;
    }
  }

  /**
   * Verifica se há token válido no cookie
   */
  getCurrentJWT(): string | null {
    if (typeof window === 'undefined') return null;

    // Tenta obter do cookie primeiro
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${this.COOKIE_NAME}=`));
    
    if (cookie) {
      const jwt = cookie.split('=')[1];
      if (this.isJWTValid(jwt)) {
        return jwt;
      }
    }

    // Fallback para localStorage
    const storedAuth = this.getStoredAuth();
    if (storedAuth && this.isJWTValid(storedAuth.jwt)) {
      return storedAuth.jwt;
    }

    return null;
  }

  /**
   * Verifica se JWT é válido (não expirado)
   */
  private isJWTValid(jwt: string): boolean {
    try {
      const payload = this.decodeJWTPayload(jwt);
      const expiresAt = new Date(payload.exp * 1000);
      return Date.now() < expiresAt.getTime();
    } catch {
      return false;
    }
  }
}
```

## 🔒 Segurança

### Configurações de Segurança do Cookie

```typescript
{
  httpOnly: true,        // JavaScript não pode acessar (protege contra XSS)
  secure: true,          // Apenas HTTPS (produção)
  sameSite: 'strict',    // Protege contra CSRF
  path: '/',            // Disponível em todo o site
  maxAge: 2592000       // 30 dias em segundos
}
```

### Considerações

1. **httpOnly**: Previne acesso via JavaScript (mais seguro)
   - **Pro**: Protege contra XSS
   - **Contra**: Frontend não pode ler diretamente (requer API route)

2. **secure**: Apenas HTTPS
   - **Obrigatório** em produção
   - **Opcional** em desenvolvimento

3. **sameSite**: Proteção CSRF
   - `strict`: Mais seguro, bloqueia requisições cross-site
   - `lax`: Permite navegação normal, bloqueia POST cross-site
   - `none`: Menos seguro, permite tudo (requer secure)

## 📊 Comparação: localStorage vs Cookie

| Característica | localStorage | Cookie Persistente |
|---------------|-------------|-------------------|
| **Persistência** | ✅ Sim | ✅ Sim |
| **Acessível via JS** | ✅ Sim | ❌ Não (httpOnly) |
| **Enviado automaticamente** | ❌ Não | ✅ Sim |
| **Segurança XSS** | ❌ Vulnerável | ✅ Protegido (httpOnly) |
| **Tamanho máximo** | ~5-10MB | ~4KB |
| **Middleware pode ler** | ❌ Não | ✅ Sim |
| **Expiração** | Manual | Automática |

## ✅ Recomendação Final

### Para este projeto, recomendo:

1. **Cookie Persistente de 30 dias** com refresh automático
2. **httpOnly = true** para segurança máxima
3. **Backup em localStorage** para compatibilidade
4. **Refresh automático** 1 hora antes do JWT expirar
5. **Middleware verifica cookie** para proteção de rotas

### Fluxo:

```
Usuário autentica
  ↓
JWT salvo em cookie (30 dias) + localStorage (backup)
  ↓
Usuário fecha navegador
  ↓
Usuário abre navegador novamente
  ↓
Middleware verifica cookie
  ↓
Se válido → Continua autenticado
Se próximo de expirar → Renova automaticamente
Se expirado → Redireciona para autenticação
```

## 🚀 Próximos Passos

1. Modificar `whatsappAuthService` para usar cookies
2. Criar API route para setar cookie httpOnly (se necessário)
3. Atualizar middleware para verificar cookie
4. Implementar refresh automático
5. Testar persistência entre sessões

