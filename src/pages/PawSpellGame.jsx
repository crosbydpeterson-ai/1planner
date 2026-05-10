import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PawBoard from '@/components/pawspell/PawBoard';
import GameHeader from '@/components/pawspell/GameHeader';
import GameOverModal from '@/components/pawspell/GameOverModal';
import {
  applyMove, hasAnyLegalMoves, isKingInCheck,
  generateGemPositions, parsePiece
} from '@/lib/pawSpellLogic';
import { INITIAL_BOARD, PIECE_TO_PET } from '@/lib/pawSpellConstants';
import AbilityPanel from '@/components/pawspell/AbilityPanel';
import { resolveAbilitiesForSide } from '@/lib/pawSpellAbilityResolver';
import { executeAbility, tickEffects, tryInterceptKingCapture } from '@/lib/pawSpellAbilities';

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
  const [gemProgress, setGemProgress] = useState({}); // { "row,col": { side, turns } }
  const [gameOver, setGameOver] = useState(null); // { winner, reason }
  const [aiThinking, setAiThinking] = useState(false);
  const [room, setRoom] = useState(null);
  const [equippedSkins, setEquippedSkins] = useState({});
  const [skinImages, setSkinImages] = useState({});
  const [abilities, setAbilities] = useState({ w: {}, b: {} });
  const [abilityEffects, setAbilityEffects] = useState([]);
  const [abilitiesUsed, setAbilitiesUsed] = useState({ w: false, b: false });
  const [pendingAbility, setPendingAbility] = useState(null); // { pieceType, ability, sourceSquare, multiTargets:[] }
  const [winConditionOverride, setWinConditionOverride] = useState(null);
  const [previousBoard, setPreviousBoard] = useState(null);
  const [abilityMessage, setAbilityMessage] = useState(null);
  const pollRef = useRef(null);
  const workerRef = useRef(null);
  const processAIMoveRef = useRef(null);

  // Lazily create the AI web worker
  const getWorker = () => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../lib/pawSpellAIWorker.js', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  };

  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    initGame();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    };
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

  const loadSkinsForSide = async (equipped, petSkinMap) => {
    const skinIds = Object.values(equipped).filter(Boolean);
    const images = {};
    for (const sid of skinIds) {
      if (sid.startsWith('pet_')) {
        if (petSkinMap[sid]) images[sid] = petSkinMap[sid];
      } else {
        const skins = await base44.entities.PawSpellSkin.filter({ id: sid });
        if (skins[0]) images[sid] = skins[0].imageUrl;
      }
    }
    return images;
  };

  const loadEquippedSkins = async (pp) => {
    const equipped = pp.equippedSkins || {};
    const petSkinMap = pp.petSkinMap || {};
    // My color gets my skins, opponent color starts empty (loaded when room loads in multi)
    setEquippedSkins(prev => ({ ...prev, [myColorParam]: equipped }));
    const images = await loadSkinsForSide(equipped, petSkinMap);
    setSkinImages(prev => ({ ...prev, ...images }));
    // Resolve my abilities
    const myAbilities = await resolveAbilitiesForSide(equipped, petSkinMap);
    setAbilities(prev => ({ ...prev, [myColorParam]: myAbilities }));
  };

  const deserializeRoom = (r) => ({
    ...r,
    board: r.board ? r.board.map(row => typeof row === 'string' ? JSON.parse(row) : row) : INITIAL_BOARD,
    gems: r.gems ? r.gems.map(g => typeof g === 'string' ? JSON.parse(g) : g) : [],
  });

  const loadRoom = async (rid) => {
    const rooms = await base44.entities.PawSpellRoom.filter({ id: rid });
    if (!rooms[0]) return;
    const r = deserializeRoom(rooms[0]);
    setRoom(r);
    setBoard(r.board || INITIAL_BOARD);
    setCurrentTurn(r.currentTurn || 'w');
    setLastMove(r.lastMove || null);
    setGems(r.gems || []);
    setGemsCollected(r.gemsCollected || { w: 0, b: 0 });
    setAbilityEffects(r.abilityEffects || []);
    setAbilitiesUsed(r.abilitiesUsed || { w: false, b: false });
    setWinConditionOverride(r.winConditionOverride || null);
    if (r.winner) setGameOver({ winner: r.winner, reason: r.winReason });

    // Load opponent skins + abilities (only need to do this once — check if already loaded)
    const oppColor = myColorParam === 'w' ? 'b' : 'w';
    if (Object.keys(abilities[oppColor]).length === 0) {
      const oppEquipped = oppColor === 'w' ? r.hostEquippedSkins : r.guestEquippedSkins;
      const oppPetSkinMap = oppColor === 'w' ? (r.hostPetSkinMap || {}) : (r.guestPetSkinMap || {});
      if (oppEquipped) {
        // Load opponent skin images
        const oppImages = await loadSkinsForSide(oppEquipped, oppPetSkinMap);
        setSkinImages(prev => ({ ...prev, ...oppImages }));
        setEquippedSkins(prev => ({ ...prev, [oppColor]: oppEquipped }));
        const oppAbils = await resolveAbilitiesForSide(oppEquipped, oppPetSkinMap);
        setAbilities(prev => ({ ...prev, [oppColor]: oppAbils }));
      }
    }
  };

  const startPolling = (rid) => {
    pollRef.current = setInterval(async () => {
      const rooms = await base44.entities.PawSpellRoom.filter({ id: rid });
      if (!rooms[0]) return;
      const r = deserializeRoom(rooms[0]);
      // Skip if it's still our turn (we just moved, don't overwrite local state)
      if (r.currentTurn === myColorParam) return;
      setRoom(r);
      setBoard(r.board || INITIAL_BOARD);
      setCurrentTurn(r.currentTurn || 'w');
      setLastMove(r.lastMove || null);
      setGems(r.gems || []);
      setGemsCollected(r.gemsCollected || { w: 0, b: 0 });
      setAbilityEffects(r.abilityEffects || []);
      setAbilitiesUsed(r.abilitiesUsed || { w: false, b: false });
      if (r.winner) setGameOver({ winner: r.winner, reason: r.winReason });
    }, 2000);
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

  // ───── Ability handlers ─────
  const handleActivateAbility = (pieceType, ability) => {
    if (abilitiesUsed[myColor]) return;
    // Find piece on board to use as sourceSquare
    let sourceSquare = null;
    const pieceCode = Object.keys(PIECE_TO_PET).find(k => PIECE_TO_PET[k] === pieceType);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === (myColor + pieceCode.toUpperCase())) {
          sourceSquare = [r, c]; break;
        }
      }
      if (sourceSquare) break;
    }

    if (ability.needsTarget) {
      setPendingAbility({ pieceType, ability, sourceSquare, multiTargets: [] });
    } else {
      // Execute immediately
      runAbility({ pieceType, ability, sourceSquare, target: null });
    }
  };

  const handleAbilityTarget = (row, col) => {
    if (!pendingAbility) return;
    const { pieceType, ability, sourceSquare, multiTargets } = pendingAbility;
    // Multi-target abilities: fire/dragon (2 pieces), ocean/golem (2 pieces)
    const needsTwo = (ability.category === 'fire' && pieceType === 'dragon') ||
                     (ability.category === 'ocean' && pieceType === 'golem');
    if (needsTwo) {
      const newTargets = [...multiTargets, [row, col]];
      if (newTargets.length < 2) {
        setPendingAbility({ ...pendingAbility, multiTargets: newTargets });
        return;
      }
      runAbility({ pieceType, ability, sourceSquare, target: newTargets });
    } else {
      runAbility({ pieceType, ability, sourceSquare, target: [row, col] });
    }
  };

  const runAbility = async ({ pieceType, ability, sourceSquare, target }) => {
    const result = executeAbility({
      board, side: myColor, category: ability.category, pieceType,
      target, abilityEffects, sourceSquare, gems, gemsCollected, previousBoard,
    });
    if (result.error) {
      setAbilityMessage({ text: result.error, type: 'error' });
      setTimeout(() => setAbilityMessage(null), 2500);
      return;
    }
    const newBoard = result.newBoard || board;
    const newEffects = result.newAbilityEffects || abilityEffects;
    const newGems = result.newGems || gems;
    const newCollected = result.newGemsCollected || gemsCollected;
    const newUsed = { ...abilitiesUsed, [myColor]: true };
    const newOverride = result.winConditionOverride || winConditionOverride;

    setBoard(newBoard);
    setAbilityEffects(newEffects);
    setGems(newGems);
    setGemsCollected(newCollected);
    setAbilitiesUsed(newUsed);
    setPendingAbility(null);
    setWinConditionOverride(newOverride);
    setAbilityMessage({ text: result.message, type: 'success' });
    setTimeout(() => setAbilityMessage(null), 3000);

    // Token bonus (e.g. Crystal/Dragon Gem Hoard miss)
    if (result.tokenBonus && pawProfile) {
      await base44.entities.PawSpellProfile.update(pawProfile.id, {
        tokens: (pawProfile.tokens || 0) + result.tokenBonus,
      });
      setPawProfile(prev => ({ ...prev, tokens: (prev.tokens || 0) + result.tokenBonus }));
    }

    // Persist to multiplayer room
    if (mode === 'multi' && room) {
      await base44.entities.PawSpellRoom.update(room.id, {
        board: newBoard.map(row => JSON.stringify(row)),
        gems: newGems.map(g => JSON.stringify(g)),
        gemsCollected: newCollected,
        abilityEffects: newEffects,
        abilitiesUsed: newUsed,
        winConditionOverride: newOverride,
      });
    }

    // Check win conditions after ability
    const gemsNeeded = newOverride === 'gems5' ? 5 : 3;
    if (newCollected[myColor] >= gemsNeeded) {
      endGame(newBoard, myColor, `Collected ${gemsNeeded} Crystal Gems!`, newGems, newCollected, lastMove, castlingRights);
    }
  };

  const cancelPendingAbility = () => setPendingAbility(null);

  const processMove = useCallback(async (from, to) => {
    const piece = board[from[0]][from[1]];

    // Capture interception (king capture by ability shields / phoenix)
    const captureTarget = board[to[0]][to[1]];
    if (captureTarget && captureTarget[1].toLowerCase() === 'k') {
      const kingSide = captureTarget[0];
      const intercept = tryInterceptKingCapture(abilityEffects, board, kingSide, to[0], to[1]);
      if (intercept?.cancelled) {
        if (!intercept.newBoard) {
          // Shield — block the capture entirely
          setAbilityEffects(intercept.newEffects);
          setAbilityMessage({ text: intercept.message, type: 'success' });
          setTimeout(() => setAbilityMessage(null), 3000);
          return;
        } else {
          // Phoenix — king relocated, attacker still moves to (now-empty) target
          const nb2 = applyMove(intercept.newBoard, from, to);
          const nextTurn = currentTurn === 'w' ? 'b' : 'w';
          setBoard(nb2);
          setAbilityEffects(intercept.newEffects);
          setAbilityMessage({ text: intercept.message, type: 'success' });
          setTimeout(() => setAbilityMessage(null), 3000);
          setCurrentTurn(nextTurn);
          setLastMove({ from, to, piece });
          return;
        }
      }
    }

    const newBoard = applyMove(board, from, to);
    const newRights = updateCastlingRights(piece, from, castlingRights);
    const move = { from, to, piece };

    // Save previous board (for time/sprite Rewind)
    setPreviousBoard(board);

    // Tick effects (decrement timers) — happens at start of NEXT player's turn
    const tickedEffects = tickEffects(abilityEffects);

    // --- 3-turn gem standing mechanic ---
    let newGems = [...gems];
    let newGemsCollected = { ...gemsCollected };
    let newGemProgress = { ...gemProgress };

    // Clear progress for gem squares the moving piece left
    const fromKey = `${from[0]},${from[1]}`;
    if (newGemProgress[fromKey]?.side === currentTurn) {
      delete newGemProgress[fromKey];
    }

    const gemOnDestIdx = newGems.findIndex(g => g.row === to[0] && g.col === to[1]);
    if (gemOnDestIdx !== -1) {
      const destKey = `${to[0]},${to[1]}`;
      const isLocked = tickedEffects.some(e => e.type === 'gemLock' && e.row === to[0] && e.col === to[1] && e.side === currentTurn);
      const oppSide = currentTurn === 'w' ? 'b' : 'w';
      const shielded = tickedEffects.some(e => e.type === 'gemShield' && e.side === oppSide) &&
        (() => {
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const r = to[0] + dr, c = to[1] + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && newBoard[r][c]?.[0] === oppSide) return true;
          }
          return false;
        })();

      if (!isLocked && !shielded) {
        const existing = newGemProgress[destKey];
        const turns = (existing?.side === currentTurn ? existing.turns : 0) + 1;
        if (turns >= 3) {
          // Collected!
          newGemsCollected[currentTurn] = (newGemsCollected[currentTurn] || 0) + 1;
          newGems = newGems.filter((_, i) => i !== gemOnDestIdx);
          delete newGemProgress[destKey];
          if (newGems.length < 2) {
            const extra = generateGemPositions(1);
            newGems.push(...extra);
          }
        } else {
          newGemProgress[destKey] = { side: currentTurn, turns };
        }
      }
    }

    // Also reset gem progress for any gem square where a different piece now occupies it
    // (opponent stepped on a gem square we were working on)
    for (const key of Object.keys(newGemProgress)) {
      const [gr, gc] = key.split(',').map(Number);
      const occupant = newBoard[gr]?.[gc];
      if (occupant && occupant[0] !== newGemProgress[key].side) {
        delete newGemProgress[key];
      }
    }

    let nextTurn = currentTurn === 'w' ? 'b' : 'w';

    // Burn trap: enemy stepping on it loses next turn
    const burnIdx = tickedEffects.findIndex(e => e.type === 'burnTrap' && e.row === to[0] && e.col === to[1] && e.side !== currentTurn);
    let finalEffects = tickedEffects;
    if (burnIdx >= 0) {
      finalEffects = tickedEffects.filter((_, i) => i !== burnIdx);
      finalEffects = [...finalEffects, { type: 'timeStop', side: nextTurn, turnsLeft: 2 }];
      setAbilityMessage({ text: '🔥 Stepped on a burn trap — opponent skips a turn!', type: 'success' });
      setTimeout(() => setAbilityMessage(null), 3000);
    }

    // Time stop: if next side is in time-stop, skip their turn
    const timeStopIdx = finalEffects.findIndex(e => e.type === 'timeStop' && e.side === nextTurn);
    if (timeStopIdx >= 0) {
      finalEffects = finalEffects.filter((_, i) => i !== timeStopIdx);
      nextTurn = currentTurn; // turn returns to mover
    }

    // Win threshold (5 if Crystal Fortress / Entropy gems5, else 3)
    const gemsNeeded = winConditionOverride === 'gems5' ? 5 : 3;

    // Check win by gems
    if (newGemsCollected[currentTurn] >= gemsNeeded) {
      endGame(newBoard, currentTurn, `Collected ${gemsNeeded} Crystal Gems!`, newGems, newGemsCollected, move, newRights);
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

    // Check checkmate / stalemate (only if not checkmate-only-mode allows non-king-capture wins)
    if (!hasAnyLegalMoves(newBoard, nextTurn, move, newRights, finalEffects)) {
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
    setGemProgress(newGemProgress);
    setAbilityEffects(finalEffects);

    if (mode === 'multi' && room) {
      await base44.entities.PawSpellRoom.update(room.id, {
        board: newBoard.map(row => JSON.stringify(row)),
        currentTurn: nextTurn, lastMove: move,
        gems: newGems.map(g => JSON.stringify(g)),
        gemsCollected: newGemsCollected, castlingRights: newRights,
        abilityEffects: finalEffects,
      });
    } else if (mode === 'ai' && nextTurn !== myColor) {
      // AI's turn — run in web worker to avoid blocking UI
      setAiThinking(true);
      const worker = getWorker();
      worker.onmessage = async (e) => {
        const aiMove = e.data.move;
        if (aiMove) await processAIMoveRef.current(newBoard, aiMove, move, newRights, newGems, newGemsCollected, nextTurn);
        setAiThinking(false);
      };
      worker.postMessage({ board: newBoard, color: nextTurn, lastMove: move, castlingRights: newRights });
    }
  }, [board, currentTurn, castlingRights, gems, gemsCollected, gemProgress, mode, room, myColor, abilityEffects, abilityEffects, winConditionOverride, previousBoard, pawProfile, lastMove, abilitiesUsed, pendingAbility]);

  processAIMoveRef.current = async (curBoard, aiMove, lastMv, rights, curGems, curCollected, turn) => {
    return processAIMove(curBoard, aiMove, lastMv, rights, curGems, curCollected, turn);
  };

  const processAIMove = async (curBoard, aiMove, lastMv, rights, curGems, curCollected, turn) => {
    const piece = curBoard[aiMove.from[0]][aiMove.from[1]];
    const newBoard = applyMove(curBoard, aiMove.from, aiMove.to);
    const newRights = updateCastlingRights(piece, aiMove.from, rights);
    const move = { from: aiMove.from, to: aiMove.to, piece };

    let newGems = [...curGems];
    let newGemsCollected = { ...curCollected };
    // AI: instant gem collection (AI doesn't wait 3 turns — keeps it challenging)
    const aiGemIdx = newGems.findIndex(g => g.row === aiMove.to[0] && g.col === aiMove.to[1]);
    if (aiGemIdx !== -1) {
      newGemsCollected[turn] = (newGemsCollected[turn] || 0) + 1;
      newGems = newGems.filter((_, i) => i !== aiGemIdx);
      if (newGems.length < 2) { const extra = generateGemPositions(1); newGems.push(...extra); }
    }

    const gemsNeededAI = winConditionOverride === 'gems5' ? 5 : 3;
    if (newGemsCollected[turn] >= gemsNeededAI) {
      endGame(newBoard, turn, `AI collected ${gemsNeededAI} Crystal Gems!`, newGems, newGemsCollected, move, newRights);
      return;
    }

    const nextTurn = 'w';
    let kingExists = false;
    for (const row of newBoard) for (const cell of row) if (cell === 'wK') { kingExists = true; break; }
    if (!kingExists) { endGame(newBoard, turn, 'AI captured your Unicorn!', newGems, newGemsCollected, move, newRights); return; }

    if (!hasAnyLegalMoves(newBoard, nextTurn, move, newRights, abilityEffects)) {
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
        board: finalBoard.map(row => JSON.stringify(row)),
        status: 'finished', winner, winReason: reason,
        gems: finalGems.map(g => JSON.stringify(g)),
        gemsCollected: finalCollected,
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

        {/* Ability message toast */}
        {abilityMessage && (
          <div className={`text-center text-sm mb-2 px-3 py-1.5 rounded-lg mx-auto inline-block ${
            abilityMessage.type === 'error' ? 'bg-red-900/60 text-red-200' : 'bg-purple-900/60 text-purple-100'
          }`} style={{ display: 'block' }}>
            {abilityMessage.text}
          </div>
        )}

        <div className="flex justify-center">
          <PawBoard
            board={board}
            currentTurn={currentTurn}
            myColor={myColor}
            gems={gems}
            gemProgress={gemProgress}
            equippedSkins={equippedSkins}
            skinImages={skinImages}
            oppAbilities={abilities[myColor === 'w' ? 'b' : 'w'] || {}}
            onMove={(from, to) => processMove(from, to)}
            lastMove={lastMove}
            castlingRights={castlingRights}
            disabled={disabled || !!pendingAbility}
            abilityEffects={abilityEffects}
            abilityTargetMode={!!pendingAbility}
            onAbilityTarget={handleAbilityTarget}
          />
        </div>

        {/* Ability panel */}
        <AbilityPanel
          myAbilities={abilities[myColor] || {}}
          oppAbilities={abilities[myColor === 'w' ? 'b' : 'w'] || {}}
          abilityUsed={abilitiesUsed[myColor]}
          pendingAbility={pendingAbility ? { ...pendingAbility.ability, pieceType: pendingAbility.pieceType } : null}
          onActivate={handleActivateAbility}
          onCancel={cancelPendingAbility}
          disabled={!isMyTurn || !!gameOver || aiThinking}
        />

        {/* Token display */}
        <div className="mt-4 text-center text-purple-400 text-sm">
          🪙 {pawProfile?.tokens || 0} tokens &nbsp;|&nbsp; 🏆 {pawProfile?.wins || 0} wins
          {winConditionOverride === 'gems5' && <span className="ml-2 text-pink-300">· Need 5 gems!</span>}
        </div>
      </div>

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