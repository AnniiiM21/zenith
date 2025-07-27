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
      
      {/* Timer circle */}
      <motion.div
        className={cn(
          "relative flex items-center justify-center w-96 h-96 rounded-full",
          "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg",
          "border-2 border-white/20 shadow-2xl"
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
        {/* Inner circle with gradient */}
        <div className={cn(
          "absolute inset-6 rounded-full",
          `bg-gradient-to-br ${timerColor}`,
          "shadow-2xl"
        )}>
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
          
          {/* Inner glow */}
          <div className={cn(
            "absolute inset-2 rounded-full",
            `bg-gradient-to-br ${timerColor}`,
            "opacity-80"
          )} />
        </div>
        
        {/* Timer text */}
        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div 
            className="text-7xl font-bold text-white drop-shadow-2xl tracking-tighter"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {time}
          </div>
          <div 
            className="text-xl font-medium text-white/90 mt-4 drop-shadow-lg tracking-wide"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
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
