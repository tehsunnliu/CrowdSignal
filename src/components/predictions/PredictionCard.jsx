import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const categoryColors = {
  crypto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  defi: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  nft: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  gaming: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  ecosystem: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  technology: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  community: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
};

const statusConfig = {
  live: { label: 'Live', color: 'bg-emerald-500', pulse: true },
  pending_review: { label: 'Pending', color: 'bg-yellow-500', pulse: false },
  ended: { label: 'Ended', color: 'bg-slate-500', pulse: false },
  settled: { label: 'Settled', color: 'bg-blue-500', pulse: false }
};

export default function PredictionCard({ prediction, index = 0, userEntry }) {
  const status = statusConfig[prediction.status] || statusConfig.live;
  const isEnded = isPast(new Date(prediction.end_time));
  const timeLeft = isEnded 
    ? 'Ended' 
    : formatDistanceToNow(new Date(prediction.end_time), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={createPageUrl(`PredictionDetail?id=${prediction.id}`)}>
        <Card className="group bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden cursor-pointer h-full">
          {/* Cover Image */}
          <div className="relative h-40 overflow-hidden">
            {prediction.cover_image ? (
              <img 
                src={prediction.cover_image} 
                alt={prediction.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-slate-700" />
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.color} text-white text-xs font-medium`}>
                {status.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                )}
                {status.label}
              </div>
            </div>

            {/* User Entry Indicator */}
            {userEntry && (
              <div className="absolute top-3 right-3">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  userEntry.is_correct === true 
                    ? 'bg-emerald-500 text-white' 
                    : userEntry.is_correct === false 
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {userEntry.is_correct === true ? 'Won' : userEntry.is_correct === false ? 'Lost' : 'Entered'}
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            
            {/* Points Reward */}
            <div className="absolute bottom-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-sm font-bold text-white">{prediction.points_reward}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            {/* Category */}
            <Badge 
              variant="outline" 
              className={`mb-2 text-xs ${categoryColors[prediction.category] || categoryColors.ecosystem}`}
            >
              {prediction.category}
            </Badge>

            {/* Title */}
            <h3 className="font-semibold text-white text-lg leading-tight mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors">
              {prediction.title}
            </h3>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{timeLeft}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{prediction.total_participants || 0}</span>
              </div>
            </div>

            {/* Options Preview */}
            {prediction.options && prediction.options.length > 0 && (
              <div className="mt-3 flex gap-1.5">
                {prediction.options.slice(0, 3).map((option, i) => (
                  <div 
                    key={option.id || i}
                    className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden"
                  >
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ 
                        width: `${prediction.total_participants > 0 
                          ? ((option.vote_count || 0) / prediction.total_participants) * 100 
                          : 100 / prediction.options.length}%` 
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}