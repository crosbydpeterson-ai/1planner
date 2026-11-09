import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Hash, Keyboard, Camera, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';
import MagicCardScanner from '@/components/auth/MagicCardScanner';
import { resolveCard, cardPinMatches, normalizeCardNumber } from '@/lib/magicCards';
import { primeScanAudio, playScanSound, playRejectSound } from '@/lib/scanSound';
import confetti from 'canvas-confetti';

export default function MagicLoginDialog({ open, onOpenChange, onUnlocked }) {
  const [scanning, setScanning] = useState(true);
  const [scanKey, setScanKey] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [legacyMode, setLegacyMode] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [scanHint, setScanHint] = useState('');
  const [card, setCard] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    primeScanAudio(); // opening the dialog is a tap, so the scan sound is allowed
    setScanning(true);
    setScanKey((k) => k + 1);
    setManualMode(false);
    setLegacyMode(false);
    setManualNumber('');
    setScanHint('');
    setCard(null);
    setPin('');
    setError('');
    setBusy(false);
  }, [open]);

  const rescan = () => {
    setError('');
    setScanHint('');
    setManualMode(false);
    setScanning(true);
    setScanKey((k) => k + 1);
  };

  // Older cards were printed in Code 39, so this switches the camera to that
  // format only and back. Typing the number keeps working in either mode.
  const toggleLegacy = () => {
    setError('');
    setScanHint('');
    setManualMode(false);
    setLegacyMode((v) => !v);
    setScanning(true);
    setScanKey((k) => k + 1);
  };

  const openProfile = async (matchedCard) => {
    setBusy(true);
    setError('');
    try {
      const profiles = await base44.entities.UserProfile.filter({ id: matchedCard.profileId });
      const profile = profiles[0];
      if (!profile) {
        setError('The linked account no longer exists. Update the card in Admin → Magic Login.');
        setBusy(false);
        return;
      }
      if (profile.isLocked) {
        setError('The linked account is locked. Unlock it before using this card.');
        setBusy(false);
        return;
      }
      // A card just opened an account — a little celebration makes it feel magic.
      try {
        confetti({ particleCount: 90, spread: 80, startVelocity: 42, origin: { y: 0.65 } });
      } catch {
        // no canvas available
      }
      onUnlocked(profile);
      onOpenChange(false);
    } catch (e) {
      console.error('Magic login failed:', e);
      setError('Could not open the linked account. Please try again.');
      setBusy(false);
    }
  };

  const handleCardValue = async (raw) => {
    // A scan or typed number is consumed once; the camera stops either way.
    setScanning(false);
    setBusy(true);
    setError('');
    try {
      const result = await resolveCard(raw);
      if (result.status === 'unknown') {
        playRejectSound();
        setError('Unrecognized card. Scan it again or type the number manually.');
        return;
      }
      if (result.status === 'disabled') {
        playRejectSound(result.card?.rejectSound, result.card?.rejectSoundUrl);
        setError('This card is disabled. Ask an admin to enable it.');
        return;
      }
      // The card was read, so its own chime plays the moment it is recognised.
      playScanSound(result.card?.successSound, result.card?.successSoundUrl);
      if (result.status === 'pin_required') {
        setCard(result.card);
        setPin('');
        return;
      }
      await openProfile(result.card);
    } catch (e) {
      console.error('Magic card lookup failed:', e);
      setError('Could not check this card. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitPin = () => {
    if (!/^\d+$/.test(pin)) {
      setError('Enter the card PIN.');
      return;
    }
    if (!cardPinMatches(card, pin)) {
      playRejectSound(card?.rejectSound, card?.rejectSoundUrl);
      setError('Incorrect PIN. Try again.');
      return;
    }
    playScanSound(card?.successSound, card?.successSoundUrl);
    openProfile(card);
  };

  const submitManual = () => {
    const number = normalizeCardNumber(manualNumber);
    if (!number) {
      setError('Enter the card number printed on the card.');
      return;
    }
    handleCardValue(number);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-indigo-600" />
            Magic Login
            <Badge variant="outline" className="ml-1 text-[10px] font-medium text-amber-700 border-amber-300 bg-amber-50">
              Works on any device
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {card
              ? 'Enter this card’s PIN to continue.'
              : 'Hold a magic card up to the camera, or type its number.'}
          </DialogDescription>
        </DialogHeader>

        {card ? (
          <div className="space-y-4 animate-scan-pop">
            <div className="space-y-2">
              <Label className="text-slate-700">Card PIN</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(e) => e.key === 'Enter' && submitPin()}
                  placeholder="••••"
                  className="pl-9 h-12 rounded-xl text-center text-xl tracking-[0.4em] font-mono"
                />
              </div>
              <p className="text-xs text-slate-500">
                {card.nickname || 'Magic card'} → {card.profileUsername || 'linked account'}
              </p>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => {
                  setCard(null);
                  setPin('');
                  setError('');
                  rescan();
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={submitPin}
                disabled={busy}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Open account'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {scanning && !manualMode ? (
              <>
                <MagicCardScanner
                  key={scanKey}
                  format={legacyMode ? 'code39' : 'code128'}
                  onDetected={handleCardValue}
                  onUnavailable={(message) => {
                    setScanHint(message);
                    setManualMode(true);
                  }}
                />
                {!scanHint && (
                  <p className="text-xs text-slate-500 text-center">
                    Move the card closer until the barcode fills the band, and hold it
                    still. Each scan is used once.
                  </p>
                )}
                <div className="text-center">
                  {legacyMode && (
                    <p className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-1.5 mb-1">
                      Older card mode — looking for Code 39 only.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={toggleLegacy}
                    className="text-[11px] text-slate-500 underline underline-offset-2 hover:text-slate-700"
                  >
                    {legacyMode ? 'Scan a new Code 128 card instead' : 'Scan an older Code 39 card'}
                  </button>
                </div>
              </>
            ) : (
              !manualMode && (
                <Button variant="outline" onClick={rescan} className="w-full h-12 rounded-xl">
                  <RefreshCw className="w-4 h-4 mr-2" /> Scan again
                </Button>
              )
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

            {manualMode && (
              <div className="space-y-2 animate-scan-pop">
                {scanHint && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2">{scanHint}</p>}
                <Label className="text-slate-700">Card number</Label>
                <div className="relative">
                  <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitManual()}
                    placeholder="e.g. 0042 7781"
                    inputMode="text"
                    className="pl-9 h-12 rounded-xl font-mono tracking-wider"
                  />
                </div>
                <Button
                  onClick={submitManual}
                  disabled={busy}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Use this card number'}
                </Button>
                <Button variant="ghost" onClick={rescan} className="w-full text-slate-600">
                  <Camera className="w-4 h-4 mr-2" /> Scan with the camera instead
                </Button>
              </div>
            )}

            {!manualMode && (
              <Button
                variant="ghost"
                onClick={() => { setManualMode(true); setScanning(false); setError(''); }}
                className="w-full text-slate-600"
              >
                <Keyboard className="w-4 h-4 mr-2" /> Enter card number
              </Button>
            )}

            <p className="text-[11px] text-slate-400 text-center">
              Cards are saved with your account, so this one works on any device.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}