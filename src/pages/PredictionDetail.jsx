import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Trophy, 
  ExternalLink, 
  Share2, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { toast } from "sonner";
import OptionVoteBar from '../components/predictions/OptionVoteBar';
import { useWallet } from '../components/wallet/WalletContext';
import ConnectWalletModal from '../components/wallet/ConnectWalletModal';

const categoryColors = {
  crypto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  defi: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  nft: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  gaming: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  ecosystem: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  technology: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  community: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
};

export default function PredictionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const predictionId = urlParams.get('id');
  const queryClient = useQueryClient();
  const { walletAddress, userProfile, isConnected, refreshProfile } = useWallet();
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const { data: prediction, isLoading } = useQuery({
    queryKey: ['prediction', predictionId],
    queryFn: async () => {
      const predictions = await base44.entities.Prediction.filter({ id: predictionId });
      return predictions[0];
    },
    enabled: !!predictionId
  });

  const { data: userEntry } = useQuery({
    queryKey: ['user-entry', predictionId, walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      const entries = await base44.entities.PredictionEntry.filter({
        prediction_id: predictionId,
        wallet_address: walletAddress
      });
      return entries[0] || null;
    },
    enabled: !!walletAddress && !!predictionId
  });

  const submitMutation = useMutation({
    mutationFn: async (optionId) => {
      // Create entry
      await base44.entities.PredictionEntry.create({
        prediction_id: predictionId,
        wallet_address: walletAddress,
        selected_option_id: optionId,
        submitted_at: new Date().toISOString()
      });

      // Update prediction participant count and option vote count
      const updatedOptions = prediction.options.map(opt => ({
        ...opt,
        vote_count: opt.id === optionId ? (opt.vote_count || 0) + 1 : opt.vote_count || 0
      }));

      await base44.entities.Prediction.update(predictionId, {
        total_participants: (prediction.total_participants || 0) + 1,
        options: updatedOptions
      });

      // Update user profile
      await base44.entities.UserProfile.update(userProfile.id, {
        total_predictions: (userProfile.total_predictions || 0) + 1
      });

      // Log activity
      await base44.entities.ActivityLog.create({
        wallet_address: walletAddress,
        action: 'prediction_submit',
        metadata: { prediction_id: predictionId, option_id: optionId }
      });
    },
    onSuccess: () => {
      toast.success('Prediction submitted!');
      queryClient.invalidateQueries(['prediction', predictionId]);
      queryClient.invalidateQueries(['user-entry', predictionId, walletAddress]);
      refreshProfile();
      setSelectedOption(null);
    },
    onError: (error) => {
      toast.error('Failed to submit prediction');
      console.error(error);
    }
  });

  const handleSubmit = () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }
    submitMutation.mutate(selectedOption);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out this prediction: ${prediction?.title}`;
    
    if (navigator.share) {
      await navigator.share({ title: prediction?.title, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Prediction not found</h2>
          <Link to={createPageUrl('Predictions')}>
            <Button variant="outline" className="border-slate-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Predictions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isEnded = isPast(new Date(prediction.end_time));
  const isSettled = prediction.status === 'settled';
  const hasSubmitted = !!userEntry;
  const canSubmit = !isEnded && !hasSubmitted && prediction.status === 'live';

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to={createPageUrl('Predictions')}>
          <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Predictions
          </Button>
        </Link>

        {/* Cover Image */}
        {prediction.cover_image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-64 rounded-2xl overflow-hidden mb-8"
          >
            <img 
              src={prediction.cover_image} 
              alt={prediction.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge 
              variant="outline" 
              className={categoryColors[prediction.category] || categoryColors.ecosystem}
            >
              {prediction.category}
            </Badge>
            <Badge className={`${
              prediction.status === 'live' ? 'bg-emerald-500' :
              prediction.status === 'settled' ? 'bg-blue-500' : 'bg-slate-500'
            } text-white`}>
              {prediction.status === 'live' && (
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              )}
              {prediction.status}
            </Badge>
            {hasSubmitted && (
              <Badge className={`${
                userEntry?.is_correct === true ? 'bg-emerald-500' :
                userEntry?.is_correct === false ? 'bg-red-500' : 'bg-slate-700'
              } text-white`}>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {userEntry?.is_correct === true ? 'Won' : userEntry?.is_correct === false ? 'Lost' : 'Submitted'}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">{prediction.title}</h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {isEnded 
                  ? `Ended ${formatDistanceToNow(new Date(prediction.end_time), { addSuffix: true })}`
                  : `Ends ${formatDistanceToNow(new Date(prediction.end_time), { addSuffix: true })}`
                }
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{prediction.total_participants || 0} participants</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">{prediction.points_reward} points</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-slate-400 hover:text-white"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </motion.div>

        {/* Description */}
        {prediction.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
              <p className="text-slate-300 whitespace-pre-wrap">{prediction.description}</p>
            </Card>
          </motion.div>
        )}

        {/* Reference Links */}
        {prediction.reference_links && prediction.reference_links.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-3">References</h2>
            <div className="flex flex-wrap gap-2">
              {prediction.reference_links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {new URL(link).hostname}
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            {canSubmit ? 'Select Your Prediction' : 'Results'}
          </h2>
          <div className="space-y-3">
            {prediction.options?.map((option, i) => (
              <OptionVoteBar
                key={option.id}
                option={option}
                totalVotes={prediction.total_participants || 0}
                isSelected={selectedOption === option.id || userEntry?.selected_option_id === option.id}
                isCorrect={option.id === prediction.correct_option_id}
                isSettled={isSettled}
                onSelect={canSubmit ? setSelectedOption : () => {}}
                disabled={!canSubmit}
                index={i}
              />
            ))}
          </div>
        </motion.div>

        {/* Submit Button */}
        {canSubmit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={!selectedOption || submitMutation.isLoading}
              className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white disabled:opacity-50"
            >
              {submitMutation.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : !isConnected ? (
                'Connect Wallet to Submit'
              ) : (
                `Submit Prediction (+${prediction.points_reward} if correct)`
              )}
            </Button>
          </motion.div>
        )}

        {/* Result Summary */}
        {hasSubmitted && isSettled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={`p-6 ${
              userEntry?.is_correct 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  userEntry?.is_correct ? 'bg-emerald-500' : 'bg-red-500'
                }`}>
                  {userEntry?.is_correct ? (
                    <Trophy className="w-7 h-7 text-white" />
                  ) : (
                    <AlertCircle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${
                    userEntry?.is_correct ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {userEntry?.is_correct ? 'Congratulations! 🎉' : 'Better luck next time!'}
                  </h3>
                  <p className="text-slate-300">
                    {userEntry?.is_correct 
                      ? `You earned ${userEntry.points_earned || prediction.points_reward} points!`
                      : 'Your prediction was incorrect.'
                    }
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </h2>
            <div className="space-y-4">
              {prediction.start_time && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-white">Started</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(prediction.start_time), 'PPP p')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isEnded ? 'bg-slate-500' : 'bg-yellow-500'}`} />
                <div>
                  <p className="text-sm font-medium text-white">
                    {isEnded ? 'Ended' : 'Ends'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(prediction.end_time), 'PPP p')}
                  </p>
                </div>
              </div>
              {prediction.settlement_time && (
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isSettled ? 'bg-blue-500' : 'bg-slate-700'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">Settlement</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(prediction.settlement_time), 'PPP p')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <ConnectWalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  );
}