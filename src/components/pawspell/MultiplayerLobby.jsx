import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { generateGemPositions } from '@/lib/pawSpellLogic';
import { INITIAL_BOARD } from '@/lib/pawSpellConstants';
import { Users, Plus, LogIn, Copy, Check, Loader2, Link } from 'lucide-react';

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function MultiplayerLobby({ profile, onJoinRoom, onBack }) {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitingRoom, setWaitingRoom] = useState(null); // room object while waiting for opponent
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    const code = generateRoomCode();
    const gems = generateGemPositions(3);
    const room = await base44.entities.PawSpellRoom.create({
      roomCode: code,
      hostProfileId: profile.profileId,
      hostUsername: profile.username,
      status: 'waiting',
      board: INITIAL_BOARD.map(row => JSON.stringify(row)),
      currentTurn: 'w',
      gems: gems.map(g => JSON.stringify(g)),
      gemsCollected: { w: 0, b: 0 },
      castlingRights: {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true },
      },
    });
    setWaitingRoom(room);
    setLoading(false);
    // Start polling for opponent
    pollRef.current = setInterval(async () => {
      const rooms = await base44.entities.PawSpellRoom.filter({ id: room.id });
      if (rooms[0]?.status === 'active') {
        clearInterval(pollRef.current);
        onJoinRoom(rooms[0], 'w');
      }
    }, 2000);
  };

  const handleJoin = async () => {
    setLoading(true);
    setError('');
    const rooms = await base44.entities.PawSpellRoom.filter({ roomCode: joinCode.trim(), status: 'waiting' });
    if (rooms.length === 0) { setError('Room not found or already started.'); setLoading(false); return; }
    const room = rooms[0];
    if (room.hostProfileId === profile.profileId) { setError("You can't join your own room!"); setLoading(false); return; }
    const updated = await base44.entities.PawSpellRoom.update(room.id, {
      guestProfileId: profile.profileId,
      guestUsername: profile.username,
      status: 'active',
    });
    setLoading(false);
    onJoinRoom({ ...room, ...updated }, 'b');
  };

  const handleCancelWaiting = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (waitingRoom) {
      await base44.entities.PawSpellRoom.delete(waitingRoom.id).catch(() => {});
    }
    setWaitingRoom(null);
    setMode(null);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(waitingRoom.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/PawSpell?join=${waitingRoom.roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- WAITING LOBBY ---
  if (waitingRoom) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="text-center">
          <div className="text-5xl mb-2">♟️</div>
          <h2 className="text-xl font-bold text-purple-200">Waiting for opponent...</h2>
          <p className="text-purple-400 text-sm mt-1">Share your code or link with a friend</p>
        </div>

        {/* Room Code Big Display */}
        <div className="bg-purple-950/80 border-2 border-purple-600 rounded-2xl p-6 w-full text-center">
          <p className="text-purple-400 text-xs uppercase tracking-widest mb-2">Room Code</p>
          <div className="text-6xl font-mono font-black text-white tracking-[0.3em] mb-4">
            {waitingRoom.roomCode}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              <Link className="w-4 h-4" />
              Copy Link
            </button>
          </div>
        </div>

        {/* Waiting animation */}
        <div className="flex items-center gap-3 text-purple-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Waiting for {' '}<span className="text-purple-200 font-medium">opponent to join</span>...</span>
        </div>

        {/* Players preview */}
        <div className="w-full bg-purple-950/40 border border-purple-900 rounded-xl p-4">
          <p className="text-purple-500 text-xs uppercase tracking-widest mb-3">Players</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm">♔</div>
            <div>
              <p className="text-white text-sm font-medium">{profile.username}</p>
              <p className="text-purple-400 text-xs">You · White</p>
            </div>
            <span className="ml-auto text-green-400 text-xs font-medium">● Ready</span>
          </div>
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 rounded-full bg-purple-800 border-2 border-dashed border-purple-600 flex items-center justify-center text-sm">?</div>
            <div>
              <p className="text-purple-400 text-sm font-medium italic">Waiting...</p>
              <p className="text-purple-600 text-xs">Black</p>
            </div>
          </div>
        </div>

        <button onClick={handleCancelWaiting} className="text-purple-500 hover:text-purple-300 text-sm transition-colors">
          Cancel & back
        </button>
      </div>
    );
  }

  // --- MAIN MENU ---
  return (
    <div className="flex flex-col gap-5 items-center py-2">
      <div className="text-center">
        <Users className="w-10 h-10 text-purple-400 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-purple-200">Play a Friend</h2>
        <p className="text-purple-400 text-sm">Create a room or enter a friend's code</p>
      </div>

      {/* Create Room */}
      <button
        onClick={() => setMode('create')}
        className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${mode === 'create' ? 'border-purple-500 bg-purple-900/50' : 'border-purple-800 bg-purple-950/40 hover:border-purple-600'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-700 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">Create a Game</p>
            <p className="text-purple-400 text-xs">Get a code & share it with your friend</p>
          </div>
        </div>
        {mode === 'create' && (
          <Button
            onClick={(e) => { e.stopPropagation(); handleCreate(); }}
            disabled={loading}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-500 rounded-xl"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : 'Create Room'}
          </Button>
        )}
      </button>

      {/* Join Room */}
      <button
        onClick={() => setMode('join')}
        className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${mode === 'join' ? 'border-indigo-500 bg-indigo-950/50' : 'border-purple-800 bg-purple-950/40 hover:border-purple-600'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-700 rounded-xl flex items-center justify-center">
            <LogIn className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">Join a Game</p>
            <p className="text-purple-400 text-xs">Enter the 4-digit code from your friend</p>
          </div>
        </div>
        {mode === 'join' && (
          <div className="mt-4" onClick={e => e.stopPropagation()}>
            <Input
              placeholder="_ _ _ _"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="bg-slate-900 border-indigo-700 text-white text-center text-3xl tracking-[0.5em] font-mono h-14 mb-3"
              maxLength={4}
              autoFocus
            />
            {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
            <Button
              onClick={handleJoin}
              disabled={loading || joinCode.length < 4}
              className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Joining...</> : 'Join Room'}
            </Button>
          </div>
        )}
      </button>

      <button onClick={onBack} className="text-purple-500 hover:text-purple-300 text-sm mt-1 transition-colors">
        ← Back to menu
      </button>
    </div>
  );
}