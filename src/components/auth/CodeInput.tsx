'use client';

import React, { useRef, useEffect, useState } from 'react';

interface CodeInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  isLoading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

/**
 * CodeInput Component - 6-digit code input with auto-focus
 *
 * Features:
 * - Auto-focus on next field after digit entry
 * - Auto-focus on previous field on backspace
 * - Paste support (pastes entire code at once)
 * - Keyboard navigation (arrow keys)
 * - Numeric input only
 * - Real-time code tracking
 */
export const CodeInput: React.FC<CodeInputProps> = ({
  length = 6,
  onComplete,
  onCodeChange,
  isLoading = false,
  error = null,
  disabled = false
}) => {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null));

  // Handle individual digit input
  const handleInputChange = (index: number, value: string) => {
    if (isLoading || disabled) return;

    // Only allow numeric input
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Notify parent of code change
    const codeString = newCode.join('');
    onCodeChange?.(codeString);

    // Auto-focus next input
    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all fields are filled
    if (newCode.every(digit => digit !== '')) {
      onComplete?.(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoading || disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();

      const newCode = [...code];

      if (code[index] !== '') {
        // Clear current field
        newCode[index] = '';
        setCode(newCode);
        onCodeChange?.(newCode.join(''));
      } else if (index > 0) {
        // Move to previous field and clear it
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
        onCodeChange?.(newCode.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

    if (pastedData.length >= length) {
      const newCode = pastedData.slice(0, length).split('');
      setCode(newCode);
      onCodeChange?.(newCode.join(''));
      onComplete?.(newCode.join(''));

      // Focus last input
      inputRefs.current[length - 1]?.focus();
    }
  };

  // Handle focus
  const handleFocus = (index: number, e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex gap-3 justify-center">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => handleFocus(index, e)}
            disabled={isLoading || disabled}
            className={`
              w-14 h-16 text-center text-2xl font-bold rounded-lg
              border-2 transition-all duration-200
              ${
                error
                  ? 'border-red-400 bg-red-50 text-red-900'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }
              ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
              focus:outline-none
            `}
            aria-label={`Dígito ${index + 1} do código`}
          />
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-600 font-medium text-center">
          {error}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Digite o código de 6 dígitos recebido no WhatsApp
      </div>
    </div>
  );
};

export default CodeInput;
