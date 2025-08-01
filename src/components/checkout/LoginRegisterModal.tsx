'use client';

import { useState, useEffect } from 'react';
import { X, Phone, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'react-hot-toast';
import { requestWhatsAppCode, verifyWhatsAppCode, quickRegisterCustomer } from '@/services/api';

export interface LoginRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: any) => void;
  storeId: string;
  initialMode?: 'login' | 'register';
}

type ModalMode = 'login' | 'register' | 'phone_verification';

export const LoginRegisterModal: React.FC<LoginRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  initialMode = 'login'
}) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');

  const [loginData, setLoginData] = useState({
    phone: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLoginData({ phone: '', password: '' });
      setRegisterData({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
      setVerificationCode('');
      setVerificationPhone('');
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10;
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleLogin = async () => {
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!validatePhone(loginData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (!loginData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // For now, we'll use the WhatsApp verification flow
      // In a real app, this would be a proper login endpoint
      const numbersOnly = loginData.phone.replace(/\D/g, '');

      const response = await requestWhatsAppCode(numbersOnly, storeId);

      if (response.data?.success) {
        setVerificationPhone(numbersOnly);
        setMode('phone_verification');
        toast.success('Código de verificação enviado!');
      } else {
        throw new Error(response.data?.message || 'Erro ao enviar código');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao fazer login';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!registerData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (registerData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!validatePhone(registerData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (registerData.email && !validateEmail(registerData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!validatePassword(registerData.password)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const numbersOnly = registerData.phone.replace(/\D/g, '');
      console.log('olha nós ' + storeId)
      const response = await quickRegisterCustomer({
        name: registerData.name.trim(),
        phone: numbersOnly,
        email: registerData.email?.trim() || undefined,
        tenant_id: storeId
      });

      if (response.data?.success && response.data?.data) {
        const newCustomer = response.data.data;
        toast.success('Conta criada com sucesso!');
        onSuccess(newCustomer);
        onClose();
      } else {
        throw new Error(response.data?.message || 'Erro ao criar conta');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar conta';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setErrors({});

    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ code: 'Código deve ter 6 dígitos' });
      return;
    }

    setLoading(true);
    try {
      const response = await verifyWhatsAppCode(verificationPhone, verificationCode, storeId);

      if (response.data?.success && response.data?.data?.token) {
        const token = response.data.data.token;
        const customer = response.data.data.customer;

        // Login with the received token
        login(token);

        toast.success('Login realizado com sucesso!');
        onSuccess(customer);
        onClose();
      } else {
        throw new Error(response.data?.message || 'Código inválido');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Código inválido';
      toast.error(errorMessage);
      setErrors({ code: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefone
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="tel"
            value={loginData.phone}
            onChange={(e) => {
              const formatted = formatPhone(e.target.value);
              setLoginData({ ...loginData, phone: formatted });
              setErrors({ ...errors, phone: '' });
            }}
            placeholder="(11) 99999-9999"
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={loginData.password}
            onChange={(e) => {
              setLoginData({ ...loginData, password: e.target.value });
              setErrors({ ...errors, password: '' });
            }}
            placeholder="Sua senha"
            className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
        )}
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={loading || !loginData.phone || !loginData.password}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Entrar
      </button>

      <div className="text-center">
        <button
          onClick={() => setMode('register')}
          className="text-sm text-blue-600 hover:text-blue-700"
          disabled={loading}
        >
          Não tem conta? Criar conta
        </button>
      </div>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome Completo
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={registerData.name}
            onChange={(e) => {
              setRegisterData({ ...registerData, name: e.target.value });
              setErrors({ ...errors, name: '' });
            }}
            placeholder="Seu nome completo"
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
        </div>
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefone
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="tel"
            value={registerData.phone}
            onChange={(e) => {
              const formatted = formatPhone(e.target.value);
              setRegisterData({ ...registerData, phone: formatted });
              setErrors({ ...errors, phone: '' });
            }}
            placeholder="(11) 99999-9999"
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail (opcional)
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="email"
            value={registerData.email}
            onChange={(e) => {
              setRegisterData({ ...registerData, email: e.target.value });
              setErrors({ ...errors, email: '' });
            }}
            placeholder="seu@email.com"
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={registerData.password}
            onChange={(e) => {
              setRegisterData({ ...registerData, password: e.target.value });
              setErrors({ ...errors, password: '' });
            }}
            placeholder="Mínimo 6 caracteres"
            className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={registerData.confirmPassword}
            onChange={(e) => {
              setRegisterData({ ...registerData, confirmPassword: e.target.value });
              setErrors({ ...errors, confirmPassword: '' });
            }}
            placeholder="Confirme sua senha"
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading || !registerData.name || !registerData.phone || !registerData.password}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Criar Conta
      </button>

      <div className="text-center">
        <button
          onClick={() => setMode('login')}
          className="text-sm text-blue-600 hover:text-blue-700"
          disabled={loading}
        >
          Já tem conta? Fazer login
        </button>
      </div>
    </div>
  );

  const renderVerificationForm = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <Phone className="w-12 h-12 text-blue-600 mx-auto" />
        <h3 className="text-lg font-semibold text-gray-900">Verificação</h3>
        <p className="text-sm text-gray-600">
          Enviamos um código para {formatPhone(verificationPhone)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Código de Verificação
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setVerificationCode(value);
            setErrors({ ...errors, code: '' });
          }}
          placeholder="000000"
          className={`w-full px-3 py-3 border rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.code ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={loading}
          maxLength={6}
        />
        {errors.code && (
          <p className="text-sm text-red-600 mt-1">{errors.code}</p>
        )}
      </div>

      <button
        onClick={handleVerifyCode}
        disabled={loading || verificationCode.length !== 6}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Verificar Código
      </button>

      <div className="text-center">
        <button
          onClick={() => setMode('login')}
          className="text-sm text-gray-600 hover:text-gray-700"
          disabled={loading}
        >
          Voltar
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Entrar na Conta';
      case 'register':
        return 'Criar Conta';
      case 'phone_verification':
        return 'Verificação';
      default:
        return 'Autenticação';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
        {mode === 'phone_verification' && renderVerificationForm()}
      </div>
    </div>
  );
};
