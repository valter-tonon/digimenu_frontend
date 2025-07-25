# Pendências do Backend - Sistema de Pedidos com Usuário Visitante

## Visão Geral

Este documento especifica todos os endpoints, modelos de dados e configurações necessárias no backend para suportar o sistema de pedidos com usuário visitante implementado no frontend.

## Endpoints Necessários

### 1. Autenticação e Sessões

#### POST /api/auth/whatsapp/request
Solicita magic link via WhatsApp

**Request:**
```json
{
  "phone": "+5511999999999",
  "storeId": "store_123",
  "fingerprint": "fp_hash_123",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Link enviado via WhatsApp",
  "tokenId": "token_123",
  "expiresAt": "2024-01-15T11:00:00Z",
  "rateLimitRemaining": 2
}
```

#### POST /api/auth/whatsapp/validate
Valida token de magic link

**Request:**
```json
{
  "token": "jwt_token_string"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_123",
  "customerId": "customer_456",
  "message": "Token válido"
}
```

#### POST /api/sessions
Cria nova sessão contextual

**Request:**
```json
{
  "storeId": "store_123",
  "fingerprint": "fp_hash_123",
  "type": "table|delivery",
  "tableId": "table_5",
  "isDelivery": false,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "customerId": "customer_456"
}
```

**Response:**
```json
{
  "id": "session_123",
  "storeId": "store_123",
  "fingerprint": "fp_hash_123",
  "isAuthenticated": false,
  "customerId": null,
  "context": {
    "type": "table",
    "tableId": "table_5",
    "isDelivery": false
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "lastActivity": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-15T14:00:00Z"
}
```

#### GET /api/sessions/:sessionId
Obtém dados da sessão

#### PUT /api/sessions/:sessionId/activity
Atualiza última atividade da sessão

#### PUT /api/sessions/:sessionId/customer
Associa cliente à sessão

**Request:**
```json
{
  "customerId": "customer_456"
}
```

#### DELETE /api/sessions/:sessionId
Expira sessão

#### GET /api/stores/:storeId/sessions
Lista sessões ativas da loja

### 2. Cadastro Rápido

#### POST /api/customers/quick-register
Cadastra usuário rapidamente no checkout

**Request:**
```json
{
  "name": "João Silva",
  "phone": "+5511999999999",
  "email": "joao@email.com",
  "acceptTerms": true,
  "storeId": "store_123",
  "sessionId": "session_123",
  "fingerprint": "fp_hash_123"
}
```

**Response:**
```json
{
  "success": true,
  "customerId": "customer_456",
  "customer": {
    "id": 456,
    "uuid": "customer_456",
    "name": "João Silva",
    "phone": "+5511999999999",
    "email": "joao@email.com",
    "mobile_phone": "+5511999999999",
    "isQuickRegistered": true,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "message": "Cadastro realizado com sucesso"
}
```

#### GET /api/customers/search
Busca cliente por telefone ou email

**Query Parameters:**
- `phone`: Telefone do cliente
- `email`: Email do cliente

**Response:**
```json
{
  "customer": {
    "id": 456,
    "uuid": "customer_456",
    "name": "João Silva",
    "phone": "+5511999999999",
    "email": "joao@email.com"
  }
}
```

### 3. Validação de Contexto

#### GET /api/stores/:storeId/status
Verifica status da loja

**Response:**
```json
{
  "id": "store_123",
  "name": "Restaurante Demo",
  "status": "open|closed|busy|maintenance",
  "isOpen": true,
  "operatingHours": {
    "seg": { "open": "11:00", "close": "23:00", "isOpen": true },
    "ter": { "open": "11:00", "close": "23:00", "isOpen": true }
  },
  "timezone": "America/Sao_Paulo"
}
```

#### GET /api/stores/:storeId/tables/:tableId/status
Verifica status da mesa

**Response:**
```json
{
  "id": "table_5",
  "storeId": "store_123",
  "number": "5",
  "capacity": 4,
  "isActive": true,
  "isOccupied": false,
  "currentSessions": 2,
  "maxSessions": 10,
  "lastActivity": "2024-01-15T10:30:00Z"
}
```

#### GET /api/stores/:storeId/tables
Lista mesas ativas da loja

**Query Parameters:**
- `active`: true/false (opcional)

#### GET /api/stores/:storeId/delivery-settings
Configurações de delivery da loja

**Response:**
```json
{
  "acceptsDelivery": true,
  "deliveryRadius": 10,
  "minimumOrder": 25.00,
  "deliveryFee": 5.00,
  "estimatedTime": 45
}
```

### 4. Configurações da Loja

#### GET /api/stores/:storeId/settings
Obtém configurações da loja

**Response:**
```json
{
  "id": "settings_store_123",
  "storeId": "store_123",
  "quickRegistration": {
    "enabled": true,
    "requirePhone": true,
    "requireName": true,
    "requireEmail": false,
    "allowWhatsAppAuth": true,
    "showTermsCheckbox": true,
    "termsText": "Aceito os termos...",
    "privacyPolicyUrl": "/privacy-policy"
  },
  "authentication": {
    "allowGuestOrders": true,
    "requireAuthForCheckout": false,
    "enableWhatsAppAuth": true,
    "enableQRCodeAccess": true,
    "sessionTimeoutMinutes": {
      "table": 240,
      "delivery": 120
    },
    "maxSessionsPerTable": 10,
    "maxSessionsPerStore": 1000
  },
  "security": {
    "enableFingerprinting": true,
    "enableRateLimit": true,
    "rateLimits": {
      "qrCodePerHour": 10,
      "whatsAppPerDay": 3,
      "whatsAppPerHour": 2,
      "fingerprintPerHour": 100
    },
    "blockSuspiciousActivity": true,
    "enableAuditLogging": true,
    "dataRetentionDays": 30
  },
  "notifications": {
    "enableOrderNotifications": true,
    "enableSecurityAlerts": true,
    "adminEmail": "admin@loja.com",
    "webhookUrl": "https://webhook.url",
    "notificationChannels": {
      "email": true,
      "webhook": false,
      "inApp": true
    }
  },
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

#### PUT /api/stores/:storeId/settings
Atualiza configurações da loja

### 5. Auditoria e Logs

#### POST /api/audit/events
Recebe eventos de auditoria do frontend

**Request:**
```json
{
  "events": [
    {
      "id": "audit_123",
      "type": "session_created",
      "category": "authentication",
      "severity": "info",
      "timestamp": "2024-01-15T10:00:00Z",
      "userId": "customer_456",
      "sessionId": "session_123",
      "fingerprint": "fp_hash_123",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "storeId": "store_123",
      "description": "Nova sessão criada",
      "details": {
        "sessionId": "session_123",
        "storeId": "store_123"
      },
      "source": "frontend",
      "success": true
    }
  ]
}
```

#### GET /api/audit/events
Consulta eventos de auditoria

**Query Parameters:**
- `startDate`: Data inicial (ISO string)
- `endDate`: Data final (ISO string)
- `types`: Tipos de eventos (array)
- `categories`: Categorias (array)
- `severities`: Severidades (array)
- `userId`: ID do usuário
- `sessionId`: ID da sessão
- `storeId`: ID da loja
- `limit`: Limite de resultados (padrão: 100)
- `offset`: Offset para paginação

#### GET /api/audit/statistics
Estatísticas de auditoria

**Query Parameters:**
- `days`: Número de dias (padrão: 30)
- `storeId`: ID da loja (opcional)

### 6. Rate Limiting e Segurança

#### GET /api/security/rate-limits/:identifier
Verifica status de rate limit

**Response:**
```json
{
  "allowed": true,
  "remaining": 8,
  "resetTime": "2024-01-15T11:00:00Z",
  "type": "qr_code"
}
```

#### POST /api/security/block-ip
Bloqueia IP manualmente

**Request:**
```json
{
  "ip": "192.168.1.1",
  "reason": "Atividade suspeita",
  "duration": 3600000,
  "type": "manual"
}
```

#### DELETE /api/security/block-ip/:ip
Desbloqueia IP

#### GET /api/security/blocked-ips
Lista IPs bloqueados

#### GET /api/security/suspicious-activities
Lista atividades suspeitas

**Query Parameters:**
- `resolved`: true/false
- `severity`: low/medium/high/critical
- `limit`: Limite de resultados

#### PUT /api/security/suspicious-activities/:id/resolve
Marca atividade suspeita como resolvida

### 7. Limpeza de Dados

#### POST /api/cleanup/run
Executa limpeza manual de dados

**Request:**
```json
{
  "types": ["expired_sessions", "old_fingerprints", "audit_logs"],
  "storeId": "store_123"
}
```

#### GET /api/cleanup/reports
Relatórios de limpeza

#### GET /api/cleanup/config
Configurações de limpeza

#### PUT /api/cleanup/config
Atualiza configurações de limpeza

## Modelos de Dados

### 1. ContextualSession

```sql
CREATE TABLE contextual_sessions (
  id VARCHAR(255) PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  fingerprint VARCHAR(255) NOT NULL,
  is_authenticated BOOLEAN DEFAULT FALSE,
  customer_id VARCHAR(255) NULL,
  context_type ENUM('table', 'delivery') NOT NULL,
  table_id VARCHAR(255) NULL,
  is_delivery BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  INDEX idx_store_id (store_id),
  INDEX idx_fingerprint (fingerprint),
  INDEX idx_customer_id (customer_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_last_activity (last_activity)
);
```

### 2. WhatsAppTokens

```sql
CREATE TABLE whatsapp_tokens (
  id VARCHAR(255) PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  store_id VARCHAR(255) NOT NULL,
  fingerprint VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  
  INDEX idx_phone (phone),
  INDEX idx_expires_at (expires_at),
  INDEX idx_is_used (is_used)
);
```

### 3. AuditEvents

```sql
CREATE TABLE audit_events (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255) NULL,
  session_id VARCHAR(255) NULL,
  fingerprint VARCHAR(255) NULL,
  ip VARCHAR(45) NULL,
  user_agent TEXT NULL,
  store_id VARCHAR(255) NULL,
  description TEXT NOT NULL,
  details JSON NULL,
  source VARCHAR(50) NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT NULL,
  metadata JSON NULL,
  
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_severity (severity),
  INDEX idx_timestamp (timestamp),
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_store_id (store_id),
  INDEX idx_ip (ip)
);
```

### 4. RateLimitAttempts

```sql
CREATE TABLE rate_limit_attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  fingerprint VARCHAR(255) NULL,
  type ENUM('qr_code', 'whatsapp', 'fingerprint', 'general') NOT NULL,
  success BOOLEAN NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT NULL,
  metadata JSON NULL,
  
  INDEX idx_ip_type (ip, type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_fingerprint (fingerprint)
);
```

### 5. BlockedIPs

```sql
CREATE TABLE blocked_ips (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  type ENUM('qr_code', 'whatsapp', 'fingerprint', 'general') NOT NULL,
  blocked_by VARCHAR(255) NULL,
  
  INDEX idx_ip (ip),
  INDEX idx_expires_at (expires_at)
);
```

### 6. SuspiciousActivities

```sql
CREATE TABLE suspicious_activities (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  description TEXT NOT NULL,
  evidence JSON NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45) NOT NULL,
  fingerprint VARCHAR(255) NULL,
  user_agent TEXT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP NULL,
  resolved_by VARCHAR(255) NULL,
  actions JSON NOT NULL,
  
  INDEX idx_type (type),
  INDEX idx_severity (severity),
  INDEX idx_timestamp (timestamp),
  INDEX idx_ip (ip),
  INDEX idx_resolved (resolved)
);
```

### 7. StoreSettings

```sql
CREATE TABLE store_settings (
  id VARCHAR(255) PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL UNIQUE,
  quick_registration JSON NOT NULL,
  authentication JSON NOT NULL,
  security JSON NOT NULL,
  notifications JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NULL,
  
  INDEX idx_store_id (store_id)
);
```

### 8. Customers (extensão da tabela existente)

```sql
-- Adicionar colunas à tabela customers existente
ALTER TABLE customers ADD COLUMN is_quick_registered BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN registration_source VARCHAR(50) DEFAULT 'normal';
ALTER TABLE customers ADD COLUMN fingerprint VARCHAR(255) NULL;
ALTER TABLE customers ADD COLUMN accepted_terms_at TIMESTAMP NULL;

-- Índices adicionais
CREATE INDEX idx_customers_is_quick_registered ON customers (is_quick_registered);
CREATE INDEX idx_customers_fingerprint ON customers (fingerprint);
```

## Configurações de Segurança

### 1. Rate Limiting

Implementar rate limiting no nível do servidor:

```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=qr_code:10m rate=10r/h;
limit_req_zone $binary_remote_addr zone=whatsapp:10m rate=3r/d;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/h;

location /api/auth/whatsapp/ {
    limit_req zone=whatsapp burst=1 nodelay;
}

location /qr/ {
    limit_req zone=qr_code burst=2 nodelay;
}

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

### 2. Firewall Rules

```bash
# iptables rules para proteção adicional
iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT
```

### 3. Variáveis de Ambiente

```env
# .env
WHATSAPP_API_URL=https://api.whatsapp.business/v1
WHATSAPP_API_TOKEN=your_whatsapp_token
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m

RATE_LIMIT_QR_CODE_PER_HOUR=10
RATE_LIMIT_WHATSAPP_PER_DAY=3
RATE_LIMIT_WHATSAPP_PER_HOUR=2
RATE_LIMIT_FINGERPRINT_PER_HOUR=100

SESSION_TIMEOUT_TABLE_MINUTES=240
SESSION_TIMEOUT_DELIVERY_MINUTES=120

AUDIT_LOG_RETENTION_DAYS=30
CLEANUP_INTERVAL_HOURS=1

ENABLE_FINGERPRINTING=true
ENABLE_RATE_LIMITING=true
ENABLE_SUSPICIOUS_ACTIVITY_DETECTION=true
```

## Jobs e Tarefas Agendadas

### 1. Limpeza Automática

```php
// Laravel Scheduler
// app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    // Limpeza de sessões expiradas (a cada hora)
    $schedule->command('cleanup:expired-sessions')->hourly();
    
    // Limpeza de tokens WhatsApp expirados (a cada hora)
    $schedule->command('cleanup:expired-tokens')->hourly();
    
    // Limpeza de logs de auditoria antigos (diariamente)
    $schedule->command('cleanup:old-audit-logs')->daily();
    
    // Limpeza de tentativas de rate limit antigas (diariamente)
    $schedule->command('cleanup:old-rate-limit-attempts')->daily();
    
    // Desbloqueio automático de IPs (a cada 15 minutos)
    $schedule->command('security:unblock-expired-ips')->everyFifteenMinutes();
    
    // Detecção de atividades suspeitas (a cada 5 minutos)
    $schedule->command('security:detect-suspicious-activity')->everyFiveMinutes();
}
```

### 2. Comandos Artisan

```php
// Comando de limpeza de sessões
php artisan make:command CleanupExpiredSessions
php artisan make:command CleanupExpiredTokens
php artisan make:command CleanupOldAuditLogs
php artisan make:command UnblockExpiredIPs
php artisan make:command DetectSuspiciousActivity
```

## Integração com WhatsApp Business API

### 1. Configuração

```php
// config/whatsapp.php
return [
    'api_url' => env('WHATSAPP_API_URL'),
    'api_token' => env('WHATSAPP_API_TOKEN'),
    'webhook_verify_token' => env('WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
    'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
    'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
];
```

### 2. Serviço de Envio

```php
// app/Services/WhatsAppService.php
class WhatsAppService
{
    public function sendMagicLink(string $phone, string $magicLink): bool
    {
        $message = "🍽️ *DigiMenu - Link de Acesso*\n\n";
        $message .= "Clique no link abaixo para acessar o cardápio:\n";
        $message .= $magicLink . "\n\n";
        $message .= "⏰ Este link expira em 15 minutos.\n";
        $message .= "🔒 Use apenas se você solicitou este acesso.";
        
        return $this->sendMessage($phone, $message);
    }
    
    private function sendMessage(string $phone, string $message): bool
    {
        // Implementação da API do WhatsApp Business
    }
}
```

## Monitoramento e Alertas

### 1. Métricas para Monitorar

- Taxa de criação de sessões por minuto
- Taxa de sucesso de autenticação WhatsApp
- Número de IPs bloqueados por hora
- Número de atividades suspeitas detectadas
- Tempo de resposta dos endpoints
- Taxa de erro dos endpoints

### 2. Alertas

```yaml
# prometheus/alerts.yml
groups:
  - name: digimenu_security
    rules:
      - alert: HighFailedAuthRate
        expr: rate(failed_auth_attempts_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Alta taxa de falhas de autenticação"
          
      - alert: SuspiciousActivityDetected
        expr: suspicious_activities_total > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Atividade suspeita detectada"
```

## Testes de Integração

### 1. Testes de API

```php
// tests/Feature/AuthenticationTest.php
class AuthenticationTest extends TestCase
{
    public function test_whatsapp_magic_link_request()
    {
        $response = $this->postJson('/api/auth/whatsapp/request', [
            'phone' => '+5511999999999',
            'storeId' => 'store_123',
            'fingerprint' => 'fp_hash_123'
        ]);
        
        $response->assertStatus(200)
                ->assertJson(['success' => true]);
    }
    
    public function test_session_creation()
    {
        $response = $this->postJson('/api/sessions', [
            'storeId' => 'store_123',
            'fingerprint' => 'fp_hash_123',
            'type' => 'table',
            'tableId' => 'table_5'
        ]);
        
        $response->assertStatus(201)
                ->assertJsonStructure([
                    'id', 'storeId', 'fingerprint', 'createdAt', 'expiresAt'
                ]);
    }
}
```

### 2. Testes de Segurança

```php
// tests/Feature/SecurityTest.php
class SecurityTest extends TestCase
{
    public function test_rate_limiting_blocks_excessive_requests()
    {
        // Fazer 11 requisições (limite é 10)
        for ($i = 0; $i < 11; $i++) {
            $response = $this->postJson('/api/auth/whatsapp/request', [
                'phone' => '+5511999999999',
                'storeId' => 'store_123',
                'fingerprint' => 'fp_hash_123'
            ]);
        }
        
        $response->assertStatus(429); // Too Many Requests
    }
}
```

## Cronograma de Implementação

### Fase 1 - Endpoints Básicos (1-2 semanas)
- [ ] Autenticação WhatsApp
- [ ] Criação e gerenciamento de sessões
- [ ] Validação de contexto (loja/mesa)
- [ ] Cadastro rápido

### Fase 2 - Segurança (1 semana)
- [ ] Rate limiting
- [ ] Detecção de atividade suspeita
- [ ] Bloqueio de IPs
- [ ] Auditoria básica

### Fase 3 - Configurações (1 semana)
- [ ] Configurações da loja
- [ ] Dashboard administrativo
- [ ] Relatórios de auditoria

### Fase 4 - Otimização (1 semana)
- [ ] Limpeza automática
- [ ] Monitoramento
- [ ] Testes de carga
- [ ] Documentação final

## Considerações de Deploy

### 1. Banco de Dados

- Configurar índices apropriados
- Implementar particionamento para tabelas grandes (audit_events)
- Configurar backup automático
- Monitorar performance das queries

### 2. Cache

```php
// config/cache.php
'stores' => [
    'sessions' => [
        'driver' => 'redis',
        'connection' => 'sessions',
        'prefix' => 'session:',
    ],
    'rate_limits' => [
        'driver' => 'redis',
        'connection' => 'rate_limits',
        'prefix' => 'rate_limit:',
    ],
]
```

### 3. Queue

```php
// config/queue.php
'connections' => [
    'audit_logs' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'audit_logs',
        'retry_after' => 90,
    ],
    'whatsapp' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'whatsapp',
        'retry_after' => 60,
    ],
]
```

### 4. Monitoramento

- Configurar logs estruturados
- Implementar health checks
- Configurar alertas de performance
- Monitorar uso de recursos