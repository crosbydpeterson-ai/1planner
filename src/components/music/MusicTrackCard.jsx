import React from 'react';
import { Play, Pause, Lock, Youtube, Music2 } from 'lucide-react';
import { musicPlayer } from '@/lib/musicPlayerStore';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { useSignedUrl } from '@/hooks/useSignedUrl';

export default function MusicTrackCard({ track }) {
  const { track: current, isPlaying } = useMusicPlayer();
  const isCurrent = current?.id === track.id;
  const coverSrc = useSignedUrl(track.coverImageUri);
  const playing = isCurrent && isPlaying;

  const handlePlay = () => {
    if (isCurrent) {
      isPlaying ? musicPlayer.pause() : musicPlayer.resume();
    } else {
      musicPlayer.play(track);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-slate-100">
        {coverSrc ? (
          <img src={coverSrc} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
            <Music2 className="w-12 h-12" />
          </div>
        )}
        <button
          onClick={handlePlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group ${playing ? 'bg-black/20' : ''}`}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          <span className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${playing ? 'bg-white text-indigo-600' : 'bg-white/90 text-indigo-600'}`}>
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </span>
        </button>
        <div className="absolute top-2 right-2 flex gap-1">
          {track.sourceType === 'youtube' && (
            <span className="bg-red-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
              <Youtube className="w-3 h-3" />YT
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-slate-800 text-sm truncate">{track.title}</h3>
        {track.description && <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{track.description}</p>}
        {track.assignedProfileIds?.length > 0 && (
          <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1"><Lock className="w-3 h-3" />Assigned</p>
        )}
      </div>
    </div>
  );
}