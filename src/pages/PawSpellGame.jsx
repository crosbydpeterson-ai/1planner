import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PawBoard from '@/components/pawspell/PawBoard';
import GameHeader from '@/components/pawspell/GameHeader';
import GameOverModal from '@/components/pawspell/GameOverModal';
import AIChat from '@/components/pawspell/AIChat';
import {
  applyMove, hasAnyLegalMoves, isKingInCheck,
  getAIMoveSimple, generateGemPositions, parsePiece
} from '@/lib/pawSpellLogic';
import { INITIAL_BOARD } from '@/lib/pawSpellConstants';

const INITIAL_CASTLING = {
  white: { kingSide: true, queenSide: true },
  black: { kingSide: true, queenSide: true },
};

export default function PawSpellGame() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'ai'; // 'ai' | 'multi'
  const roomId = urlParams.get('room');
  const myColorParam = urlParams.get('color') || 'w';

  const [pawProfile, setPawProfile] = useState(null);
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [currentTurn, setCurrentTurn] = useState('w');
  const [myColor] = useState(myColorParam);
  const [lastMove, setLastMove] = useState(null);
  const [castlingRights, setCastlingRights] = useState(INITIAL_CASTLING);
  const [gems, setGems] = useState([]);
  const [gemsCollected, setGemsCollected] = useState({ w: 0, b: 0 });
  const [gameOver, setGameOver] = useState(null); // { winner, reason }
  const [chatOpen, setChatOpen] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [room, setRoom] = useState(null);
  const [equippedSkins, setEquippedSkins] = useState({});
  const [skinImages, setSkinImages] = useState({});
  const pollRef = useRef(null);

  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    initGame();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const initGame = async () => {
    // Load paw profile
    const profiles = await base44.entities.PawSpellProfile.filter({ profileId });
    let pp = profiles[0];
    if (!pp) {
      const userProfiles = await base44.entities.UserProfile.filter({ id: profileId });
      const username = userProfiles[0]?.username || 'Player';
      pp = await base44.entities.PawSpellProfile.create({ profileId, username, tokens: 100 });
    }
    setPawProfile(pp);
    loadEquippedSkins(pp);

    if (mode === 'multi' && roomId) {
      await loadRoom(roomId);
      startPolling(roomId);
    } else {
      // AI mode — start fresh
      const newGems = generateGemPositions(3);
      setGems(newGems);
    }
  };

  const loadEquippedSkins = async (pp) => {
    const equipped = pp.equippedSkins || {};
    setEquippedSkins({ w: equipped, b: {} }); // Only load my skins for now
    // Load skin images
    const skinIds = Object.values(equipped).filter(Boolean);
    if (skinIds.length > 0) {
      const images = {};
      for (const sid of skinIds) {
        const skins = await base44.entities.PawSpellSkin.filter({ id: sid });
        if (skins[0]) images[sid] = skins[0].imageUrl;
      }
      setSkinImages(images);
    }
  };

  const loadRoom = async (rid) => {
    const rooms = await base44.entities.PawSpellRoom.filter({ id: rid });
    if (!rooms[0]) return;
    const r = rooms[0];
    setRoom(r);
    setBoard(r.board || INITIAL_BOARD);
    setCurrentTurn(r.currentTurn || 'w');
    setLastMove(r.lastMove || null);
    setGems(r.gems || []);
    setGemsCollected(r.gemsCollected || { w: 0, b: 0 });
    if (r.winner) setGameOver({ winner: r.winner, reason: r.winReason });
  };

  const startPolling = (rid) => {
    pollRef.current = setInterval(() => loadRoom(rid), 2000);
  };

  const updateCastlingRights = (piece, from, rights) => {
    const { color, type } = parsePiece(piece);
    const newRights = { white: { ...rights.white }, black: { ...rights.black } };
    const side = color === 'w' ? 'white' : 'black';
    if (type === 'k') { newRights[side] = { kingSide: false, queenSide: false }; }
    if (type === 'r') {
      if (from[1] === 0) newRights[side].queenSide = false;
      if (from[1] === 7) newRights[side].kingSide = false;
    }
    return newRights;
  };

  const checkGemCollection = (newBoard, col, row, newGems, newGemsCollected) => {
    const updatedGems = newGems.map(g => {
      if (g.row === row && g.col === col && !g.collected?.[col]) {
        return { ...g, collected: { ...g.collected, [currentTurn]: true } };
      }
      return g;
    });
    const updatedCollected = { ...newGemsCollected };
    const collected = updatedGems.filter(g => g.collected?.[currentTurn] && !newGems.find(og => og.row === g.row && og.col === g.col)?.collected?.[currentTurn]);
    if (collected.length > 0) updatedCollected[currentTurn] = (updatedCollected[currentTurn] || 0) + collected.length;
    return { updatedGems, updatedCollected };
  };

  const processMove = useCallback(async (from, to) => {
    const piece = board[from[0]][from[1]];
    const newBoard = applyMove(board, from, to);
    const newRights = updateCastlingRights(piece, from, castlingRights);
    const move = { from, to, piece };

    // Check gem collection on destination square
    let newGems = [...gems];
    let newGemsCollected = { ...gemsCollected };
    const gemOnDest = newGems.findIndex(g => g.row === to[0] && g.col === to[1]);
    if (gemOnDest !== -1) {
      newGemsCollected[currentTurn] = (newGemsCollected[currentTurn] || 0) + 1;
      newGems = newGems.filter((_, i) => i !== gemOnDest);
      // Spawn new gem elsewhere if needed
      if (newGems.length < 2) {
        const extra = generateGemPositions(1);
        newGems.push(...extra);
      }
    }

    const nextTurn = currentTurn === 'w' ? 'b' : 'w';

    // Check win by gems
    if (newGemsCollected[currentTurn] >= 3) {
      endGame(newBoard, currentTurn, 'Collected 3 Crystal Gems!', newGems, newGemsCollected, move, newRights);
      return;
    }

    // Check win by king capture
    let kingExists = false;
    for (const row of newBoard) {
      for (const cell of row) {
        if (cell === (nextTurn + 'K')) { kingExists = true; break; }
      }
      if (kingExists) break;
    }
    if (!kingExists) {
      endGame(newBoard, currentTurn, 'Captured the enemy Unicorn!', newGems, newGemsCollected, move, newRights);
      return;
    }

    // Check checkmate / stalemate
    if (!hasAnyLegalMoves(newBoard, nextTurn, move, newRights)) {
      const inCheck = isKingInCheck(newBoard, nextTurn);
      if (inCheck) {
        endGame(newBoard, currentTurn, 'Checkmate!', newGems, newGemsCollected, move, newRights);
      } else {
        endGame(newBoard, 'draw', 'Stalemate!', newGems, newGemsCollected, move, newRights);
      }
      return;
    }

    setBoard(newBoard);
    setCurrentTurn(nextTurn);
    setLastMove(move);
    setCastlingRights(newRights);
    setGems(newGems);
    setGemsCollected(newGemsCollected);

    if (mode === 'multi' && room) {
      await base44.entities.PawSpellRoom.update(room.id, {
        board: newBoard, currentTurn: nextTurn, lastMove: move,
        gems: newGems, gemsCollected: newGemsCollected, castlingRights: newRights,
      });
    } else if (mode === 'ai' && nextTurn !== myColor) {
      // AI's turn
      setAiThinking(true);
      setTimeout(async () => {
        const aiMove = getAIMoveSimple(newBoard, nextTurn, move, newRights);
        if (aiMove) await processAIMove(newBoard, aiMove, move, newRights, newGems, newGemsCollected, nextTurn);
        setAiThinking(false);
      }, 700);
    }
  }, [board, currentTurn, castlingRights, gems, gemsCollected, mode, room, myColor]);

  const processAIMove = async (curBoard, aiMove, lastMv, rights, curGems, curCollected, turn) => {
    const piece = curBoard[aiMove.from[0]][aiMove.from[1]];
    const newBoard = applyMove(curBoard, aiMove.from, aiMove.to);
    const newRights = updateCastlingRights(piece, aiMove.from, rights);
    const move = { from: aiMove.from, to: aiMove.to, piece };

    let newGems = [...curGems];
    let newGemsCollected = { ...curCollected };
    const gemOnDest = newGems.findIndex(g => g.row === aiMove.to[0] && g.col === aiMove.to[1]);
    if (gemOnDest !== -1) {
      newGemsCollected[turn] = (newGemsCollected[turn] || 0) + 1;
      newGems = newGems.filter((_, i) => i !== gemOnDest);
      if (newGems.length < 2) { const extra = generateGemPositions(1); newGems.push(...extra); }
    }

    if (newGemsCollected[turn] >= 3) {
      endGame(newBoard, turn, 'AI collected 3 Crystal Gems!', newGems, newGemsCollected, move, newRights);
      return;
    }

    const nextTurn = 'w';
    let kingExists = false;
    for (const row of newBoard) for (const cell of row) if (cell === 'wK') { kingExists = true; break; }
    if (!kingExists) { endGame(newBoard, turn, 'AI captured your Unicorn!', newGems, newGemsCollected, move, newRights); return; }

    if (!hasAnyLegalMoves(newBoard, nextTurn, move, newRights)) {
      const inCheck = isKingInCheck(newBoard, nextTurn);
      endGame(newBoard, inCheck ? turn : 'draw', inCheck ? 'Checkmate!' : 'Stalemate!', newGems, newGemsCollected, move, newRights);
      return;
    }

    setBoard(newBoard);
    setCurrentTurn(nextTurn);
    setLastMove(move);
    setCastlingRights(newRights);
    setGems(newGems);
    setGemsCollected(newGemsCollected);
  };

  const endGame = async (finalBoard, winner, reason, finalGems, finalCollected, move, rights) => {
    setBoard(finalBoard);
    setGems(finalGems);
    setGemsCollected(finalCollected);
    setGameOver({ winner, reason });

    if (mode === 'multi' && room) {
      await base44.entities.PawSpellRoom.update(room.id, {
        board: finalBoard, status: 'finished', winner, winReason: reason,
        gems: finalGems, gemsCollected: finalCollected,
      });
    }

    // Update wins/losses
    if (pawProfile && winner !== 'draw') {
      const isWin = winner === myColor;
      const tokensEarned = isWin ? 25 : 5;
      await base44.entities.PawSpellProfile.update(pawProfile.id, {
        wins: (pawProfile.wins || 0) + (isWin ? 1 : 0),
        losses: (pawProfile.losses || 0) + (isWin ? 0 : 1),
        tokens: (pawProfile.tokens || 0) + tokensEarned,
      });
      setPawProfile(prev => ({ ...prev, tokens: (prev.tokens || 0) + tokensEarned }));
    }
  };

  const handlePlayAgain = () => {
    navigate('/PawSpell');
  };

  const isCheck = !gameOver && isKingInCheck(board, currentTurn);
  const isMyTurn = currentTurn === myColor;
  const disabled = !isMyTurn || !!gameOver || aiThinking;

  const oppUsername = mode === 'ai' ? '🤖 AI' : (myColor === 'w' ? room?.guestUsername : room?.hostUsername);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Back button */}
        <button onClick={() => navigate('/PawSpell')} className="text-purple-400 hover:text-purple-200 text-sm mb-4 block">
          ← Back to Paw & Spell
        </button>

        <GameHeader
          myUsername={pawProfile?.username}
          oppUsername={oppUsername}
          myColor={myColor}
          currentTurn={currentTurn}
          gemsCollected={gemsCollected}
          isCheck={isCheck}
          myTokens={pawProfile?.tokens}
        />

        {/* AI thinking indicator */}
        {aiThinking && (
          <div className="text-center text-purple-400 text-sm mb-2 animate-pulse">🐉 AI is thinking...</div>
        )}

        <div className="flex justify-center">
          <PawBoard
            board={board}
            currentTurn={currentTurn}
            myColor={myColor}
            gems={gems}
            equippedSkins={equippedSkins}
            skinImages={skinImages}
            onMove={(from, to) => processMove(from, to)}
            lastMove={lastMove}
            castlingRights={castlingRights}
            disabled={disabled}
          />
        </div>

        {/* Token display */}
        <div className="mt-4 text-center text-purple-400 text-sm">
          🪙 {pawProfile?.tokens || 0} tokens &nbsp;|&nbsp; 🏆 {pawProfile?.wins || 0} wins
        </div>
      </div>

      {mode === 'ai' && (
        <AIChat
          board={board}
          currentTurn={currentTurn}
          myColor={myColor}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(v => !v)}
        />
      )}

      {gameOver && (
        <GameOverModal
          winner={gameOver.winner}
          winReason={gameOver.reason}
          myColor={myColor}
          tokensEarned={gameOver.winner === myColor ? 25 : 5}
          onPlayAgain={handlePlayAgain}
          onExit={() => navigate('/PawSpell')}
        />
      )}
    </div>
  );
}