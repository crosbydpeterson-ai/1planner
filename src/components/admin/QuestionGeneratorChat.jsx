import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Bot, User, Plus, Save, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function QuestionGeneratorChat({ adminProfile }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const pollRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.entities.Assignment.list('-created_date', 100).then(setAssignments).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  const startNewSession = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setLoading(true);
    setMessages([]);
    setConversationId(null);
    setSavedId(null);
    try {
      const profileId = adminProfile?.id || localStorage.getItem('quest_profile_id');
      const username = adminProfile?.username || localStorage.getItem('quest_username') || 'admin';
      const res = await base44.functions.invoke('questionGeneratorAgent', {
        action: 'create',
        profileId,
        username,
        assignmentTitle: selectedAssignment?.title || null,
        assignmentId: selectedAssignmentId || null,
      });
      const convo = res.data.conversation;
      setConversationId(convo.id);
      setMessages(convo.messages || []);

      // If assignment selected, auto-prompt the agent
      if (selectedAssignment) {
        setTimeout(() => autoPromptAssignment(convo.id, selectedAssignment), 500);
      }
    } catch (e) {
      console.error('Failed to start session', e);
    }
    setLoading(false);
  };

  const autoPromptAssignment = async (convoId, assignment) => {
    setThinking(true);
    const prompt = `Generate 10 quiz questions for the assignment titled "${assignment.title}"${assignment.description ? `. Description: ${assignment.description}` : ''}${assignment.pdfUrl ? `. PDF: ${assignment.pdfUrl}` : ''}.`;
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    try {
      await base44.functions.invoke('questionGeneratorAgent', {
        action: 'send',
        conversationId: convoId,
        content: prompt,
      });
      startPolling(convoId);
    } catch (e) {
      console.error('Auto-prompt error', e);
      setThinking(false);
    }
  };

  const startPolling = (convoId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await base44.functions.invoke('questionGeneratorAgent', {
          action: 'get',
          conversationId: convoId,
        });
        const msgs = res.data.conversation.messages || [];
        setMessages(msgs);
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant' && last?.content) {
          clearInterval(pollRef.current);
          setThinking(false);
        }
      } catch (e) {
        console.error('Poll error', e);
      }
    }, 1500);
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || thinking) return;
    const content = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content }]);
    setThinking(true);
    setSavedId(null);
    try {
      await base44.functions.invoke('questionGeneratorAgent', {
        action: 'send',
        conversationId,
        content,
      });
      startPolling(conversationId);
    } catch (e) {
      console.error('Send error', e);
      setThinking(false);
    }
  };

  // Extract JSON questions array from the last assistant message
  const extractQuestions = () => {
    const assistantMsgs = messages.filter(m => m.role === 'assistant' && m.content);
    if (!assistantMsgs.length) return null;
    const last = assistantMsgs[assistantMsgs.length - 1].content;
    const match = last.match(/```json\s*([\s\S]*?)```/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return null;
  };

  const saveQuestions = async () => {
    const questions = extractQuestions();
    if (!questions) return;
    setSaving(true);
    try {
      const record = await base44.entities.GameQuestion.create({
        questions,
        assignmentId: selectedAssignmentId || undefined,
        topic: selectedAssignment?.title || 'AI Generated',
      });
      setSavedId(record.id);
    } catch (e) {
      console.error('Save error', e);
    }
    setSaving(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const parsedQuestions = extractQuestions();

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">AI Question Generator</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            Optionally pick an assignment first — the AI will auto-generate questions for it. Or start blank and chat freely.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Pick an assignment (optional)" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={startNewSession} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            {selectedAssignment ? `Generate for "${selectedAssignment.title}"` : 'Start New Session'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" /> Question Generator
          </h3>
          {selectedAssignment && (
            <p className="text-xs text-emerald-400 mt-0.5">📎 {selectedAssignment.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {parsedQuestions && !savedId && (
            <Button
              size="sm"
              onClick={saveQuestions}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs"
            >
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Save {parsedQuestions.length} Questions{selectedAssignment ? ' to Assignment' : ''}
            </Button>
          )}
          {savedId && (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={() => { setConversationId(null); setMessages([]); setSavedId(null); }} className="text-slate-400 hover:text-white">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.filter(m => m.role === 'user' || m.role === 'assistant').map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-100'
            }`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="bg-slate-700 rounded-xl px-3 py-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for changes, more questions, a different topic..."
          className="bg-slate-700 border-slate-600 text-white resize-none min-h-[60px] max-h-[120px]"
          rows={2}
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || thinking}
          className="bg-emerald-600 hover:bg-emerald-700 self-end px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}