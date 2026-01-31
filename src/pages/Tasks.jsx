import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Gift, 
  Twitter, 
  MessageCircle, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import { isToday, parseISO, isSameDay, subDays } from 'date-fns';
import TaskCard from '../components/tasks/TaskCard';
import DailyCheckIn from '../components/tasks/DailyCheckIn';
import { useWallet } from '../components/wallet/WalletContext';
import ConnectWalletModal from '../components/wallet/ConnectWalletModal';

export default function Tasks() {
  const { walletAddress, userProfile, isConnected, refreshProfile } = useWallet();
  const queryClient = useQueryClient();
  const [showWalletModal, setShowWalletModal] = React.useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      return await base44.entities.Task.filter({ is_active: true }, '-created_date');
    }
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['task-completions', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      return await base44.entities.TaskCompletion.filter({ wallet_address: walletAddress });
    },
    enabled: !!walletAddress
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error('Not connected');
      
      const lastCheckIn = userProfile?.last_check_in;
      let newStreak = 1;
      
      // Calculate streak
      if (lastCheckIn) {
        const lastDate = parseISO(lastCheckIn);
        const yesterday = subDays(new Date(), 1);
        if (isSameDay(lastDate, yesterday)) {
          newStreak = (userProfile?.check_in_streak || 0) + 1;
        }
      }

      // Calculate reward
      const dayInCycle = ((newStreak - 1) % 7) + 1;
      const streakRewards = [10, 15, 20, 25, 35, 45, 100];
      const pointsEarned = streakRewards[dayInCycle - 1] || 10;

      // Update user profile
      await base44.entities.UserProfile.update(userProfile.id, {
        check_in_streak: newStreak,
        last_check_in: new Date().toISOString(),
        regular_points: (userProfile?.regular_points || 0) + pointsEarned
      });

      // Create points transaction
      await base44.entities.PointsTransaction.create({
        wallet_address: walletAddress,
        amount: pointsEarned,
        points_type: 'regular',
        transaction_type: 'check_in',
        description: `Daily check-in (Day ${dayInCycle} streak bonus)`
      });

      // Log activity
      await base44.entities.ActivityLog.create({
        wallet_address: walletAddress,
        action: 'check_in',
        metadata: { streak: newStreak, points: pointsEarned }
      });

      return { streak: newStreak, points: pointsEarned };
    },
    onSuccess: (data) => {
      toast.success(`+${data.points} points! Streak: ${data.streak} days 🔥`);
      refreshProfile();
    },
    onError: (error) => {
      toast.error('Failed to check in');
      console.error(error);
    }
  });

  const taskCompletionMutation = useMutation({
    mutationFn: async (task) => {
      if (!walletAddress) throw new Error('Not connected');

      // Open task URL if exists
      if (task.action_url) {
        window.open(task.action_url, '_blank');
      }

      // Create pending completion
      await base44.entities.TaskCompletion.create({
        task_id: task.id,
        wallet_address: walletAddress,
        status: task.verification_type === 'automatic' ? 'verified' : 'pending',
        points_awarded: task.verification_type === 'automatic' ? task.points_reward : 0,
        completed_at: new Date().toISOString()
      });

      // If automatic verification, award points immediately
      if (task.verification_type === 'automatic') {
        const pointsField = task.points_type === 'builder' ? 'builder_points' : 'regular_points';
        const currentPoints = userProfile?.[pointsField] || 0;
        
        await base44.entities.UserProfile.update(userProfile.id, {
          [pointsField]: currentPoints + task.points_reward
        });

        await base44.entities.PointsTransaction.create({
          wallet_address: walletAddress,
          amount: task.points_reward,
          points_type: task.points_type || 'regular',
          transaction_type: 'task_completion',
          reference_id: task.id,
          description: `Completed task: ${task.title}`
        });

        // Update task completion count
        await base44.entities.Task.update(task.id, {
          current_completions: (task.current_completions || 0) + 1
        });
      }

      // Log activity
      await base44.entities.ActivityLog.create({
        wallet_address: walletAddress,
        action: 'task_complete',
        metadata: { task_id: task.id, task_title: task.title }
      });

      return { task, automatic: task.verification_type === 'automatic' };
    },
    onSuccess: (data) => {
      if (data.automatic) {
        toast.success(`+${data.task.points_reward} points earned!`);
      } else {
        toast.success('Task submitted for verification');
      }
      queryClient.invalidateQueries(['task-completions', walletAddress]);
      queryClient.invalidateQueries(['tasks']);
      refreshProfile();
    },
    onError: (error) => {
      toast.error('Failed to complete task');
      console.error(error);
    }
  });

  const handleCheckIn = () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    checkInMutation.mutate();
  };

  const handleTaskComplete = (task) => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    taskCompletionMutation.mutate(task);
  };

  const isTaskCompleted = (taskId) => {
    const completion = completions.find(c => c.task_id === taskId);
    if (!completion) return false;
    
    const task = tasks.find(t => t.id === taskId);
    if (task?.is_recurring) {
      const completedAt = parseISO(completion.completed_at);
      if (task.recurrence_period === 'daily') {
        return isToday(completedAt);
      }
    }
    return completion.status === 'verified';
  };

  const isTaskPending = (taskId) => {
    const completion = completions.find(c => c.task_id === taskId);
    return completion?.status === 'pending';
  };

  const categorizedTasks = useMemo(() => {
    const social = tasks.filter(t => ['twitter_share', 'twitter_follow', 'discord_join', 'telegram_join'].includes(t.task_type));
    const partner = tasks.filter(t => t.partner_name);
    const other = tasks.filter(t => !['twitter_share', 'twitter_follow', 'discord_join', 'telegram_join', 'daily_checkin'].includes(t.task_type) && !t.partner_name);
    
    return { social, partner, other };
  }, [tasks]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Earn Points</h1>
          </div>
          <p className="text-slate-400">
            Complete tasks to earn points and climb the leaderboard
          </p>
        </div>

        {/* Daily Check-in */}
        <div className="mb-8">
          <DailyCheckIn 
            userProfile={userProfile} 
            onCheckIn={handleCheckIn}
          />
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800 w-full justify-start mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-800">
              All Tasks
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-slate-800">
              <Twitter className="w-4 h-4 mr-1.5" />
              Social
            </TabsTrigger>
            <TabsTrigger value="partner" className="data-[state=active]:bg-slate-800">
              <Gift className="w-4 h-4 mr-1.5" />
              Partner
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <>
              <TabsContent value="all">
                <div className="space-y-4">
                  {tasks.filter(t => t.task_type !== 'daily_checkin').map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      isCompleted={isTaskCompleted(task.id)}
                      isPending={isTaskPending(task.id)}
                      onComplete={handleTaskComplete}
                    />
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                      <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No tasks available at the moment</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="social">
                <div className="space-y-4">
                  {categorizedTasks.social.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      isCompleted={isTaskCompleted(task.id)}
                      isPending={isTaskPending(task.id)}
                      onComplete={handleTaskComplete}
                    />
                  ))}
                  {categorizedTasks.social.length === 0 && (
                    <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                      <Twitter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No social tasks available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="partner">
                <div className="space-y-4">
                  {categorizedTasks.partner.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      isCompleted={isTaskCompleted(task.id)}
                      isPending={isTaskPending(task.id)}
                      onComplete={handleTaskComplete}
                    />
                  ))}
                  {categorizedTasks.partner.length === 0 && (
                    <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                      <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No partner tasks available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <ConnectWalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  );
}