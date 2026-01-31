import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  Trophy, 
  ExternalLink, 
  Twitter, 
  MessageCircle,
  Share2,
  Gift,
  Zap,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const taskIcons = {
  daily_checkin: Zap,
  twitter_share: Twitter,
  twitter_follow: Twitter,
  discord_join: MessageCircle,
  telegram_join: Share2,
  custom: Gift
};

const taskColors = {
  daily_checkin: 'from-yellow-500 to-orange-500',
  twitter_share: 'from-blue-400 to-blue-600',
  twitter_follow: 'from-blue-400 to-blue-600',
  discord_join: 'from-indigo-500 to-purple-600',
  telegram_join: 'from-sky-400 to-blue-500',
  custom: 'from-pink-500 to-rose-500'
};

export default function TaskCard({ 
  task, 
  isCompleted, 
  isPending,
  onComplete, 
  index = 0 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const Icon = taskIcons[task.task_type] || Gift;
  const gradient = taskColors[task.task_type] || taskColors.custom;

  const handleComplete = async () => {
    if (isCompleted || isLoading) return;
    setIsLoading(true);
    try {
      await onComplete(task);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn(
        "relative overflow-hidden border transition-all duration-300",
        isCompleted 
          ? "bg-slate-900/30 border-slate-800" 
          : "bg-slate-900/50 border-slate-800 hover:border-emerald-500/50"
      )}>
        <div className="p-4 flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
            isCompleted ? "from-slate-700 to-slate-600" : gradient
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-semibold truncate",
                isCompleted ? "text-slate-500" : "text-white"
              )}>
                {task.title}
              </h3>
              {task.is_recurring && (
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                  {task.recurrence_period}
                </Badge>
              )}
              {task.partner_name && (
                <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {task.partner_name}
                </Badge>
              )}
            </div>
            <p className={cn(
              "text-sm truncate",
              isCompleted ? "text-slate-600" : "text-slate-400"
            )}>
              {task.description}
            </p>
          </div>

          {/* Points & Action */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full",
              isCompleted 
                ? "bg-slate-800 text-slate-500" 
                : task.points_type === 'builder' 
                  ? "bg-teal-500/20 text-teal-400"
                  : "bg-emerald-500/20 text-emerald-400"
            )}>
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{task.points_reward}</span>
            </div>

            {isCompleted ? (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Done</span>
              </div>
            ) : isPending ? (
              <div className="flex items-center gap-1 text-yellow-400">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Pending</span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : task.action_url ? (
                  <>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Go
                  </>
                ) : (
                  'Complete'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress indicator for limited tasks */}
        {task.max_completions && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span>
              <span>{task.current_completions || 0} / {task.max_completions}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                style={{ width: `${((task.current_completions || 0) / task.max_completions) * 100}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}