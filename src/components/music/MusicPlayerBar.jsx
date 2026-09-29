import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, X, Volume2, VolumeX } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { musicPlayer, parseYouTubeId } from '@/lib/musicPlayerStore';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { useSignedUrl } from '@/hooks/useSignedUrl';

// Persistent player bar rendered once in Layout so audio survives route changes.
export default function MusicPlayerBar({ profile }) {
  const { track, isPlaying } = useMusicPlayer();
  const coverSrc = useSignedUrl(track?.coverImageUri);
  const audioRef = useRef(null);
  const ytRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const signedUrlRef = useRef(null);
  const lastLoggedTrackId = useRef(null);
  const [muted, setMuted] = useState(false);
  const [show, setShow] = useState(false);

  // Load YouTube IFrame API once.
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true; };
      document.body.appendChild(tag);
    } else {
      ytReadyRef.current = !!window.YT.Player;
    }
  }, []);

  const writeLog = async (action, t = track) => {
    if (!profile || !t) return;
    try {
      await base44.entities.MusicPlayLog.create({
        profileId: profile.id,
        username: profile.username,
        trackId: t.id,
        trackTitle: t.title,
        action,
        timestamp: new Date().toISOString(),
      });
    } catch (e) { /* logging is best-effort */ }
  };

  // React to track / play-state changes.
  useEffect(() => {
    if (!track) { setShow(false); return; }
    setShow(true);

    const ytId = track.sourceType === 'youtube' ? parseYouTubeId(track.youtubeUrl) : null;

    if (track.sourceType === 'upload') {
      // Pause YT if switching away from a youtube track
      try { ytPlayerRef.current?.pauseVideo(); } catch (_) {}
      (async () => {
        if (!signedUrlRef.current || signedUrlRef.current.uri !== track.audioFileUri) {
          try {
            const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: track.audioFileUri });
            signedUrlRef.current = { uri: track.audioFileUri, url: signed_url };
          } catch (e) { return; }
        }
        const audio = audioRef.current;
        if (audio) {
          audio.src = signedUrlRef.current.url;
          audio.muted = muted;
          if (isPlaying) audio.play().catch(() => musicPlayer.pause());
        }
      })();
      if (lastLoggedTrackId.current !== track.id) {
        writeLog('play');
        lastLoggedTrackId.current = track.id;
      }
    } else if (ytId) {
      // Pause upload audio if switching away
      const audio = audioRef.current;
      if (audio) { audio.pause(); }
      ensureYtPlayer(ytRef.current, ytId, isPlaying, muted, (state) => {
        if (state === 0) { // ended
          writeLog('complete');
          musicPlayer.setPlaying(false);
        }
      });
      if (lastLoggedTrackId.current !== track.id) {
        writeLog('play');
        lastLoggedTrackId.current = track.id;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // React to play/pause toggle.
  useEffect(() => {
    if (!track) return;
    if (track.sourceType === 'upload') {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) audio.play().catch(() => musicPlayer.pause());
      else audio.pause();
    } else if (track.sourceType === 'youtube') {
      try {
        if (isPlaying) ytPlayerRef.current?.playVideo();
        else ytPlayerRef.current?.pauseVideo();
      } catch (_) {}
    }
    if (isPlaying) {
      // resuming counts as a play log
      if (lastLoggedTrackId.current === track.id) {
        // already logged the initial play; only log resume if it was paused via UI
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
    try { ytPlayerRef.current?.setMuted ? ytPlayerRef.current.setMuted(muted) : null; } catch (_) {}
  }, [muted]);

  if (!show || !track) return null;

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ''; }
    try { ytPlayerRef.current?.stopVideo(); } catch (_) {}
    musicPlayer.stop();
    lastLoggedTrackId.current = null;
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3 pb-1 safe-area-pb pointer-events-none">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 flex items-center gap-3 p-2 pointer-events-auto">
        {coverSrc ? (
          <img src={coverSrc} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-lg flex-shrink-0">🎵</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{track.title}</p>
          <p className="text-[11px] text-slate-400 truncate">{track.sourceType === 'youtube' ? 'YouTube' : 'Uploaded'}</p>
        </div>
        <button
          onClick={() => musicPlayer.pause()}
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
          aria-label="Pause"
        >
          <Pause className="w-4 h-4" />
        </button>
        <button
          onClick={() => musicPlayer.resume()}
          className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700"
          aria-label="Play"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMuted(m => !m)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
          aria-label="Mute"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          onClick={handleStop}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* hidden media elements */}
      <audio
        ref={audioRef}
        onEnded={() => { writeLog('complete'); musicPlayer.setPlaying(false); }}
        className="hidden"
      />
      <div ref={ytRef} className="hidden" />
    </div>
  );

  function ensureYtPlayer(container, videoId, autoplay, muted, onStateChange) {
    if (!container) return;
    const make = () => {
      ytPlayerRef.current = new window.YT.Player(container, {
        videoId,
        playerVars: { autoplay: autoplay ? 1 : 0, controls: 0, modestbranding: 1 },
        events: {
          onReady: (e) => { if (autoplay) e.target.playVideo(); if (muted) e.target.mute(); },
          onStateChange: (e) => onStateChange?.(e.data),
        },
      });
    };
    if (window.YT && window.YT.Player) {
      if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
        try { ytPlayerRef.current.loadVideoById(videoId); if (autoplay) ytPlayerRef.current.playVideo(); } catch (_) {}
      } else {
        make();
      }
    } else {
      // wait for API
      const wait = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(wait);
          make();
        }
      }, 300);
    }
  }
}