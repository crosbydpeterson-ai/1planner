import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Square, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const EVENT_TYPES = [
  {
    type: 'bubble_pop',
    emoji: '🫧',
    name: 'Bubble Pop',
    description: 'Students pop colorful bubbles for a chance to win Magic Eggs!',
    defaultConfig: { bubbleCount: 15, eggChance: 10 },
  },
  {
    type: 'balloon_pop',
    emoji: '🎈',
    name: 'Balloon Pop',
    description: 'Students shoot darts to pop floating balloons and win Magic Eggs!',
    defaultConfig: { bubbleCount: 12, eggChance: 10 },
  },
  {
    type: 'fusion_lab',
    emoji: '🧪',
    name: 'Fusion Lab',
    description: 'Students pick 2 of their pets to fuse into a brand new Legendary pet!',
    defaultConfig: {},
  },
  {
    type: 'pet_food',
    emoji: '🍽️',
    name: 'Pet Food Kitchen',
    description: 'Students feed food items to their pets to create new food-themed Legendary pets!',
    defaultConfig: {},
  },
];

export default function AdminEventsPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.AdminEvent.list('-created_date');
      setEvents(all);
    } catch (e) {
      toast.error('Failed to load events');
    }
    setLoading(false);
  };

  const getEventByType = (type) => events.find(e => e.type === type);
  const activeEvent = events.find(e => e.isActive);

  const activateEvent = async (eventType) => {
    setActivating(eventType.type);
    try {
      // Deactivate ALL active events first
      const actives = events.filter(e => e.isActive);
      await Promise.all(actives.map(ev =>
        base44.entities.AdminEvent.update(ev.id, { isActive: false, endTime: new Date().toISOString() })
      ));

      const now = new Date().toISOString();
      const existing = getEventByType(eventType.type);

      if (existing) {
        await base44.entities.AdminEvent.update(existing.id, {
          isActive: true,
          startTime: now,
          endTime: null,
        });
        setEvents(prev => prev.map(e => ({
          ...e,
          isActive: e.id === existing.id,
          startTime: e.id === existing.id ? now : e.startTime,
        })));
      } else {
        const newEv = await base44.entities.AdminEvent.create({
          name: eventType.name,
          type: eventType.type,
          isActive: true,
          startTime: now,
          config: eventType.defaultConfig,
        });
        setEvents(prev => [...prev.map(e => ({ ...e, isActive: false })), newEv]);
      }
      toast.success(`🎉 ${eventType.name} is now LIVE for all students!`);
    } catch (e) {
      toast.error('Failed to activate: ' + e.message);
    }
    setActivating(null);
  };

  const deactivateEvent = async (ev) => {
    setActivating(ev.type);
    try {
      await base44.entities.AdminEvent.update(ev.id, {
        isActive: false,
        endTime: new Date().toISOString(),
      });
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, isActive: false } : e));
      toast.success('Event stopped');
    } catch (e) {
      toast.error('Failed: ' + e.message);
    }
    setActivating(null);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Pop-Up Events</h3>
        <Button size="sm" variant="ghost" onClick={loadEvents} className="text-slate-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {activeEvent && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          <span className="text-green-400 font-semibold text-sm">LIVE NOW:</span>
          <span className="text-white text-sm">{EVENT_TYPES.find(t => t.type === activeEvent.type)?.emoji} {activeEvent.name}</span>
          <span className="text-green-300/60 text-xs ml-auto">All online students see this popup</span>
        </div>
      )}

      {EVENT_TYPES.map(eventType => {
        const existing = getEventByType(eventType.type);
        const isActive = existing?.isActive;
        const isLoading = activating === eventType.type;

        return (
          <div key={eventType.type}
            className={`rounded-xl p-4 border transition-all ${isActive ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl flex-shrink-0">{eventType.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-white font-semibold">{eventType.name}</h4>
                    {isActive
                      ? <Badge className="bg-green-500 text-white text-xs">🟢 LIVE</Badge>
                      : <Badge className="bg-slate-600 text-slate-300 text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{eventType.description}</p>
                  {existing?.startTime && isActive && (
                    <p className="text-green-400 text-xs mt-0.5">
                      Started: {new Date(existing.startTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {isActive ? (
                  <Button size="sm" onClick={() => deactivateEvent(existing)} disabled={!!activating}
                    className="bg-red-600 hover:bg-red-500">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Square className="w-3 h-3 mr-1" />Stop</>}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => activateEvent(eventType)} disabled={!!activating}
                    className="bg-green-600 hover:bg-green-500">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-3 h-3 mr-1" />Go Live</>}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}