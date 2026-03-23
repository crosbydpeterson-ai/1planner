import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import FeedbackCard from './FeedbackCard';

export default function UserFeedbackStatus({ profileId }) {
  const [bugs, setBugs] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      const [b, f] = await Promise.all([
        base44.entities.BugReport.filter({ reporterProfileId: profileId }),
        base44.entities.FeatureSuggestion.filter({ reporterProfileId: profileId }),
      ]);
      setBugs(b);
      setFeatures(f);
      setLoading(false);
    })();
  }, [profileId]);

  if (loading) return null;

  const all = [
    ...bugs.map(b => ({ ...b, _type: 'bug' })),
    ...features.map(f => ({ ...f, _type: 'feature' })),
  ];

  if (all.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-600">Your Submissions</h2>
      {all.map(item => (
        <FeedbackCard
          key={item.id}
          item={item}
          type={item._type}
          isSuperAdmin={false}
          onUpdate={() => {}}
        />
      ))}
    </div>
  );
}