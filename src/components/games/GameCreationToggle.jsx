import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Super-admin only toggle that flips the global `games_creation_disabled` AppSetting.
 */
export default function GameCreationToggle({ disabled, settingId, onChange }) {
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      const next = !disabled;
      if (settingId) {
        await base44.entities.AppSetting.update(settingId, { value: next });
        onChange(next, settingId);
      } else {
        const created = await base44.entities.AppSetting.create({
          key: 'games_creation_disabled',
          value: next,
        });
        onChange(next, created.id);
      }
    } catch (e) {
      alert('Failed to update: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <Button
      onClick={toggle}
      disabled={saving}
      variant="outline"
      className={`rounded-xl gap-2 ${disabled ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-slate-200 text-slate-600'}`}
      title={disabled ? 'Game creation is disabled. Click to enable.' : 'Click to disable game creation for everyone.'}
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : disabled ? (
        <Lock className="w-4 h-4" />
      ) : (
        <Unlock className="w-4 h-4" />
      )}
      {disabled ? 'Creation Off' : 'Creation On'}
    </Button>
  );
}