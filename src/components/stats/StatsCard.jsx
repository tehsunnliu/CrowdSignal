import React from 'react';
import { Card } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  gradient = 'from-emerald-500 to-teal-500',
  index = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden group hover:border-slate-700 transition-all">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">{title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {trend && (
                  <span className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    trend > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
            <div className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
              gradient
            )}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        {/* Bottom gradient accent */}
        <div className={cn(
          "h-1 bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity",
          gradient
        )} />
      </Card>
    </motion.div>
  );
}