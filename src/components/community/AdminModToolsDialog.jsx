import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, Sparkles, UserX, Scan } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminModToolsDialog({ open, onClose, profilesCache, posts, onRefresh }) {
  const [tab, setTab] = useState('scan');
  
  // AI Scan state
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  
  // AI Summarize state
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  
  // Kick state
  const [kickUsername, setKickUsername] = useState('');
  const [kickReason, setKickReason] = useState('');
  const [kicking, setKicking] = useState(false);

  const handleAIScan = async () => {
    if (!posts || posts.length === 0) { toast.error('No posts to scan'); return; }
    setScanning(true);
    setScanResults(null);
    
    const postTexts = posts.slice(0, 30).map((p, i) => `[${i + 1}] ${p.authorUsername}: ${p.content}`).join('\n');
    
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a school safety moderator for students aged 10-14. Analyze these community posts and flag ANY that contain:
- Bullying, mean comments, or targeting someone
- Inappropriate language (even coded/slang)
- Off-topic spam or attention-seeking
- Anything a teacher would want to know about

Posts:
${postTexts}

For each flagged post, explain WHY it's concerning and rate severity (low/medium/high). If all posts are fine, say so.`,
      response_json_schema: {
        type: "object",
        properties: {
          allClear: { type: "boolean" },
          flaggedPosts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                postNumber: { type: "number" },
                author: { type: "string" },
                reason: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                suggestion: { type: "string" }
              }
            }
          },
          overallNote: { type: "string" }
        }
      }
    });
    
    setScanResults(res);
    setScanning(false);
  };

  const handleAISummarize = async () => {
    if (!posts || posts.length === 0) { toast.error('No posts to summarize'); return; }
    setSummarizing(true);
    setSummary(null);
    
    const postTexts = posts.slice(0, 50).map(p => `${p.authorUsername}: ${p.content}`).join('\n');
    
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Summarize the mood and key topics of this school community channel for a teacher. Note:
- What are students mainly talking about?
- What's the general mood (positive, negative, mixed)?
- Any concerning patterns (cliques, exclusion, drama)?
- Who are the most active/influential posters?

Posts:
${postTexts}

Keep it concise and actionable for a teacher.`,
      response_json_schema: {
        type: "object",
        properties: {
          mood: { type: "string" },
          topTopics: { type: "array", items: { type: "string" } },
          concerns: { type: "array", items: { type: "string" } },
          activeUsers: { type: "array", items: { type: "string" } },
          teacherNote: { type: "string" }
        }
      }
    });
    
    setSummary(res);
    setSummarizing(false);
  };

  const handleKickUser = async () => {
    if (!kickUsername.trim()) { toast.error('Enter a username'); return; }
    setKicking(true);
    
    const target = Object.values(profilesCache).find(p => p.username?.toLowerCase() === kickUsername.trim().toLowerCase());
    if (!target) { toast.error('User not found'); setKicking(false); return; }
    
    // Ban user + delete all their pending posts
    await base44.entities.UserProfile.update(target.id, {
      isBanned: true,
      banReason: kickReason.trim() || 'Removed from community by admin',
      banEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    // Delete their pending posts in current channel
    const userPosts = posts.filter(p => p.authorProfileId === target.id && p.status === 'pending');
    for (const p of userPosts) {
      await base44.entities.CommunityPost.delete(p.id);
    }
    
    toast.success(`${target.username} has been banned for 7 days and their pending posts removed.`);
    setKickUsername('');
    setKickReason('');
    setKicking(false);
    onRefresh?.();
  };

  const severityColor = (s) => ({ low: 'text-amber-600 bg-amber-50', medium: 'text-orange-600 bg-orange-50', high: 'text-red-600 bg-red-50' }[s] || 'text-slate-500 bg-slate-50');

  const tabs = [
    { id: 'scan', label: 'AI Safety Scan', icon: Scan },
    { id: 'summary', label: 'AI Channel Summary', icon: Sparkles },
    { id: 'kick', label: 'Ban User', icon: UserX },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-amber-500" /> Moderation Tools</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* AI Safety Scan */}
        {tab === 'scan' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">AI scans the last 30 posts in this channel for bullying, inappropriate content, or concerning behavior.</p>
            <Button onClick={handleAIScan} disabled={scanning} className="w-full bg-indigo-500 hover:bg-indigo-600 gap-2">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {scanning ? 'Scanning...' : 'Run AI Safety Scan'}
            </Button>
            {scanResults && (
              <div className="space-y-2 mt-3">
                {scanResults.allClear ? (
                  <div className="bg-green-50 text-green-700 rounded-xl p-3 text-sm font-medium">✅ All clear — no issues found!</div>
                ) : (
                  <>
                    {(scanResults.flaggedPosts || []).map((f, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">Post #{f.postNumber} — {f.author}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${severityColor(f.severity)}`}>{f.severity}</span>
                        </div>
                        <p className="text-xs text-slate-600">{f.reason}</p>
                        <p className="text-xs text-indigo-500 font-medium">💡 {f.suggestion}</p>
                      </div>
                    ))}
                  </>
                )}
                {scanResults.overallNote && <p className="text-xs text-slate-500 italic mt-2">{scanResults.overallNote}</p>}
              </div>
            )}
          </div>
        )}

        {/* AI Summary */}
        {tab === 'summary' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">AI reads the channel and gives you a quick teacher-friendly summary of what's happening.</p>
            <Button onClick={handleAISummarize} disabled={summarizing} className="w-full bg-purple-500 hover:bg-purple-600 gap-2">
              {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {summarizing ? 'Analyzing...' : 'Generate Channel Summary'}
            </Button>
            {summary && (
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 mt-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Mood</p>
                  <p className="text-sm text-slate-700">{summary.mood}</p>
                </div>
                {(summary.topTopics || []).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Key Topics</p>
                    <div className="flex flex-wrap gap-1 mt-1">{summary.topTopics.map((t, i) => <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{t}</span>)}</div>
                  </div>
                )}
                {(summary.concerns || []).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-400 uppercase">Concerns</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside">{summary.concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                )}
                {(summary.activeUsers || []).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Most Active</p>
                    <p className="text-sm text-slate-600">{summary.activeUsers.join(', ')}</p>
                  </div>
                )}
                {summary.teacherNote && (
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-xs font-bold text-amber-600 uppercase">Teacher Note</p>
                    <p className="text-xs text-amber-700">{summary.teacherNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ban User */}
        {tab === 'kick' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Ban a user from the app for 7 days. Their pending posts will be removed.</p>
            <div className="space-y-2">
              <Input placeholder="Username to ban" value={kickUsername} onChange={(e) => setKickUsername(e.target.value)} />
              <Textarea placeholder="Reason (optional, shown to user)" value={kickReason} onChange={(e) => setKickReason(e.target.value)} className="min-h-[60px]" />
            </div>
            <Button onClick={handleKickUser} disabled={kicking || !kickUsername.trim()} variant="destructive" className="w-full gap-2">
              {kicking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
              {kicking ? 'Banning...' : 'Ban User (7 days)'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}