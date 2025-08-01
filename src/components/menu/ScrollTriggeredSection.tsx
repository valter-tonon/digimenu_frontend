"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollTriggeredSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
  staggerChildren?: number;
  enableParallax?: boolean;
  parallaxOffset?: number;
}

const ScrollTriggeredSection: React.FC<ScrollTriggeredSectionProps> = ({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 50,
  duration = 0.6,
  once = true,
  threshold = 0.1,
  staggerChildren = 0.1,
  enableParallax = false,
  parallaxOffset = 50,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    once, 
    margin: `-${threshold * 100}%`,
    amount: threshold 
  });
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const parallaxY = useTransform(
    scrollYProgress, 
    [0, 1], 
    [parallaxOffset, -parallaxOffset]
  );

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      default:
        return { y: distance, x: 0 };
    }
  };

  const variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: "easeOut",
        staggerChildren,
      },
    },
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: duration * 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      style={enableParallax ? { y: parallaxY } : {}}
    >
      {/* Background effects */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent rounded-2xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: duration + 0.2, delay: delay + 0.1 }}
      />
      
      {/* Content */}
      <motion.div
        className="relative z-10"
        variants={childVariants}
      >
        {children}
      </motion.div>
      
      {/* Decorative elements */}
      <motion.div
        className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-60"
        initial={{ scale: 0, rotate: 0 }}
        animate={isInView ? { scale: 1, rotate: 360 } : { scale: 0, rotate: 0 }}
        transition={{ duration: 0.8, delay: delay + 0.3, ease: "easeOut" }}
      />
      
      <motion.div
        className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-40"
        initial={{ scale: 0, rotate: 0 }}
        animate={isInView ? { scale: 1, rotate: -360 } : { scale: 0, rotate: 0 }}
        transition={{ duration: 1, delay: delay + 0.5, ease: "easeOut" }}
      />
    </motion.div>
  );
};

export { ScrollTriggeredSection };