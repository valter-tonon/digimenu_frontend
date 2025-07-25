# Documento de Requisitos - Sistema de Pedidos com Usuário Visitante

## Introdução

Este documento define os requisitos para implementar um sistema de autenticação segura baseado em QR Code + Fingerprint com fallback para Magic Links via WhatsApp, incluindo a funcionalidade de pedidos com usuário visitante. O sistema prioriza segurança, facilidade de uso e conformidade com padrões da indústria, permitindo que restaurantes configurem se aceitam ou não pedidos de usuários não autenticados.

## Requisitos

### Requisito 1: Sistema de Fingerprint de Dispositivo

**História de Usuário:** Como cliente, quero ser reconhecido automaticamente quando retorno ao restaurante, para que eu não precise fazer login repetidamente.

#### Critérios de Aceitação

1. QUANDO um usuário acessa o cardápio pela primeira vez ENTÃO o sistema DEVE gerar um fingerprint único do dispositivo
2. QUANDO um usuário retorna ao mesmo restaurante ENTÃO o sistema DEVE reconhecê-lo automaticamente pelo fingerprint
3. QUANDO o fingerprint é gerado ENTÃO o sistema DEVE incluir User Agent, resolução de tela, fuso horário, idioma, canvas fingerprint, WebGL fingerprint, memória do dispositivo e núcleos de CPU
4. QUANDO o fingerprint é validado ENTÃO o sistema DEVE verificar se não houve mudanças suspeitas no dispositivo
5. QUANDO há mudanças suspeitas no fingerprint ENTÃO o sistema DEVE solicitar reautenticação

### Requisito 2: Sessões Contextuais

**História de Usuário:** Como cliente, quero que minha sessão seja vinculada à mesa/loja onde estou, para que meus pedidos sejam direcionados corretamente.

#### Critérios de Aceitação

1. QUANDO um usuário escaneia um QR Code ENTÃO o sistema DEVE criar uma sessão contextual vinculada à mesa e loja
2. QUANDO uma sessão contextual é criada ENTÃO o sistema DEVE definir expiração de 4 horas para mesa ou 2 horas para delivery
3. QUANDO uma sessão está ativa ENTÃO o sistema DEVE validar se a mesa/loja ainda está disponível
4. QUANDO o restaurante fecha ENTÃO o sistema DEVE expirar automaticamente todas as sessões ativas
5. QUANDO uma sessão expira ENTÃO o sistema DEVE limpar os dados temporários e solicitar novo acesso

### Requisito 3: QR Code Authentication

**História de Usuário:** Como cliente, quero acessar o cardápio escaneando um QR Code na mesa, para que eu tenha acesso rápido e seguro.

#### Critérios de Aceitação

1. QUANDO um QR Code é escaneado ENTÃO o sistema DEVE validar se a mesa e loja existem e estão ativas
2. QUANDO o QR Code é válido ENTÃO o sistema DEVE criar uma sessão contextual automaticamente
3. QUANDO o horário de funcionamento é verificado ENTÃO o sistema DEVE permitir acesso apenas durante horários válidos
4. QUANDO há tentativas excessivas de acesso ENTÃO o sistema DEVE implementar rate limiting de 10 tentativas por IP/hora
5. QUANDO o contexto é inválido ENTÃO o sistema DEVE exibir mensagem de erro apropriada

### Requisito 4: Magic Links via WhatsApp (Delivery)

**História de Usuário:** Como cliente de delivery, quero receber um link seguro via WhatsApp para acessar o cardápio, para que eu possa fazer pedidos online de forma segura.

#### Critérios de Aceitação

1. QUANDO um cliente solicita cardápio via WhatsApp para delivery ENTÃO o sistema DEVE gerar um JWT temporário com expiração de 15 minutos
2. QUANDO o JWT é gerado ENTÃO o sistema DEVE enviar um link seguro via WhatsApp
3. QUANDO o link é acessado ENTÃO o sistema DEVE validar o JWT e criar uma sessão httpOnly para delivery
4. QUANDO a validação é bem-sucedida ENTÃO o sistema DEVE redirecionar para o menu em modo delivery sem tokens na URL
5. QUANDO há muitas solicitações ENTÃO o sistema DEVE implementar rate limiting de 3 solicitações por número/dia

### Requisito 5: Cadastro de Usuário Visitante no Checkout

**História de Usuário:** Como proprietário de restaurante, quero configurar se aceito cadastro rápido de usuários durante o checkout, para que eu possa facilitar o processo de compra mantendo os dados dos clientes.

#### Critérios de Aceitação

1. QUANDO configurando o restaurante ENTÃO o sistema DEVE permitir habilitar/desabilitar cadastro rápido no checkout
2. QUANDO cadastro rápido está habilitado E usuário não está autenticado ENTÃO o sistema DEVE solicitar nome completo e telefone no checkout
3. QUANDO dados básicos são fornecidos ENTÃO o sistema DEVE criar um usuário no sistema e autenticá-lo automaticamente
4. QUANDO usuário é criado no checkout ENTÃO o sistema DEVE associar o fingerprint e sessão ao novo usuário
5. QUANDO cadastro rápido está desabilitado ENTÃO o sistema DEVE exigir autenticação via WhatsApp antes do checkout

### Requisito 6: Gerenciamento de Sessões

**História de Usuário:** Como proprietário de restaurante, quero controlar as sessões ativas no meu estabelecimento, para que eu possa gerenciar a segurança e o acesso.

#### Critérios de Aceitação

1. QUANDO uma sessão é criada ENTÃO o sistema DEVE registrar logs de auditoria com IP, fingerprint e contexto
2. QUANDO há atividade suspeita ENTÃO o sistema DEVE alertar e bloquear temporariamente o IP
3. QUANDO o restaurante solicita ENTÃO o sistema DEVE permitir visualizar sessões ativas
4. QUANDO necessário ENTÃO o sistema DEVE permitir invalidar sessões específicas
5. QUANDO o sistema detecta fraude ENTÃO o sistema DEVE bloquear automaticamente o fingerprint

### Requisito 7: Conformidade com Privacidade

**História de Usuário:** Como usuário, quero que meus dados sejam tratados de acordo com a LGPD/GDPR, para que minha privacidade seja respeitada.

#### Critérios de Aceitação

1. QUANDO dados são coletados ENTÃO o sistema DEVE informar claramente sobre o uso do fingerprint
2. QUANDO solicitado ENTÃO o sistema DEVE permitir opt-out do rastreamento
3. QUANDO o usuário opta por sair ENTÃO o sistema DEVE limpar todos os dados identificáveis
4. QUANDO dados expiram ENTÃO o sistema DEVE limpar automaticamente fingerprints antigos (24 horas)
5. QUANDO solicitado ENTÃO o sistema DEVE fornecer transparência sobre dados coletados

### Requisito 8: Rate Limiting e Segurança

**História de Usuário:** Como proprietário de restaurante, quero que meu sistema seja protegido contra abusos, para que eu tenha segurança operacional.

#### Critérios de Aceitação

1. QUANDO há tentativas de QR Code ENTÃO o sistema DEVE limitar a 10 tentativas por IP/hora
2. QUANDO há solicitações WhatsApp ENTÃO o sistema DEVE limitar a 3 solicitações por número/dia
3. QUANDO há validações de fingerprint ENTÃO o sistema DEVE limitar a 100 validações por sessão/hora
4. QUANDO limites são excedidos ENTÃO o sistema DEVE bloquear temporariamente o acesso
5. QUANDO há padrões suspeitos ENTÃO o sistema DEVE registrar alertas de segurança

### Requisito 9: Limpeza Automática de Dados

**História de Usuário:** Como administrador do sistema, quero que dados antigos sejam limpos automaticamente, para que o sistema mantenha performance e conformidade.

#### Critérios de Aceitação

1. QUANDO sessões expiram ENTÃO o sistema DEVE limpar dados a cada 1 hora
2. QUANDO fingerprints ficam antigos ENTÃO o sistema DEVE limpar dados a cada 24 horas
3. QUANDO logs de auditoria acumulam ENTÃO o sistema DEVE limpar dados a cada 30 dias
4. QUANDO a limpeza ocorre ENTÃO o sistema DEVE manter logs de auditoria da operação
5. QUANDO há falhas na limpeza ENTÃO o sistema DEVE alertar administradores

### Requisito 10: Interface de Administração

**História de Usuário:** Como proprietário de restaurante, quero uma interface para gerenciar configurações de autenticação, para que eu possa controlar o acesso ao meu cardápio.

#### Critérios de Aceitação

1. QUANDO acessando configurações ENTÃO o sistema DEVE permitir habilitar/desabilitar pedidos de visitantes
2. QUANDO configurando segurança ENTÃO o sistema DEVE permitir ajustar durações de sessão
3. QUANDO monitorando ENTÃO o sistema DEVE exibir sessões ativas e estatísticas
4. QUANDO necessário ENTÃO o sistema DEVE permitir bloquear IPs ou fingerprints específicos
5. QUANDO configurações mudam ENTÃO o sistema DEVE aplicar mudanças imediatamente