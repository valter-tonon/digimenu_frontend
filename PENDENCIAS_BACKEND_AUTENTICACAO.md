# Pendências do Backend - Sistema de Autenticação Segura

## Resumo

Este documento lista todas as implementações necessárias no backend Laravel para suportar o sistema de autenticação segura baseado em QR Code + Fingerprint com fallback para Magic Links via WhatsApp, incluindo cadastro rápido de usuários visitantes no checkout.

## Endpoints Necessários

### 1. Gestão de Sessões Contextuais
**Status**: ❌ Não implementado

#### Endpoints necessários:

- `POST /api/v1/sessions`
  - **Payload**: 
    ```json
    {
      "store_id": "string",
      "table_id": "string|null",
      "is_delivery": "boolean",
      "fingerprint": "string",
      "ip_address": "string",
      "user_agent": "string",
      "customer_id": "string|null"
    }
    ```
  - **Response**: 
    ```json
    {
      "success": true,
      "session": {
        "id": "string",
        "store_id": "string",
        "table_id": "string|null",
        "is_delivery": "boolean",
        "fingerprint": "string",
        "ip_address": "string",
        "user_agent": "string",
        "created_at": "datetime",
        "expires_at": "datetime",
        "last_activity": "datetime",
        "order_count": "number",
        "total_spent": "number",
        "is_authenticated": "boolean",
        "customer_id": "string|null"
      }
    }
    ```
  - **Descrição**: Cria nova sessão contextual

- `GET /api/v1/sessions/{sessionId}`
  - **Response**: `{ session: ContextualSession }`
  - **Descrição**: Recupera dados da sessão

- `PUT /api/v1/sessions/{sessionId}/activity`
  - **Response**: `{ success: boolean }`
  - **Descrição**: Atualiza última atividade da sessão

- `PUT /api/v1/sessions/{sessionId}/customer`
  - **Payload**: `{ customer_id: string }`
  - **Response**: `{ success: boolean, session: ContextualSession }`
  - **Descrição**: Associa cliente à sessão

- `DELETE /api/v1/sessions/{sessionId}`
  - **Response**: `{ success: boolean }`
  - **Descrição**: Invalida sessão

- `GET /api/v1/stores/{storeId}/sessions/active`
  - **Response**: `{ sessions: ContextualSession[], count: number }`
  - **Descrição**: Lista sessões ativas da loja

### 2. Validação de Contexto (Mesa/Loja)
**Status**: ⚠️ Parcialmente implementado

#### Endpoints necessários:

- `GET /api/v1/stores/{storeId}/tables/{tableId}/status`
  - **Response**: 
    ```json
    {
      "id": "string",
      "is_active": "boolean",
      "is_occupied": "boolean",
      "current_sessions": "number",
      "max_sessions": "number",
      "store_status": "open|closed|busy"
    }
    ```
  - **Descrição**: Verifica status da mesa e disponibilidade

- `GET /api/v1/stores/{storeId}/status`
  - **Response**: 
    ```json
    {
      "id": "string",
      "is_open": "boolean",
      "status": "open|closed|busy",
      "opening_hours": "object",
      "current_time": "datetime"
    }
    ```
  - **Descrição**: Verifica status do restaurante

### 3. Autenticação WhatsApp (Magic Links)
**Status**: ❌ Não implementado

#### Endpoints necessários:

- `POST /api/v1/auth/whatsapp/request`
  - **Payload**: 
    ```json
    {
      "phone": "string",
      "store_id": "string",
      "session_id": "string|null"
    }
    ```
  - **Response**: `{ success: boolean, message: string }`
  - **Descrição**: Solicita magic link via WhatsApp

- `POST /api/v1/auth/whatsapp/validate`
  - **Payload**: `{ token: string }`
  - **Response**: 
    ```json
    {
      "success": true,
      "customer": "Customer",
      "session": "ContextualSession"
    }
    ```
  - **Descrição**: Valida token JWT e cria/atualiza sessão

### 4. Cadastro Rápido de Usuários
**Status**: ❌ Não implementado

#### Endpoints necessários:

- `POST /api/v1/customers/quick-register`
  - **Payload**: 
    ```json
    {
      "full_name": "string",
      "phone": "string",
      "email": "string|null",
      "session_id": "string",
      "registration_method": "quick_checkout"
    }
    ```
  - **Response**: 
    ```json
    {
      "success": true,
      "customer": {
        "id": "string",
        "name": "string",
        "phone": "string",
        "email": "string|null",
        "created_at": "datetime",
        "registration_method": "string"
      }
    }
    ```
  - **Descrição**: Cadastra usuário rapidamente no checkout

- `GET /api/v1/customers/by-phone/{phone}`
  - **Response**: `{ customer: Customer }` ou 404
  - **Descrição**: Busca cliente por telefone

### 5. Configurações de Loja
**Status**: ⚠️ Parcialmente implementado

#### Endpoints necessários:

- `GET /api/v1/stores/{storeId}/auth-settings`
  - **Response**: 
    ```json
    {
      "allow_quick_registration": "boolean",
      "session_duration": {
        "table": "number",
        "delivery": "number"
      },
      "rate_limiting": {
        "qr_code": "number",
        "whatsapp": "number",
        "fingerprint": "number"
      },
      "security": {
        "require_auth_for_orders": "boolean",
        "block_suspicious_fingerprints": "boolean",
        "enable_audit_logs": "boolean"
      }
    }
    ```
  - **Descrição**: Recupera configurações de autenticação da loja

- `PATCH /api/v1/stores/{storeId}/auth-settings`
  - **Payload**: `{ allow_quick_registration: boolean, ... }`
  - **Response**: `{ success: boolean, settings: StoreAuthSettings }`
  - **Descrição**: Atualiza configurações de autenticação

### 6. Rate Limiting e Segurança
**Status**: ❌ Não implementado

#### Endpoints necessários:

- `POST /api/v1/security/rate-limit/check`
  - **Payload**: 
    ```json
    {
      "key": "string",
      "type": "qrcode|whatsapp|fingerprint",
      "ip_address": "string"
    }
    ```
  - **Response**: `{ allowed: boolean, remaining: number, reset_at: datetime }`
  - **Descrição**: Verifica rate limiting

- `POST /api/v1/security/fingerprint/validate`
  - **Payload**: 
    ```json
    {
      "fingerprint": "string",
      "ip_address": "string",
      "user_agent": "string"
    }
    ```
  - **Response**: `{ valid: boolean, suspicious: boolean, blocked: boolean }`
  - **Descrição**: Valida fingerprint e detecta atividade suspeita

- `POST /api/v1/security/block-ip`
  - **Payload**: `{ ip_address: string, duration: number, reason: string }`
  - **Response**: `{ success: boolean }`
  - **Descrição**: Bloqueia IP temporariamente

### 7. Logs de Auditoria
**Status**: ❌ Não implementado

#### Endpoints necessários:

- `POST /api/v1/audit/log`
  - **Payload**: 
    ```json
    {
      "type": "session_created|session_expired|suspicious_activity|order_placed|auth_attempt",
      "store_id": "string",
      "session_id": "string|null",
      "fingerprint": "string|null",
      "ip_address": "string",
      "user_agent": "string",
      "metadata": "object"
    }
    ```
  - **Response**: `{ success: boolean }`
  - **Descrição**: Registra evento de auditoria

- `GET /api/v1/stores/{storeId}/audit/events`
  - **Query params**: `{ type?: string, date_from?: date, date_to?: date, page?: number }`
  - **Response**: `{ events: AuditEvent[], pagination: PaginationMeta }`
  - **Descrição**: Lista eventos de auditoria

### 8. Melhorias nos Endpoints Existentes

#### Pedidos
- Adicionar campos `session_id`, `fingerprint`, `is_guest_order`, `auth_method` no modelo Order
- Modificar `POST /api/v1/orders` para aceitar dados de sessão
- Adicionar validação de permissão para pedidos de visitante

#### Clientes
- Adicionar campo `registration_method` no modelo Customer
- Modificar endpoints de cliente para suportar cadastro rápido

## Modelos de Dados Necessários

### 1. ContextualSession
```php
<?php

use Illuminate\Database\Eloquent\Model;

class ContextualSession extends Model
{
    protected $fillable = [
        'id',
        'store_id',
        'table_id',
        'is_delivery',
        'fingerprint',
        'ip_address',
        'user_agent',
        'expires_at',
        'last_activity',
        'order_count',
        'total_spent',
        'is_authenticated',
        'customer_id'
    ];

    protected $casts = [
        'is_delivery' => 'boolean',
        'is_authenticated' => 'boolean',
        'expires_at' => 'datetime',
        'last_activity' => 'datetime',
        'order_count' => 'integer',
        'total_spent' => 'decimal:2'
    ];

    public function store()
    {
        return $this->belongsTo(Tenant::class, 'store_id');
    }

    public function table()
    {
        return $this->belongsTo(Table::class, 'table_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'session_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at < now();
    }

    public function isActive(): bool
    {
        return !$this->isExpired() && $this->last_activity > now()->subMinutes(30);
    }
}
```

### 2. DeviceFingerprint
```php
<?php

use Illuminate\Database\Eloquent\Model;

class DeviceFingerprint extends Model
{
    protected $fillable = [
        'hash',
        'user_agent',
        'screen_resolution',
        'time_zone',
        'language',
        'canvas_hash',
        'webgl_hash',
        'device_memory',
        'hardware_concurrency',
        'ip_address',
        'geolocation',
        'last_seen',
        'is_blocked',
        'suspicious_activity'
    ];

    protected $casts = [
        'geolocation' => 'array',
        'last_seen' => 'datetime',
        'is_blocked' => 'boolean',
        'suspicious_activity' => 'integer'
    ];

    public function sessions()
    {
        return $this->hasMany(ContextualSession::class, 'fingerprint', 'hash');
    }

    public function isSuspicious(): bool
    {
        return $this->suspicious_activity > 5;
    }
}
```

### 3. StoreAuthSettings
```php
<?php

use Illuminate\Database\Eloquent\Model;

class StoreAuthSettings extends Model
{
    protected $fillable = [
        'store_id',
        'allow_quick_registration',
        'session_duration_table',
        'session_duration_delivery',
        'rate_limit_qr_code',
        'rate_limit_whatsapp',
        'rate_limit_fingerprint',
        'require_auth_for_orders',
        'block_suspicious_fingerprints',
        'enable_audit_logs'
    ];

    protected $casts = [
        'allow_quick_registration' => 'boolean',
        'session_duration_table' => 'integer',
        'session_duration_delivery' => 'integer',
        'rate_limit_qr_code' => 'integer',
        'rate_limit_whatsapp' => 'integer',
        'rate_limit_fingerprint' => 'integer',
        'require_auth_for_orders' => 'boolean',
        'block_suspicious_fingerprints' => 'boolean',
        'enable_audit_logs' => 'boolean'
    ];

    public function store()
    {
        return $this->belongsTo(Tenant::class, 'store_id');
    }
}
```

### 4. AuditEvent
```php
<?php

use Illuminate\Database\Eloquent\Model;

class AuditEvent extends Model
{
    protected $fillable = [
        'type',
        'store_id',
        'session_id',
        'fingerprint',
        'ip_address',
        'user_agent',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function store()
    {
        return $this->belongsTo(Tenant::class, 'store_id');
    }

    public function session()
    {
        return $this->belongsTo(ContextualSession::class, 'session_id');
    }
}
```

### 5. WhatsAppAuthToken
```php
<?php

use Illuminate\Database\Eloquent\Model;

class WhatsAppAuthToken extends Model
{
    protected $fillable = [
        'token',
        'phone',
        'store_id',
        'session_id',
        'expires_at',
        'used_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime'
    ];

    public function store()
    {
        return $this->belongsTo(Tenant::class, 'store_id');
    }

    public function session()
    {
        return $this->belongsTo(ContextualSession::class, 'session_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at < now();
    }

    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }
}
```

### 6. Modificações em Modelos Existentes

#### Order (modificações)
```php
// Adicionar campos:
protected $fillable = [
    // ... campos existentes
    'session_id',
    'fingerprint',
    'is_guest_order',
    'auth_method', // 'qrcode', 'whatsapp', 'quick_registration'
    'ip_address',
    'user_agent'
];

protected $casts = [
    // ... casts existentes
    'is_guest_order' => 'boolean'
];

public function session()
{
    return $this->belongsTo(ContextualSession::class, 'session_id');
}
```

#### Customer (modificações)
```php
// Adicionar campos:
protected $fillable = [
    // ... campos existentes
    'registration_method' // 'whatsapp', 'quick_checkout', 'admin'
];
```

#### Table (modificações)
```php
// Adicionar campos:
protected $fillable = [
    // ... campos existentes
    'max_sessions', // número máximo de sessões simultâneas
    'is_active'
];

protected $casts = [
    // ... casts existentes
    'max_sessions' => 'integer',
    'is_active' => 'boolean'
];

public function activeSessions()
{
    return $this->hasMany(ContextualSession::class, 'table_id')
                ->where('expires_at', '>', now());
}

public function canAcceptNewSession(): bool
{
    return $this->is_active && 
           $this->activeSessions()->count() < $this->max_sessions;
}
```

## Migrations Necessárias

### 1. create_contextual_sessions_table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateContextualSessionsTable extends Migration
{
    public function up()
    {
        Schema::create('contextual_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('store_id');
            $table->uuid('table_id')->nullable();
            $table->boolean('is_delivery')->default(false);
            $table->string('fingerprint');
            $table->ipAddress('ip_address');
            $table->text('user_agent');
            $table->timestamp('expires_at');
            $table->timestamp('last_activity');
            $table->integer('order_count')->default(0);
            $table->decimal('total_spent', 10, 2)->default(0);
            $table->boolean('is_authenticated')->default(false);
            $table->uuid('customer_id')->nullable();
            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('tenants');
            $table->foreign('table_id')->references('id')->on('tables');
            $table->foreign('customer_id')->references('id')->on('customers');
            
            $table->index(['store_id', 'expires_at']);
            $table->index(['fingerprint', 'store_id']);
            $table->index('last_activity');
        });
    }

    public function down()
    {
        Schema::dropIfExists('contextual_sessions');
    }
}
```

### 2. create_device_fingerprints_table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDeviceFingerprintsTable extends Migration
{
    public function up()
    {
        Schema::create('device_fingerprints', function (Blueprint $table) {
            $table->id();
            $table->string('hash')->unique();
            $table->text('user_agent');
            $table->string('screen_resolution');
            $table->string('time_zone');
            $table->string('language');
            $table->string('canvas_hash');
            $table->string('webgl_hash');
            $table->integer('device_memory')->nullable();
            $table->integer('hardware_concurrency')->nullable();
            $table->ipAddress('ip_address');
            $table->json('geolocation')->nullable();
            $table->timestamp('last_seen');
            $table->boolean('is_blocked')->default(false);
            $table->integer('suspicious_activity')->default(0);
            $table->timestamps();

            $table->index('hash');
            $table->index(['ip_address', 'last_seen']);
            $table->index('is_blocked');
        });
    }

    public function down()
    {
        Schema::dropIfExists('device_fingerprints');
    }
}
```

### 3. create_store_auth_settings_table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStoreAuthSettingsTable extends Migration
{
    public function up()
    {
        Schema::create('store_auth_settings', function (Blueprint $table) {
            $table->id();
            $table->uuid('store_id')->unique();
            $table->boolean('allow_quick_registration')->default(true);
            $table->integer('session_duration_table')->default(240); // 4 horas em minutos
            $table->integer('session_duration_delivery')->default(120); // 2 horas em minutos
            $table->integer('rate_limit_qr_code')->default(10);
            $table->integer('rate_limit_whatsapp')->default(3);
            $table->integer('rate_limit_fingerprint')->default(100);
            $table->boolean('require_auth_for_orders')->default(false);
            $table->boolean('block_suspicious_fingerprints')->default(true);
            $table->boolean('enable_audit_logs')->default(true);
            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('tenants');
        });
    }

    public function down()
    {
        Schema::dropIfExists('store_auth_settings');
    }
}
```

### 4. create_audit_events_table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAuditEventsTable extends Migration
{
    public function up()
    {
        Schema::create('audit_events', function (Blueprint $table) {
            $table->id();
            $table->enum('type', [
                'session_created',
                'session_expired',
                'suspicious_activity',
                'order_placed',
                'auth_attempt',
                'fingerprint_blocked',
                'rate_limit_exceeded'
            ]);
            $table->uuid('store_id');
            $table->uuid('session_id')->nullable();
            $table->string('fingerprint')->nullable();
            $table->ipAddress('ip_address');
            $table->text('user_agent');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('tenants');
            $table->foreign('session_id')->references('id')->on('contextual_sessions');
            
            $table->index(['store_id', 'type', 'created_at']);
            $table->index(['ip_address', 'created_at']);
            $table->index('fingerprint');
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_events');
    }
}
```

### 5. create_whatsapp_auth_tokens_table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateWhatsappAuthTokensTable extends Migration
{
    public function up()
    {
        Schema::create('whatsapp_auth_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token')->unique();
            $table->string('phone');
            $table->uuid('store_id');
            $table->uuid('session_id')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('tenants');
            $table->foreign('session_id')->references('id')->on('contextual_sessions');
            
            $table->index(['phone', 'created_at']);
            $table->index('expires_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('whatsapp_auth_tokens');
    }
}
```

### 6. Modificações em tabelas existentes

#### add_auth_fields_to_orders_table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAuthFieldsToOrdersTable extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('session_id')->nullable()->after('customer_id');
            $table->string('fingerprint')->nullable()->after('session_id');
            $table->boolean('is_guest_order')->default(false)->after('fingerprint');
            $table->enum('auth_method', ['qrcode', 'whatsapp', 'quick_registration'])->nullable()->after('is_guest_order');
            $table->ipAddress('ip_address')->nullable()->after('auth_method');
            $table->text('user_agent')->nullable()->after('ip_address');

            $table->foreign('session_id')->references('id')->on('contextual_sessions');
            $table->index(['session_id', 'created_at']);
            $table->index('fingerprint');
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['session_id']);
            $table->dropColumn([
                'session_id',
                'fingerprint',
                'is_guest_order',
                'auth_method',
                'ip_address',
                'user_agent'
            ]);
        });
    }
}
```

#### add_registration_method_to_customers_table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRegistrationMethodToCustomersTable extends Migration
{
    public function up()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('registration_method', ['whatsapp', 'quick_checkout', 'admin'])
                  ->default('whatsapp')
                  ->after('phone');
        });
    }

    public function down()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('registration_method');
        });
    }
}
```

#### add_session_fields_to_tables_table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSessionFieldsToTablesTable extends Migration
{
    public function up()
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->integer('max_sessions')->default(10)->after('number');
            $table->boolean('is_active')->default(true)->after('max_sessions');
        });
    }

    public function down()
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn(['max_sessions', 'is_active']);
        });
    }
}
```

## Services Necessários

### 1. SessionService
```php
<?php

namespace App\Services;

use App\Models\ContextualSession;
use App\Models\StoreAuthSettings;
use Carbon\Carbon;

class SessionService
{
    public function createSession(array $data): ContextualSession
    {
        $settings = StoreAuthSettings::where('store_id', $data['store_id'])->first();
        
        $duration = $data['is_delivery'] 
            ? $settings->session_duration_delivery ?? 120
            : $settings->session_duration_table ?? 240;

        return ContextualSession::create([
            'id' => \Str::uuid(),
            'store_id' => $data['store_id'],
            'table_id' => $data['table_id'] ?? null,
            'is_delivery' => $data['is_delivery'],
            'fingerprint' => $data['fingerprint'],
            'ip_address' => $data['ip_address'],
            'user_agent' => $data['user_agent'],
            'expires_at' => now()->addMinutes($duration),
            'last_activity' => now(),
            'customer_id' => $data['customer_id'] ?? null,
            'is_authenticated' => !is_null($data['customer_id'] ?? null)
        ]);
    }

    public function updateActivity(string $sessionId): bool
    {
        return ContextualSession::where('id', $sessionId)
            ->update(['last_activity' => now()]);
    }

    public function associateCustomer(string $sessionId, string $customerId): bool
    {
        return ContextualSession::where('id', $sessionId)
            ->update([
                'customer_id' => $customerId,
                'is_authenticated' => true
            ]);
    }

    public function cleanExpiredSessions(): int
    {
        return ContextualSession::where('expires_at', '<', now())->delete();
    }
}
```

### 2. FingerprintService
```php
<?php

namespace App\Services;

use App\Models\DeviceFingerprint;

class FingerprintService
{
    public function validateFingerprint(array $data): array
    {
        $fingerprint = DeviceFingerprint::where('hash', $data['fingerprint'])->first();
        
        if (!$fingerprint) {
            $fingerprint = $this->createFingerprint($data);
        } else {
            $this->updateFingerprint($fingerprint, $data);
        }

        return [
            'valid' => true,
            'suspicious' => $fingerprint->isSuspicious(),
            'blocked' => $fingerprint->is_blocked
        ];
    }

    private function createFingerprint(array $data): DeviceFingerprint
    {
        return DeviceFingerprint::create([
            'hash' => $data['fingerprint'],
            'user_agent' => $data['user_agent'],
            'ip_address' => $data['ip_address'],
            'last_seen' => now(),
            // ... outros campos
        ]);
    }

    private function updateFingerprint(DeviceFingerprint $fingerprint, array $data): void
    {
        $fingerprint->update([
            'last_seen' => now(),
            'ip_address' => $data['ip_address']
        ]);
    }
}
```

### 3. WhatsAppAuthService
```php
<?php

namespace App\Services;

use App\Models\WhatsAppAuthToken;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class WhatsAppAuthService
{
    public function generateMagicLink(string $phone, string $storeId, ?string $sessionId = null): string
    {
        $token = $this->generateJWT($phone, $storeId, $sessionId);
        
        WhatsAppAuthToken::create([
            'token' => $token,
            'phone' => $phone,
            'store_id' => $storeId,
            'session_id' => $sessionId,
            'expires_at' => now()->addMinutes(15)
        ]);

        return config('app.url') . "/auth/whatsapp?token={$token}";
    }

    public function validateToken(string $token): array
    {
        $authToken = WhatsAppAuthToken::where('token', $token)
            ->where('expires_at', '>', now())
            ->whereNull('used_at')
            ->first();

        if (!$authToken) {
            throw new \Exception('Token inválido ou expirado');
        }

        $authToken->update(['used_at' => now()]);

        return [
            'phone' => $authToken->phone,
            'store_id' => $authToken->store_id,
            'session_id' => $authToken->session_id
        ];
    }

    private function generateJWT(string $phone, string $storeId, ?string $sessionId): string
    {
        $payload = [
            'phone' => $phone,
            'store_id' => $storeId,
            'session_id' => $sessionId,
            'exp' => now()->addMinutes(15)->timestamp
        ];

        return JWT::encode($payload, config('app.key'), 'HS256');
    }
}
```

### 4. RateLimitService
```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class RateLimitService
{
    public function checkLimit(string $key, int $limit, int $windowMinutes): bool
    {
        $current = Cache::get($key, 0);
        return $current < $limit;
    }

    public function incrementCounter(string $key, int $windowMinutes): void
    {
        $current = Cache::get($key, 0);
        Cache::put($key, $current + 1, now()->addMinutes($windowMinutes));
    }

    public function blockIP(string $ip, int $durationMinutes, string $reason): void
    {
        Cache::put("blocked_ip:{$ip}", $reason, now()->addMinutes($durationMinutes));
    }

    public function isBlocked(string $ip): bool
    {
        return Cache::has("blocked_ip:{$ip}");
    }
}
```

## Jobs/Commands Necessários

### 1. CleanExpiredSessionsCommand
```php
<?php

namespace App\Console\Commands;

use App\Services\SessionService;
use Illuminate\Console\Command;

class CleanExpiredSessionsCommand extends Command
{
    protected $signature = 'sessions:clean';
    protected $description = 'Clean expired sessions';

    public function handle(SessionService $sessionService)
    {
        $cleaned = $sessionService->cleanExpiredSessions();
        $this->info("Cleaned {$cleaned} expired sessions");
    }
}
```

### 2. CleanOldFingerprintsCommand
```php
<?php

namespace App\Console\Commands;

use App\Models\DeviceFingerprint;
use Illuminate\Console\Command;

class CleanOldFingerprintsCommand extends Command
{
    protected $signature = 'fingerprints:clean';
    protected $description = 'Clean old fingerprints';

    public function handle()
    {
        $cleaned = DeviceFingerprint::where('last_seen', '<', now()->subHours(24))->delete();
        $this->info("Cleaned {$cleaned} old fingerprints");
    }
}
```

### 3. CleanAuditLogsCommand
```php
<?php

namespace App\Console\Commands;

use App\Models\AuditEvent;
use Illuminate\Console\Command;

class CleanAuditLogsCommand extends Command
{
    protected $signature = 'audit:clean';
    protected $description = 'Clean old audit logs';

    public function handle()
    {
        $cleaned = AuditEvent::where('created_at', '<', now()->subDays(30))->delete();
        $this->info("Cleaned {$cleaned} old audit logs");
    }
}
```

## Configurações Necessárias

### 1. Variáveis de Ambiente
```env
# WhatsApp Integration
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Rate Limiting
RATE_LIMIT_QR_CODE=10
RATE_LIMIT_WHATSAPP=3
RATE_LIMIT_FINGERPRINT=100

# Session Configuration
SESSION_DURATION_TABLE=240
SESSION_DURATION_DELIVERY=120

# Security
ENABLE_FINGERPRINT_BLOCKING=true
ENABLE_AUDIT_LOGS=true
```

### 2. Scheduler (app/Console/Kernel.php)
```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('sessions:clean')->hourly();
    $schedule->command('fingerprints:clean')->daily();
    $schedule->command('audit:clean')->daily();
}
```

## Prioridades de Implementação

### Alta Prioridade (Semana 1-2)
1. ✅ Modelos e migrations básicos
2. ✅ Endpoints de sessão contextual
3. ✅ Validação de contexto (mesa/loja)
4. ✅ Cadastro rápido de usuários

### Média Prioridade (Semana 3-4)
1. ✅ Autenticação WhatsApp com magic links
2. ✅ Sistema de fingerprint e validação
3. ✅ Configurações de loja
4. ✅ Rate limiting básico

### Baixa Prioridade (Semana 5-6)
1. ✅ Sistema completo de auditoria
2. ✅ Interface administrativa
3. ✅ Limpeza automática avançada
4. ✅ Monitoramento e alertas

## Considerações de Segurança

### Validação de Dados
- Validar todos os inputs de fingerprint
- Sanitizar dados de user agent
- Validar formato de telefone brasileiro
- Verificar integridade de tokens JWT

### Rate Limiting
- Implementar rate limiting por IP e por fingerprint
- Bloquear IPs suspeitos automaticamente
- Monitorar padrões de abuso

### Auditoria
- Registrar todas as tentativas de autenticação
- Monitorar criação de sessões suspeitas
- Alertar sobre atividade anômala

### Conformidade LGPD
- Implementar limpeza automática de dados
- Fornecer mecanismo de opt-out
- Documentar uso de dados coletados

---

**Documento criado em:** 25/07/2025  
**Versão:** 1.0  
**Status:** Pronto para implementação  
**Próxima revisão:** Após implementação das funcionalidades básicas