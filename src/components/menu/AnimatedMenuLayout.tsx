"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useInView, useAnimation, useScroll, useTransform, easeOut } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { Particles } from "@/components/ui/particles";

interface AnimatedMenuLayoutProps {
  children: React.ReactNode;
  className?: string;
  showParticles?: boolean;
  showBeams?: boolean;
}

const AnimatedMenuLayout: React.FC<AnimatedMenuLayoutProps> = ({
  children,
  className,
  showParticles = true,
  showBeams = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const controls = useAnimation();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 1, 0.4]);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: easeOut,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: easeOut,
      },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800",
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      style={{ y, opacity }}
    >
      {/* Background Particles */}
      {showParticles && (
        <div className="absolute inset-0 z-0">
          <Particles
            className="absolute inset-0"
            quantity={50}
            ease={80}
            color="#3b82f6"
            size={0.8}
            staticity={30}
          />
        </div>
      )}

      {/* Animated Beams */}
      {showBeams && headerRef.current && contentRef.current && (
        <AnimatedBeam
          className="z-10"
          containerRef={containerRef as React.RefObject<HTMLElement>}
          fromRef={headerRef as React.RefObject<HTMLElement>}
          toRef={contentRef as React.RefObject<HTMLElement>}
          curvature={-50}
          gradientStartColor="#3b82f6"
          gradientStopColor="#8b5cf6"
          duration={3}
        />
      )}

      {/* Header Section */}
      <motion.div
        ref={headerRef}
        className="relative z-20 pt-8 pb-4"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
              Menu Digital
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore nossa seleção especial com experiência interativa
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        ref={contentRef}
        className="relative z-20 flex-1"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4">
          {children}
        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 right-10 w-4 h-4 bg-blue-500 rounded-full opacity-60"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-32 left-10 w-6 h-6 bg-purple-500 rounded-full opacity-40"
        animate={{
          y: [0, 15, 0],
          x: [0, 10, 0],
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-20 w-3 h-3 bg-green-500 rounded-full opacity-50"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
          delay: 2,
        }}
      />
    </motion.div>
  );
};

export { AnimatedMenuLayout };