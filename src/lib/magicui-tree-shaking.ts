/**
 * Magic UI Tree Shaking Configuration
 * Optimizes bundle size by removing unused component features
 */

// Feature flags for Magic UI components
export const MAGIC_UI_FEATURES = {
  // Loading component features
  SPINNER_ANIMATIONS: true,
  PULSE_EFFECTS: true,
  WAVE_ANIMATIONS: true,
  ORBIT_EFFECTS: true,
  GRADIENT_ANIMATIONS: true,
  
  // Animation features
  CONFETTI_EFFECTS: true,
  SUCCESS_CELEBRATIONS: true,
  PARTICLE_EFFECTS: false, // Disabled to reduce bundle size
  
  // Advanced features
  CUSTOM_SHAPES: false, // Heavy feature, disabled by default
  EMOJI_CONFETTI: false, // Heavy feature, disabled by default
  FIREWORKS: false, // Heavy feature, disabled by default
  
  // Performance features
  PRELOADING: true,
  LAZY_LOADING: true,
  ERROR_BOUNDARIES: true,
  PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
} as const;

// Component feature mapping
export const COMPONENT_FEATURES = {
  MagicSpinner: ['SPINNER_ANIMATIONS'],
  MagicPulse: ['PULSE_EFFECTS'],
  MagicWave: ['WAVE_ANIMATIONS'],
  MagicOrbit: ['ORBIT_EFFECTS'],
  MagicGradient: ['GRADIENT_ANIMATIONS'],
  MagicLoadingOverlay: ['SPINNER_ANIMATIONS', 'PULSE_EFFECTS'],
  ProgressIndicator: [],
  SkeletonLoader: [],
  SuccessCelebration: ['SUCCESS_CELEBRATIONS', 'CONFETTI_EFFECTS'],
  Confetti: ['CONFETTI_EFFECTS', 'CUSTOM_SHAPES', 'EMOJI_CONFETTI', 'FIREWORKS'],
} as const;

// Tree shaking utility
export class TreeShakingOptimizer {
  /**
   * Check if a feature is enabled
   */
  static isFeatureEnabled(feature: keyof typeof MAGIC_UI_FEATURES): boolean {
    return MAGIC_UI_FEATURES[feature];
  }

  /**
   * Check if a component should be included based on enabled features
   */
  static shouldIncludeComponent(componentName: keyof typeof COMPONENT_FEATURES): boolean {
    const requiredFeatures = COMPONENT_FEATURES[componentName];
    
    // If component has no feature requirements, always include
    if (requiredFeatures.length === 0) {
      return true;
    }

    // Check if at least one required feature is enabled
    return requiredFeatures.some(feature => 
      this.isFeatureEnabled(feature as keyof typeof MAGIC_UI_FEATURES)
    );
  }

  /**
   * Get optimized component list based on enabled features
   */
  static getOptimizedComponents(): string[] {
    return Object.keys(COMPONENT_FEATURES).filter(componentName =>
      this.shouldIncludeComponent(componentName as keyof typeof COMPONENT_FEATURES)
    );
  }

  /**
   * Get disabled features for bundle analysis
   */
  static getDisabledFeatures(): string[] {
    return Object.entries(MAGIC_UI_FEATURES)
      .filter(([, enabled]) => !enabled)
      .map(([feature]) => feature);
  }

  /**
   * Calculate estimated bundle size reduction
   */
  static calculateBundleSizeReduction(): {
    originalSize: number;
    optimizedSize: number;
    reduction: number;
    reductionPercentage: number;
  } {
    const featureSizes: Record<string, number> = {
      SPINNER_ANIMATIONS: 2.1,
      PULSE_EFFECTS: 2.8,
      WAVE_ANIMATIONS: 2.3,
      ORBIT_EFFECTS: 3.1,
      GRADIENT_ANIMATIONS: 2.9,
      CONFETTI_EFFECTS: 8.4,
      SUCCESS_CELEBRATIONS: 5.8,
      PARTICLE_EFFECTS: 15.2,
      CUSTOM_SHAPES: 12.7,
      EMOJI_CONFETTI: 8.9,
      FIREWORKS: 11.3,
      PRELOADING: 1.2,
      LAZY_LOADING: 0.8,
      ERROR_BOUNDARIES: 1.5,
      PERFORMANCE_MONITORING: 3.2,
    };

    const originalSize = Object.values(featureSizes).reduce((sum, size) => sum + size, 0);
    
    const optimizedSize = Object.entries(MAGIC_UI_FEATURES)
      .filter(([, enabled]) => enabled)
      .reduce((sum, [feature]) => {
        return sum + (featureSizes[feature] || 0);
      }, 0);

    const reduction = originalSize - optimizedSize;
    const reductionPercentage = (reduction / originalSize) * 100;

    return {
      originalSize,
      optimizedSize,
      reduction,
      reductionPercentage
    };
  }
}

// Webpack plugin configuration for tree shaking
export const webpackTreeShakingConfig = {
  resolve: {
    alias: {
      // Alias unused features to empty modules
      ...(MAGIC_UI_FEATURES.PARTICLE_EFFECTS ? {} : {
        '@/components/ui/ParticleEffects': false,
      }),
      ...(MAGIC_UI_FEATURES.CUSTOM_SHAPES ? {} : {
        '@/lib/custom-shapes': false,
      }),
      ...(MAGIC_UI_FEATURES.EMOJI_CONFETTI ? {} : {
        '@/lib/emoji-confetti': false,
      }),
      ...(MAGIC_UI_FEATURES.FIREWORKS ? {} : {
        '@/lib/fireworks': false,
      }),
    },
  },
  optimization: {
    usedExports: true,
    sideEffects: false,
    providedExports: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                // Enable tree shaking for TypeScript
                module: 'esnext',
                moduleResolution: 'node',
              },
            },
          },
        ],
      },
    ],
  },
};

// Runtime feature detection
export class RuntimeFeatureDetector {
  private static detectedFeatures = new Map<string, boolean>();

  /**
   * Detect if a feature is actually used at runtime
   */
  static detectFeatureUsage(feature: string): void {
    this.detectedFeatures.set(feature, true);
  }

  /**
   * Get unused features that can be removed
   */
  static getUnusedFeatures(): string[] {
    const allFeatures = Object.keys(MAGIC_UI_FEATURES);
    const usedFeatures = Array.from(this.detectedFeatures.keys());
    
    return allFeatures.filter(feature => !usedFeatures.includes(feature));
  }

  /**
   * Generate optimization report
   */
  static generateOptimizationReport(): {
    enabledFeatures: string[];
    disabledFeatures: string[];
    unusedFeatures: string[];
    bundleReduction: ReturnType<typeof TreeShakingOptimizer.calculateBundleSizeReduction>;
    recommendations: string[];
  } {
    const enabledFeatures = Object.entries(MAGIC_UI_FEATURES)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);

    const disabledFeatures = TreeShakingOptimizer.getDisabledFeatures();
    const unusedFeatures = this.getUnusedFeatures();
    const bundleReduction = TreeShakingOptimizer.calculateBundleSizeReduction();

    const recommendations: string[] = [];

    if (unusedFeatures.length > 0) {
      recommendations.push(`Consider disabling unused features: ${unusedFeatures.join(', ')}`);
    }

    if (bundleReduction.reductionPercentage < 20) {
      recommendations.push('Consider disabling more features to achieve better bundle size reduction');
    }

    if (enabledFeatures.includes('PARTICLE_EFFECTS') && !this.detectedFeatures.has('PARTICLE_EFFECTS')) {
      recommendations.push('PARTICLE_EFFECTS is enabled but not used - consider disabling');
    }

    return {
      enabledFeatures,
      disabledFeatures,
      unusedFeatures,
      bundleReduction,
      recommendations
    };
  }

  /**
   * Reset detection data
   */
  static reset(): void {
    this.detectedFeatures.clear();
  }
}

// Development helper for analyzing bundle
export const analyzeMagicUIBundle = () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const report = RuntimeFeatureDetector.generateOptimizationReport();
  
  console.group('🎨 Magic UI Bundle Analysis');
  console.log('Enabled Features:', report.enabledFeatures);
  console.log('Disabled Features:', report.disabledFeatures);
  console.log('Unused Features:', report.unusedFeatures);
  console.log('Bundle Size Reduction:', `${report.bundleReduction.reductionPercentage.toFixed(1)}%`);
  console.log('Size Saved:', `${report.bundleReduction.reduction.toFixed(1)}KB`);
  
  if (report.recommendations.length > 0) {
    console.group('💡 Recommendations');
    report.recommendations.forEach(rec => console.log(`• ${rec}`));
    console.groupEnd();
  }
  
  console.groupEnd();
};

// Export configuration
export default {
  MAGIC_UI_FEATURES,
  COMPONENT_FEATURES,
  TreeShakingOptimizer,
  webpackTreeShakingConfig,
  RuntimeFeatureDetector,
  analyzeMagicUIBundle
};