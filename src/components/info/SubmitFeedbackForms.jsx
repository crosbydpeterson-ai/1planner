import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bug, Lightbulb, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

function FeedbackCard({ icon: Icon, iconColor, title, subtitle, onSubmit, submitting }) {
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('Please add a title');
      return;
    }
    await onSubmit(formTitle.trim(), formDesc.trim());
    setFormTitle('');
    setFormDesc('');
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">
        <Input
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="Title"
          className="bg-white border-slate-200 text-sm h-9"
        />
        <Textarea
          value={formDesc}
          onChange={(e) => setFormDesc(e.target.value)}
          placeholder="Details (optional)"
          className="bg-white border-slate-200 text-sm min-h-[60px]"
        />
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="sm"
          className="w-full bg-slate-800 hover:bg-slate-700 text-sm"
        >
          {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
          Submit
        </Button>
      </div>
    </div>
  );
}

export default function SubmitFeedbackForms({ profileId, username }) {
  const [submittingBug, setSubmittingBug] = useState(false);
  const [submittingFeature, setSubmittingFeature] = useState(false);

  const handleBugSubmit = async (title, description) => {
    setSubmittingBug(true);
    await base44.entities.BugReport.create({
      title,
      description,
      reporterProfileId: profileId,
      reporterUsername: username,
      status: 'open'
    });
    toast.success('Bug report submitted!');
    setSubmittingBug(false);
  };

  const handleFeatureSubmit = async (title, description) => {
    setSubmittingFeature(true);
    await base44.entities.FeatureSuggestion.create({
      title,
      description,
      reporterProfileId: profileId,
      reporterUsername: username,
      status: 'submitted'
    });
    toast.success('Feature idea submitted!');
    setSubmittingFeature(false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FeedbackCard
        icon={Bug}
        iconColor="bg-red-500"
        title="Report a Bug"
        subtitle="Something broken?"
        onSubmit={handleBugSubmit}
        submitting={submittingBug}
      />
      <FeedbackCard
        icon={Lightbulb}
        iconColor="bg-amber-500"
        title="Suggest a Feature"
        subtitle="Got an idea?"
        onSubmit={handleFeatureSubmit}
        submitting={submittingFeature}
      />
    </div>
  );
}