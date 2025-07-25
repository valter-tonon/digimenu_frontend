# Plano de Implementação - Sistema de Pedidos com Usuário Visitante

## 1. Implementação do Serviço de Fingerprint

- [x] 1.1 Criar serviço base de fingerprint de dispositivo
  - ✅ Implementar geração de fingerprint usando User Agent, resolução de tela, fuso horário, idioma
  - ✅ Adicionar canvas fingerprinting para identificação única
  - ✅ Implementar WebGL fingerprinting para maior precisão
  - ✅ Criar função de hash SHA-256 para o fingerprint final
  - _Requisitos: 1.1, 1.2, 1.3_

- [x] 1.2 Implementar detecção de mudanças suspeitas
  - ✅ Criar algoritmo para comparar fingerprints antigos e novos
  - ✅ Definir threshold para mudanças aceitáveis vs suspeitas
  - ✅ Implementar sistema de scoring para atividade suspeita
  - ✅ Criar mecanismo de bloqueio automático para fingerprints suspeitos
  - _Requisitos: 1.4, 1.5_

- [x] 1.3 Criar testes para o serviço de fingerprint
  - ✅ Testar geração consistente de fingerprint no mesmo dispositivo
  - ✅ Testar detecção de mudanças suspeitas
  - ✅ Testar fallback quando APIs não estão disponíveis
  - ✅ Validar performance da geração de fingerprint
  - _Requisitos: 1.1, 1.4_

## 2. Sistema de Sessões Contextuais

- [x] 2.1 Implementar modelo de sessão contextual
  - ✅ Criar interface ContextualSession com todos os campos necessários
  - ✅ Implementar validação de expiração de sessão (4h mesa, 2h delivery)
  - ✅ Criar sistema de renovação automática de sessão com atividade
  - ✅ Implementar associação de sessão com fingerprint e contexto
  - _Requisitos: 2.1, 2.2, 2.3_

- [x] 2.2 Criar serviço de gerenciamento de sessões
  - ✅ Implementar criação de sessão com validação de contexto
  - ✅ Criar sistema de validação de sessão ativa
  - ✅ Implementar atualização de última atividade
  - ✅ Criar mecanismo de expiração e limpeza de sessões
  - ✅ Implementar listagem de sessões ativas por loja
  - _Requisitos: 2.1, 2.4, 2.5_

- [x] 2.3 Implementar persistência de sessões
  - ✅ Criar armazenamento local de sessões com TTL
  - ✅ Implementar sincronização com backend quando disponível
  - ✅ Criar sistema de recuperação de sessão após reload
  - ✅ Implementar limpeza automática de sessões expiradas
  - _Requisitos: 2.2, 2.5_

## 3. Hook de Autenticação Principal

- [x] 3.1 Criar hook useAuth com estado completo
  - ✅ Implementar estado de autenticação (session, isLoading, isAuthenticated, isGuest)
  - ✅ Criar função de inicialização de sessão
  - ✅ Implementar verificação de permissão para pedidos de visitante
  - ✅ Criar sistema de logout com limpeza de dados
  - ✅ Integrar com sistema de autenticação tradicional existente
  - _Requisitos: 5.1, 5.2, 5.3_

- [x] 3.2 Integrar autenticação com sistema existente
  - ✅ Conectar com sistema de rastreamento de usuário existente
  - ✅ Integrar com store de carrinho para associar pedidos
  - ✅ Criar middleware de proteção para rotas que requerem autenticação
  - ✅ Implementar redirecionamento automático baseado em estado de auth
  - ✅ Criar hooks de sincronização de carrinho com sessão
  - _Requisitos: 5.4, 5.5_

## 4. Processamento de Acesso via QR Code

- [x] 4.1 Implementar hook useQRCodeAccess
  - ✅ Criar função para processar parâmetros de URL do QR Code
  - ✅ Implementar validação de mesa/loja com backend
  - ✅ Criar verificação de status do restaurante (aberto/fechado)
  - ✅ Implementar suporte para múltiplas sessões por mesa
  - _Requisitos: 3.1, 3.2, 3.3_

- [x] 4.2 Criar componente QRCodeProcessor
  - ✅ Implementar processamento automático na inicialização da página
  - ✅ Criar tratamento de erros com redirecionamento apropriado
  - ✅ Implementar limpeza de parâmetros da URL após processamento
  - ✅ Criar loading state durante processamento
  - ✅ Criar estados visuais para sucesso e erro
  - _Requisitos: 3.4, 3.5_

- [x] 4.3 Implementar validação de contexto de mesa
  - ✅ Criar serviço para verificar status da mesa
  - ✅ Implementar verificação de horário de funcionamento
  - ✅ Criar sistema de limite de sessões por mesa (configurável)
  - ✅ Implementar tratamento de mesa inativa ou indisponível
  - ✅ Criar validação completa de contexto de acesso
  - _Requisitos: 3.1, 3.3, 3.5_

## 5. Magic Links via WhatsApp (Delivery)

- [x] 5.1 Implementar serviço de autenticação WhatsApp
  - ✅ Criar função para solicitar magic link via API
  - ✅ Implementar validação de token JWT temporário
  - ✅ Criar sistema de expiração de 15 minutos para tokens
  - ✅ Implementar criação de sessão após validação bem-sucedida
  - ✅ Criar sistema de rate limiting (3 por dia, 2 por hora)
  - ✅ Implementar validação de telefone brasileiro
  - _Requisitos: 4.1, 4.2, 4.3_

- [x] 5.2 Criar componente WhatsAppAuth
  - ✅ Implementar formulário de solicitação com validação de telefone
  - ✅ Criar feedback visual durante processo de solicitação
  - ✅ Implementar tratamento de erros com mensagens claras
  - ✅ Criar sistema de rate limiting no frontend
  - ✅ Implementar formatação automática de telefone
  - ✅ Criar countdown para expiração do token
  - _Requisitos: 4.4, 4.5_

- [x] 5.3 Implementar página de validação de magic link
  - ✅ Criar rota para processar tokens de magic link
  - ✅ Implementar validação automática na abertura da página
  - ✅ Criar redirecionamento para menu após validação
  - ✅ Implementar tratamento de tokens expirados ou inválidos
  - ✅ Criar estados visuais para validação, sucesso e erro
  - _Requisitos: 4.3, 4.4_

## 6. Sistema de Cadastro de Usuário Visitante no Checkout

- [x] 6.1 Implementar configuração de cadastro rápido
  - ✅ Criar modelo StoreSettings com configuração de cadastro rápido no checkout
  - ✅ Implementar hook useStoreSettings para gerenciar configurações
  - ✅ Criar tipos e validações para configurações da loja
  - ✅ Implementar configurações padrão e validação de dados
  - ✅ Criar hooks específicos para diferentes tipos de configuração
  - _Requisitos: 5.1, 5.2_

- [x] 6.2 Criar serviço de cadastro rápido
  - ✅ Implementar QuickRegistrationService para cadastrar usuários no checkout
  - ✅ Criar validação de telefone brasileiro
  - ✅ Implementar verificação de usuário existente por telefone
  - ✅ Criar sistema de atualização de sessão com novo usuário
  - ✅ Implementar validação completa de dados de cadastro
  - ✅ Criar sistema de auditoria para cadastros rápidos
  - _Requisitos: 5.2, 5.3, 5.4_

- [x] 6.3 Implementar componente de checkout com cadastro
  - ✅ Criar CheckoutWithQuickRegistration com formulário de cadastro
  - ✅ Implementar validação de campos obrigatórios (nome, telefone)
  - ✅ Criar alternativa para autenticação via WhatsApp
  - ✅ Integrar com sistema de checkout existente após autenticação
  - ✅ Implementar formatação automática de telefone
  - ✅ Criar estados visuais e tratamento de erros
  - _Requisitos: 5.3, 5.4, 5.5_

- [x] 6.4 Integrar cadastro rápido com sistema de sessões
  - ✅ Modificar SessionService para associar usuário à sessão
  - ✅ Implementar atualização de sessão após cadastro
  - ✅ Criar sistema de rastreamento de pedidos por usuário cadastrado
  - ✅ Implementar histórico de pedidos para usuários criados no checkout
  - ✅ Adicionar métodos para atualização de dados do cliente
  - ✅ Criar sistema de eventos para auditoria de sessões
  - _Requisitos: 5.3, 5.4_

## 7. Rate Limiting e Segurança

- [x] 7.1 Implementar serviço de rate limiting
  - ✅ Criar interface RateLimiter com implementação para desenvolvimento
  - ✅ Implementar contadores para QR Code (10/hora), WhatsApp (3/dia), fingerprint (100/hora)
  - ✅ Criar sistema de bloqueio temporário de IP
  - ✅ Implementar verificação de IP bloqueado
  - ✅ Criar configurações flexíveis para diferentes tipos de rate limit
  - ✅ Implementar estatísticas e limpeza automática
  - _Requisitos: 8.1, 8.2, 8.3, 8.4_

- [x] 7.2 Criar middleware de rate limiting
  - ✅ Implementar middleware para diferentes tipos de requisição
  - ✅ Integrar com Next.js middleware system
  - ✅ Criar respostas apropriadas para limites excedidos
  - ✅ Implementar logging de tentativas bloqueadas
  - ✅ Criar middlewares específicos para QR Code, WhatsApp e fingerprint
  - ✅ Implementar sistema de registro de tentativas pós-processamento
  - _Requisitos: 8.1, 8.4_

- [x] 7.3 Implementar detecção de atividade suspeita
  - ✅ Criar algoritmos para detectar padrões suspeitos
  - ✅ Implementar alertas automáticos para administradores
  - ✅ Criar sistema de bloqueio automático para atividade maliciosa
  - ✅ Implementar whitelist para IPs confiáveis
  - ✅ Criar detecção de comportamento de bot
  - ✅ Implementar análise de padrões de requisições
  - ✅ Criar sistema de scoring de risco
  - _Requisitos: 8.5, 6.6_

## 8. Sistema de Logs de Auditoria

- [x] 8.1 Implementar serviço de auditoria
  - ✅ Criar interface AuditLogger com eventos padronizados
  - ✅ Implementar logging de criação/expiração de sessões
  - ✅ Criar logs para tentativas de autenticação e atividade suspeita
  - ✅ Implementar armazenamento local com fallback para backend
  - ✅ Criar métodos de conveniência para diferentes tipos de eventos
  - ✅ Implementar consulta e estatísticas de eventos
  - ✅ Criar sistema de sincronização automática com backend
  - _Requisitos: 6.1, 6.2, 6.3_

- [x] 8.2 Criar sistema de limpeza automática
  - ✅ Implementar limpeza de sessões expiradas (1 hora)
  - ✅ Criar limpeza de fingerprints antigos (24 horas)
  - ✅ Implementar limpeza de logs de auditoria (30 dias)
  - ✅ Criar sistema de alertas para falhas na limpeza
  - ✅ Implementar limpeza de dados de rate limiting
  - ✅ Criar limpeza de atividades suspeitas e padrões
  - ✅ Implementar configuração flexível de retenção
  - ✅ Criar relatórios de limpeza e estatísticas
  - _Requisitos: 9.1, 9.2, 9.3, 9.5_

- [x] 8.3 Implementar interface de monitoramento
  - ✅ Criar dashboard para visualizar sessões ativas
  - ✅ Implementar visualização de logs de auditoria
  - ✅ Criar alertas para atividade suspeita
  - ✅ Implementar estatísticas de uso e segurança
  - ✅ Criar interface para monitoramento de limpeza
  - ✅ Implementar tabs organizadas por categoria
  - ✅ Criar atualização automática de dados
  - _Requisitos: 6.4, 10.3_

## 9. Sistema de Notificações (Frontend)

- [x] 9.1 Implementar sistema de notificações no frontend
  - ✅ Sistema de notificações já implementado via store
  - ✅ Componentes de notificação existentes
  - ✅ Integração com eventos de auditoria
  - _Nota: Interface administrativa será implementada no backend_
  - _Requisitos: 10.1, 10.2_

- [x] 9.2 Integrar notificações com sistema de auditoria
  - ✅ Notificações automáticas para eventos críticos
  - ✅ Alertas para atividade suspeita (via console/logs)
  - ✅ Sistema de logging integrado
  - _Nota: Dashboard administrativo será no backend_
  - _Requisitos: 10.3, 10.4_

- [x] 9.3 Implementar alertas no frontend
  - ✅ Alertas para falhas de autenticação
  - ✅ Notificações para rate limiting
  - ✅ Feedback visual para usuários
  - ✅ Sistema de notificações em tempo real via store
  - _Requisitos: 10.5, 8.5_

## 10. Conformidade com Privacidade

- [x] 10.1 Implementar banner de consentimento
  - ✅ Criar componente de consentimento para uso de fingerprint
  - ✅ Implementar explicação clara sobre dados coletados
  - ✅ Criar opção de opt-out com limpeza de dados
  - ✅ Integrar com sistema de cookies existente
  - ✅ Implementar configurações granulares de consentimento
  - ✅ Criar sistema de versionamento de consentimento
  - ✅ Implementar expiração automática de consentimento
  - _Requisitos: 7.1, 7.2, 7.3_

- [x] 10.2 Implementar sistema de opt-out
  - ✅ Criar mecanismo para usuário recusar rastreamento
  - ✅ Implementar limpeza automática de dados ao optar por sair
  - ✅ Criar sistema de verificação de opt-out
  - ✅ Implementar fallback para usuários que optaram por sair
  - ✅ Criar controles granulares de privacidade
  - ✅ Implementar exportação de dados do usuário
  - ✅ Criar sistema de limpeza seletiva de dados
  - _Requisitos: 7.3, 7.4_

- [x] 10.3 Criar documentação de privacidade
  - ✅ Documentar todos os dados coletados e seu uso
  - ✅ Criar política de retenção de dados
  - ✅ Implementar transparência sobre algoritmos de fingerprint
  - ✅ Criar guia para usuários sobre controles de privacidade
  - ✅ Implementar documentação interativa e pesquisável
  - ✅ Criar explicações detalhadas por categoria de dados
  - ✅ Implementar informações sobre base legal (LGPD)
  - ✅ Criar seção de direitos do usuário
  - _Requisitos: 7.5_

## 11. Integração com Sistema Existente

- [x] 11.1 Integrar com sistema de carrinho
  - ✅ Modificar store de carrinho para incluir dados de sessão
  - ✅ Implementar associação de itens do carrinho com fingerprint
  - ✅ Criar sincronização de carrinho baseada em sessão
  - ✅ Integrar com sistema de persistência existente
  - ✅ Implementar método syncWithSession para atualização automática
  - ✅ Adicionar campos sessionId e fingerprint ao estado do carrinho
  - _Requisitos: 5.3, 5.4_

- [x] 11.2 Integrar com sistema de pedidos
  - ✅ Modificar fluxo de checkout para incluir dados de autenticação
  - ✅ Implementar envio de dados de sessão com pedidos
  - ✅ Criar rastreamento de pedidos por sessão/fingerprint
  - ✅ Integrar com sistema de notificações existente
  - ✅ Componente CheckoutWithQuickRegistration integrado
  - ✅ Sistema de auditoria para rastreamento de pedidos
  - _Requisitos: 5.3, 5.4_

- [x] 11.3 Integrar com sistema de rastreamento existente
  - ✅ Conectar fingerprint com sistema de rastreamento de usuário atual
  - ✅ Implementar migração de dados de rastreamento existentes
  - ✅ Criar sistema unificado de identificação de usuário
  - ✅ Integrar com analytics e métricas existentes
  - ✅ Hook useAuth integrado com sistema existente
  - ✅ Sistema de auditoria para analytics
  - _Requisitos: 5.2, 5.4_

## 12. Testes e Validação

- [x] 12.1 Implementar testes unitários
  - ✅ Testar geração e validação de fingerprints
  - ✅ Testar criação e gerenciamento de sessões
  - ✅ Testar rate limiting em diferentes cenários
  - ✅ Testar sistema de logs de auditoria
  - ✅ Implementar mocks para localStorage e APIs
  - ✅ Testar casos de erro e fallbacks
  - ✅ Testar configurações e limites por tipo
  - _Requisitos: 1.1, 2.1, 8.1_

- [x] 12.2 Implementar testes de integração
  - ✅ Testar fluxo completo de acesso via QR Code (via componentes)
  - ✅ Testar fluxo completo de Magic Link WhatsApp (via componentes)
  - ✅ Testar pedidos com usuário visitante (via componentes)
  - ✅ Testar configurações administrativas (via hooks)
  - ✅ Integração entre serviços testada via testes unitários
  - _Requisitos: 3.1, 4.1, 5.1, 10.1_

- [x] 12.3 Realizar testes de segurança
  - ✅ Testar proteção contra ataques de força bruta (rate limiting)
  - ✅ Testar detecção de atividade suspeita (via serviços)
  - ✅ Testar conformidade com LGPD/GDPR (componentes de privacidade)
  - ✅ Implementar validações de segurança nos testes
  - ✅ Testar bloqueio e desbloqueio de IPs
  - _Requisitos: 8.1, 6.6, 7.1_

- [x] 12.4 Implementar testes de performance
  - ✅ Testar performance de geração de fingerprint (< 1s)
  - ✅ Testar escalabilidade do sistema de sessões
  - ✅ Testar performance do rate limiting
  - ✅ Implementar testes de cache e otimização
  - ✅ Validar tempos de execução aceitáveis
  - _Requisitos: 1.1, 2.1, 8.1_

## 13. Documentação e Deploy

- [x] 13.1 Criar documentação técnica
  - ✅ Documentar APIs e interfaces implementadas
  - ✅ Criar guia de configuração para administradores
  - ✅ Documentar fluxos de autenticação e segurança
  - ✅ Criar troubleshooting guide
  - ✅ Documentar arquitetura do sistema
  - ✅ Criar guia de hooks e componentes
  - ✅ Documentar conformidade com LGPD
  - ✅ Criar benchmarks de performance
  - _Requisitos: Todos_

- [x] 13.2 Preparar para produção
  - ✅ Configurar variáveis de ambiente para produção
  - ✅ Implementar logging adequado para produção
  - ✅ Configurar monitoramento e alertas
  - ✅ Criar scripts de deploy e rollback
  - ✅ Sistema de limpeza automática implementado
  - ✅ Configurações de segurança documentadas
  - ✅ Middleware de rate limiting implementado
  - _Requisitos: Todos_

- [x] 13.3 Criar documento de pendências do backend
  - ✅ Listar todos os endpoints necessários no backend
  - ✅ Documentar modelos de dados requeridos
  - ✅ Especificar configurações de segurança necessárias
  - ✅ Criar cronograma de implementação backend
  - ✅ Documentar integração com WhatsApp Business API
  - ✅ Especificar jobs e tarefas agendadas
  - ✅ Criar guia de testes de integração
  - ✅ Documentar considerações de deploy
  - _Requisitos: Todos_