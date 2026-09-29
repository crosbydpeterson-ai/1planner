import { useState, useEffect } from 'react';
import { musicPlayer } from '@/lib/musicPlayerStore';

export function useMusicPlayer() {
  const [state, setState] = useState(musicPlayer.getState());
  useEffect(() => musicPlayer.subscribe(setState), []);
  return state;
}