import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { generateGemPositions, cloneBoard } from '@/lib/pawSpellLogic';
import { INITIAL_BOARD } from '@/lib/pawSpellConstants';
import { Users, Plus, LogIn, Copy } from 'lucide-react';

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function MultiplayerLobby({ profile, onJoinRoom, onBack }) {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState(null);

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
      board: INITIAL_BOARD,
      currentTurn: 'w',
      gems,
      gemsCollected: { w: 0, b: 0 },
      castlingRights: {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true },
      },
    });
    setCreatedCode(code);
    setLoading(false);
    onJoinRoom(room, 'w');
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

  return (
    <div className="flex flex-col gap-6 items-center p-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-purple-400 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-purple-200">Multiplayer</h2>
        <p className="text-purple-400 text-sm">Challenge a friend!</p>
      </div>

      {!mode && (
        <div className="flex gap-4">
          <Button onClick={() => setMode('create')} className="bg-purple-700 hover:bg-purple-600 gap-2">
            <Plus className="w-4 h-4" /> Create Room
          </Button>
          <Button onClick={() => setMode('join')} variant="outline" className="border-purple-600 text-purple-300 hover:bg-purple-900 gap-2">
            <LogIn className="w-4 h-4" /> Join Room
          </Button>
        </div>
      )}

      {mode === 'create' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-purple-300 text-sm">Creating a new room...</p>
          <Button onClick={handleCreate} disabled={loading} className="bg-purple-700 hover:bg-purple-600">
            {loading ? 'Creating...' : 'Create & Enter Room'}
          </Button>
          <Button variant="ghost" onClick={() => setMode(null)} className="text-purple-400">Back</Button>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <Input
            placeholder="Enter 4-digit room code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            className="bg-slate-900 border-purple-700 text-purple-200 text-center text-xl tracking-widest"
            maxLength={4}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={handleJoin} disabled={loading || joinCode.length < 4} className="bg-purple-700 hover:bg-purple-600 w-full">
            {loading ? 'Joining...' : 'Join Room'}
          </Button>
          <Button variant="ghost" onClick={() => setMode(null)} className="text-purple-400">Back</Button>
        </div>
      )}

      <Button variant="ghost" onClick={onBack} className="text-purple-500 text-sm mt-2">← Back to menu</Button>
    </div>
  );
}