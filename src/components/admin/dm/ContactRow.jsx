import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LINK_LEGACY, LINK_UNLINKED, linkStatusLabel } from '@/lib/dmRouting';

/**
 * One contact in the admin DM tooling.
 *
 * The display name is presentation only; the linked recipient is the account
 * id that actually receives messages. Both are shown separately so an admin can
 * verify the mapping, and unlinked/legacy links are flagged for repair.
 */
export default function ContactRow({ contact, link, candidates, onToggle, onDelete, onSetRecipient }) {
  const linked = link.status !== LINK_LEGACY && link.status !== LINK_UNLINKED && !link.bot ? link.matches[0] : null;
  const statusClass = link.bot
    ? 'border-indigo-500/40 text-indigo-300'
    : link.status === LINK_UNLINKED
    ? 'border-amber-500/40 text-amber-300'
    : link.status === LINK_LEGACY
    ? 'border-red-500/40 text-red-300'
    : 'border-emerald-500/40 text-emerald-300';

  return (
    <div className="bg-slate-700/50 rounded-lg px-2.5 py-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-base">{contact.emoji}</span>
        <p className={cn('text-xs flex-1 truncate', contact.isActive ? 'text-white' : 'text-slate-500 line-through')}>{contact.username}</p>
        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border whitespace-nowrap', statusClass)}>{linkStatusLabel(link)}</span>
        <button
          onClick={() => onToggle(contact)}
          title={contact.isActive ? 'Active' : 'Inactive'}
          className={cn('w-4 h-4 rounded-full shrink-0 border flex items-center justify-center', contact.isActive ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500')}
        >
          {contact.isActive && <Check className="w-3 h-3 text-white" />}
        </button>
        <button onClick={() => onDelete(contact)} className="text-red-400 hover:text-red-300 shrink-0">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {contact.isBot ? (
        <p className="text-[10px] text-slate-400">Bot contact — students talk to Byte here, no linked account needed.</p>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 whitespace-nowrap">Recipient</span>
          <Select value={linked?.id || ''} onValueChange={(v) => onSetRecipient(contact, v)}>
            <SelectTrigger className="h-7 bg-slate-800 border-slate-600 text-white text-[11px] flex-1">
              <SelectValue placeholder="Recipient not linked" />
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
      )}

      {linked && (
        <p className="text-[10px] text-slate-400">
          Display name "{contact.username}" is presentation only · messages go to <span className="text-slate-200">{linked.username}</span>
        </p>
      )}
      {link.status === LINK_UNLINKED && (
        <p className="text-[10px] text-amber-400">Recipient not linked — conversations here have no personal recipient yet.</p>
      )}
      {link.status === LINK_LEGACY && (
        <p className="text-[10px] text-amber-400">
          {link.matches.length === 1
            ? `Legacy link (old id format) can be repaired → ${link.matches[0].username}`
            : 'Legacy link has no unique account match — choose the recipient above.'}
        </p>
      )}
    </div>
  );
}