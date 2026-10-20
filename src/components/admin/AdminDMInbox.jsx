import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2, Plus, Send, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ContactRow from './dm/ContactRow';
import MessageBubble from '@/components/messages/MessageBubble';
import {
  classifyContactLink,
  invalidateContacts,
  indexContacts,
  LINK_LEGACY,
  LINK_LINKED,
  LINK_UNLINKED,
  loadContacts,
} from '@/lib/dmRouting';
import { loadMessagesForThreads, mergeThreadMessages, storeMessage, touchThreadSummary } from '@/lib/dmMessages';

const PRESET_CONTACTS = [
  { username: 'Crosby', role: 'Owner & Main Admin', emoji: '👑', color: 'from-yellow-500 to-orange-500', isBot: false },
  { username: 'Raphela', role: 'Pet Helper', emoji: '🐾', color: 'from-pink-500 to-rose-500', isBot: false },
  { username: 'Byte', role: 'AI Helper', emoji: '🤖', color: 'from-indigo-500 to-purple-600', isBot: true },
];

const EMPTY_CONTACT = { username: '', role: '', emoji: '😊', color: 'from-blue-500 to-indigo-500', isBot: false, adminProfileId: '' };

/**
 * Admin DM tooling: every conversation, plus contact → recipient linking.
 *
 * A contact's linked account id is what routes messages to a person. The
 * display name never routes anything. Unlinked and legacy links are flagged so
 * they can be repaired instead of silently dropping conversations.
 */
export default function AdminDMInbox({ adminProfile }) {
  const [contacts, setContacts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [records, setRecords] = useState({});
  const [activeThread, setActiveThread] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState('');
  const [repairSummary, setRepairSummary] = useState('');
  const [tab, setTab] = useState('inbox'); // inbox | contacts
  const [newContact, setNewContact] = useState(EMPTY_CONTACT);
  const endRef = useRef(null);
  const refreshTimer = useRef(null);
  const replyBusyRef = useRef(false);

  const contactMap = indexContacts(contacts);

  const loadThreads = async () => {
    const page = await base44.entities.DMThread.list({ sort: '-lastMessageAt', limit: 200 });
    const rows = Array.isArray(page) ? page : page?.items || [];
    setThreads(rows);
    setActiveThread((prev) => (prev ? rows.find((t) => t.id === prev.id) || prev : null));
  };

  const loadBase = async () => {
    const [allContacts, allProfiles] = await Promise.all([
      loadContacts(),
      base44.entities.UserProfile.list('-created_date', 500),
    ]);
    setContacts(allContacts);
    setProfiles(allProfiles);
    await loadThreads();
  };

  useEffect(() => {
    loadBase().catch((err) => {
      console.error('Could not load the DM admin tooling', err);
      setError('Could not load conversations. Please try again.');
    });
    const unsub = base44.entities.DMThread.subscribe(() => {
      // Only threads are refetched; contacts and accounts are not re-read.
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        loadThreads().catch((err) => console.error('Thread refresh failed', err));
      }, 800);
    });
    return () => { clearTimeout(refreshTimer.current); unsub?.(); };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.id, records]);

  const refreshContacts = async () => {
    invalidateContacts();
    const fresh = await loadContacts();
    setContacts(fresh);
    return fresh;
  };

  const openThread = async (thread) => {
    setActiveContact(contactMap[thread.contactId] || null);
    setReplyText('');
    setError('');
    try {
      const { byThread } = await loadMessagesForThreads([thread.id]);
      setRecords((prev) => ({ ...prev, ...byThread }));
    } catch (err) {
      console.error('Could not load thread messages', err);
      setError('Could not load this conversation’s messages.');
    }
    // Messages are only marked read because a person is opening them here.
    if (thread.hasUnreadAdmin) {
      const updated = await base44.entities.DMThread.update(thread.id, { hasUnreadAdmin: false });
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setActiveThread(updated);
    } else {
      setActiveThread(thread);
    }
  };

  const sendReply = async () => {
    // Ref guard so a rapid double tap cannot store the reply twice.
    if (!replyText.trim() || !activeThread || sending || replyBusyRef.current) return;
    replyBusyRef.current = true;
    const thread = activeThread;
    const text = replyText.trim();
    setSending(true);
    setError('');
    try {
      const { message } = await storeMessage({
        threadId: thread.id,
        sender: 'admin',
        senderName: adminProfile?.username || 'Admin',
        senderProfileId: adminProfile?.id || null,
        text,
        operationId: `admin:${thread.id}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`,
      });
      setRecords((prev) => ({ ...prev, [thread.id]: [...(prev[thread.id] || []), message] }));
      setReplyText('');
      const { thread: updated, summaryUpdated } = await touchThreadSummary(thread, {
        lastMessageAt: message.sentAt,
        hasUnreadStudent: true,
        hasUnreadAdmin: false,
      });
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? updated : t)));
      setActiveThread((prev) => (prev && prev.id === thread.id ? updated : prev));
      if (!summaryUpdated) setError('Reply stored, but the conversation summary could not be updated.');
    } catch (err) {
      console.error('Reply failed', err);
      setError('That reply was not sent — your text is still here.');
    } finally {
      replyBusyRef.current = false;
      setSending(false);
    }
  };

  const candidates = [...profiles]
    .filter((p) => p.rank === 'admin' || p.rank === 'super_admin' || (p.assignedRoleIds || []).length > 0
      || contacts.some((c) => c.adminProfileId === p.id))
    .sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')));

  const setRecipient = async (contact, profileId) => {
    const target = profiles.find((p) => p.id === profileId);
    if (!target) { toast.error('That account no longer exists'); return; }
    try {
      await base44.entities.DMContact.update(contact.id, { adminProfileId: target.id });
      await refreshContacts();
      toast.success(`${contact.username} now routes to ${target.username}`);
      if (contacts.some((c) => c.id === contact.id && c.adminProfileId && c.adminProfileId !== target.id)) {
        toast.info('Existing conversations stay with the previously linked recipient.');
      }
    } catch (err) {
      console.error('Could not link the recipient', err);
      toast.error('Could not link that recipient');
    }
  };

  const addContact = async () => {
    if (!newContact.username.trim() || !newContact.role.trim()) { toast.error('Fill in username and role'); return; }
    if (newContact.adminProfileId && !profiles.some((p) => p.id === newContact.adminProfileId)) {
      toast.error('That linked account no longer exists');
      return;
    }
    const created = await base44.entities.DMContact.create({ ...newContact, isActive: true });
    setContacts((prev) => [created, ...prev]);
    setNewContact(EMPTY_CONTACT);
    invalidateContacts();
    toast.success('Contact added!');
  };

  const addPreset = async (preset) => {
    const exists = contacts.find((c) => c.username.toLowerCase() === preset.username.toLowerCase());
    if (exists) { toast.info(`${preset.username} already exists`); return; }
    const created = await base44.entities.DMContact.create({ ...preset, isActive: true });
    setContacts((prev) => [created, ...prev]);
    invalidateContacts();
    toast.success(`${preset.username} added as contact!`);
  };

  const toggleContact = async (contact) => {
    const updated = await base44.entities.DMContact.update(contact.id, { isActive: !contact.isActive });
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    invalidateContacts();
  };

  const deleteContact = async (contact) => {
    await base44.entities.DMContact.delete(contact.id);
    setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    invalidateContacts();
    toast.success('Contact removed');
  };

  /**
   * Idempotent repair of legacy links: only a unique account match is accepted,
   * ambiguous or missing links are left for a manual choice. Conversations on a
   * repaired contact get their recipient snapshot so a later reassignment can
   * never move that history to someone else.
   */
  const repairLegacyLinks = async () => {
    setRepairing(true);
    setRepairSummary('');
    try {
      const changes = [];
      for (const contact of contacts) {
        const link = classifyContactLink(contact, profiles);
        if (link.status !== LINK_LEGACY || !link.resolvable) continue;
        const target = link.matches[0];
        await base44.entities.DMContact.update(contact.id, { adminProfileId: target.id });
        changes.push(`"${contact.username}" → ${target.username}`);
        // Snapshot the conversations already on this contact so a later
        // reassignment can never move that history to someone else.
        const affected = await base44.entities.DMThread.filter({ contactId: contact.id }, { limit: 200 });
        const rows = Array.isArray(affected) ? affected : affected?.items || [];
        for (const t of rows) {
          if (t.recipientProfileId) continue;
          await base44.entities.DMThread.update(t.id, { recipientProfileId: target.id });
        }
      }
      await refreshContacts();
      await loadThreads();
      setRepairSummary(changes.length
        ? `Repaired ${changes.length} legacy link${changes.length === 1 ? '' : 's'}: ${changes.join(', ')}`
        : 'No repairable legacy links found.');
    } catch (err) {
      console.error('Legacy link repair failed', err);
      setRepairSummary('Repair failed part-way. Nothing was deleted — run it again to finish.');
    } finally {
      setRepairing(false);
    }
  };

  const flaggedContacts = contacts.filter((c) => {
    const link = classifyContactLink(c, profiles);
    return !link.bot && (link.status === LINK_UNLINKED || link.status === LINK_LEGACY);
  });
  const totalUnread = threads.filter((t) => t.hasUnreadAdmin).length;
  const activeIsBot = !!activeContact?.isBot;
  const activeMessages = activeThread
    ? mergeThreadMessages(activeThread, records[activeThread.id] || [])
    : [];

  return (
    <div className="flex h-[600px] gap-0 rounded-xl overflow-hidden border border-slate-600">
      {/* Sidebar */}
      <div className="w-52 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
        <div className="flex border-b border-slate-700">
          <button onClick={() => setTab('inbox')} className={cn('flex-1 py-2.5 text-xs font-semibold transition-colors', tab === 'inbox' ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white')}>
            Inbox {totalUnread > 0 && <span className="ml-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
          </button>
          <button onClick={() => setTab('contacts')} className={cn('flex-1 py-2.5 text-xs font-semibold transition-colors', tab === 'contacts' ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white')}>
            Contacts {flaggedContacts.length > 0 && <span className="ml-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{flaggedContacts.length}</span>}
          </button>
        </div>

        {tab === 'inbox' && (
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 && <p className="text-slate-500 text-xs text-center py-6">No threads yet</p>}
            {threads.map((thread) => {
              const contact = contactMap[thread.contactId];
              const link = contact ? classifyContactLink(contact, profiles) : null;
              const last = mergeThreadMessages(thread, records[thread.id] || []).at(-1);
              const isActive = activeThread?.id === thread.id;
              return (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread)}
                  className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-slate-700/50 transition-colors', isActive ? 'bg-slate-600' : 'hover:bg-slate-700/50')}
                >
                  <div className="relative shrink-0">
                    <span className="text-xl">{contact?.emoji || '💬'}</span>
                    {thread.hasUnreadAdmin && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-slate-800" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-xs truncate', thread.hasUnreadAdmin ? 'text-white font-bold' : 'text-slate-300')}>{thread.studentUsername}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {link && link.status !== LINK_LINKED && !link.bot && <span className="text-amber-400">unlinked · </span>}
                      {last?.text || '—'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'contacts' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {contacts.map((c) => (
              <ContactRow
                key={c.id}
                contact={c}
                link={classifyContactLink(c, profiles)}
                candidates={candidates}
                onToggle={toggleContact}
                onDelete={deleteContact}
                onSetRecipient={setRecipient}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        {tab === 'contacts' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {flaggedContacts.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 space-y-2">
                <p className="text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {flaggedContacts.length} contact{flaggedContacts.length === 1 ? '' : 's'} need attention
                </p>
                <p className="text-[11px] text-amber-200/80">
                  {flaggedContacts.map((c) => c.username).join(', ')} — conversations addressed to them have no linked account, so pick a recipient below.
                </p>
                <Button onClick={repairLegacyLinks} disabled={repairing} className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">
                  {repairing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Wrench className="w-3.5 h-3.5 mr-1" />}
                  Repair legacy links
                </Button>
                {repairSummary && <p className="text-[11px] text-amber-100">{repairSummary}</p>}
              </div>
            )}

            <div>
              <p className="text-slate-300 text-sm font-semibold mb-3">Quick Add Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_CONTACTS.map((p) => (
                  <button key={p.username} onClick={() => addPreset(p)} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full px-3 py-1.5 transition-colors">
                    <span>{p.emoji}</span> {p.username}
                    <Plus className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-slate-300 text-sm font-semibold">Add Custom Contact</p>
              <div className="grid grid-cols-2 gap-2">
                <Input value={newContact.username} onChange={(e) => setNewContact((p) => ({ ...p, username: e.target.value }))} placeholder="Display name (e.g. Raphela)" className="bg-slate-700 border-slate-600 text-white text-sm" />
                <Input value={newContact.role} onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))} placeholder="Role (e.g. Pet Helper)" className="bg-slate-700 border-slate-600 text-white text-sm" />
                <Input value={newContact.emoji} onChange={(e) => setNewContact((p) => ({ ...p, emoji: e.target.value }))} placeholder="Emoji" className="bg-slate-700 border-slate-600 text-white text-sm" />
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 text-xs whitespace-nowrap">Is Bot?</label>
                  <input type="checkbox" checked={newContact.isBot} onChange={(e) => setNewContact((p) => ({ ...p, isBot: e.target.checked }))} />
                </div>
              </div>
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1.5">Recipient account</p>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Required for a real recipient. The display name above is only what students see — it never decides who receives a message.
                </p>
                <Select
                  value={newContact.adminProfileId}
                  onValueChange={(v) => setNewContact((p) => ({ ...p, adminProfileId: v }))}
                  disabled={newContact.isBot}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-sm">
                    <SelectValue placeholder={newContact.isBot ? 'Not needed for a bot' : 'Select the account that receives these messages'} />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.username}
                        {u.rank === 'admin' || u.rank === 'super_admin' ? ' · admin' : (u.assignedRoleIds || []).length ? ' · custom role' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addContact} className="bg-indigo-600 hover:bg-indigo-700 w-full">
                <Plus className="w-4 h-4 mr-1" /> Add Contact
              </Button>
            </div>
          </div>
        ) : activeThread ? (
          <>
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3 bg-slate-800">
              <span className="text-2xl">{activeContact?.emoji || '💬'}</span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{activeThread.studentUsername}</p>
                <p className="text-slate-400 text-xs truncate">
                  → {activeContact?.username || activeThread.contactUsername}
                  {activeThread.recipientProfileId
                    ? ` · linked to ${profiles.find((p) => p.id === activeThread.recipientProfileId)?.username || activeThread.recipientProfileId}`
                    : ' · no linked recipient'}
                </p>
              </div>
            </div>

            {!activeThread.recipientProfileId && (
              <p className="mx-3 mt-3 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg px-2 py-1.5">
                This conversation has no linked recipient — link the contact on the Contacts tab so replies reach the right person.
              </p>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-900">
              {activeMessages.length === 0 && <p className="text-center text-slate-500 text-sm py-4">No messages yet</p>}
              {activeMessages.map((msg, i) => (
                <MessageBubble key={msg.__key || i} msg={msg} isMe={msg.sender === 'admin'} />
              ))}
              <div ref={endRef} />
            </div>

            {error && (
              <p className="mx-3 mb-1 text-[11px] bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-2 py-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-700 bg-slate-800">
              <input
                className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400"
                placeholder={activeIsBot ? 'Byte replies come from the AI agent' : `Reply as ${adminProfile?.username || 'Admin'}…`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendReply(); } }}
                disabled={sending || activeIsBot}
              />
              <button
                onClick={sendReply}
                disabled={sending || activeIsBot || !replyText.trim()}
                className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-colors shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a conversation to reply
          </div>
        )}
      </div>
    </div>
  );
}