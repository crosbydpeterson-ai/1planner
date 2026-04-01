import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart3, Plus, X } from 'lucide-react';

export default function PollCreatorDialog({ open, onClose, onSubmit }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const removeOption = (i) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, j) => j !== i));
  };

  const updateOption = (i, val) => {
    const copy = [...options];
    copy[i] = val;
    setOptions(copy);
  };

  const handleSubmit = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    setSubmitting(true);
    await onSubmit(question.trim(), validOptions);
    setQuestion('');
    setOptions(['', '']);
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#2b2d31] border-[#1e1f22] text-[#dbdee1] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Create Poll
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-[#b5bac1] text-xs">Question</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to ask?"
              className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] mt-1"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#b5bac1] text-xs">Options</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] flex-1"
                />
                {options.length > 2 && (
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-[#949ba4] hover:text-red-400" onClick={() => removeOption(i)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <Button variant="ghost" size="sm" onClick={addOption} className="text-[#949ba4] hover:text-white text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Option
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#b5bac1]">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !question.trim() || options.filter(o => o.trim()).length < 2}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <BarChart3 className="w-4 h-4 mr-1" />}
            Create Poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}