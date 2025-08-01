'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  optional?: boolean;
}

export interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showDescriptions?: boolean;
  className?: string;
  onStepClick?: (stepIndex: number) => void;
  allowClickOnCompleted?: boolean;
}

const sizeClasses = {
  sm: {
    circle: 'w-6 h-6 text-xs',
    text: 'text-xs',
    spacing: 'space-x-2'
  },
  md: {
    circle: 'w-8 h-8 text-sm',
    text: 'text-sm',
    spacing: 'space-x-3'
  },
  lg: {
    circle: 'w-10 h-10 text-base',
    text: 'text-base',
    spacing: 'space-x-4'
  }
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  variant = 'horizontal',
  size = 'md',
  showLabels = true,
  showDescriptions = false,
  className,
  onStepClick,
  allowClickOnCompleted = false
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex) || stepIndex < currentStep) {
      return 'completed';
    }
    if (stepIndex === currentStep) {
      return 'current';
    }
    return 'upcoming';
  };

  const getStepClasses = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const baseClasses = cn(
      'flex items-center justify-center rounded-full border-2 font-medium transition-all duration-200',
      sizeClasses[size].circle
    );

    switch (status) {
      case 'completed':
        return cn(baseClasses, 'bg-green-600 border-green-600 text-white');
      case 'current':
        return cn(baseClasses, 'bg-blue-600 border-blue-600 text-white');
      case 'upcoming':
        return cn(baseClasses, 'bg-gray-100 border-gray-300 text-gray-500');
      default:
        return baseClasses;
    }
  };

  const getConnectorClasses = (stepIndex: number) => {
    const isCompleted = getStepStatus(stepIndex) === 'completed' || getStepStatus(stepIndex + 1) === 'current';
    
    if (variant === 'horizontal') {
      return cn(
        'flex-1 h-0.5 mx-2 transition-colors duration-200',
        isCompleted ? 'bg-green-600' : 'bg-gray-300'
      );
    } else {
      return cn(
        'w-0.5 h-8 mx-auto transition-colors duration-200',
        isCompleted ? 'bg-green-600' : 'bg-gray-300'
      );
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (!onStepClick) return;
    
    const status = getStepStatus(stepIndex);
    if (status === 'completed' && allowClickOnCompleted) {
      onStepClick(stepIndex);
    } else if (status === 'current') {
      onStepClick(stepIndex);
    }
  };

  const isClickable = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    return onStepClick && (status === 'current' || (status === 'completed' && allowClickOnCompleted));
  };

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col', className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col">
            <div className="flex items-start">
              <div className="flex flex-col items-center">
                <button
                  className={cn(
                    getStepClasses(index),
                    isClickable(index) && 'cursor-pointer hover:scale-105',
                    !isClickable(index) && 'cursor-default'
                  )}
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable(index)}
                  aria-label={`Passo ${index + 1}: ${step.title}`}
                >
                  {getStepStatus(index) === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    index + 1
                  )}
                </button>
                
                {index < steps.length - 1 && (
                  <div className={getConnectorClasses(index)} />
                )}
              </div>
              
              {showLabels && (
                <div className="ml-4 pb-8">
                  <div className={cn('font-medium', sizeClasses[size].text)}>
                    {step.title}
                    {step.optional && (
                      <span className="ml-2 text-xs text-gray-500">(Opcional)</span>
                    )}
                  </div>
                  {showDescriptions && step.description && (
                    <div className={cn('text-gray-600 mt-1', sizeClasses[size].text)}>
                      {step.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <button
              className={cn(
                getStepClasses(index),
                isClickable(index) && 'cursor-pointer hover:scale-105',
                !isClickable(index) && 'cursor-default'
              )}
              onClick={() => handleStepClick(index)}
              disabled={!isClickable(index)}
              aria-label={`Passo ${index + 1}: ${step.title}`}
            >
              {getStepStatus(index) === 'completed' ? (
                <Check className="w-4 h-4" />
              ) : step.icon ? (
                step.icon
              ) : (
                index + 1
              )}
            </button>
            
            {showLabels && (
              <div className="mt-2 text-center">
                <div className={cn('font-medium', sizeClasses[size].text)}>
                  {step.title}
                  {step.optional && (
                    <span className="block text-xs text-gray-500">(Opcional)</span>
                  )}
                </div>
                {showDescriptions && step.description && (
                  <div className={cn('text-gray-600 mt-1', sizeClasses[size].text)}>
                    {step.description}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {index < steps.length - 1 && (
            <div className={getConnectorClasses(index)} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export interface BreadcrumbProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (stepIndex: number) => void;
  separator?: React.ReactNode;
}

export const BreadcrumbProgress: React.FC<BreadcrumbProgressProps> = ({
  steps,
  currentStep,
  className,
  onStepClick,
  separator = <ChevronRight className="w-4 h-4 text-gray-400" />
}) => {
  const handleStepClick = (stepIndex: number) => {
    if (onStepClick && stepIndex <= currentStep) {
      onStepClick(stepIndex);
    }
  };

  return (
    <nav className={cn('flex items-center space-x-2', className)} aria-label="Progresso">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <button
            className={cn(
              'text-sm font-medium transition-colors duration-200',
              index < currentStep && 'text-green-600 hover:text-green-700',
              index === currentStep && 'text-blue-600',
              index > currentStep && 'text-gray-500',
              onStepClick && index <= currentStep && 'cursor-pointer hover:underline',
              (!onStepClick || index > currentStep) && 'cursor-default'
            )}
            onClick={() => handleStepClick(index)}
            disabled={!onStepClick || index > currentStep}
          >
            {step.title}
          </button>
          
          {index < steps.length - 1 && separator}
        </React.Fragment>
      ))}
    </nav>
  );
};

export interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
  label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  className,
  label = 'Progresso'
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-label={label}
        aria-valuenow={normalizedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700">
            {Math.round(normalizedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;