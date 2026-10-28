import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Bot, User, Plus, Save, CheckCircle2 } from 'lucide-react';
import { askQuestionGenerator } from '@/lib/gameQuestions';

export default function QuestionGeneratorChat({ adminProfile }) {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.entities.Assignment.list('-created_date', 100).then(setAssignments).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const runTurn = async (transcript, fileUrls = []) => {
    setThinking(true);
    setError('');
    try {
      const { message, questions } = await askQuestionGenerator({ transcript, fileUrls });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            message ||
            (questions.length
              ? `Here are ${questions.length} questions.`
              : 'I could not build questions from that — try naming a topic.'),
          questions,
        },
      ]);
    } catch (e) {
      console.error('Question generator error', e);
      setError('The generator could not answer. Please try again.');
    }
    setThinking(false);
  };

  const startNewSession = async () => {
    setSavedId(null);
    setError('');
    setInput('');
    setStarted(true);

    if (!selectedAssignment) {
      setMessages([
        {
          role: 'assistant',
          content: 'Tell me a topic (or which assignment) and I will build the quiz questions.',
        },
      ]);
      return;
    }

    const prompt = `Generate 10 quiz questions for the assignment titled "${selectedAssignment.title}"${
      selectedAssignment.description ? `. Description: ${selectedAssignment.description}` : ''
    }.`;
    const userMessage = { role: 'user', content: prompt };
    setMessages([userMessage]);
    await runTurn([userMessage], selectedAssignment.pdfUrl ? [selectedAssignment.pdfUrl] : []);
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || thinking) return;
    setInput('');
    setSavedId(null);
    const userMessage = { role: 'user', content };
    const transcript = [...messages, userMessage];
    setMessages(transcript);
    await runTurn(transcript);
  };

  const latestQuestions = () => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant' && m.questions?.length);
    return last?.questions || null;
  };

  const saveQuestions = async () => {
    const questions = latestQuestions();
    if (!questions) return;
    setSaving(true);
    setError('');
    try {
      const record = await base44.entities.GameQuestion.create({
        questions,
        assignmentId: selectedAssignmentId || undefined,
        topic: selectedAssignment?.title || 'AI Generated',
      });
      setSavedId(record.id);
    } catch (e) {
      console.error('Save error', e);
      setError('Those questions could not be saved. Please try again.');
    }
    setSaving(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const parsedQuestions = latestQuestions();

  if (!started) {
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
              {assignments.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={startNewSession} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
            <Plus className="w-4 h-4 mr-2" />
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
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setStarted(false); setMessages([]); setSavedId(null); setError(''); }}
            className="text-slate-400 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm space-y-2 ${
              msg.role === 'user' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-100'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.questions?.length > 0 && (
                <ol className="list-decimal list-inside space-y-1.5 border-t border-slate-600 pt-2 text-xs text-slate-200">
                  {msg.questions.map((q, qi) => (
                    <li key={qi}>
                      <span className="font-medium">{q.question}</span>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {q.options.map((opt, oi) => (
                          <span
                            key={oi}
                            className={`px-1.5 py-0.5 rounded ${
                              opt === q.correctAnswer
                                ? 'bg-emerald-500/25 text-emerald-300 font-semibold'
                                : 'bg-slate-600/60 text-slate-300'
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>
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
      {error && <p className="text-xs text-amber-400 mb-2">{error}</p>}
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