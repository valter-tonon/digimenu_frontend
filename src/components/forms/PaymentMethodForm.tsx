'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, Receipt, QrCode, AlertCircle, Check, Loader2, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { cn } from '@/lib/utils';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

export interface PaymentData {
  method: string;
  cardData?: {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
  };
  pixData?: {
    qrCode: string;
    pixKey: string;
    amount: number;
  };
  cashData?: {
    changeFor: number;
    changeAmount: number;
  };
}

export interface PaymentMethodFormProps {
  onSubmit: (paymentData: PaymentData) => void;
  onCancel?: () => void;
  orderTotal: number;
  isLoading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

interface FormErrors {
  method?: string;
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  changeFor?: string;
  general?: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'pix',
    name: 'PIX',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'Pagamento instantâneo via QR Code',
    enabled: true
  },
  {
    id: 'credit',
    name: 'Cartão de Crédito',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Visa, Mastercard, Elo',
    enabled: true
  },
  {
    id: 'debit',
    name: 'Cartão de Débito',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Débito na conta',
    enabled: true
  },
  {
    id: 'cash',
    name: 'Dinheiro',
    icon: <Banknote className="w-5 h-5" />,
    description: 'Pagamento na entrega',
    enabled: true
  },
  {
    id: 'voucher',
    name: 'Vale Refeição',
    icon: <Receipt className="w-5 h-5" />,
    description: 'Ticket, Sodexo, Alelo',
    enabled: true
  }
];

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  onSubmit,
  onCancel,
  orderTotal,
  isLoading = false,
  className,
  title = 'Método de Pagamento',
  subtitle = 'Escolha como deseja pagar seu pedido'
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});

  // Card data state
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  // PIX data state
  const [pixData, setPixData] = useState({
    qrCode: '',
    pixKey: '',
    amount: orderTotal
  });

  // Cash data state
  const [cashData, setCashData] = useState({
    changeFor: 0,
    changeAmount: 0
  });

  // PIX QR Code generation state
  const [generatingPix, setGeneratingPix] = useState(false);

  // Clear errors when values change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (newErrors[key as keyof FormErrors]) {
          delete newErrors[key as keyof FormErrors];
        }
      });
      setErrors(newErrors);
    }
  }, [selectedMethod, cardData, cashData]);

  // Generate PIX QR Code when PIX is selected
  useEffect(() => {
    if (selectedMethod === 'pix' && !pixData.qrCode) {
      generatePixQRCode();
    }
  }, [selectedMethod]);

  // Calculate change amount when changeFor changes
  useEffect(() => {
    if (selectedMethod === 'cash' && cashData.changeFor > 0) {
      const changeAmount = cashData.changeFor - orderTotal;
      setCashData(prev => ({ ...prev, changeAmount: Math.max(0, changeAmount) }));
    }
  }, [cashData.changeFor, orderTotal, selectedMethod]);

  // Generate PIX QR Code (mock implementation)
  const generatePixQRCode = async () => {
    setGeneratingPix(true);
    try {
      // Simulate API call to generate PIX QR Code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock PIX data
      const mockPixKey = `pix-${Date.now()}@restaurant.com`;
      const mockQRCode = `00020126580014BR.GOV.BCB.PIX0136${mockPixKey}5204000053039865802BR5925Restaurant Name6009SAO PAULO62070503***6304${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      setPixData({
        qrCode: mockQRCode,
        pixKey: mockPixKey,
        amount: orderTotal
      });
      
      toast.success('QR Code PIX gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar QR Code PIX');
      setErrors(prev => ({ ...prev, general: 'Erro ao gerar QR Code PIX' }));
    } finally {
      setGeneratingPix(false);
    }
  };

  // Format card number
  const formatCardNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 16) {
      return numbers.substring(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  // Format expiry date
  const formatExpiry = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + '/' + numbers.substring(2, 4);
    }
    return numbers;
  };

  // Validate card number using Luhn algorithm
  const validateCardNumber = (number: string): boolean => {
    const digits = number.replace(/\s/g, '').split('').map(Number);
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Validate expiry date
  const validateExpiry = (expiry: string): boolean => {
    if (!expiry || expiry.length !== 5) return false;
    
    const [month, year] = expiry.split('/');
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (monthNum < 1 || monthNum > 12) return false;
    
    const expiryDate = new Date(2000 + yearNum, monthNum - 1);
    const now = new Date();
    
    return expiryDate > now;
  };

  // Handle method selection
  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setErrors({});
    
    // Reset form data when method changes
    if (methodId !== 'credit' && methodId !== 'debit') {
      setCardData({ number: '', name: '', expiry: '', cvv: '' });
    }
    if (methodId !== 'cash') {
      setCashData({ changeFor: 0, changeAmount: 0 });
    }
  };

  // Handle card data change with real-time validation
  const handleCardDataChange = (field: keyof typeof cardData, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'name') {
      formattedValue = value.toUpperCase();
    }
    
    setCardData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Real-time validation
    let isValid = true;
    switch (field) {
      case 'number':
        isValid = validateCardNumber(formattedValue);
        break;
      case 'name':
        isValid = formattedValue.trim().length >= 2;
        break;
      case 'expiry':
        isValid = validateExpiry(formattedValue);
        break;
      case 'cvv':
        isValid = formattedValue.length >= 3;
        break;
    }
    
    setValidationState(prev => ({ ...prev, [`card${field.charAt(0).toUpperCase() + field.slice(1)}`]: isValid }));
  };

  // Handle cash change calculation
  const handleChangeForChange = (value: string) => {
    const changeFor = parseFloat(value) || 0;
    const changeAmount = Math.max(0, changeFor - orderTotal);
    
    setCashData({ changeFor, changeAmount });
    setValidationState(prev => ({ ...prev, changeFor: changeFor >= orderTotal }));
  };

  // Copy PIX key to clipboard
  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixData.pixKey);
      toast.success('Chave PIX copiada!');
    } catch (error) {
      toast.error('Erro ao copiar chave PIX');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!selectedMethod) {
      newErrors.method = 'Selecione um método de pagamento';
    }
    
    if (selectedMethod === 'credit' || selectedMethod === 'debit') {
      if (!cardData.number) {
        newErrors.cardNumber = 'Número do cartão é obrigatório';
      } else if (!validateCardNumber(cardData.number)) {
        newErrors.cardNumber = 'Número do cartão inválido';
      }
      
      if (!cardData.name.trim()) {
        newErrors.cardName = 'Nome no cartão é obrigatório';
      } else if (cardData.name.trim().length < 2) {
        newErrors.cardName = 'Nome deve ter pelo menos 2 caracteres';
      }
      
      if (!cardData.expiry) {
        newErrors.cardExpiry = 'Data de validade é obrigatória';
      } else if (!validateExpiry(cardData.expiry)) {
        newErrors.cardExpiry = 'Data de validade inválida';
      }
      
      if (!cardData.cvv) {
        newErrors.cardCvv = 'CVV é obrigatório';
      } else if (cardData.cvv.length < 3) {
        newErrors.cardCvv = 'CVV deve ter 3 ou 4 dígitos';
      }
    }
    
    if (selectedMethod === 'cash' && cashData.changeFor > 0 && cashData.changeFor < orderTotal) {
      newErrors.changeFor = `Valor deve ser maior que R$ ${orderTotal.toFixed(2)}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || isLoading) return;
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    setSubmitting(true);
    try {
      const paymentData: PaymentData = {
        method: selectedMethod
      };
      
      if (selectedMethod === 'credit' || selectedMethod === 'debit') {
        paymentData.cardData = {
          ...cardData,
          number: cardData.number.replace(/\s/g, '') // Remove formatting
        };
      } else if (selectedMethod === 'pix') {
        paymentData.pixData = pixData;
      } else if (selectedMethod === 'cash') {
        paymentData.cashData = cashData;
      }
      
      onSubmit(paymentData);
      toast.success('Método de pagamento confirmado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pagamento');
      setErrors({ general: error.message || 'Erro ao processar pagamento' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MagicCard className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Order Total */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">Total do Pedido:</span>
            <span className="text-lg font-bold text-blue-900">
              R$ {orderTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Escolha o método de pagamento *
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.filter(method => method.enabled).map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => handleMethodSelect(method.id)}
                className={cn(
                  "p-4 border rounded-lg flex items-center space-x-3 transition-colors text-left",
                  selectedMethod === method.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400 text-gray-700"
                )}
                disabled={isLoading || submitting}
              >
                <div className="flex-shrink-0">
                  {method.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm opacity-75">{method.description}</p>
                </div>
                {selectedMethod === method.id && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>
          
          {errors.method && (
            <div className="flex items-center space-x-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.method}</span>
            </div>
          )}
        </div>

        {/* PIX Payment Details */}
        {selectedMethod === 'pix' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Smartphone className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">Pagamento PIX</h4>
            </div>
            
            {generatingPix ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <span className="ml-2 text-green-700">Gerando QR Code...</span>
              </div>
            ) : pixData.qrCode ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-green-300 text-center">
                  <QrCode className="w-32 h-32 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 mb-2">QR Code PIX</p>
                  <p className="text-sm font-mono text-gray-800 break-all bg-gray-100 p-2 rounded">
                    {pixData.qrCode}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Chave PIX:</span>
                    <button
                      type="button"
                      onClick={copyPixKey}
                      className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-800"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </button>
                  </div>
                  <p className="text-sm font-mono text-gray-700 bg-white p-2 rounded border">
                    {pixData.pixKey}
                  </p>
                </div>
                
                <div className="text-xs text-green-700">
                  ✓ Pagamento instantâneo<br/>
                  ✓ Disponível 24h por dia<br/>
                  ✓ Sem taxas adicionais
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={generatePixQRCode}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Gerar QR Code PIX
              </button>
            )}
          </div>
        )}

        {/* Credit/Debit Card Form */}
        {(selectedMethod === 'credit' || selectedMethod === 'debit') && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-800">
                Dados do {selectedMethod === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
              </h4>
            </div>
            
            <div className="space-y-4">
              {/* Card Number */}
              <div>
                <label htmlFor="card-number-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Número do Cartão *
                </label>
                <div className="relative">
                  <input
                    id="card-number-input"
                    type="text"
                    value={cardData.number}
                    onChange={(e) => handleCardDataChange('number', e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={cn(
                      "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                      errors.cardNumber ? "border-red-300 bg-red-50" : 
                      validationState.cardNumber && cardData.number ? "border-green-300 bg-green-50" : "border-gray-300"
                    )}
                    disabled={isLoading || submitting}
                    aria-invalid={!!errors.cardNumber}
                    aria-describedby={errors.cardNumber ? "card-number-error" : undefined}
                  />
                  {cardData.number && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validationState.cardNumber ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {errors.cardNumber && (
                  <div id="card-number-error" className="flex items-center space-x-1 text-sm text-red-600 mt-1" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.cardNumber}</span>
                  </div>
                )}
              </div>
              
              {/* Card Name */}
              <div>
                <label htmlFor="card-name-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome no Cartão *
                </label>
                <input
                  id="card-name-input"
                  type="text"
                  value={cardData.name}
                  onChange={(e) => handleCardDataChange('name', e.target.value)}
                  placeholder="NOME COMO NO CARTÃO"
                  className={cn(
                    "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                    errors.cardName ? "border-red-300 bg-red-50" : 
                    validationState.cardName && cardData.name ? "border-green-300 bg-green-50" : "border-gray-300"
                  )}
                  disabled={isLoading || submitting}
                  aria-invalid={!!errors.cardName}
                  aria-describedby={errors.cardName ? "card-name-error" : undefined}
                />
                {errors.cardName && (
                  <div id="card-name-error" className="flex items-center space-x-1 text-sm text-red-600 mt-1" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.cardName}</span>
                  </div>
                )}
              </div>
              
              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="card-expiry-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Validade *
                  </label>
                  <input
                    id="card-expiry-input"
                    type="text"
                    value={cardData.expiry}
                    onChange={(e) => handleCardDataChange('expiry', e.target.value)}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={cn(
                      "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                      errors.cardExpiry ? "border-red-300 bg-red-50" : 
                      validationState.cardExpiry && cardData.expiry ? "border-green-300 bg-green-50" : "border-gray-300"
                    )}
                    disabled={isLoading || submitting}
                    aria-invalid={!!errors.cardExpiry}
                    aria-describedby={errors.cardExpiry ? "card-expiry-error" : undefined}
                  />
                  {errors.cardExpiry && (
                    <div id="card-expiry-error" className="flex items-center space-x-1 text-sm text-red-600 mt-1" role="alert">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.cardExpiry}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="card-cvv-input" className="block text-sm font-medium text-gray-700 mb-1">
                    CVV *
                  </label>
                  <input
                    id="card-cvv-input"
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => handleCardDataChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className={cn(
                      "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                      errors.cardCvv ? "border-red-300 bg-red-50" : 
                      validationState.cardCvv && cardData.cvv ? "border-green-300 bg-green-50" : "border-gray-300"
                    )}
                    disabled={isLoading || submitting}
                    aria-invalid={!!errors.cardCvv}
                    aria-describedby={errors.cardCvv ? "card-cvv-error" : undefined}
                  />
                  {errors.cardCvv && (
                    <div id="card-cvv-error" className="flex items-center space-x-1 text-sm text-red-600 mt-1" role="alert">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.cardCvv}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Payment */}
        {selectedMethod === 'cash' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Banknote className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">Pagamento em Dinheiro</h4>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-yellow-700">
                Pagamento será feito na entrega. Informe se precisa de troco.
              </p>
              
              <div>
                <label htmlFor="change-for-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Troco para (opcional)
                </label>
                <input
                  id="change-for-input"
                  type="number"
                  value={cashData.changeFor || ''}
                  onChange={(e) => handleChangeForChange(e.target.value)}
                  placeholder="0,00"
                  step="0.01"
                  min={orderTotal}
                  className={cn(
                    "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                    errors.changeFor ? "border-red-300 bg-red-50" : "border-gray-300"
                  )}
                  disabled={isLoading || submitting}
                  aria-invalid={!!errors.changeFor}
                  aria-describedby={errors.changeFor ? "change-for-error" : undefined}
                />
                {errors.changeFor && (
                  <div id="change-for-error" className="flex items-center space-x-1 text-sm text-red-600 mt-1" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.changeFor}</span>
                  </div>
                )}
                
                {cashData.changeFor > 0 && (
                  <div className="mt-2 p-2 bg-white rounded border border-yellow-300">
                    <div className="flex justify-between text-sm">
                      <span>Valor do pedido:</span>
                      <span>R$ {orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Valor pago:</span>
                      <span>R$ {cashData.changeFor.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium border-t pt-1 mt-1">
                      <span>Troco:</span>
                      <span className="text-green-600">R$ {cashData.changeAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco se não precisar de troco
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Voucher Payment */}
        {selectedMethod === 'voucher' && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Receipt className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-purple-800">Vale Refeição</h4>
            </div>
            
            <p className="text-sm text-purple-700 mb-3">
              Pagamento será processado com seu vale refeição na entrega.
            </p>
            
            <div className="bg-white p-3 rounded border border-purple-300">
              <p className="text-xs text-gray-600">
                ✓ Ticket, Sodexo, Alelo<br/>
                ✓ Verificação na entrega<br/>
                ✓ Saldo será consultado
              </p>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isLoading || submitting}
            >
              Cancelar
            </button>
          )}
          
          <ShimmerButton
            type="submit"
            disabled={isLoading || submitting || !selectedMethod}
            className="flex-1"
          >
            {(isLoading || submitting) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Pagamento
          </ShimmerButton>
        </div>
      </form>
    </MagicCard>
  );
};