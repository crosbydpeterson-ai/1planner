import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getWheelTheme, ThemeDefs } from '@/components/wheellibrary/WheelThemeCatalog';

const FALLBACK_COLORS = [
  '#7c3aed', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

const TYPE_ICONS = {
  xp: '⭐',
  coins: '🪙',
  pet: '🐾',
  theme: '🎨',
  title: '🏷️',
  song: '🎵',
  playlist: '🎶',
  wheel: '🎡',
  default: '🎁',
};

function getIcon(type) {
  return TYPE_ICONS[type] || TYPE_ICONS.default;
}

function getPrizeLabel(prize, assets) {
  if (!prize) return '';
  if (prize.label) return prize.label;
  if (prize.name) return prize.name;
  if (prize.type === 'xp') return `${prize.amount || 0} XP`;
  if (prize.type === 'coins') return `${prize.amount || 0} Coins`;
  if (prize.type === 'pet') {
    const pet = assets?.pets?.[prize.value];
    return pet?.name || 'Pet';
  }
  if (prize.type === 'theme') {
    const theme = assets?.themes?.[prize.value];
    return theme?.name || 'Theme';
  }
  if (prize.type === 'title') return prize.value || 'Title';
  if (prize.type === 'song') {
    const song = assets?.songs?.[prize.value];
    return song?.title || 'Song';
  }
  if (prize.type === 'playlist') {
    const playlist = assets?.playlists?.[prize.value];
    return playlist?.name || 'Playlist';
  }
  return 'Reward';
}

function segmentPath(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
}

export default function SpinWheel({ prizes = [], onResult, disabled = false, onBusyChange, colors, wheelTheme: themeId, assets }) {
  const theme = useMemo(() => getWheelTheme(themeId), [themeId]);
  const palette = (colors && colors.length > 0) ? colors : theme.defaultColors;
  const controls = useAnimation();
  const [phase, setPhase] = useState('idle');
  const [landedPrize, setLandedPrize] = useState(null);
  const [resultInfo, setResultInfo] = useState(null);
  const currentRotation = useRef(0);
  const mountedRef = useRef(true);
  const animLockRef = useRef(false);
  const onBusyChangeRef = useRef(onBusyChange);

  useEffect(() => { onBusyChangeRef.current = onBusyChange; }, [onBusyChange]);

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      onBusyChangeRef.current?.(false);
    };
  }, []);

  useEffect(() => {
    setPhase('idle');
    setLandedPrize(null);
    setResultInfo(null);
    animLockRef.current = false;
  }, [prizes]);

  const totalWeight = useMemo(
    () => prizes.reduce((s, p) => s + Math.max(0, Number(p.weight) || 0), 0),
    [prizes]
  );

  const segments = useMemo(() => {
    if (!prizes.length || totalWeight <= 0) return [];
    let angle = 0;
    return prizes.map((p, i) => {
      const slice = (Math.max(0, Number(p.weight) || 0) / totalWeight) * 360;
      const seg = { ...p, startAngle: angle, endAngle: angle + slice, midAngle: angle + slice / 2, color: p.color || palette[i % palette.length], index: i };
      angle += slice;
      return seg;
    });
  }, [prizes, totalWeight, palette]);

  const pickPrize = useCallback(() => {
    if (prizes.length === 0 || totalWeight <= 0) return null;
    const valid = prizes.filter(p => (Number(p.weight) || 0) > 0);
    if (valid.length === 1) return valid[0];
    const r = Math.random() * totalWeight;
    let sum = 0;
    for (const p of prizes) {
      sum += Math.max(0, Number(p.weight) || 0);
      if (r <= sum) return p;
    }
    return prizes[prizes.length - 1];
  }, [prizes, totalWeight]);

  const handleSpin = async () => {
    if (disabled || animLockRef.current || phase === 'spinning' || phase === 'saving') return;
    if (prizes.length === 0 || totalWeight <= 0) return;

    animLockRef.current = true;
    onBusyChangeRef.current?.(true);
    setPhase('spinning');
    setLandedPrize(null);
    setResultInfo(null);

    const prize = pickPrize();
    if (!prize) {
      animLockRef.current = false;
      onBusyChangeRef.current?.(false);
      setPhase('error');
      setResultInfo({ error: 'no_prize' });
      return;
    }

    const idx = prizes.indexOf(prize);
    const seg = segments[idx];
    const segAngle = seg.endAngle - seg.startAngle;

    const maxOffset = Math.min(segAngle * 0.3, 15);
    const offset = (Math.random() - 0.5) * 2 * maxOffset;
    const landAngle = seg.midAngle + offset;
    const targetAngle = (270 - landAngle + 360) % 360;
    const base = currentRotation.current % 360;
    let delta = (targetAngle - base + 360) % 360;
    if (delta < 15) delta += 360;

    if (prefersReducedMotion) {
      const newRotation = currentRotation.current + delta;
      await controls.start({ rotate: newRotation, transition: { duration: 0.5, ease: 'easeOut' } });
      if (!mountedRef.current) return;
      currentRotation.current = newRotation;
    } else {
      const fullSpins = 5 * 360;
      const totalSpin = fullSpins + delta;
      const newRotation = currentRotation.current + totalSpin;
      await controls.start({
        rotate: newRotation,
        transition: { duration: 4, ease: [0.25, 0.1, 0.25, 1] },
      });
      if (!mountedRef.current) return;
      currentRotation.current = newRotation;
    }

    setLandedPrize(prize);
    setPhase('saving');

    try {
      const result = await onResult?.(prize);
      if (!mountedRef.current) return;
      if (result?.ok) {
        setPhase('success');
        setResultInfo({ awarded: result.awarded, reward: result.reward || prize });
      } else {
        setPhase('error');
        setResultInfo({ error: result?.error || 'unknown' });
      }
    } catch {
      if (!mountedRef.current) return;
      setPhase('error');
      setResultInfo({ error: 'exception' });
    } finally {
      if (mountedRef.current) {
        animLockRef.current = false;
        onBusyChangeRef.current?.(false);
      }
    }
  };

  const [size, setSize] = useState(360);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setSize(w < 400 ? Math.min(300, w - 80) : w < 768 ? 340 : 400);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 18;
  const rimR = size / 2 - 4;

  const isLocked = phase === 'spinning' || phase === 'saving' || disabled;
  const canSpin = !isLocked && prizes.length > 0 && totalWeight > 0;

  // Resolve pet image for result card
  const landedPet = landedPrize?.type === 'pet' ? assets?.pets?.[landedPrize.value] : null;
  const resultEmoji = landedPet?.emoji || landedPet?.imageUrl ? null : getIcon(landedPrize?.type);

  if (prizes.length === 0 || totalWeight <= 0) {
    return (
      <div className="flex flex-col items-center gap-3 w-full py-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl">{theme.center.hubEmoji}</div>
        <p className="text-sm text-slate-500 text-center max-w-xs">
          No wheel prizes are configured right now.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Wheel container */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Themed glow behind wheel */}
        {theme.bgGlow && (
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${theme.bgGlow}, transparent 70%)` }}
          />
        )}

        {/* Fixed top pointer */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}>
          <svg width="28" height="32" viewBox="0 0 28 32">
            <path d="M14 30 L2 6 Q14 0 26 6 Z" fill={theme.pointer.color} stroke={theme.pointer.stroke} strokeWidth="1.5" />
            <circle cx="14" cy="8" r="3" fill={theme.pointer.stroke} />
          </svg>
        </div>

        {/* Themed rim (static) */}
        <svg width={size} height={size} className="absolute inset-0 z-0">
          <circle cx={cx} cy={cy} r={rimR} fill="none" stroke={theme.rim.color} strokeWidth="8" />
          <circle cx={cx} cy={cy} r={rimR - 1} fill="none" stroke={theme.rim.innerColor} strokeWidth="2" />
          {Array.from({ length: theme.rim.dotCount }).map((_, i) => {
            const a = (i / theme.rim.dotCount) * 2 * Math.PI;
            const dx = cx + (rimR - 4) * Math.cos(a);
            const dy = cy + (rimR - 4) * Math.sin(a);
            return <circle key={i} cx={dx} cy={dy} r="2" fill={theme.rim.dotColor} />;
          })}
        </svg>

        {/* Rotating wheel */}
        <motion.div
          animate={controls}
          initial={{ rotate: 0 }}
          style={{ originX: '50%', originY: '50%', width: size, height: size, position: 'relative', zIndex: 1 }}
        >
          <svg width={size} height={size}>
            <ThemeDefs theme={theme} uid="spin" />
            {segments.map((seg, i) => {
              const midRad = (seg.midAngle * Math.PI) / 180;
              const textR = r * 0.6;
              const tx = cx + textR * Math.cos(midRad);
              const ty = cy + textR * Math.sin(midRad);
              const iconR = r * 0.82;
              const ix = cx + iconR * Math.cos(midRad);
              const iy = cy + iconR * Math.sin(midRad);
              const segAngle = seg.endAngle - seg.startAngle;
              const isLanded = landedPrize && segments.indexOf(landedPrize) === i;
              const dim = phase === 'success' && !isLanded;
              const showLabel = segAngle > 30;
              const pathD = segmentPath(cx, cy, r, seg.startAngle, seg.endAngle);
              return (
                <g key={i}>
                  <path
                    d={pathD}
                    fill={seg.color}
                    stroke={theme.segment.stroke}
                    strokeWidth={theme.segment.strokeWidth}
                    opacity={dim ? 0.4 : 1}
                  />
                  {/* Gradient overlay for depth */}
                  {theme.gradient && (
                    <path d={pathD} fill={`url(#tw-spin-grad)`} opacity={theme.gradient.opacity} />
                  )}
                  {/* Pattern overlay for texture */}
                  {theme.pattern && (
                    <path d={pathD} fill={`url(#tw-spin-pat)`} opacity={theme.pattern.opacity} />
                  )}
                  {segAngle > 12 && (
                    <text
                      x={ix} y={iy}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={segAngle > 50 ? 18 : segAngle > 25 ? 14 : 11}
                      transform={`rotate(${seg.midAngle + 90}, ${ix}, ${iy})`}
                    >
                      {getIcon(seg.type)}
                    </text>
                  )}
                  {showLabel && (
                    <text
                      x={tx} y={ty}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={segAngle > 60 ? 11 : 9}
                      fill="white"
                      fontWeight="700"
                      transform={`rotate(${seg.midAngle + 90}, ${tx}, ${ty})`}
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {(() => {
                        const lbl = getPrizeLabel(seg, assets);
                        return lbl.length > 10 ? lbl.slice(0, 9) + '…' : lbl;
                      })()}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Themed center hub */}
            <circle cx={cx} cy={cy} r="26" fill={theme.center.ringFill} stroke={theme.center.ringStroke} strokeWidth="4" />
            <circle cx={cx} cy={cy} r="18" fill={theme.center.fill} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="white">{theme.center.hubEmoji}</text>
          </svg>
        </motion.div>

        {/* Highlight ring on landed segment */}
        {phase === 'success' && landedPrize && (
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 pointer-events-none"
          >
            <svg width={size} height={size}>
              <circle cx={cx} cy={cy} r={rimR + 2} fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="6 4" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Prize list with win chances */}
      <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="text-xs font-semibold text-slate-500 mb-2">Prizes &amp; win chances</div>
        <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
          {segments.map((seg, i) => {
            const pct = totalWeight > 0 ? Math.round((Math.max(0, Number(seg.weight) || 0) / totalWeight) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white/50" style={{ background: seg.color }} />
                <span className="truncate text-slate-600">{getIcon(seg.type)} {getPrizeLabel(seg, assets)}</span>
                <span className="ml-auto font-bold text-slate-700 tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status feedback */}
      {phase === 'saving' && (
        <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving reward…
        </div>
      )}
      {phase === 'success' && resultInfo && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="w-full bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-5 text-center relative overflow-hidden"
        >
          {/* Pet image or emoji */}
          {landedPet?.imageUrl ? (
            <motion.div
              initial={{ rotate: -8, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="mb-2 flex justify-center"
            >
              <img src={landedPet.imageUrl} alt={landedPet.name} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-300 shadow-lg" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ rotate: -8, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="text-5xl mb-2"
            >
              {landedPet?.emoji || getIcon(landedPrize?.type)}
            </motion.div>
          )}
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">🎉 You won!</div>
          <div className="text-lg font-extrabold text-slate-800 leading-tight">
            {resultInfo.awarded || getPrizeLabel(landedPrize, assets)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saved to your account
          </div>
        </motion.div>
      )}
      {phase === 'error' && resultInfo && (
        <div className="flex items-start gap-2 text-sm text-red-700 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            {resultInfo.error === 'already_claimed' ? 'Already claimed today — no spin was used.' :
             resultInfo.error === 'no_tokens' ? 'No bonus spins available.' :
             resultInfo.error === 'connection_error' ? 'Connection error. Please try again — no reward was saved.' :
             resultInfo.error === 'profile_update_failed' ? 'Could not save the reward to your profile. Please try again.' :
             resultInfo.error === 'progress_update_failed' ? 'Reward added, but we could not confirm your claim. Please contact support if this persists.' :
             'Could not save reward. Your spin was not counted.'}
          </span>
        </div>
      )}

      <Button
        onClick={handleSpin}
        disabled={!canSpin}
        className="w-full text-white font-bold text-base py-5"
        style={{ backgroundColor: theme.center.fill }}
      >
        {phase === 'spinning' ? 'Spinning…' :
         phase === 'saving' ? 'Saving…' :
         `${theme.center.hubEmoji} SPIN!`}
      </Button>
    </div>
  );
}