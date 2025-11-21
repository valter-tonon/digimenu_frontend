"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import { cn } from "@/lib/utils";
import { Category } from "@/domain/entities/Category";

interface CategorySwitcherProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  className?: string;
}

const CategorySwitcher: React.FC<CategorySwitcherProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (categoryId: string | null) => {
    onCategoryChange(categoryId);
  };

  const categoryVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.95,
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: easeOut,
      },
    }),
    hover: {
      scale: 1.05,
      y: -2,
      transition: {
        duration: 0.2,
        ease: easeOut,
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  const indicatorVariants = {
    hidden: {
      scaleX: 0,
      opacity: 0,
    },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easeOut,
      },
    },
  };

  const glowVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 0.6,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: easeOut,
      },
    },
  };

  return (
    <div className={cn("relative", className)}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl blur-xl" />
      
      <motion.div
        ref={containerRef}
        className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
      >
        <div className="flex flex-wrap gap-2">
          {/* All Categories Button */}
          <motion.button
            className={cn(
              "relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 overflow-hidden",
              activeCategory === null
                ? "text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            )}
            variants={categoryVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            custom={0}
            onClick={() => handleCategoryClick(null)}
            onMouseEnter={() => setHoveredCategory("all")}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            {/* Active indicator */}
            {activeCategory === null && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"
                variants={indicatorVariants}
                initial="hidden"
                animate="visible"
                layoutId="activeCategory"
              />
            )}
            
            {/* Hover glow */}
            <AnimatePresence>
              {hoveredCategory === "all" && activeCategory !== null && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl"
                  variants={glowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                />
              )}
            </AnimatePresence>
            
            <span className="relative z-10">Todos</span>
          </motion.button>

          {/* Category Buttons */}
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              className={cn(
                "relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 overflow-hidden",
                activeCategory === category.id
                  ? "text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              )}
              variants={categoryVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              custom={index + 1}
              onClick={() => handleCategoryClick(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {/* Active indicator */}
              {activeCategory === category.id && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"
                  variants={indicatorVariants}
                  initial="hidden"
                  animate="visible"
                  layoutId="activeCategory"
                />
              )}
              
              {/* Hover glow */}
              <AnimatePresence>
                {hoveredCategory === category.id && activeCategory !== category.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl"
                    variants={glowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  />
                )}
              </AnimatePresence>
              
              <span className="relative z-10">{category.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export { CategorySwitcher };