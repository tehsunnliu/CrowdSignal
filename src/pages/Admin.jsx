import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Target, 
  Users, 
  Gift,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Eye,
  AlertCircle,
  Clock,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from "sonner";
import { useWallet } from '../components/wallet/WalletContext';

export default function Admin() {
  const { userProfile, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'moderator';

  const { data: pendingPredictions = [], isLoading: loadingPredictions } = useQuery({
    queryKey: ['admin', 'pending-predictions'],
    queryFn: async () => {
      return await base44.entities.Prediction.filter(
        { status: 'pending_review' },
        '-created_date',
        50
      );
    },
    enabled: isAdmin
  });

  const { data: pendingTaskCompletions = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['admin', 'pending-tasks'],
    queryFn: async () => {
      return await base44.entities.TaskCompletion.filter(
        { status: 'pending' },
        '-created_date',
        100
      );
    },
    enabled: isAdmin
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => await base44.entities.Task.list('-created_date'),
    enabled: isAdmin
  });

  const { data: livePredictions = [] } = useQuery({
    queryKey: ['admin', 'live-predictions'],
    queryFn: async () => {
      return await base44.entities.Prediction.filter(
        { status: { $in: ['live', 'ended'] } },
        '-created_date',
        50
      );
    },
    enabled: isAdmin
  });

  const approveMutation = useMutation({
    mutationFn: async (prediction) => {
      await base44.entities.Prediction.update(prediction.id, {
        status: 'live',
        start_time: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Prediction approved');
      queryClient.invalidateQueries(['admin', 'pending-predictions']);
      setSelectedPrediction(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ prediction, reason }) => {
      await base44.entities.Prediction.update(prediction.id, {
        status: 'rejected',
        rejection_reason: reason
      });
    },
    onSuccess: () => {
      toast.success('Prediction rejected');
      queryClient.invalidateQueries(['admin', 'pending-predictions']);
      setSelectedPrediction(null);
      setRejectionReason('');
    }
  });

  const settleMutation = useMutation({
    mutationFn: async ({ prediction, correctOptionId }) => {
      // Update prediction
      await base44.entities.Prediction.update(prediction.id, {
        status: 'settled',
        correct_option_id: correctOptionId,
        settlement_time: new Date().toISOString()
      });

      // Get all entries for this prediction
      const entries = await base44.entities.PredictionEntry.filter({
        prediction_id: prediction.id
      });

      // Update each entry and award points to winners
      for (const entry of entries) {
        const isCorrect = entry.selected_option_id === correctOptionId;
        
        await base44.entities.PredictionEntry.update(entry.id, {
          is_correct: isCorrect,
          points_earned: isCorrect ? prediction.points_reward : 0
        });

        if (isCorrect) {
          // Get user profile
          const profiles = await base44.entities.UserProfile.filter({
            wallet_address: entry.wallet_address
          });
          
          if (profiles.length > 0) {
            const profile = profiles[0];
            await base44.entities.UserProfile.update(profile.id, {
              regular_points: (profile.regular_points || 0) + prediction.points_reward,
              correct_predictions: (profile.correct_predictions || 0) + 1
            });

            // Create transaction
            await base44.entities.PointsTransaction.create({
              wallet_address: entry.wallet_address,
              amount: prediction.points_reward,
              points_type: 'regular',
              transaction_type: 'prediction_win',
              reference_id: prediction.id,
              description: `Won prediction: ${prediction.title}`
            });
          }
        }
      }
    },
    onSuccess: () => {
      toast.success('Prediction settled and rewards distributed');
      queryClient.invalidateQueries(['admin', 'live-predictions']);
    }
  });

  const verifyTaskMutation = useMutation({
    mutationFn: async ({ completion, approved }) => {
      const task = tasks.find(t => t.id === completion.task_id);
      
      if (approved && task) {
        // Update completion
        await base44.entities.TaskCompletion.update(completion.id, {
          status: 'verified',
          points_awarded: task.points_reward,
          verified_at: new Date().toISOString()
        });

        // Award points
        const profiles = await base44.entities.UserProfile.filter({
          wallet_address: completion.wallet_address
        });
        
        if (profiles.length > 0) {
          const profile = profiles[0];
          const pointsField = task.points_type === 'builder' ? 'builder_points' : 'regular_points';
          
          await base44.entities.UserProfile.update(profile.id, {
            [pointsField]: (profile[pointsField] || 0) + task.points_reward
          });

          await base44.entities.PointsTransaction.create({
            wallet_address: completion.wallet_address,
            amount: task.points_reward,
            points_type: task.points_type || 'regular',
            transaction_type: 'task_completion',
            reference_id: task.id,
            description: `Completed task: ${task.title}`
          });
        }
      } else {
        await base44.entities.TaskCompletion.update(completion.id, {
          status: 'rejected'
        });
      }
    },
    onSuccess: () => {
      toast.success('Task completion processed');
      queryClient.invalidateQueries(['admin', 'pending-tasks']);
    }
  });

  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Admin Access Required</h2>
          <p className="text-slate-400">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-slate-400">
            Manage predictions, tasks, and user content
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingPredictions.length}</p>
                <p className="text-xs text-slate-400">Pending Review</p>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{livePredictions.length}</p>
                <p className="text-xs text-slate-400">Live Predictions</p>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingTaskCompletions.length}</p>
                <p className="text-xs text-slate-400">Task Verifications</p>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{tasks.length}</p>
                <p className="text-xs text-slate-400">Active Tasks</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800 w-full justify-start mb-6">
            <TabsTrigger value="predictions" className="data-[state=active]:bg-slate-800">
              <Target className="w-4 h-4 mr-1.5" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="settle" className="data-[state=active]:bg-slate-800">
              <Trophy className="w-4 h-4 mr-1.5" />
              Settle
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-slate-800">
              <Gift className="w-4 h-4 mr-1.5" />
              Task Verifications
            </TabsTrigger>
          </TabsList>

          {/* Predictions Tab */}
          <TabsContent value="predictions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Pending Review</h3>
                {loadingPredictions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                ) : pendingPredictions.length > 0 ? (
                  <div className="space-y-3">
                    {pendingPredictions.map((prediction, i) => (
                      <motion.div
                        key={prediction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card 
                          className={`bg-slate-900/50 border-slate-800 p-4 cursor-pointer hover:border-slate-700 transition-all ${
                            selectedPrediction?.id === prediction.id ? 'border-emerald-500' : ''
                          }`}
                          onClick={() => setSelectedPrediction(prediction)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{prediction.title}</h4>
                              <p className="text-xs text-slate-400 mt-1">
                                by {prediction.creator_wallet?.slice(0, 6)}...{prediction.creator_wallet?.slice(-4)}
                              </p>
                            </div>
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Pending
                            </Badge>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-slate-400">All caught up!</p>
                  </div>
                )}
              </div>

              {/* Selected Preview */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Preview & Actions</h3>
                {selectedPrediction ? (
                  <Card className="bg-slate-900/50 border-slate-800 p-6">
                    {selectedPrediction.cover_image && (
                      <img 
                        src={selectedPrediction.cover_image} 
                        alt="Cover"
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                    <Badge className="mb-2">{selectedPrediction.category}</Badge>
                    <h4 className="text-xl font-bold text-white mb-2">{selectedPrediction.title}</h4>
                    <p className="text-slate-400 text-sm mb-4">{selectedPrediction.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-slate-500">Options:</p>
                      {selectedPrediction.options?.map((opt, i) => (
                        <div key={i} className="p-2 bg-slate-800/50 rounded text-sm text-white">
                          {opt.text}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                      <span>Ends: {format(new Date(selectedPrediction.end_time), 'PPP')}</span>
                      <span>Reward: {selectedPrediction.points_reward} pts</span>
                    </div>

                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason (optional)"
                      className="bg-slate-800 border-slate-700 text-white mb-4"
                    />

                    <div className="flex gap-3">
                      <Button
                        onClick={() => approveMutation.mutate(selectedPrediction)}
                        disabled={approveMutation.isLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                      >
                        {approveMutation.isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate({ 
                          prediction: selectedPrediction, 
                          reason: rejectionReason 
                        })}
                        disabled={rejectMutation.isLoading}
                        variant="destructive"
                        className="flex-1"
                      >
                        {rejectMutation.isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                    <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Select a prediction to preview</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settle Tab */}
          <TabsContent value="settle">
            <h3 className="text-lg font-semibold text-white mb-4">Settle Predictions</h3>
            {livePredictions.filter(p => p.status === 'ended' || new Date(p.end_time) < new Date()).length > 0 ? (
              <div className="space-y-4">
                {livePredictions
                  .filter(p => p.status === 'ended' || new Date(p.end_time) < new Date())
                  .map((prediction) => (
                    <Card key={prediction.id} className="bg-slate-900/50 border-slate-800 p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-white">{prediction.title}</h4>
                          <p className="text-xs text-slate-400">
                            {prediction.total_participants || 0} participants
                          </p>
                        </div>
                        <Badge className="bg-orange-500/20 text-orange-400">
                          Needs Settlement
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Select correct answer:</p>
                        {prediction.options?.map((opt) => (
                          <Button
                            key={opt.id}
                            variant="outline"
                            onClick={() => settleMutation.mutate({ 
                              prediction, 
                              correctOptionId: opt.id 
                            })}
                            disabled={settleMutation.isLoading}
                            className="w-full justify-start border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10"
                          >
                            {opt.text}
                            <span className="ml-auto text-slate-500">
                              {opt.vote_count || 0} votes
                            </span>
                          </Button>
                        ))}
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-slate-400">No predictions need settlement</p>
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <h3 className="text-lg font-semibold text-white mb-4">Task Verification Queue</h3>
            {loadingTasks ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : pendingTaskCompletions.length > 0 ? (
              <div className="space-y-3">
                {pendingTaskCompletions.map((completion, i) => {
                  const task = tasks.find(t => t.id === completion.task_id);
                  return (
                    <motion.div
                      key={completion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{task?.title || 'Unknown Task'}</p>
                            <p className="text-xs text-slate-400">
                              {completion.wallet_address?.slice(0, 6)}...{completion.wallet_address?.slice(-4)}
                              {' • '}
                              {format(new Date(completion.completed_at || completion.created_date), 'MMM d, h:mm a')}
                            </p>
                            {completion.proof_url && (
                              <a 
                                href={completion.proof_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-400 hover:underline mt-1 block"
                              >
                                View Proof
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => verifyTaskMutation.mutate({ completion, approved: true })}
                              disabled={verifyTaskMutation.isLoading}
                              className="bg-emerald-500 hover:bg-emerald-600"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => verifyTaskMutation.mutate({ completion, approved: false })}
                              disabled={verifyTaskMutation.isLoading}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-slate-400">No pending verifications</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}