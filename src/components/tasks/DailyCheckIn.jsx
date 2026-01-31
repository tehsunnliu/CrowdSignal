import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Gift, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { isToday, parseISO } from 'date-fns';

const streakRewards = [
  { day: 1, points: 10 },
  { day: 2, points: 15 },
  { day: 3, points: 20 },
  { day: 4, points: 25 },
  { day: 5, points: 35 },
  { day: 6, points: 45 },
  { day: 7, points: 100 }
];

export default function DailyCheckIn({ userProfile, onCheckIn }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showReward, setShowReward] = useState(false);
  
  const currentStreak = userProfile?.check_in_streak || 0;
  const lastCheckIn = userProfile?.last_check_in;
  const hasCheckedInToday = lastCheckIn && isToday(parseISO(lastCheckIn));
  
  const currentDay = Math.min((currentStreak % 7) + 1, 7);
  const todayReward = streakRewards.find(r => r.day === currentDay)?.points || 10;

  const handleCheckIn = async () => {
    if (hasCheckedInToday || isLoading) return;
    setIsLoading(true);
    try {
      await onCheckIn();
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/20 border-slate-800 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Daily Check-in</h3>
              <p className="text-sm text-slate-400">
                {hasCheckedInToday ? 'Come back tomorrow!' : 'Check in to earn points'}
              </p>
            </div>
          </div>
          
          {/* Streak Counter */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-2xl font-bold text-white">{currentStreak}</span>
            </div>
            <p className="text-xs text-slate-400">day streak</p>
          </div>
        </div>

        {/* Streak Progress */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {streakRewards.map((reward, i) => {
            const isPast = i < (currentStreak % 7);
            const isCurrent = i === (currentStreak % 7);
            const isChecked = isPast || (isCurrent && hasCheckedInToday);
            
            return (
              <motion.div
                key={reward.day}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all",
                  isChecked 
                    ? "bg-emerald-500/20 border-emerald-500" 
                    : isCurrent
                    ? "bg-orange-500/10 border-orange-500 border-dashed"
                    : "bg-slate-800/50 border-slate-700"
                )}
              >
                <span className={cn(
                  "text-xs font-medium",
                  isChecked ? "text-emerald-400" : isCurrent ? "text-orange-400" : "text-slate-500"
                )}>
                  Day {reward.day}
                </span>
                <div className={cn(
                  "flex items-center gap-0.5 text-xs font-bold",
                  isChecked ? "text-emerald-400" : isCurrent ? "text-orange-400" : "text-slate-400"
                )}>
                  <Gift className="w-3 h-3" />
                  {reward.points}
                </div>
                
                {isChecked && (
                  <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-emerald-400 bg-slate-900 rounded-full" />
                )}
                
                {reward.day === 7 && (
                  <Sparkles className={cn(
                    "absolute -top-1.5 -right-1.5 w-4 h-4",
                    isChecked ? "text-emerald-400" : "text-yellow-400"
                  )} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Check-in Button */}
        <Button
          onClick={handleCheckIn}
          disabled={hasCheckedInToday || isLoading}
          className={cn(
            "w-full h-12 text-lg font-semibold transition-all",
            hasCheckedInToday
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : hasCheckedInToday ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Checked In Today
            </>
          ) : (
            <>
              Claim +{todayReward} Points
            </>
          )}
        </Button>

        {/* Reward Animation */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-emerald-400 mb-2">
                  +{todayReward} Points!
                </div>
                <p className="text-slate-300">Keep your streak going!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}