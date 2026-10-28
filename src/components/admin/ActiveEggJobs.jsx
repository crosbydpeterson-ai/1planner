import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { runEggGenerationJob } from '@/lib/eggGeneration';

const STALE_MS = 2 * 60 * 1000;

export default function ActiveEggJobs({ adminProfile, onComplete }) {
  const [jobs, setJobs] = useState([]);
  const [restarting, setRestarting] = useState({});

  useEffect(() => {
    loadJobs();
    const unsub = base44.entities.EggGenerationJob.subscribe((event) => {
      if (event.type === 'create') {
        setJobs(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setJobs(prev => prev.map(j => j.id === event.id ? event.data : j));
        if (event.data.status === 'completed') {
          onComplete?.();
        }
      } else if (event.type === 'delete') {
        setJobs(prev => prev.filter(j => j.id !== event.id));
      }
    });
    return unsub;
  }, []);

  const loadJobs = async () => {
    const all = await base44.entities.EggGenerationJob.list('-created_date', 10);
    setJobs(all);
  };

  const deleteJob = async (id) => {
    await base44.entities.EggGenerationJob.delete(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const restartJob = async (job) => {
    setRestarting(prev => ({ ...prev, [job.id]: true }));
    await runEggGenerationJob(job, {
      createdBy: adminProfile?.userId || 'admin',
      createdByProfileId: adminProfile?.id,
      onComplete: () => onComplete?.()
    });
    setRestarting(prev => ({ ...prev, [job.id]: false }));
    loadJobs();
  };

  if (jobs.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-medium">Recent Jobs</p>
      {jobs.map((job) => {
        const pct = job.totalCount > 0 ? Math.round((job.completedCount / job.totalCount) * 100) : 0;
        // A job only really runs while the browser tab that started it is open.
        // One that never started, or stopped for over 2 minutes, is stuck.
        const lastTouch = new Date(job.updated_date || job.created_date).getTime();
        const stale = job.status === 'pending' ||
          (job.status === 'processing' && Date.now() - lastTouch > STALE_MS);
        const isActive = (job.status === 'pending' || job.status === 'processing') && !stale;
        const isDone = job.status === 'completed';
        const isFailed = job.status === 'failed';
        const canRestart = (stale || isFailed) && !restarting[job.id];

        return (
          <div key={job.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {isActive && <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />}
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                {(isFailed || stale) && <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                <span className="text-sm text-white truncate">{job.idea}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400">{job.completedCount}/{job.totalCount}</span>
                {canRestart && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => restartJob(job)}
                    className="h-6 px-2 text-xs text-amber-300 hover:text-amber-200"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                )}
                {restarting[job.id] && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
                {!isActive && !restarting[job.id] && (
                  <Button size="sm" variant="ghost" onClick={() => deleteJob(job.id)} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            {isActive && <Progress value={pct} className="h-1.5 mb-1" />}
            {job.currentStep && (
              <p className="text-xs text-slate-400">
                {stale && !isFailed ? `Stopped — ${job.currentStep}` : job.currentStep}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}