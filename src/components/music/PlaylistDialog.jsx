import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ListMusic } from 'lucide-react';
import MusicTrackCard from '@/components/music/MusicTrackCard';
import { useSignedUrl } from '@/hooks/useSignedUrl';

// Shows the tracks inside a playlist. Only tracks the viewer is allowed to
// play are listed (season-exclusive tracks require an unlock).
export default function PlaylistDialog({ playlist, tracks, open, onOpenChange }) {
  const coverSrc = useSignedUrl(playlist?.coverImageUri);
  if (!playlist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white flex-shrink-0">
              {coverSrc ? (
                <img src={coverSrc} alt={playlist.name} className="w-full h-full object-cover" />
              ) : (
                <ListMusic className="w-7 h-7" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">{playlist.name}</DialogTitle>
              <DialogDescription className="truncate">
                {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
                {playlist.description ? ` • ${playlist.description}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {tracks.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <ListMusic className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No songs in this playlist yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {tracks.map((t) => (
              <MusicTrackCard key={t.id} track={t} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}