import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface TimerDisplayProps {
  time: string;
  isRunning: boolean;
  sessionType: "work" | "break";
  className?: string;
}

export const TimerDisplay = ({
  time,
  isRunning,
  sessionType,
  className,
}: TimerDisplayProps) => {
  const pulseVariants = {
    running: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    stopped: {
      scale: 1,
    },
  };

  const timerColor = sessionType === "work" 
    ? "from-[#667EEA] to-[#764BA2]" 
    : "from-[#6BCF7F] to-[#4ECDC4]";

  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center",
        className
      )}
      variants={pulseVariants}
      animate={isRunning ? "running" : "stopped"}
    >
      {/* Background glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-full blur-2xl opacity-30",
        `bg-gradient-to-r ${timerColor}`
      )} />
      
      {/* Timer circle - Made bigger and more prominent */}
      <motion.div
        className={cn(
          "relative flex items-center justify-center w-[28rem] h-[28rem] rounded-full",
          "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl",
          "border-4 border-white/30 shadow-[0_0_80px_rgba(102,126,234,0.4)]"
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.2 
        }}
      >
        {/* Outer ring animation */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border-4",
            `border-gradient-to-r ${timerColor}`,
            "opacity-60"
          )}
          animate={isRunning ? {
            rotate: 360,
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Inner circle with enhanced gradient */}
        <div className={cn(
          "absolute inset-8 rounded-full",
          `bg-gradient-to-br ${timerColor}`,
          "shadow-[0_0_60px_rgba(102,126,234,0.6)]",
          "border-2 border-white/20"
        )}>
          {/* Enhanced shine effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 via-white/10 to-transparent" />
          
          {/* Multiple inner glows for depth */}
          <div className={cn(
            "absolute inset-3 rounded-full",
            `bg-gradient-to-br ${timerColor}`,
            "opacity-90 shadow-inner"
          )} />
          
          <div className={cn(
            "absolute inset-6 rounded-full",
            `bg-gradient-to-br ${timerColor}`,
            "opacity-70"
          )} />
        </div>
        
        {/* Timer text with enhanced visibility */}
        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div 
            className="text-8xl font-bold tracking-tighter"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              textShadow: '0 0 30px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.6)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {time}
          </div>
          <div 
            className="text-2xl font-semibold mt-6 tracking-wide"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              textShadow: '0 0 30px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.6)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {sessionType === "work" ? "Focus Time" : "Break Time"}
          </div>
        </motion.div>
        
        {/* Status indicator */}
        <motion.div
          className={cn(
            "absolute -top-3 -right-3 w-8 h-8 rounded-full",
            isRunning ? "bg-green-400" : "bg-red-400",
            "shadow-xl border-3 border-white"
          )}
          animate={{
            scale: isRunning ? [1, 1.3, 1] : 1,
            boxShadow: isRunning 
              ? [
                  "0 0 0 0px rgba(34, 197, 94, 0.4)",
                  "0 0 0 10px rgba(34, 197, 94, 0)",
                  "0 0 0 0px rgba(34, 197, 94, 0)"
                ]
              : "0 4px 15px rgba(0, 0, 0, 0.2)"
          }}
          transition={{
            duration: 1.5,
            repeat: isRunning ? Infinity : 0,
          }}
        />
      </motion.div>
    </motion.div>
  );
};
