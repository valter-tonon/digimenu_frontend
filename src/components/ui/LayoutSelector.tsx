'use client';

/**
 * LayoutSelector - Componente para seleção de temas
 * 
 * TODO: Este componente será usado apenas no painel administrativo.
 * A seleção de tema foi removida da interface do usuário final.
 * O tema será configurado pelo restaurante no painel admin.
 */

import { useState } from 'react';
import { useLayout } from '@/infrastructure/context/LayoutContext';
import { Check, ChevronDown, Palette } from 'lucide-react';

interface LayoutSelectorProps {
  className?: string;
  compact?: boolean;
}

export function LayoutSelector({ className = '', compact = false }: LayoutSelectorProps) {
  const { currentLayout, availableLayouts, setLayout } = useLayout();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectLayout = (layoutId: string) => {
    setLayout(layoutId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botão para abrir o seletor */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Selecionar layout"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Palette className="w-4 h-4 text-primary" />
        {!compact && (
          <>
            <span className="text-sm font-medium">Layout: {currentLayout.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown com opções de layout */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-dropdown">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Escolha um layout</h3>
            <p className="text-xs text-gray-500 mt-1">
              Personalize a aparência do cardápio
            </p>
          </div>
          
          <ul className="py-2" role="listbox">
            {availableLayouts.map((layout) => (
              <li
                key={layout.id}
                role="option"
                aria-selected={currentLayout.id === layout.id}
                className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentLayout.id === layout.id ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleSelectLayout(layout.id)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: layout.theme.colors.primary }}
                  />
                  <div>
                    <div className="text-sm font-medium">{layout.name}</div>
                    <div className="text-xs text-gray-500">{layout.description}</div>
                  </div>
                </div>
                
                {currentLayout.id === layout.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </li>
            ))}
          </ul>
          
          <div className="p-3 border-t border-gray-100 text-xs text-gray-500">
            As alterações são salvas automaticamente
          </div>
        </div>
      )}
    </div>
  );
}

// Versão para painel de administração com mais opções
export function AdminLayoutSelector({ className = '' }: LayoutSelectorProps) {
  const { currentLayout, availableLayouts, setLayout, updateLayoutConfig, resetToDefault } = useLayout();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectLayout = (layoutId: string) => {
    setLayout(layoutId);
    setIsOpen(false);
  };

  const handleReset = () => {
    resetToDefault();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Configurar layout"
      >
        <Palette className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium">Configurar Layout</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-dropdown">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Configurações de Layout</h3>
            <p className="text-sm text-gray-500 mt-1">
              Personalize a aparência do cardápio para seus clientes
            </p>
          </div>
          
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layout Atual
            </label>
            <select
              value={currentLayout.id}
              onChange={(e) => handleSelectLayout(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableLayouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name} - {layout.description}
                </option>
              ))}
            </select>
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor Principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={currentLayout.theme.colors.primary}
                onChange={(e) => {
                  updateLayoutConfig({
                    theme: {
                      colors: {
                        primary: e.target.value,
                      },
                    },
                  });
                }}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={currentLayout.theme.colors.primary}
                onChange={(e) => {
                  updateLayoutConfig({
                    theme: {
                      colors: {
                        primary: e.target.value,
                      },
                    },
                  });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 flex justify-between">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Restaurar Padrão
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}