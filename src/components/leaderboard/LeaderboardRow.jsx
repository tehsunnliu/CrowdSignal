import React from 'react';
import { Trophy, Medal, Award, TrendingUp, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function LeaderboardRow({ user, rank, index, isCurrentUser }) {
  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-500 font-mono w-5 text-center">{rank}</span>;
  };

  const getRankBg = () => {
    if (rank === 1) return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
    if (rank === 2) return 'from-slate-400/20 to-slate-500/10 border-slate-400/30';
    if (rank === 3) return 'from-amber-600/20 to-orange-500/10 border-amber-600/30';
    return 'from-slate-800/50 to-slate-900/50 border-slate-800';
  };

  const totalPoints = (user.regular_points || 0) + (user.builder_points || 0);
  const accuracy = user.total_predictions > 0 
    ? ((user.correct_predictions / user.total_predictions) * 100).toFixed(1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r transition-all",
        getRankBg(),
        isCurrentUser && "ring-2 ring-emerald-500"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center">
        {getRankIcon()}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
          rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
          rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400" :
          rank === 3 ? "bg-gradient-to-br from-amber-500 to-orange-600" :
          "bg-gradient-to-br from-slate-600 to-slate-700"
        )}>
          {user.wallet_address?.slice(2, 4).toUpperCase()}
        </div>
        {user.check_in_streak >= 7 && (
          <Flame className="absolute -top-1 -right-1 w-4 h-4 text-orange-400" />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium truncate",
            isCurrentUser ? "text-emerald-400" : "text-white"
          )}>
            {user.username || `${user.wallet_address?.slice(0, 6)}...${user.wallet_address?.slice(-4)}`}
          </span>
          {isCurrentUser && (
            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
              You
            </span>
          )}
          {user.level > 0 && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
              Lv.{user.level}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
          <span>{user.total_predictions || 0} predictions</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {accuracy}% accuracy
          </span>
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <div className={cn(
          "text-lg font-bold",
          rank === 1 ? "text-yellow-400" :
          rank === 2 ? "text-slate-300" :
          rank === 3 ? "text-amber-500" :
          "text-white"
        )}>
          {totalPoints.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">points</div>
      </div>
    </motion.div>
  );
}