import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Module-level cache so repeated renders of the same private file reuse one signed URL.
const cache = new Map();

export function useSignedUrl(uri) {
  const [url, setUrl] = useState(() => (uri ? cache.get(uri) ?? null : null));

  useEffect(() => {
    if (!uri) { setUrl(null); return; }
    if (cache.has(uri)) { setUrl(cache.get(uri)); return; }
    let cancelled = false;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri })
      .then(({ signed_url }) => {
        if (cancelled) return;
        cache.set(uri, signed_url);
        setUrl(signed_url);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [uri]);

  return url;
}