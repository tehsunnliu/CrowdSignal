import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Target, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PredictionCard from '../components/predictions/PredictionCard';
import PredictionFilters from '../components/predictions/PredictionFilters';
import { useWallet } from '../components/wallet/WalletContext';

export default function Predictions() {
  const { walletAddress } = useWallet();
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: '',
    sort: '-created_date'
  });

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['predictions', 'all'],
    queryFn: async () => {
      const allPredictions = await base44.entities.Prediction.filter(
        { status: { $in: ['live', 'ended', 'settled'] } },
        '-created_date',
        100
      );
      return allPredictions;
    }
  });

  const { data: userEntries = [] } = useQuery({
    queryKey: ['user-entries', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      return await base44.entities.PredictionEntry.filter({ wallet_address: walletAddress });
    },
    enabled: !!walletAddress
  });

  const getUserEntry = (predictionId) => {
    return userEntries.find(e => e.prediction_id === predictionId);
  };

  const filteredPredictions = useMemo(() => {
    let result = [...predictions];

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter(p => p.category === filters.category);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'end_time':
          return new Date(a.end_time) - new Date(b.end_time);
        case '-points_reward':
          return (b.points_reward || 0) - (a.points_reward || 0);
        case '-total_participants':
          return (b.total_participants || 0) - (a.total_participants || 0);
        case '-created_date':
        default:
          return new Date(b.created_date) - new Date(a.created_date);
      }
    });

    return result;
  }, [predictions, filters]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Predictions</h1>
          </div>
          <p className="text-slate-400">
            Browse and participate in predictions to earn points
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <PredictionFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-400">
            {filteredPredictions.length} prediction{filteredPredictions.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Predictions Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : filteredPredictions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredPredictions.map((prediction, i) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                index={i}
                userEntry={getUserEntry(prediction.id)}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No predictions found</h3>
            <p className="text-slate-400">Try adjusting your filters or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
}