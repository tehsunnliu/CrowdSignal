import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFT' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'ecosystem', label: 'Ecosystem' },
  { value: 'technology', label: 'Technology' },
  { value: 'community', label: 'Community' }
];

const statuses = [
  { value: 'all', label: 'All Status' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
  { value: 'settled', label: 'Settled' }
];

const sortOptions = [
  { value: '-created_date', label: 'Newest First' },
  { value: 'end_time', label: 'Ending Soon' },
  { value: '-points_reward', label: 'Highest Reward' },
  { value: '-total_participants', label: 'Most Popular' }
];

export default function PredictionFilters({ 
  filters, 
  onFilterChange, 
  showFilters, 
  onToggleFilters 
}) {
  const hasActiveFilters = filters.category !== 'all' || filters.status !== 'all' || filters.search;

  const clearFilters = () => {
    onFilterChange({
      category: 'all',
      status: 'all',
      search: '',
      sort: '-created_date'
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search predictions..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, category: value })}
          >
            <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-800 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-800">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, status: value })}
          >
            <SelectTrigger className="w-[120px] bg-slate-900/50 border-slate-800 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-white hover:bg-slate-800">
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sort || '-created_date'}
            onValueChange={(value) => onFilterChange({ ...filters, sort: value })}
          >
            <SelectTrigger className="w-[150px] bg-slate-900/50 border-slate-800 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-800">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2"
          >
            {filters.category !== 'all' && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm flex items-center gap-1">
                Category: {filters.category}
                <button onClick={() => onFilterChange({ ...filters, category: 'all' })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center gap-1">
                Status: {filters.status}
                <button onClick={() => onFilterChange({ ...filters, status: 'all' })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.search && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-1">
                Search: "{filters.search}"
                <button onClick={() => onFilterChange({ ...filters, search: '' })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}