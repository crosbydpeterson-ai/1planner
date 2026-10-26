import { base44 } from '@/api/base44Client';

/**
 * Byte's in-app answers, without platform agent conversations.
 *
 * The app is open to visitors and students sign in with a PIN profile, so the
 * person chatting is not a signed-in platform user — and a platform agent
 * conversation can only be created for one. Byte therefore answers through the
 * platform LLM call, which works for every visitor, and the whole conversation is
 * stored as this app's own messages. Anything that needs an account change goes
 * to a human admin through the "Talk to an admin" handoff.
 */

const BYTE_RULES = `You are Byte, the friendly in-app helper for 1planner, a school quest planner where students earn XP for finishing assignments, spend quest coins in the shop, and collect pets, themes and titles.

How to reply:
- Plain text only, 1-4 short sentences. Friendly, calm, a little fun. No headings, no numbered lists unless a list is genuinely clearer.
- Answer what was asked and stop. Never invent a feature, a reward, a number or a date.

What you can help with:
- How the app works: XP and levelling, quest coins, gems, quests/assignments, pets and themes, the rewards collection, 1Pass (the season pass), Season Book, events, the leaderboard, the shop, the kitchen, the marketplace, games, the community wall, music, and updates.
- Explaining what a screen or button does and how to find it.
- Their own read-only stats, which are given to you below.

What you cannot do:
- You cannot change an account. No adding XP, coins or gems, no unlocking or equipping pets, themes or titles, no hatching eggs, no fixing a missing purchase, no bans or unlocks.
- If they need any of that fixed, or ask for a real person, or you are unsure: give one short line telling them to tap "Talk to an admin" — that sends this chat to the app's support admins, who answer right here. Then stop.
- Never say you have done something you cannot do, and never promise an outcome.
- Never help with homework or school subjects; offer to help them keep it organised in the planner instead.`;

export const BYTE_HISTORY_LIMIT = 12;

/** Recent back-and-forth as plain lines the model can read. */
export function byteHistory(messages = [], limit = BYTE_HISTORY_LIMIT) {
  return (messages || [])
    .filter((m) => (m?.sender === 'student' || m?.sender === 'bot') && m.text)
    .slice(-limit)
    .map((m) => `${m.sender === 'student' ? 'Student' : 'Byte'}: ${String(m.text).trim()}`);
}

/** The student's own read-only stats, so Byte can answer simple account questions. */
export function studentContext(profile) {
  if (!profile) return 'The student\'s stats are not available.';
  const bits = [
    `username ${profile.username || 'unknown'}`,
    `${Number(profile.xp || 0)} XP`,
    `${Number(profile.seasonXp || 0)} season XP`,
    `${Number(profile.questCoins || 0)} quest coins`,
    `${Number(profile.gems || 0)} gems`,
    `${(profile.unlockedPets || []).length} pets unlocked`,
    `${(profile.unlockedThemes || []).length} themes unlocked`,
    `1Pass Plus: ${profile.has1PassPlus ? 'yes' : 'no'}`,
  ];
  return `The student's own read-only stats: ${bits.join(', ')}.`;
}

export function buildBytePrompt({ profile, history, question }) {
  return [
    BYTE_RULES,
    studentContext(profile),
    history?.length ? `Conversation so far:\n${history.join('\n')}` : '',
    `Student: ${String(question || '').trim()}`,
    'Reply as Byte:',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** One answer from Byte. Throws on failure so the caller can tell the student. */
export async function askByte({ profile, history, question }) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: buildBytePrompt({ profile, history, question }),
  });
  const text = String(res || '').trim();
  if (!text) throw new Error('Byte returned an empty answer');
  return text;
}