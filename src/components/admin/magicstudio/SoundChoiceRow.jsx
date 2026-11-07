import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Volume2, Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CUSTOM_SOUND } from '@/lib/scanSound';

const fileName = (url) => {
  try {
    return decodeURIComponent(url.split('/').pop() || 'Uploaded sound').slice(0, 24);
  } catch {
    return 'Uploaded sound';
  }
};

// One sound group: tap a built-in chime to hear it, or upload your own file.
// Uploads are stored publicly — anyone with the link can open them — because the
// login screen plays them before an account is chosen.
export default function SoundChoiceRow({ label, hint, sounds, value, url, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      const fileUrl = res?.file_url || res?.data?.file_url;
      if (!fileUrl) throw new Error('no file url returned');
      onChange({ sound: CUSTOM_SOUND, url: fileUrl });
    } catch (e) {
      console.error('Sound upload failed:', e);
      toast.error('That sound could not be uploaded');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? 'Uploading' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="audio/*" onChange={upload} className="hidden" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {sounds.map((sound) => {
          const active = !url && sound.id === value;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => onChange({ sound: sound.id, url: '' })}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {active && <Volume2 className="w-3 h-3" />}
              {sound.label}
            </button>
          );
        })}

        {url && (
          <button
            type="button"
            onClick={() => {
              onChange({ sound: value || CUSTOM_SOUND, url });
            }}
            className="flex items-center gap-1 rounded-full border border-violet-400 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700"
          >
            <Volume2 className="w-3 h-3" />
            {fileName(url)}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange({ sound: '', url: '' });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onChange({ sound: '', url: '' });
                }
              }}
              className="ml-0.5 rounded-full p-0.5 hover:bg-violet-200"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        )}
      </div>

      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}