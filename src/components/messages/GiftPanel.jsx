import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Coins, Gift, Loader2, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendThreadMessage } from '@/lib/dmMessages';
import PlusGiftPicker from '@/components/rewards/PlusGiftPicker';
import { describeTrack, loadGiftableTracks, songGrantPatch } from '@/lib/songGift';

/**
 * Gift panel for a recipient/admin. The gift payload is stored on a message
 * record, and the panel only closes once the message is actually stored.
 */
export default function GiftPanel({ thread, senderProfileId, senderName, canGrantPermanent, onGiftSent, onClose }) {
  const [tab, setTab] = useState('quick'); // quick | pet | theme | song | plus
  const [pets, setPets] = useState([]);
  const [themes, setThemes] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [petSearch, setPetSearch] = useState('');
  const [themeSearch, setThemeSearch] = useState('');
  const [songSearch, setSongSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const busyRef = useRef(false);

  useEffect(() => {
    base44.entities.CustomPet.list('-created_date', 200).then(setPets);
    base44.entities.CustomTheme.list('-created_date', 200).then(setThemes);
    loadGiftableTracks().then(setTracks);
    base44.entities.UserProfile.filter({ id: thread.studentProfileId }).then((r) => setStudentProfile(r[0] || null));
  }, [thread.studentProfileId]);

  const sendGift = async (giftData, msgText) => {
    // A ref guard, not state, so a double tap in the same tick can't send twice.
    if (busyRef.current || sending) return;
    busyRef.current = true;
    setSending(true);
    setError('');
    try {
      // Apply the actual reward to the student profile
      if (studentProfile) {
        if (giftData.type === 'pet') {
          const current = studentProfile.unlockedPets || [];
          if (!current.includes(giftData.id)) {
            await base44.entities.UserProfile.update(studentProfile.id, { unlockedPets: [...current, giftData.id] });
          }
        } else if (giftData.type === 'theme') {
          const current = studentProfile.unlockedThemes || [];
          if (!current.includes(giftData.id)) {
            await base44.entities.UserProfile.update(studentProfile.id, { unlockedThemes: [...current, giftData.id] });
          }
        } else if (giftData.type === 'song') {
          // The song is owned outright, so it plays even while the track is
          // switched off for the general library.
          const patch = songGrantPatch(studentProfile, giftData.id);
          if (Object.keys(patch).length > 0) {
            await base44.entities.UserProfile.update(studentProfile.id, patch);
          }
        } else if (giftData.type === 'coins') {
          await base44.entities.UserProfile.update(studentProfile.id, { questCoins: (studentProfile.questCoins || 0) + giftData.amount });
        } else if (giftData.type === 'xp') {
          await base44.entities.UserProfile.update(studentProfile.id, { xp: (studentProfile.xp || 0) + giftData.amount });
        } else if (giftData.type === 'onepassplus') {
          // Never send the message without the grant — that would tell the
          // student they have Plus when they don't.
          if (!studentProfile) throw new Error('Profile not loaded');
          await base44.entities.UserProfile.update(studentProfile.id, {
            has1PassPlus: true,
            plusSeasonsGranted: giftData.seasonCount || 0,
            plusExpiresAt: giftData.expiresAt || null,
          });
        }
      }
      const result = await sendThreadMessage({
        thread,
        sender: 'admin',
        senderName,
        senderProfileId,
        text: msgText,
        giftData,
        unreadPatch: { hasUnreadStudent: true },
      });
      onGiftSent(result);
      onClose();
    } catch (err) {
      console.error('Gift could not be sent', err);
      setError('That gift could not be sent. Nothing was recorded — try again.');
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  };

  const filteredPets = pets.filter((p) => !petSearch || p.name?.toLowerCase().includes(petSearch.toLowerCase()));
  const filteredThemes = themes.filter((t) => !themeSearch || t.name?.toLowerCase().includes(themeSearch.toLowerCase()));
  const filteredTracks = tracks.filter((t) => !songSearch || t.title?.toLowerCase().includes(songSearch.toLowerCase()));

  return (
    <div className="border-t border-white/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-amber-700 text-xs font-bold flex items-center gap-1">
          <Gift className="w-3.5 h-3.5" /> Send Gift to {thread.studentUsername}
        </p>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-1 mb-3">
        {[['quick', 'Quick'], ['pet', 'Pet'], ['theme', 'Theme'], ['song', 'Song'], ['plus', '1Pass Plus']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn('text-xs px-3 py-1 rounded-full transition-colors', tab === k ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/40 backdrop-blur-sm border border-white/40 text-slate-600 hover:bg-white/60')}
          >
            {l}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-2 text-[11px] bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-600 rounded-xl px-2 py-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      {tab === 'quick' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              className="flex-1 bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => sendGift({ type: 'coins', amount: Number(amount) || 50 }, `🎁 You've been gifted ${amount || 50} Quest Coins!`)}
              disabled={sending}
              className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 backdrop-blur-sm text-yellow-700 border border-yellow-500/30 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <Coins className="w-3.5 h-3.5" /> Coins
            </button>
            <button
              onClick={() => sendGift({ type: 'xp', amount: Number(amount) || 25 }, `🎁 You've been gifted ${amount || 25} XP!`)}
              disabled={sending}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm text-blue-700 border border-blue-500/30 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" /> XP
            </button>
          </div>
          {sending && (
            <div className="flex justify-center pt-1">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      )}

      {tab === 'pet' && (
        <div>
          <input
            value={petSearch}
            onChange={(e) => setPetSearch(e.target.value)}
            placeholder="Search pets…"
            className="w-full bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none mb-2"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredPets.map((pet) => (
              <button
                key={pet.id}
                disabled={sending}
                onClick={() => sendGift({ type: 'pet', id: `custom_${pet.id}`, name: pet.name }, `🎁 You've been gifted the "${pet.name}" pet!`)}
                className="w-full flex items-center gap-2 px-2 py-1.5 bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <span className="text-lg">
                  {pet.imageUrl ? <img src={pet.imageUrl} className="w-6 h-6 rounded object-cover" alt="" /> : pet.emoji || '🐾'}
                </span>
                <span className="text-slate-800 text-xs font-medium flex-1 truncate">{pet.name}</span>
                <span className="text-slate-500 text-[10px]">{pet.rarity}</span>
              </button>
            ))}
            {filteredPets.length === 0 && <p className="text-slate-500 text-xs text-center py-3">No pets found</p>}
          </div>
        </div>
      )}

      {tab === 'theme' && (
        <div>
          <input
            value={themeSearch}
            onChange={(e) => setThemeSearch(e.target.value)}
            placeholder="Search themes…"
            className="w-full bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none mb-2"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredThemes.map((theme) => (
              <button
                key={theme.id}
                disabled={sending}
                onClick={() => sendGift({ type: 'theme', id: `custom_${theme.id}`, name: theme.name }, `🎁 You've been gifted the "${theme.name}" theme!`)}
                className="w-full flex items-center gap-2 px-2 py-1.5 bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <div className="w-5 h-5 rounded-full shrink-0" style={{ background: theme.primaryColor || '#888' }} />
                <span className="text-slate-800 text-xs font-medium flex-1 truncate">{theme.name}</span>
                <span className="text-slate-500 text-[10px]">{theme.rarity}</span>
              </button>
            ))}
            {filteredThemes.length === 0 && <p className="text-slate-500 text-xs text-center py-3">No themes found</p>}
          </div>
        </div>
      )}

      {tab === 'song' && (
        <div>
          <input
            value={songSearch}
            onChange={(e) => setSongSearch(e.target.value)}
            placeholder="Search songs…"
            className="w-full bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none mb-2"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredTracks.map((track) => (
              <button
                key={track.id}
                disabled={sending}
                onClick={() => sendGift({ type: 'song', id: track.id, name: track.title }, `🎁 You've been gifted the song "${track.title}"!`)}
                className="w-full flex items-center gap-2 px-2 py-1.5 bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <span className="text-lg">🎵</span>
                <span className="text-slate-800 text-xs font-medium flex-1 truncate">{track.title}</span>
                <span className="text-slate-500 text-[10px]">{describeTrack(track)}</span>
              </button>
            ))}
            {filteredTracks.length === 0 && <p className="text-slate-500 text-xs text-center py-3">No songs found</p>}
          </div>
        </div>
      )}

      {tab === 'plus' && (
        <PlusGiftPicker
          sending={sending}
          canGrantPermanent={canGrantPermanent}
          onGift={({ seasonCount, expiresAt }) => sendGift(
            { type: 'onepassplus', seasonCount, expiresAt },
            seasonCount > 0
              ? `⭐ You've been gifted 1Pass Plus for ${seasonCount} season${seasonCount > 1 ? 's' : ''} — until ${new Date(expiresAt).toLocaleDateString()}!`
              : `⭐ You've been gifted 1Pass Plus — no expiry!`
          )}
        />
      )}
    </div>
  );
}