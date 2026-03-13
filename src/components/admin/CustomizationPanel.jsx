import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Check, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function Section({ title, type, items, onUpload, onSetActive, onDelete, uploading, activeItem }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-slate-300" />
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-slate-300 text-sm" htmlFor={`file-${type}`}>Upload</Label>
          <Input id={`file-${type}`} type="file" accept="image/*" className="bg-slate-700 border-slate-600 max-w-xs" onChange={(e) => onUpload(e.target.files?.[0] || null)} />
          <Button disabled={uploading} className="bg-blue-600" onClick={() => document.getElementById(`file-${type}`)?.click()}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choose File'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <p className="text-slate-300 text-sm mb-2">Active</p>
          <div className="aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
            {activeItem ? (
              <img src={activeItem.image} alt="Active" className="w-full h-full object-cover" />
            ) : (
              <p className="text-slate-500 text-sm">None active</p>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="text-slate-300 text-sm mb-2">Uploaded ({items.length})</p>
          {items.length === 0 ? (
            <div className="text-slate-500 text-sm p-4 bg-slate-900 rounded-xl border border-slate-700">No uploads yet</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((it) => (
                <div key={it.id} className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                  <div className="aspect-video">
                    <img src={it.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <Button size="sm" className={it.is_active ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'} onClick={() => onSetActive(it)}>
                      <Check className="w-4 h-4 mr-1" /> {it.is_active ? 'Active' : 'Set Active'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => onDelete(it)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="px-2 pb-2 text-[11px] text-slate-400">{new Date(it.created_date || it.uploaded_at || Date.now()).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomizationPanel() {
  const [loadingItems, setLoadingItems] = useState([]);
  const [bgItems, setBgItems] = useState([]);
  const [uploadingType, setUploadingType] = useState(null);

  const refresh = async () => {
    try {
      const all = await base44.entities.AppCustomization.list('-created_date');
      const ls = all.filter(x => x.type === 'loading_screen');
      const bg = all.filter(x => x.type === 'background');
      const sortBy = (arr) => arr.sort((a,b) => new Date(b.created_date || b.uploaded_at || 0) - new Date(a.created_date || a.uploaded_at || 0));
      setLoadingItems(sortBy(ls));
      setBgItems(sortBy(bg));
    } catch (e) {
      console.error('Failed loading customization', e);
    }
  };

  useEffect(() => {
    refresh();
    const unsub = base44.entities.AppCustomization.subscribe((evt) => {
      if (['create','update','delete'].includes(evt.type)) refresh();
    });
    return unsub;
  }, []);

  const handleUpload = async (file, type) => {
    if (!file) return;
    setUploadingType(type);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const rec = await base44.entities.AppCustomization.create({
        type,
        image: file_url,
        is_active: false,
        uploaded_at: new Date().toISOString()
      });
      toast.success('Uploaded');
      if (type === 'loading_screen') setLoadingItems((prev) => [rec, ...prev]);
      else setBgItems((prev) => [rec, ...prev]);
    } catch (e) {
      toast.error('Upload failed');
    }
    setUploadingType(null);
  };

  const setActive = async (item) => {
    try {
      const type = item.type;
      const list = type === 'loading_screen' ? loadingItems : bgItems;
      const currentlyActive = list.filter(x => x.is_active && x.id !== item.id);
      // deactivate others
      await Promise.all(currentlyActive.map(x => base44.entities.AppCustomization.update(x.id, { is_active: false })));
      // activate selected
      const updated = await base44.entities.AppCustomization.update(item.id, { is_active: true });
      toast.success('Set active');
      if (type === 'loading_screen') setLoadingItems(list.map(x => x.id === item.id ? updated : { ...x, is_active: false }));
      else setBgItems(list.map(x => x.id === item.id ? updated : { ...x, is_active: false }));
    } catch (e) {
      toast.error('Failed to set active');
    }
  };

  const deleteItem = async (item) => {
    try {
      await base44.entities.AppCustomization.delete(item.id);
      if (item.type === 'loading_screen') setLoadingItems(prev => prev.filter(x => x.id !== item.id));
      else setBgItems(prev => prev.filter(x => x.id !== item.id));
      toast.success('Deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const activeLoading = loadingItems.find(x => x.is_active);
  const activeBg = bgItems.find(x => x.is_active);

  return (
    <div className="space-y-6">
      <Section
        title="Loading Screen"
        type="loading_screen"
        items={loadingItems}
        activeItem={activeLoading}
        onUpload={(file) => handleUpload(file, 'loading_screen')}
        onSetActive={setActive}
        onDelete={deleteItem}
        uploading={uploadingType === 'loading_screen'}
      />
      <Section
        title="Background"
        type="background"
        items={bgItems}
        activeItem={activeBg}
        onUpload={(file) => handleUpload(file, 'background')}
        onSetActive={setActive}
        onDelete={deleteItem}
        uploading={uploadingType === 'background'}
      />
    </div>
  );
}