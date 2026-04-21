import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PETS } from '@/components/quest/PetCatalog';
import { Plus, Trash2, Copy, RefreshCw } from 'lucide-react';

const FEATURE_OPTIONS = [
  { value: 'games', label: '🎮 Games tab' },
  { value: 'shop', label: '🛍️ Shop tab' },
  { value: 'market', label: '💰 Marketplace tab' },
  { value: 'pets', label: '🐾 Pets/Rewards tab' },
  { value: 'battlePass', label: '✨ 1Pass tab' },
  { value: 'kitchen', label: '🍳 Kitchen tab' },
];

const REWARD_TYPES = ['pet', 'feature_unlock', 'xp', 'coins', 'food_item'];

const defaultForm = {
  code: '',
  label: '',
  rewardType: 'pet',
  petId: '',
  feature: 'games',
  amount: 100,
  itemId: '',
  quantity: 1,
  maxUses: '',
  expiresAt: '',
};

export default function RedeemCodeManager() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.RedeemCode.list('-created_date');
    setCodes(all);
    setLoading(false);
  };

  const generateCode = () => {
    const words = ['QUEST', 'EPIC', 'SUPER', 'COOL', 'MAGIC', 'GAMER', 'STAR', 'HERO', 'ACE', 'WILD'];
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    setForm(f => ({ ...f, code: `${w1}_${w2}_${num}` }));
  };

  const buildRewardData = () => {
    if (form.rewardType === 'pet') return { petId: form.petId };
    if (form.rewardType === 'feature_unlock') return { feature: form.feature };
    if (form.rewardType === 'xp' || form.rewardType === 'coins') return { amount: Number(form.amount) };
    if (form.rewardType === 'food_item') return { itemId: form.itemId, quantity: Number(form.quantity) };
    return {};
  };

  const save = async () => {
    if (!form.code.trim() || !form.rewardType) return;
    setSaving(true);
    await base44.entities.RedeemCode.create({
      code: form.code.trim().toUpperCase(),
      label: form.label,
      rewardType: form.rewardType,
      rewardData: buildRewardData(),
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
      usedBy: [],
      isActive: true,
    });
    setForm(defaultForm);
    setShowForm(false);
    setSaving(false);
    load();
  };

  const deactivate = async (c) => {
    await base44.entities.RedeemCode.update(c.id, { isActive: !c.isActive });
    load();
  };

  const remove = async (c) => {
    if (!confirm(`Delete code "${c.code}"?`)) return;
    await base44.entities.RedeemCode.delete(c.id);
    load();
  };

  const copy = (text) => navigator.clipboard.writeText(text);

  const rewardLabel = (c) => {
    const rd = c.rewardData || {};
    if (c.rewardType === 'pet') { const p = PETS.find(x => x.id === rd.petId); return p ? `${p.emoji} ${p.name}` : rd.petId; }
    if (c.rewardType === 'feature_unlock') return `🔓 Unlocks: ${rd.feature}`;
    if (c.rewardType === 'xp') return `+${rd.amount} XP`;
    if (c.rewardType === 'coins') return `+${rd.amount} Coins`;
    if (c.rewardType === 'food_item') return `🍎 Food item x${rd.quantity}`;
    return c.rewardType;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">🎟️ Redeem Codes</h3>
        <Button size="sm" onClick={() => setShowForm(s => !s)} className="gap-1">
          <Plus className="w-3 h-3" /> New Code
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="CODE (e.g. COOL_GAMES)"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="font-mono uppercase"
            />
            <Button size="sm" variant="outline" onClick={generateCode} className="shrink-0 gap-1">
              <RefreshCw className="w-3 h-3" /> Random
            </Button>
          </div>
          <Input
            placeholder="Label / note (admin-only)"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          />

          <select
            value={form.rewardType}
            onChange={e => setForm(f => ({ ...f, rewardType: e.target.value }))}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {REWARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {form.rewardType === 'pet' && (
            <select
              value={form.petId}
              onChange={e => setForm(f => ({ ...f, petId: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Select pet —</option>
              {PETS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name} ({p.rarity})</option>)}
            </select>
          )}

          {form.rewardType === 'feature_unlock' && (
            <select
              value={form.feature}
              onChange={e => setForm(f => ({ ...f, feature: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {FEATURE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}

          {(form.rewardType === 'xp' || form.rewardType === 'coins') && (
            <Input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
          )}

          {form.rewardType === 'food_item' && (
            <div className="flex gap-2">
              <Input
                placeholder="Food item ID"
                value={form.itemId}
                onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Qty"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-20"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Max uses (blank = unlimited)"
              value={form.maxUses}
              onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
            />
            <Input
              type="datetime-local"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              className="flex-1"
              title="Expires at (optional)"
            />
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? 'Creating...' : 'Create Code'}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
      ) : codes.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No codes yet.</p>
      ) : (
        <div className="space-y-2">
          {codes.map(c => (
            <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${c.isActive ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-800">{c.code}</span>
                  <button onClick={() => copy(c.code)} className="text-slate-400 hover:text-slate-600">
                    <Copy className="w-3 h-3" />
                  </button>
                  {!c.isActive && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">inactive</span>}
                </div>
                <p className="text-xs text-slate-500 truncate">{rewardLabel(c)}{c.label ? ` · ${c.label}` : ''}</p>
                <p className="text-[10px] text-slate-400">{(c.usedBy || []).length} uses{c.maxUses ? ` / ${c.maxUses}` : ''}{c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => deactivate(c)} className="h-7 text-xs px-2">
                  {c.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}