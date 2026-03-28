import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function ActiveEggJobs({ adminProfile, onComplete }) {
  const [jobs, setJobs] = useState([]);

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

  if (jobs.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-medium">Recent Jobs</p>
      {jobs.map((job) => {
        const pct = job.totalCount > 0 ? Math.round((job.completedCount / job.totalCount) * 100) : 0;
        const isActive = job.status === 'pending' || job.status === 'processing';
        const isDone = job.status === 'completed';
        const isFailed = job.status === 'failed';

        return (
          <div key={job.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {isActive && <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />}
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                {isFailed && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <span className="text-sm text-white truncate">{job.idea}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400">{job.completedCount}/{job.totalCount}</span>
                {!isActive && (
                  <Button size="sm" variant="ghost" onClick={() => deleteJob(job.id)} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            {isActive && <Progress value={pct} className="h-1.5 mb-1" />}
            {job.currentStep && (
              <p className="text-xs text-slate-400">{job.currentStep}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}