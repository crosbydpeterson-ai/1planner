import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export default function PetConceptDialog({ open, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rarity, setRarity] = useState('uncommon');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) return;
    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      rarity,
    });
    setName('');
    setDescription('');
    setRarity('uncommon');
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#2b2d31] border-[#1e1f22] text-[#dbdee1] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Submit Pet Idea
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-[#b5bac1] text-xs">Pet Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Crystal Fox"
              className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] mt-1"
              maxLength={40}
            />
          </div>
          <div>
            <Label className="text-[#b5bac1] text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your pet idea... what does it look like? What makes it special?"
              className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] mt-1 min-h-[80px]"
              maxLength={300}
            />
            <p className="text-[10px] text-[#6d6f78] mt-1">{description.length}/300</p>
          </div>
          <div>
            <Label className="text-[#b5bac1] text-xs">Suggested Rarity</Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RARITIES.map(r => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-[#6d6f78]">
            Your pet idea will be posted in the community and sent to admins for review. If approved, it may become a real pet!
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#b5bac1]">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !description.trim()}
            className="bg-[#5865f2] hover:bg-[#4752c4]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Submit Idea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}