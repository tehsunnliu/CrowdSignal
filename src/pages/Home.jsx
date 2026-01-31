import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  TrendingUp, 
  Zap, 
  Trophy, 
  Users, 
  ChevronRight, 
  Sparkles,
  Target,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import PredictionCard from '../components/predictions/PredictionCard';
import { useWallet } from '../components/wallet/WalletContext';

export default function Home() {
  const { walletAddress, userProfile } = useWallet();

  const { data: featuredPredictions = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ['predictions', 'featured'],
    queryFn: async () => {
      const predictions = await base44.entities.Prediction.filter(
        { status: 'live', is_featured: true },
        '-created_date',
        6
      );
      return predictions;
    }
  });

  const { data: livePredictions = [], isLoading: loadingLive } = useQuery({
    queryKey: ['predictions', 'live'],
    queryFn: async () => {
      const predictions = await base44.entities.Prediction.filter(
        { status: 'live' },
        'end_time',
        8
      );
      return predictions;
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

  const { data: topUsers = [] } = useQuery({
    queryKey: ['leaderboard', 'top'],
    queryFn: async () => {
      const users = await base44.entities.UserProfile.list('-regular_points', 5);
      return users;
    }
  });

  const getUserEntry = (predictionId) => {
    return userEntries.find(e => e.prediction_id === predictionId);
  };

  const stats = [
    { 
      label: 'Total Predictions', 
      value: '1,247', 
      icon: Target,
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Active Users', 
      value: '12.4K', 
      icon: Users,
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Points Distributed', 
      value: '2.1M', 
      icon: Trophy,
      gradient: 'from-yellow-500 to-orange-500'
    },
    { 
      label: 'Win Rate', 
      value: '68%', 
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by CESS Network
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Predict. Earn.
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text"> Get Rewarded.</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Join the decentralized prediction platform where your insights earn you rewards. 
              No deposits, no risks – just pure prediction power.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('Predictions')}>
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 px-8 text-lg">
                  Start Predicting
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('Tasks')}>
                <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 text-white h-12 px-8 text-lg">
                  Earn Points
                  <Trophy className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 text-center"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Predictions */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Live Predictions</h2>
                <p className="text-sm text-slate-400">Make your predictions before time runs out</p>
              </div>
            </div>
            <Link to={createPageUrl('Predictions')}>
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {loadingLive ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : livePredictions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {livePredictions.slice(0, 8).map((prediction, i) => (
                <PredictionCard 
                  key={prediction.id} 
                  prediction={prediction} 
                  index={i}
                  userEntry={getUserEntry(prediction.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No live predictions yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-16 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Top Predictors</h2>
                <p className="text-sm text-slate-400">Leading the prediction game</p>
              </div>
            </div>
            <Link to={createPageUrl('Leaderboard')}>
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                Full Leaderboard <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {topUsers.slice(0, 3).map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-slate-900/50 border rounded-2xl p-6 ${
                  i === 0 ? 'border-yellow-500/30 lg:scale-105' : 'border-slate-800'
                }`}
              >
                {i === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full text-xs font-bold text-black">
                    #1 Top Predictor
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                    i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' :
                    i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                    'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                  }`}>
                    {user.wallet_address?.slice(2, 4).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {user.username || `${user.wallet_address?.slice(0, 6)}...${user.wallet_address?.slice(-4)}`}
                    </p>
                    <p className="text-sm text-slate-400">Level {user.level || 1}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Total Points</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {((user.regular_points || 0) + (user.builder_points || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Predictions</p>
                    <p className="text-lg font-bold text-white">{user.total_predictions || 0}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Start earning rewards in three simple steps. No deposits, no risks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Wallet',
                description: 'Link your MetaMask or WalletConnect wallet to get started instantly.',
                icon: Users,
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                step: '02',
                title: 'Make Predictions',
                description: 'Browse predictions and submit your answers on crypto, DeFi, NFTs and more.',
                icon: Target,
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                step: '03',
                title: 'Earn Rewards',
                description: 'Correct predictions earn you points that can be converted to token airdrops.',
                icon: Trophy,
                gradient: 'from-emerald-500 to-teal-500'
              }
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
                className="relative"
              >
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 h-full hover:border-slate-700 transition-all">
                  <div className="absolute -top-4 left-8">
                    <span className="text-5xl font-bold text-slate-800">{item.step}</span>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-3xl border border-emerald-500/20 p-8 lg:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDE2LDE4NSwxMjksMC4xKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
            
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Ready to Start Predicting?
                </h2>
                <p className="text-lg text-slate-300 max-w-xl">
                  Join thousands of users earning rewards for their predictions. 
                  Connect your wallet and claim your welcome bonus today.
                </p>
              </div>
              <Link to={createPageUrl('Predictions')}>
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-10 text-lg font-semibold whitespace-nowrap">
                  Launch App
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}