import {
  Zap, PawPrint, BarChart3, Trophy, ClipboardList, Sparkles, Compass,
  Music2, Ticket, StickyNote, Star, ListChecks, CalendarRange, RotateCw,
  Megaphone, Heart, Target, Gem,
} from 'lucide-react';

/**
 * Single source of truth for the Home widget system.
 *
 * `id` is the stable value stored in the profile's widgetConfig — never rename
 * one, because saved layouts refer to it. Adding a widget means adding an entry
 * here (plus a case in Dashboard's renderer); removing one is safe, since saved
 * ids that no longer exist are dropped on load.
 */
export const WIDGET_REGISTRY = [
  // The original dashboard widgets — always available, on by default.
  { id: 'xp', name: 'XP Progress', description: 'Your experience progress bar', Icon: Zap },
  { id: 'pet', name: 'Equipped Pet', description: 'Your current companion and theme', Icon: PawPrint },
  { id: 'stats', name: 'Quick Stats', description: 'XP, pets, and completed quests', Icon: BarChart3 },
  { id: 'leaderboard', name: 'Mini Leaderboard', description: 'Top 3 students', Icon: Trophy },
  { id: 'assignments', name: 'Recent Quests', description: 'Your latest assignments', Icon: ClipboardList },
  { id: 'season', name: 'Season Progress', description: 'Current season status', Icon: Sparkles },
  { id: 'nav', name: 'Quick Navigation', description: 'Navigation cards', Icon: Compass },

  // Optional widgets — off until a student adds them.
  { id: 'musicPlayer', name: 'Mini Music Player', description: 'What is playing right now, on Home', Icon: Music2, isNew: true },
  { id: 'eventTicket', name: 'Event Ticket', description: 'Live event with a countdown', Icon: Ticket, isNew: true },
  { id: 'petSpotlight', name: 'Pet Spotlight', description: 'Your equipped pet and title', Icon: Star, isNew: true },
  { id: 'rewardGoal', name: 'Pick Your Next Reward', description: 'Follow one reward you are working toward', Icon: Target, isNew: true },
  { id: 'stickyNote', name: 'Sticky Note', description: 'A private note just for you', Icon: StickyNote, isNew: true },
  { id: 'collectionNew', name: 'New in Your Collection', description: 'Recently earned pets, titles and songs', Icon: Gem, isNew: true },
  { id: 'nextQuest', name: 'What Should I Do First?', description: 'One quest to do next', Icon: ListChecks, isNew: true },
  { id: 'weekWrapped', name: 'Week Wrapped', description: 'A quick recap of your week', Icon: CalendarRange, isNew: true },
  { id: 'wheelWindow', name: 'Wheel Window', description: 'The wheel live right now', Icon: RotateCw, isNew: true },
  { id: 'bulletin', name: 'School Bulletin', description: 'Announcements from your school', Icon: Megaphone, isNew: true },
  { id: 'wishlist', name: 'Collection Wishlist', description: 'Up to three items you are after', Icon: Heart, isNew: true },
];

/** The layout every account starts from (the original seven widgets). */
export const LEGACY_DEFAULT_WIDGETS = ['xp', 'pet', 'stats', 'leaderboard', 'assignments', 'season', 'nav'];

export const ALL_WIDGET_IDS = WIDGET_REGISTRY.map((w) => w.id);

const BY_ID = WIDGET_REGISTRY.reduce((acc, w) => {
  acc[w.id] = w;
  return acc;
}, {});

export function getWidgetInfo(id) {
  return BY_ID[id] || null;
}

/**
 * Keep only ids this build still ships, in their saved order and without
 * duplicates. Returns null when the stored value is not a usable array, so a
 * corrupt/absent config falls back to the default layout rather than blanking
 * the dashboard.
 */
export function sanitizeWidgetConfig(ids) {
  if (!Array.isArray(ids)) return null;
  const seen = new Set();
  const clean = [];
  ids.forEach((id) => {
    if (BY_ID[id] && !seen.has(id)) {
      seen.add(id);
      clean.push(id);
    }
  });
  return clean;
}

/**
 * The widget list to render for a stored config: valid saved ids in order, else
 * the original layout. New optional widgets are never switched on implicitly.
 */
export function getActiveWidgetIds(savedIds) {
  const clean = sanitizeWidgetConfig(savedIds);
  if (clean && clean.length > 0) return clean;
  return [...LEGACY_DEFAULT_WIDGETS];
}