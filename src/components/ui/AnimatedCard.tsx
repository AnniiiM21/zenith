import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface AnimatedCardProps {
  children: any;
  className?: string;
  hover?: boolean;
}

export const AnimatedCard = ({
  children,
  className,
  hover = true,
}: AnimatedCardProps) => {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white p-6 shadow-lg border border-gray-200",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

interface GlassCardProps {
  children: any;
  className?: string;
}

export const GlassCard = ({
  children,
  className,
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl backdrop-blur-lg bg-white/20 border border-white/30 p-6 shadow-xl",
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      {children}
    </motion.div>
  );
};
