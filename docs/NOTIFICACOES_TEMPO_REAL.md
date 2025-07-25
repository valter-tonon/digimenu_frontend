# Sistema de Notificações em Tempo Real

## 📋 Visão Geral

O sistema de notificações em tempo real foi implementado para manter os usuários informados sobre seus pedidos, atualizações de estoque, promoções e outras informações importantes do restaurante.

## 🏗️ Arquitetura

### Componentes Principais

1. **WebSocketService** (`/services/websocket.ts`)
   - Gerencia conexão WebSocket com o servidor
   - Reconexão automática em caso de falha
   - Sistema de eventos para diferentes tipos de mensagens

2. **NotificationStore** (`/store/notification-store.ts`)
   - Gerenciamento de estado com Zustand
   - Persistência local das notificações
   - Controle de som e configurações

3. **NotificationBadge** (`/components/notifications/NotificationBadge.tsx`)
   - Badge no header com contador de notificações
   - Indicador de status de conexão
   - Acesso à central de notificações

4. **NotificationCenter** (`/components/notifications/NotificationCenter.tsx`)
   - Interface para visualizar todas as notificações
   - Configurações de som e push notifications
   - Gerenciamento de notificações (marcar como lida, remover)

5. **NotificationToast** (`/components/notifications/NotificationToast.tsx`)
   - Toasts automáticos para novas notificações
   - Integração com react-hot-toast
   - Notificações push para alta prioridade

### Hook Personalizado

**useNotifications** (`/hooks/useNotifications.ts`)
- Interface simplificada para usar notificações
- Funções específicas para cada tipo de notificação
- Gerenciamento automático de conexão WebSocket

## 🚀 Como Usar

### 1. Integração Básica

```tsx
import { NotificationBadge, NotificationToast } from '@/components/notifications';

function App() {
  return (
    <div>
      <NotificationBadge storeId="store-123" tableId="table-456" />
      <NotificationToast />
      {/* resto da aplicação */}
    </div>
  );
}
```

### 2. Usando o Hook

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    showNotification,
    showOrderNotification,
    showStockNotification,
    isConnected,
    unreadCount
  } = useNotifications('store-123', 'table-456');

  const handleOrderUpdate = () => {
    showOrderNotification('12345', 'Em preparação', 'Seu pedido está sendo preparado!');
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Conectado' : 'Desconectado'}</p>
      <p>Notificações não lidas: {unreadCount}</p>
      <button onClick={handleOrderUpdate}>Testar Notificação</button>
    </div>
  );
}
```

### 3. Tipos de Notificação

```tsx
// Notificação de pedido
showOrderNotification('12345', 'Em preparação', 'Seu pedido está sendo preparado!');

// Notificação de estoque
showStockNotification('Hambúrguer Clássico', false);

// Notificação de promoção
showPromotionNotification('Promoção Especial!', '20% de desconto hoje!');

// Notificação de garçom
showWaiterCallNotification('O garçom está a caminho!');

// Notificação geral
showNotification('Título', 'Mensagem', 'general', 'medium');
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:6001
```

### WebSocket Server

O sistema espera um servidor WebSocket que envie mensagens no formato:

```json
{
  "type": "notification|order_update|stock_update|promotion|waiter_call_response",
  "data": {
    "title": "Título da notificação",
    "message": "Mensagem da notificação",
    "type": "order_status",
    "priority": "high",
    "data": {}
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🎨 Personalização

### Cores e Estilos

O sistema usa Tailwind CSS com as seguintes cores padrão:

- **Alta prioridade**: Vermelho (`red-500`, `red-100`)
- **Média prioridade**: Âmbar (`amber-500`, `amber-100`)
- **Baixa prioridade**: Verde (`green-500`, `green-100`)

### Ícones por Tipo

- **order_status**: Ícone de documento
- **stock_update**: Ícone de caixa
- **promotion**: Ícone de presente
- **waiter_call**: Ícone de sino
- **general**: Ícone de informação

## 📱 Notificações Push

### Solicitar Permissão

```tsx
const { requestPermission } = useNotifications();

const handleRequestPermission = async () => {
  const granted = await requestPermission();
  if (granted) {
    console.log('Permissão concedida!');
  }
};
```

### Enviar Notificação Push

```tsx
const { sendPush } = useNotifications();

sendPush('Título', {
  body: 'Corpo da notificação',
  icon: '/favicon.ico',
  tag: 'unique-tag',
  requireInteraction: true
});
```

## 🔍 Debug e Teste

### Componente de Demonstração

```tsx
import { NotificationDemo } from '@/components/notifications';

function App() {
  return (
    <div>
      {/* Aplicação principal */}
      <NotificationDemo storeId="store-123" tableId="table-456" />
    </div>
  );
}
```

### Logs de Debug

O sistema inclui logs detalhados para debug:

```javascript
// Conexão WebSocket
console.log('WebSocket conectado');
console.log('WebSocket desconectado:', event.code, event.reason);

// Notificações
console.log('Nova notificação recebida:', notification);
console.log('Erro ao tocar som de notificação:', error);
```

## 🛠️ Manutenção

### Limpeza de Notificações

- Máximo de 50 notificações armazenadas
- Limpeza automática das mais antigas
- Persistência local com Zustand

### Reconexão WebSocket

- Tentativas automáticas de reconexão
- Backoff exponencial (1s, 2s, 4s, 8s, 16s)
- Máximo de 5 tentativas

### Performance

- Lazy loading de componentes
- Debounce em eventos de notificação
- Otimização de re-renders com React.memo

## 🔒 Segurança

- Validação de tipos de mensagem
- Sanitização de dados recebidos
- Controle de permissões para push notifications
- Timeout em conexões WebSocket

## 📈 Métricas

O sistema pode ser estendido para incluir métricas como:

- Taxa de entrega de notificações
- Tempo de resposta do usuário
- Taxa de engajamento
- Status de conexão WebSocket

## 🚀 Próximos Passos

1. **Integração com Backend**
   - Implementar endpoints WebSocket no Laravel
   - Sistema de broadcast de eventos
   - Autenticação WebSocket

2. **Melhorias de UX**
   - Animações mais suaves
   - Som personalizado por tipo
   - Modo noturno

3. **Funcionalidades Avançadas**
   - Agendamento de notificações
   - Filtros por tipo
   - Exportação de histórico 