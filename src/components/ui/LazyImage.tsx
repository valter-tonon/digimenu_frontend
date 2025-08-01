'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

/**
 * Optimized lazy loading image component with WebP/AVIF support
 * and progressive loading with blur placeholder
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder = 'blur',
  blurDataURL,
  priority = false,
  quality = 75,
  sizes,
  fill = false,
  objectFit = 'cover',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg'
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLDivElement>(null);

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (width: number = 10, height: number = 10) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple gradient blur placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL();
  };

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL();

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Handle image error with fallback
  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
    onError?.();
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return; // Skip lazy loading for priority images

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Image is in viewport, start loading
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  // Error fallback component
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={!fill ? { width, height } : undefined}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: `url("${defaultBlurDataURL}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.1)' // Slightly larger to hide blur edges
          }}
        />
      )}

      {/* Actual image */}
      <Image
        src={currentSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          fill && `object-${objectFit}`
        )}
        placeholder={placeholder as any}
        blurDataURL={defaultBlurDataURL}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        // Enable modern image formats
        unoptimized={false}
      />
    </div>
  );
}

/**
 * Optimized product image component with specific sizing and lazy loading
 */
interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}

export function ProductImage({
  src,
  alt,
  className,
  priority = false,
  onClick
}: ProductImageProps) {
  return (
    <div
      className={cn(
        'relative aspect-square overflow-hidden rounded-lg cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <LazyImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        priority={priority}
        quality={80}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
}

/**
 * Hero image component with optimized loading
 */
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
}

export function HeroImage({
  src,
  alt,
  className,
  overlay = false
}: HeroImageProps) {
  return (
    <div className={cn('relative w-full h-64 md:h-96 overflow-hidden', className)}>
      <LazyImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        priority={true} // Hero images should load immediately
        quality={90}
        sizes="100vw"
      />
      
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-30" />
      )}
    </div>
  );
}

/**
 * Avatar image component with circular crop and fallback
 */
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackInitials?: string;
}

export function AvatarImage({
  src,
  alt,
  size = 'md',
  className,
  fallbackInitials
}: AvatarImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg'
  };

  if (!src) {
    return (
      <div
        className={cn(
          'rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium',
          sizeClasses[size],
          className
        )}
      >
        {fallbackInitials || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
      <LazyImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        quality={85}
        sizes="(max-width: 640px) 96px, 128px"
      />
    </div>
  );
}

/**
 * Gallery image component with thumbnail optimization
 */
interface GalleryImageProps {
  src: string;
  alt: string;
  thumbnailSrc?: string;
  className?: string;
  onClick?: () => void;
}

export function GalleryImage({
  src,
  alt,
  thumbnailSrc,
  className,
  onClick
}: GalleryImageProps) {
  const [showFullSize, setShowFullSize] = useState(false);

  const handleClick = () => {
    setShowFullSize(true);
    onClick?.();
  };

  return (
    <>
      <div
        className={cn(
          'relative aspect-square overflow-hidden rounded-lg cursor-pointer group',
          className
        )}
        onClick={handleClick}
      >
        <LazyImage
          src={thumbnailSrc || src}
          alt={alt}
          fill
          objectFit="cover"
          quality={70}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Full size modal */}
      {showFullSize && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowFullSize(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <LazyImage
              src={src}
              alt={alt}
              width={800}
              height={600}
              quality={95}
              className="max-w-full max-h-full object-contain"
            />
            
            <button
              onClick={() => setShowFullSize(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}