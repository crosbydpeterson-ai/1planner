import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine, Hash, X } from 'lucide-react';
import MagicCardScanner from '@/components/auth/MagicCardScanner';
import MagicAccountPicker from '@/components/admin/MagicAccountPicker';
import {
  addCard, updateCard, listCards, isDuplicateNumber, normalizeCardNumber, hashCardPin,
} from '@/lib/magicCards';

export default function MagicCardFormDialog({ open, onOpenChange, card, profiles, onSaved }) {
  const isEdit = !!card;
  const [number, setNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileId, setProfileId] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [pin, setPin] = useState('');
  const [removePin, setRemovePin] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanHint, setScanHint] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setNumber(card?.number || '');
    setNickname(card?.nickname || '');
    setProfileId(card?.profileId || '');
    setProfileUsername(card?.profileUsername || '');
    setPin('');
    setRemovePin(false);
    setScanning(false);
    setScanHint('');
    setError('');
  }, [open, card]);

  const hasSavedPin = !!card?.pinHash;

  const handleSave = () => {
    const cleanNumber = normalizeCardNumber(number);
    if (!cleanNumber) {
      setError('Scan a card or type its number.');
      return;
    }
    if (!profileId) {
      setError('Choose the account this card opens.');
      return;
    }
    if (isDuplicateNumber(cleanNumber, card?.id)) {
      setError('That card number is already saved (disabled cards count too).');
      return;
    }
    if (pin && !/^\d{4,8}$/.test(pin)) {
      setError('Card PIN must be 4–8 digits.');
      return;
    }

    const payload = {
      number: cleanNumber,
      nickname: nickname.trim(),
      profileId,
      profileUsername: profiles.find((p) => p.id === profileId)?.username || profileUsername || card?.profileUsername || '',
    };
    if (removePin) payload.pinHash = '';
    else if (pin) payload.pinHash = hashCardPin(pin);

    if (isEdit) updateCard(card.id, payload);
    else addCard({ ...payload, enabled: true });

    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit magic card' : 'Add magic card'}</DialogTitle>
          <DialogDescription>
            Scan the card with the camera or type the number exactly as printed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {scanning ? (
            <div className="space-y-2">
              <MagicCardScanner
                onDetected={(value) => {
                  setScanning(false);
                  setNumber(normalizeCardNumber(value));
                  setError('');
                }}
                onUnavailable={(message) => {
                  setScanning(false);
                  setScanHint(message);
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => setScanning(false)} className="w-full text-slate-500">
                <X className="w-4 h-4 mr-1" /> Stop camera
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setScanning(true)} className="w-full h-10 rounded-xl border-dashed">
              <ScanLine className="w-4 h-4 mr-2" /> Scan barcode or QR code
            </Button>
          )}

          {scanHint && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{scanHint}</p>}

          <div className="space-y-2">
            <Label className="text-slate-700">Card number (text)</Label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="0042 7781"
              inputMode="text"
              autoComplete="off"
              className="h-11 rounded-xl font-mono tracking-wider"
            />
            <p className="text-[11px] text-slate-500">Leading zeros are kept. Changing this stops the old number working.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Nickname</Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Blue arcade card"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Opens account</Label>
            <MagicAccountPicker
              profiles={profiles}
              value={profileId}
              fallbackLabel={profileUsername}
              onChange={(p) => {
                setProfileId(p.id);
                setProfileUsername(p.username || '');
                setError('');
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" /> Card PIN (optional)
            </Label>
            <Input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setRemovePin(false); }}
              placeholder={hasSavedPin && !removePin ? 'PIN set — leave blank to keep it' : '4–8 digits, leave blank for one-scan login'}
              className="h-11 rounded-xl font-mono tracking-[0.3em]"
              disabled={removePin}
            />
            {hasSavedPin && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">A PIN is saved on this card (never displayed).</span>
                <button
                  type="button"
                  onClick={() => { setRemovePin((v) => !v); setPin(''); }}
                  className={`font-semibold ${removePin ? 'text-slate-500' : 'text-red-600'}`}
                >
                  {removePin ? 'Keep PIN' : 'Remove PIN'}
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEdit ? 'Save card' : 'Add card'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}