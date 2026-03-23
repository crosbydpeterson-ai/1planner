import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeedbackCard from './FeedbackCard';

export default function AdminFeedbackManager() {
  const [bugs, setBugs] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [b, f] = await Promise.all([
      base44.entities.BugReport.list('-created_date'),
      base44.entities.FeatureSuggestion.list('-created_date'),
    ]);
    setBugs(b);
    setFeatures(f);
    setLoading(false);
  };

  const updateBug = async (id, data) => {
    await base44.entities.BugReport.update(id, data);
    setBugs(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const updateFeature = async (id, data) => {
    await base44.entities.FeatureSuggestion.update(id, data);
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-600">Manage Feedback</h2>
      <Tabs defaultValue="bugs">
        <TabsList className="w-full">
          <TabsTrigger value="bugs" className="flex-1 text-xs">🐛 Bugs ({bugs.length})</TabsTrigger>
          <TabsTrigger value="features" className="flex-1 text-xs">💡 Ideas ({features.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="bugs" className="space-y-2 mt-2">
          {bugs.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No bug reports yet</p>}
          {bugs.map(b => (
            <FeedbackCard key={b.id} item={b} type="bug" isSuperAdmin onUpdate={updateBug} />
          ))}
        </TabsContent>
        <TabsContent value="features" className="space-y-2 mt-2">
          {features.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No feature ideas yet</p>}
          {features.map(f => (
            <FeedbackCard key={f.id} item={f} type="feature" isSuperAdmin onUpdate={updateFeature} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}