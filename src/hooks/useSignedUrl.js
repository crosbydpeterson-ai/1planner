import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Signed URLs for this app's private files, shared by every consumer.
 *
 * One module-level cache (and one in-flight map) means a file is signed once
 * even when a cover is shown in a grid, in the player bar and in a Home widget
 * at the same time, and the music player reuses the same cached URL for audio.
 * `invalidateSignedUrl` lets the player drop an expired URL and ask for a fresh
 * one — deliberately a single bounded retry, never a loop.
 */
const cache = new Map(); // file uri -> signed url
const inflight = new Map(); // file uri -> Promise<string>

export function getSignedUrl(fileUri) {
  if (!fileUri) return Promise.reject(new Error('No file uri'));
  if (cache.has(fileUri)) return Promise.resolve(cache.get(fileUri));
  const existing = inflight.get(fileUri);
  if (existing) return existing;

  const request = base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri })
    .then(({ signed_url }) => {
      inflight.delete(fileUri);
      cache.set(fileUri, signed_url);
      return signed_url;
    })
    .catch((err) => {
      inflight.delete(fileUri);
      throw err;
    });

  inflight.set(fileUri, request);
  return request;
}

/** Drop a cached URL so the next request signs the file again. */
export function invalidateSignedUrl(fileUri) {
  if (!fileUri) return;
  cache.delete(fileUri);
  inflight.delete(fileUri);
}

export function useSignedUrl(uri) {
  const [url, setUrl] = useState(() => (uri ? cache.get(uri) ?? null : null));

  useEffect(() => {
    if (!uri) { setUrl(null); return; }
    if (cache.has(uri)) { setUrl(cache.get(uri)); return; }
    let cancelled = false;
    getSignedUrl(uri)
      .then((signed) => { if (!cancelled) setUrl(signed); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [uri]);

  return url;
}