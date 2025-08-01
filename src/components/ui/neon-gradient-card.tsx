"use client";

import { cn } from "@/lib/utils";
import React, { CSSProperties, ReactNode } from "react";

interface NeonGradientCardProps {
  /**
   * @default <div />
   */
  as?: React.ElementType;
  /**
   * @default ""
   */
  className?: string;

  /**
   * @default ""
   */
  children?: ReactNode;

  /**
   * @default 5
   */
  borderSize?: number;

  /**
   * @default 20
   */
  borderRadius?: number;

  /**
   * @default "[#ffaa40_0%,#9c40ff_100%]"
   */
  neonColors?: string;

  /**
   * @default ""
   */
  backgroundColor?: string;

  [key: string]: any;
}

const NeonGradientCard: React.FC<NeonGradientCardProps> = ({
  className,
  children,
  as: Component = "div",
  borderSize = 2,
  borderRadius = 20,
  neonColors = "[#ffaa40_0%,#9c40ff_100%]",
  backgroundColor = "",
  ...props
}) => {
  return (
    <Component
      className={cn(
        "relative z-10 h-fit w-fit rounded-[var(--border-radius)] p-[var(--border-size)]",
        className,
      )}
      style={
        {
          "--border-size": `${borderSize}px`,
          "--border-radius": `${borderRadius}px`,
        } as CSSProperties
      }
      {...props}
    >
      <div
        className={cn(
          "relative z-20 h-full w-full rounded-[calc(var(--border-radius)-var(--border-size))] bg-gray-100 dark:bg-gray-900",
          backgroundColor,
        )}
      >
        {children}
      </div>

      {/* Neon gradient border */}
      <div
        className={cn(
          "absolute inset-0 z-10 rounded-[var(--border-radius)] bg-gradient-to-r opacity-100",
        )}
        style={{
          background: `conic-gradient(from 0deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)`,
        }}
      />

      {/* Animated rotating border */}
      <div
        className="absolute inset-0 z-0 rounded-[var(--border-radius)] opacity-20 blur-md"
        style={{
          background: `conic-gradient(from 0deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)`,
          animation: "spin 3s linear infinite",
        }}
      />

      {/* Inner glow effect */}
      <div
        className="absolute inset-[var(--border-size)] z-10 rounded-[calc(var(--border-radius)-var(--border-size))] opacity-40"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255,255,255,0.1), transparent 40%)`,
        }}
      />
    </Component>
  );
};

export { NeonGradientCard };