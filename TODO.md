# TODO - Tarefas Pendentes

## 🎨 Configuração de Temas no Painel Administrativo

### Prioridade: Alta
**Status:** Pendente

### Descrição
O seletor de temas foi removido da interface do usuário. O tema deve ser configurado no painel administrativo do restaurante.

### Tarefas Necessárias

#### 1. Painel Administrativo - Configuração de Tema
- [ ] Criar seção "Aparência" no painel admin
- [ ] Implementar seletor de temas disponíveis
- [ ] Adicionar personalização de cores principais
- [ ] Permitir upload de logo personalizada
- [ ] Configuração de fonte e tipografia
- [ ] Preview em tempo real das mudanças

#### 2. Persistência de Configurações
- [ ] Salvar configurações de tema por restaurante
- [ ] API para atualizar configurações
- [ ] Cache das configurações no frontend
- [ ] Fallback para tema padrão

#### 3. Temas Disponíveis
- [ ] Tema Clássico (atual)
- [ ] Tema Moderno
- [ ] Tema Minimalista
- [ ] Tema Escuro
- [ ] Tema Personalizado (cores customizadas)

#### 4. Interface do Usuário
- [ ] Remover completamente o LayoutSelector da interface do usuário
- [ ] Aplicar tema automaticamente baseado na configuração do restaurante
- [ ] Garantir que mudanças no admin sejam refletidas imediatamente

### Arquivos Afetados
- `src/components/ui/LayoutSelector.tsx` - Manter apenas para uso no painel admin
- `src/app/menu/page.tsx` - Remover seletor (já feito)
- `src/infrastructure/context/LayoutContext.tsx` - Modificar para carregar tema do backend
- `src/config/layouts.ts` - Expandir com mais opções de tema

### Benefícios
- ✅ Interface mais limpa para o usuário final
- ✅ Controle total do restaurante sobre a aparência
- ✅ Experiência consistente para todos os clientes
- ✅ Personalização profissional sem confundir o usuário

---

## 🔧 Outras Tarefas

### Melhorias de Performance
- [ ] Otimizar carregamento de imagens
- [ ] Implementar lazy loading para produtos
- [ ] Cache de dados do menu

### Funcionalidades Adicionais
- [ ] Sistema de favoritos
- [ ] Histórico de pedidos
- [ ] Notificações push
- [ ] Integração com WhatsApp

### Melhorias de UX
- [ ] Animações mais suaves
- [ ] Feedback visual melhorado
- [ ] Acessibilidade (WCAG 2.1)
- [ ] Suporte a múltiplos idiomas 