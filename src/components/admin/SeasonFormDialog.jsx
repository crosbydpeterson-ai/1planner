import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

export default function SeasonFormDialog({ open, onOpenChange, seasonForm, setSeasonForm, onSubmit, customPets, customThemes }) {
  const addReward = () => {
    setSeasonForm({ ...seasonForm, rewards: [...seasonForm.rewards, { xpRequired: 100, type: 'pet', value: '', name: '' }] });
  };

  const updateReward = (index, field, value) => {
    const newRewards = [...seasonForm.rewards];
    newRewards[index][field] = value;
    setSeasonForm({ ...seasonForm, rewards: newRewards });
  };

  const removeReward = (index) => {
    setSeasonForm({ ...seasonForm, rewards: seasonForm.rewards.filter((_, i) => i !== index) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Season</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Season Name</Label>
            <Input
              value={seasonForm.name}
              onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
              placeholder="Spring 2024"
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={seasonForm.startDate} onChange={(e) => setSeasonForm({ ...seasonForm, startDate: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={seasonForm.endDate} onChange={(e) => setSeasonForm({ ...seasonForm, endDate: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Season Rewards</Label>
              <Button size="sm" onClick={addReward} className="bg-amber-600">
                <Plus className="w-3 h-3 mr-1" /> Add Reward
              </Button>
            </div>
            <div className="space-y-3">
              {seasonForm.rewards.map((reward, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Reward {index + 1}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeReward(index)} className="text-red-400 h-6 px-2">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Name" value={reward.name} onChange={(e) => updateReward(index, 'name', e.target.value)} className="bg-slate-600 border-slate-500 text-sm" />
                    <Input type="number" placeholder="XP Required" value={reward.xpRequired} onChange={(e) => updateReward(index, 'xpRequired', parseInt(e.target.value) || 0)} className="bg-slate-600 border-slate-500 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={reward.type} onValueChange={(v) => updateReward(index, 'type', v)}>
                      <SelectTrigger className="bg-slate-600 border-slate-500 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pet">Pet</SelectItem>
                        <SelectItem value="theme">Theme</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="magic_egg">Magic Egg 🥚</SelectItem>
                      </SelectContent>
                    </Select>
                    {reward.type === 'pet' ? (
                      <Select value={reward.value} onValueChange={(v) => updateReward(index, 'value', v)}>
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-sm">
                          <SelectValue placeholder="Select pet" />
                        </SelectTrigger>
                        <SelectContent>
                          {customPets.map(pet => (
                            <SelectItem key={pet.id} value={`custom_${pet.id}`}>{pet.emoji || '🎁'} {pet.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : reward.type === 'theme' ? (
                      <Select value={reward.value} onValueChange={(v) => updateReward(index, 'value', v)}>
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-sm">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {customThemes.map(theme => (
                            <SelectItem key={theme.id} value={`custom_${theme.id}`}>{theme.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : reward.type === 'magic_egg' ? (
                      <div className="flex items-center text-sm text-slate-300 bg-slate-600 rounded-md px-3">🥚 Magic Egg reward</div>
                    ) : (
                      <Input placeholder="Title text" value={reward.value} onChange={(e) => updateReward(index, 'value', e.target.value)} className="bg-slate-600 border-slate-500 text-sm" />
                    )}
                  </div>
                </div>
              ))}
              {seasonForm.rewards.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-2">No rewards added yet</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} className="bg-amber-600">Create Season</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}