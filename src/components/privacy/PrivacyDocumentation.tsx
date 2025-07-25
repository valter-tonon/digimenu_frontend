/**
 * Documentação de privacidade
 * 
 * Componente que explica detalhadamente todos os dados coletados,
 * como são usados, políticas de retenção e direitos do usuário.
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrivacyDocumentationProps {
  className?: string;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  dataPoints: DataPoint[];
  purpose: string[];
  retention: string;
  sharing: string;
  userRights: string[];
}

interface DataPoint {
  name: string;
  description: string;
  example?: string;
  required: boolean;
  automated: boolean;
}

export const PrivacyDocumentation: React.FC<PrivacyDocumentationProps> = ({
  className = ''
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const dataCategories: DataCategory[] = [
    {
      id: 'fingerprinting',
      name: 'Identificação do Dispositivo (Fingerprinting)',
      description: 'Informações técnicas coletadas automaticamente do seu dispositivo para criar uma identificação única.',
      dataPoints: [
        {
          name: 'User Agent',
          description: 'Informações sobre seu navegador e sistema operacional',
          example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          required: true,
          automated: true
        },
        {
          name: 'Resolução de Tela',
          description: 'Largura e altura da sua tela em pixels',
          example: '1920x1080',
          required: true,
          automated: true
        },
        {
          name: 'Fuso Horário',
          description: 'Seu fuso horário local',
          example: 'America/Sao_Paulo',
          required: true,
          automated: true
        },
        {
          name: 'Idioma do Navegador',
          description: 'Idiomas configurados no seu navegador',
          example: 'pt-BR, en-US',
          required: true,
          automated: true
        },
        {
          name: 'Canvas Fingerprint',
          description: 'Assinatura única baseada na renderização de elementos gráficos',
          example: 'hash: a1b2c3d4e5f6...',
          required: false,
          automated: true
        },
        {
          name: 'WebGL Fingerprint',
          description: 'Informações sobre capacidades gráficas do dispositivo',
          example: 'renderer: ANGLE (Intel HD Graphics)',
          required: false,
          automated: true
        }
      ],
      purpose: [
        'Detectar atividades suspeitas e tentativas de fraude',
        'Prevenir criação de múltiplas contas falsas',
        'Manter segurança do sistema',
        'Identificar bots e comportamentos automatizados'
      ],
      retention: '24 horas após última atividade',
      sharing: 'Não compartilhamos com terceiros. Usado apenas internamente para segurança.',
      userRights: [
        'Pode optar por não fornecer (opt-out)',
        'Pode solicitar remoção a qualquer momento',
        'Pode visualizar dados coletados',
        'Pode exportar dados em formato JSON'
      ]
    },
    {
      id: 'sessions',
      name: 'Dados de Sessão',
      description: 'Informações sobre sua sessão ativa no sistema, incluindo contexto de uso.',
      dataPoints: [
        {
          name: 'ID da Sessão',
          description: 'Identificador único da sua sessão atual',
          example: 'session_1234567890_abc123',
          required: true,
          automated: true
        },
        {
          name: 'Loja Acessada',
          description: 'ID da loja que você está visitando',
          example: 'store_123',
          required: true,
          automated: true
        },
        {
          name: 'Mesa/Contexto',
          description: 'Mesa ou contexto de delivery',
          example: 'Mesa 15 ou Delivery',
          required: false,
          automated: true
        },
        {
          name: 'Timestamp de Criação',
          description: 'Quando a sessão foi criada',
          example: '2024-01-15T10:30:00Z',
          required: true,
          automated: true
        },
        {
          name: 'Última Atividade',
          description: 'Timestamp da última interação',
          example: '2024-01-15T11:45:00Z',
          required: true,
          automated: true
        },
        {
          name: 'Status de Autenticação',
          description: 'Se você está logado ou é visitante',
          example: 'autenticado/visitante',
          required: true,
          automated: true
        }
      ],
      purpose: [
        'Manter sua sessão ativa durante o uso',
        'Associar pedidos ao contexto correto (mesa/delivery)',
        'Controlar tempo de expiração de sessão',
        'Permitir recuperação de sessão após desconexão'
      ],
      retention: '4 horas para mesa, 2 horas para delivery, mais 1 hora após expiração',
      sharing: 'Compartilhado apenas com a loja específica para processamento de pedidos.',
      userRights: [
        'Pode encerrar sessão a qualquer momento',
        'Pode visualizar dados da sessão',
        'Sessão expira automaticamente por inatividade',
        'Pode solicitar remoção imediata'
      ]
    },
    {
      id: 'authentication',
      name: 'Dados de Autenticação',
      description: 'Informações coletadas durante processos de autenticação via WhatsApp ou cadastro rápido.',
      dataPoints: [
        {
          name: 'Número de Telefone',
          description: 'Seu número de WhatsApp para autenticação',
          example: '+55 11 99999-9999 (mascarado: +55 11 999**-**99)',
          required: true,
          automated: false
        },
        {
          name: 'Nome',
          description: 'Nome fornecido no cadastro rápido',
          example: 'João Silva',
          required: true,
          automated: false
        },
        {
          name: 'Email',
          description: 'Email opcional para comunicações',
          example: 'joao@email.com',
          required: false,
          automated: false
        },
        {
          name: 'Tokens de Acesso',
          description: 'Tokens temporários para magic links',
          example: 'jwt_token_abc123 (expira em 15 minutos)',
          required: true,
          automated: true
        },
        {
          name: 'Tentativas de Autenticação',
          description: 'Registro de tentativas de login',
          example: 'Sucesso/Falha + timestamp',
          required: true,
          automated: true
        }
      ],
      purpose: [
        'Permitir acesso ao sistema via WhatsApp',
        'Criar conta de usuário visitante',
        'Associar pedidos ao usuário correto',
        'Comunicar sobre status de pedidos'
      ],
      retention: 'Tokens: 15 minutos. Dados pessoais: até remoção da conta ou opt-out.',
      sharing: 'Telefone compartilhado com serviço de WhatsApp apenas para envio de magic link.',
      userRights: [
        'Pode solicitar remoção de dados pessoais',
        'Pode atualizar informações a qualquer momento',
        'Pode optar por não receber comunicações',
        'Pode exportar dados pessoais'
      ]
    },
    {
      id: 'security',
      name: 'Dados de Segurança',
      description: 'Informações coletadas para detectar e prevenir atividades suspeitas.',
      dataPoints: [
        {
          name: 'Endereço IP',
          description: 'Seu endereço IP público',
          example: '192.168.1.1 (mascarado: 192.168.*.*)',
          required: true,
          automated: true
        },
        {
          name: 'Padrões de Requisição',
          description: 'Frequência e timing de suas requisições',
          example: '10 requisições em 60 segundos',
          required: true,
          automated: true
        },
        {
          name: 'Atividades Suspeitas',
          description: 'Detecção de comportamentos anômalos',
          example: 'Bot detectado, múltiplos fingerprints',
          required: true,
          automated: true
        },
        {
          name: 'Bloqueios Temporários',
          description: 'Histórico de bloqueios por segurança',
          example: 'IP bloqueado por 2 horas',
          required: true,
          automated: true
        }
      ],
      purpose: [
        'Detectar e prevenir ataques de força bruta',
        'Identificar bots e comportamentos automatizados',
        'Proteger contra fraudes e abusos',
        'Manter integridade do sistema'
      ],
      retention: '7 dias para dados de requisição, 90 dias para atividades suspeitas',
      sharing: 'Não compartilhado. Usado apenas para segurança interna.',
      userRights: [
        'Pode contestar bloqueios incorretos',
        'Pode solicitar revisão de atividade suspeita',
        'Pode ser adicionado à whitelist se necessário',
        'Pode visualizar histórico de segurança'
      ]
    },
    {
      id: 'usage',
      name: 'Dados de Uso e Analytics',
      description: 'Informações sobre como você usa o sistema para melhorias e otimizações.',
      dataPoints: [
        {
          name: 'Páginas Visitadas',
          description: 'URLs das páginas que você acessa',
          example: '/menu/store123, /checkout',
          required: false,
          automated: true
        },
        {
          name: 'Tempo de Sessão',
          description: 'Duração total da sua sessão',
          example: '25 minutos',
          required: false,
          automated: true
        },
        {
          name: 'Interações com Interface',
          description: 'Cliques, scrolls e outras interações',
          example: 'Clique no botão "Adicionar ao Carrinho"',
          required: false,
          automated: true
        },
        {
          name: 'Carrinho de Compras',
          description: 'Itens adicionados e removidos do carrinho',
          example: '2x Hambúrguer, 1x Refrigerante',
          required: false,
          automated: true
        },
        {
          name: 'Preferências',
          description: 'Configurações e preferências salvas',
          example: 'Idioma: PT-BR, Tema: Claro',
          required: false,
          automated: true
        }
      ],
      purpose: [
        'Melhorar experiência do usuário',
        'Otimizar performance do sistema',
        'Identificar problemas de usabilidade',
        'Desenvolver novas funcionalidades'
      ],
      retention: '30 dias para dados detalhados, 1 ano para estatísticas agregadas',
      sharing: 'Dados agregados e anonimizados podem ser compartilhados com parceiros para melhorias.',
      userRights: [
        'Pode optar por não fornecer dados de analytics',
        'Pode visualizar dados coletados',
        'Pode solicitar anonimização',
        'Pode exportar histórico de uso'
      ]
    }
  ];

  const filteredCategories = dataCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.dataPoints.some(point => 
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📋 Documentação de Privacidade
        </h2>
        <p className="text-gray-600 mb-4">
          Transparência completa sobre todos os dados que coletamos, 
          como os usamos e seus direitos sobre eles.
        </p>
        
        {/* Busca */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar informações sobre dados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="p-6 bg-blue-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📊 Resumo Executivo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800">Dados Coletados</h4>
            <p className="text-blue-700">
              {dataCategories.reduce((sum, cat) => sum + cat.dataPoints.length, 0)} tipos diferentes
            </p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Finalidade Principal</h4>
            <p className="text-blue-700">
              Segurança, funcionalidade e melhoria da experiência
            </p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Seus Direitos</h4>
            <p className="text-blue-700">
              Acesso, correção, exportação e remoção completa
            </p>
          </div>
        </div>
      </div>

      {/* Categorias de Dados */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Categorias de Dados Coletados
        </h3>
        
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setActiveCategory(
                  activeCategory === category.id ? null : category.id
                )}
                className="w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {category.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {category.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{category.dataPoints.length} tipos de dados</span>
                      <span>•</span>
                      <span>Retenção: {category.retention}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      activeCategory === category.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {activeCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      {/* Dados Coletados */}
                      <div className="mb-6">
                        <h5 className="font-medium text-gray-900 mb-3">
                          📋 Dados Coletados
                        </h5>
                        <div className="space-y-3">
                          {category.dataPoints.map((point, index) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-start mb-2">
                                <h6 className="font-medium text-gray-900">
                                  {point.name}
                                </h6>
                                <div className="flex space-x-2">
                                  {point.required && (
                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                      Obrigatório
                                    </span>
                                  )}
                                  {point.automated && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                      Automático
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {point.description}
                              </p>
                              {point.example && (
                                <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
                                  Exemplo: {point.example}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Finalidade */}
                      <div className="mb-6">
                        <h5 className="font-medium text-gray-900 mb-3">
                          🎯 Finalidade do Uso
                        </h5>
                        <ul className="space-y-1">
                          {category.purpose.map((purpose, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {purpose}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Compartilhamento */}
                      <div className="mb-6">
                        <h5 className="font-medium text-gray-900 mb-3">
                          🔗 Compartilhamento
                        </h5>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                          {category.sharing}
                        </p>
                      </div>

                      {/* Direitos do Usuário */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">
                          ⚖️ Seus Direitos
                        </h5>
                        <ul className="space-y-1">
                          {category.userRights.map((right, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">✓</span>
                              {right}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Informações Legais */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚖️ Base Legal e Conformidade
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">LGPD (Lei Geral de Proteção de Dados)</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Consentimento explícito para dados não essenciais</li>
              <li>• Direito ao acesso, correção e portabilidade</li>
              <li>• Direito ao esquecimento (remoção de dados)</li>
              <li>• Transparência sobre uso dos dados</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Bases Legais para Processamento</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <strong>Consentimento:</strong> Analytics e marketing</li>
              <li>• <strong>Interesse legítimo:</strong> Segurança e fraude</li>
              <li>• <strong>Execução contratual:</strong> Processamento de pedidos</li>
              <li>• <strong>Obrigação legal:</strong> Registros fiscais</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📞 Contato para Questões de Privacidade</h4>
          <p className="text-sm text-blue-800">
            Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
            entre em contato através do email: <strong>privacidade@digimenu.com</strong>
          </p>
          <p className="text-xs text-blue-700 mt-2">
            Responderemos em até 15 dias úteis conforme previsto na LGPD.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyDocumentation;