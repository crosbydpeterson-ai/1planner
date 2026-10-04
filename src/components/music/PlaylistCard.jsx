import React from 'react';
import { ListMusic, Lock, Music2 } from 'lucide-react';
import { useSignedUrl } from '@/hooks/useSignedUrl';

// A playlist card on the Study Music page. Clicking opens the playlist dialog.
export default function PlaylistCard({ playlist, trackCount, onClick }) {
  const coverSrc = useSignedUrl(playlist.coverImageUri);
  const exclusive = !!playlist.isSeasonExclusive;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square bg-slate-100">
        {coverSrc ? (
          <img src={coverSrc} alt={playlist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 text-white">
            <ListMusic className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 text-white">
          <Music2 className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold drop-shadow">{trackCount} {trackCount === 1 ? 'song' : 'songs'}</span>
        </div>
        {exclusive && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
              <Lock className="w-3 h-3" />1Pass
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-slate-800 text-sm truncate">{playlist.name}</h3>
        {playlist.description ? (
          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{playlist.description}</p>
        ) : null}
      </div>
    </button>
  );
}