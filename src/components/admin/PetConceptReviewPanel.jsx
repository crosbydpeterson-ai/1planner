import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function PetConceptReviewPanel({ customPets, setCustomPets, customThemes, setCustomThemes }) {
  const [loading, setLoading] = useState(true);
  const [concepts, setConcepts] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { loadConcepts(); }, [filter]);

  const loadConcepts = async () => {
    setLoading(true);
    const list = filter === 'all'
      ? await base44.entities.PetConcept.list('-created_date', 50)
      : await base44.entities.PetConcept.filter({ status: filter }, '-created_date', 50);
    setConcepts(list);
    setLoading(false);
  };

  const handleApprove = async (concept) => {
    // Create the actual CustomPet from the concept
    const pet = await base44.entities.CustomPet.create({
      name: concept.name,
      description: concept.description,
      emoji: concept.emoji || '',
      imageUrl: concept.imageUrl || '',
      rarity: concept.rarity || 'uncommon',
      xpRequired: 999999,
      isGiftOnly: true,
      theme: concept.theme || { primary: '#6366f1', secondary: '#a5b4fc', accent: '#f59e0b', bg: '#f0f9ff' },
      createdBy: concept.submittedByProfileId,
      createdByProfileId: concept.submittedByProfileId,
      createdSourceTab: 'pet_creator',
      imageSource: concept.imageSource || 'uploaded',
    });

    // Create matching theme
    const theme = await base44.entities.CustomTheme.create({
      name: concept.name,
      rarity: concept.rarity || 'uncommon',
      xpRequired: 0,
      description: `Theme from ${concept.name}`,
      primaryColor: concept.theme?.primary || '#6366f1',
      secondaryColor: concept.theme?.secondary || '#a5b4fc',
      accentColor: concept.theme?.accent || '#f59e0b',
      bgColor: concept.theme?.bg || '#f0f9ff',
    });

    // Update concept status
    await base44.entities.PetConcept.update(concept.id, { status: 'approved', createdPetId: pet.id });

    // Gift the pet + theme to the submitter
    const profiles = await base44.entities.UserProfile.filter({ id: concept.submittedByProfileId });
    if (profiles.length > 0) {
      const p = profiles[0];
      const petId = `custom_${pet.id}`;
      const themeId = `custom_${theme.id}`;
      const up = [...(p.unlockedPets || [])];
      const ut = [...(p.unlockedThemes || [])];
      if (!up.includes(petId)) up.push(petId);
      if (!ut.includes(themeId)) ut.push(themeId);
      await base44.entities.UserProfile.update(p.id, { unlockedPets: up, unlockedThemes: ut });
    }

    if (customPets && setCustomPets) setCustomPets(prev => [pet, ...prev]);
    if (customThemes && setCustomThemes) setCustomThemes(prev => [theme, ...prev]);
    setConcepts(prev => prev.map(c => c.id === concept.id ? { ...c, status: 'approved', createdPetId: pet.id } : c));
    toast.success(`"${concept.name}" approved and gifted to ${concept.submittedByUsername}!`);
  };

  const handleReject = async (concept, note) => {
    await base44.entities.PetConcept.update(concept.id, { status: 'rejected', adminNote: note || 'Not approved' });
    setConcepts(prev => prev.map(c => c.id === concept.id ? { ...c, status: 'rejected' } : c));
    toast.success('Concept rejected');
  };

  const handleDelete = async (id) => {
    await base44.entities.PetConcept.delete(id);
    setConcepts(prev => prev.filter(c => c.id !== id));
    toast.success('Concept deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-white font-semibold">Pet Concept Submissions</h3>
        <div className="flex gap-1 ml-auto">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={`h-7 text-xs ${filter === f ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /></div>
      ) : concepts.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">No {filter} concepts</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {concepts.map(concept => (
            <ConceptCard key={concept.id} concept={concept} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConceptCard({ concept, onApprove, onReject, onDelete }) {
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  return (
    <div className="bg-slate-700/60 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        {concept.imageUrl ? (
          <img src={concept.imageUrl} alt={concept.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-slate-600 flex items-center justify-center text-2xl shrink-0">{concept.emoji || '🐾'}</div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-semibold text-sm">{concept.name}</h4>
          <p className="text-slate-400 text-xs">{concept.description}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
            <span>by {concept.submittedByUsername}</span>
            <span>•</span>
            <span>{moment(concept.created_date).format('MM/DD h:mm A')}</span>
            <span>•</span>
            <span className="capitalize">{concept.rarity}</span>
            <span>•</span>
            <span>{concept.imageSource === 'ai_generated' ? '🤖 AI' : '📁 Upload'}</span>
          </div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${concept.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : concept.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{concept.status}</span>
      </div>

      {/* Theme colors preview */}
      {concept.theme && (
        <div className="flex gap-1">
          {['primary', 'secondary', 'accent', 'bg'].map(k => (
            <div key={k} className="w-6 h-6 rounded" style={{ backgroundColor: concept.theme[k] }} title={k} />
          ))}
        </div>
      )}

      {concept.status === 'pending' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onApprove(concept)} className="bg-emerald-600 h-7 text-xs flex-1">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & Gift
          </Button>
          {!showReject ? (
            <Button size="sm" variant="outline" onClick={() => setShowReject(true)} className="border-red-500/50 text-red-400 h-7 text-xs">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
          ) : (
            <div className="flex gap-1 flex-1">
              <Input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason..." className="bg-slate-600 border-slate-500 text-white h-7 text-xs" />
              <Button size="sm" onClick={() => { onReject(concept, rejectNote); setShowReject(false); }} className="bg-red-600 h-7 text-xs">Send</Button>
            </div>
          )}
        </div>
      )}

      <Button size="sm" variant="ghost" onClick={() => onDelete(concept.id)} className="text-red-400 hover:text-red-300 h-6 text-xs w-full">
        <Trash2 className="w-3 h-3 mr-1" /> Delete
      </Button>
    </div>
  );
}