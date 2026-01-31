import React from 'react';
import { motion } from 'framer-motion';
import { Check, Trophy } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function OptionVoteBar({ 
  option, 
  totalVotes, 
  isSelected, 
  isCorrect, 
  isSettled,
  onSelect,
  disabled,
  index
}) {
  const percentage = totalVotes > 0 ? ((option.vote_count || 0) / totalVotes) * 100 : 0;
  
  const getBarColor = () => {
    if (isSettled && isCorrect) return 'from-emerald-500 to-emerald-400';
    if (isSettled && !isCorrect) return 'from-slate-600 to-slate-500';
    if (isSelected) return 'from-emerald-500 to-teal-500';
    return 'from-slate-600 to-slate-500';
  };

  const getBorderColor = () => {
    if (isSettled && isCorrect) return 'border-emerald-500 bg-emerald-500/10';
    if (isSelected) return 'border-emerald-500 bg-emerald-500/5';
    return 'border-slate-700 hover:border-slate-600';
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => !disabled && onSelect(option.id)}
      disabled={disabled}
      className={cn(
        "w-full p-4 rounded-xl border-2 transition-all relative overflow-hidden text-left",
        getBorderColor(),
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      {/* Background Progress Bar */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          className={cn(
            "h-full bg-gradient-to-r opacity-30",
            getBarColor()
          )}
        />
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Selection/Correct Indicator */}
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            isSelected || (isSettled && isCorrect) 
              ? "border-emerald-500 bg-emerald-500" 
              : "border-slate-600"
          )}>
            {(isSelected || (isSettled && isCorrect)) && (
              <Check className="w-4 h-4 text-white" />
            )}
          </div>

          <span className={cn(
            "font-medium",
            isSettled && isCorrect ? "text-emerald-400" : "text-white"
          )}>
            {option.text}
          </span>

          {isSettled && isCorrect && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded-full">
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Correct</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {option.vote_count || 0} votes
          </span>
          <span className={cn(
            "font-bold text-lg min-w-[60px] text-right",
            isSettled && isCorrect ? "text-emerald-400" : "text-white"
          )}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.button>
  );
}