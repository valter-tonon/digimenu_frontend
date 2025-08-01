'use client';

import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Receipt } from 'lucide-react';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
}

export interface PaymentMethodSelectionProps {
  selectedMethod: string;
  onMethodSelect: (methodId: string) => void;
  onPaymentDataChange: (data: any) => void;
  changeAmount?: string;
  onChangeAmountChange?: (amount: string) => void;
  className?: string;
}

const paymentMethods: PaymentMethod[] = [
  { 
    id: 'pix', 
    name: 'PIX', 
    icon: <Smartphone className="w-5 h-5" />,
    description: 'Pagamento instantâneo'
  },
  { 
    id: 'credit', 
    name: 'Cartão de Crédito', 
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Visa, Mastercard, Elo'
  },
  { 
    id: 'debit', 
    name: 'Cartão de Débito', 
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Débito na conta'
  },
  { 
    id: 'money', 
    name: 'Dinheiro', 
    icon: <Banknote className="w-5 h-5" />,
    description: 'Pagamento na entrega'
  },
  { 
    id: 'voucher', 
    name: 'Vale Refeição', 
    icon: <Receipt className="w-5 h-5" />,
    description: 'Ticket, Sodexo, Alelo'
  },
];

export function PaymentMethodSelection({
  selectedMethod,
  onMethodSelect,
  onPaymentDataChange,
  changeAmount = '',
  onChangeAmountChange,
  className = ''
}: PaymentMethodSelectionProps) {
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const [cardErrors, setCardErrors] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const handleMethodSelect = (methodId: string) => {
    onMethodSelect(methodId);
    
    // Reset payment data when method changes
    if (methodId !== 'credit' && methodId !== 'debit') {
      setCardData({ number: '', name: '', expiry: '', cvv: '' });
      onPaymentDataChange({});
    }
  };

  // Reset card data when selectedMethod changes from outside
  React.useEffect(() => {
    if (selectedMethod !== 'credit' && selectedMethod !== 'debit') {
      setCardData({ number: '', name: '', expiry: '', cvv: '' });
      onPaymentDataChange({});
    }
  }, [selectedMethod, onPaymentDataChange]);

  const validateCardField = (field: string, value: string): string => {
    switch (field) {
      case 'number':
        const numbers = value.replace(/\s/g, '');
        if (!numbers) return '';
        if (numbers.length < 13) return 'Número do cartão deve ter pelo menos 13 dígitos';
        if (numbers.length > 19) return 'Número do cartão inválido';
        return '';
      
      case 'name':
        if (!value.trim()) return '';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        return '';
      
      case 'expiry':
        if (!value) return '';
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryRegex.test(value)) return 'Formato inválido (MM/AA)';
        
        // Check if not expired
        const [month, year] = value.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const now = new Date();
        if (expiryDate < now) return 'Cartão expirado';
        return '';
      
      case 'cvv':
        if (!value) return '';
        if (value.length < 3) return 'CVV deve ter 3 ou 4 dígitos';
        return '';
      
      default:
        return '';
    }
  };

  const handleCardDataChange = (field: string, value: string) => {
    const newCardData = { ...cardData, [field]: value };
    setCardData(newCardData);
    
    // Validate field and update errors
    const error = validateCardField(field, value);
    setCardErrors(prev => ({ ...prev, [field]: error }));
    
    onPaymentDataChange(newCardData);
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 16) {
      return numbers.substring(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + '/' + numbers.substring(2, 4);
    }
    return numbers;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Método de Pagamento</h3>
      
      {/* Payment Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleMethodSelect(method.id)}
            className={`p-4 border rounded-lg flex items-center space-x-3 transition-colors text-left ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex-shrink-0">
              {method.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{method.name}</p>
              {method.description && (
                <p className="text-sm text-gray-500">{method.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* PIX Payment Details */}
      {selectedMethod === 'pix' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">Pagamento PIX</h4>
          </div>
          <p className="text-sm text-green-700 mb-3">
            Após confirmar o pedido, você receberá um QR Code para pagamento instantâneo.
          </p>
          <div className="bg-white p-3 rounded border border-green-300">
            <p className="text-xs text-gray-600">
              ✓ Pagamento instantâneo<br/>
              ✓ Disponível 24h por dia<br/>
              ✓ Sem taxas adicionais
            </p>
          </div>
        </div>
      )}

      {/* Credit/Debit Card Form */}
      {(selectedMethod === 'credit' || selectedMethod === 'debit') && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-800">
              Dados do {selectedMethod === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
            </h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Cartão
              </label>
              <input
                type="text"
                value={cardData.number}
                onChange={(e) => handleCardDataChange('number', formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  cardErrors.number ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {cardErrors.number && (
                <p className="text-sm text-red-600 mt-1">{cardErrors.number}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome no Cartão
              </label>
              <input
                type="text"
                value={cardData.name}
                onChange={(e) => handleCardDataChange('name', e.target.value.toUpperCase())}
                placeholder="NOME COMO NO CARTÃO"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  cardErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {cardErrors.name && (
                <p className="text-sm text-red-600 mt-1">{cardErrors.name}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validade
                </label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={(e) => handleCardDataChange('expiry', formatExpiry(e.target.value))}
                  placeholder="MM/AA"
                  maxLength={5}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    cardErrors.expiry ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {cardErrors.expiry && (
                  <p className="text-sm text-red-600 mt-1">{cardErrors.expiry}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={(e) => {
                    const cvv = e.target.value.replace(/\D/g, '').substring(0, 4);
                    handleCardDataChange('cvv', cvv);
                  }}
                  placeholder="123"
                  maxLength={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    cardErrors.cvv ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {cardErrors.cvv && (
                  <p className="text-sm text-red-600 mt-1">{cardErrors.cvv}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment with Change */}
      {selectedMethod === 'money' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Banknote className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">Pagamento em Dinheiro</h4>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            Pagamento será feito na entrega. Informe se precisa de troco.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Troco para (opcional)
            </label>
            <input
              type="number"
              value={changeAmount}
              onChange={(e) => onChangeAmountChange?.(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco se não precisar de troco
            </p>
          </div>
        </div>
      )}

      {/* Voucher Payment */}
      {selectedMethod === 'voucher' && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium text-purple-800">Vale Refeição</h4>
          </div>
          <p className="text-sm text-purple-700">
            Pagamento será processado com seu vale refeição na entrega.
          </p>
          <div className="bg-white p-3 rounded border border-purple-300 mt-3">
            <p className="text-xs text-gray-600">
              ✓ Ticket, Sodexo, Alelo<br/>
              ✓ Verificação na entrega<br/>
              ✓ Saldo será consultado
            </p>
          </div>
        </div>
      )}
    </div>
  );
}