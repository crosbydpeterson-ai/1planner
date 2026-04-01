// Content moderation utilities - keyword filtering + AI mod
import { base44 } from '@/api/base44Client';

// Default blocked words (hardcoded fallback)
const DEFAULT_BLOCKED = [
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell',
  'kill', 'murder', 'blood', 'gore', 'suicide',
  'gun', 'shoot', 'stab', 'weapon',
  'drug', 'weed', 'cocaine', 'meth',
  'porn', 'sex', 'nude', 'naked', 'nsfw',
  'racist', 'slur', 'hate',
  'middle finger', 'flip off',
];

let cachedSettings = null;

export async function loadModSettings() {
  try {
    const settings = await base44.entities.AppSetting.list();
    const modSetting = settings.find(s => s.key === 'community_moderation');
    if (modSetting) {
      cachedSettings = modSetting.value;
      return cachedSettings;
    }
  } catch (e) {
    console.error('Failed to load mod settings', e);
  }
  return { keywords: DEFAULT_BLOCKED, aiModEnabled: false };
}

export function getModSettings() {
  return cachedSettings || { keywords: DEFAULT_BLOCKED, aiModEnabled: false };
}

export function checkKeywordFilter(text) {
  if (!text) return { safe: true };
  const settings = getModSettings();
  const keywords = settings.keywords || DEFAULT_BLOCKED;
  const lower = text.toLowerCase();
  
  for (const word of keywords) {
    if (!word) continue;
    // Match whole word or as part of compound
    const escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    if (regex.test(lower)) {
      return { safe: false, reason: `Your message contains a blocked word. Please keep it kid-friendly!`, word };
    }
  }
  return { safe: true };
}

export async function checkAIMod(text) {
  const settings = getModSettings();
  if (!settings.aiModEnabled) return { safe: true };
  
  const customInstructions = settings.aiCustomInstructions ? `\n\nAdditional admin instructions: ${settings.aiCustomInstructions}` : '';
  
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a kid-friendly content moderator for a school classroom app. Check if this message is appropriate for children ages 10-14. The message is: "${text}"
      
Rules: No profanity, bullying, violence, inappropriate content, personal info sharing, or mean-spirited content. Be strict but fair - normal kid conversation is fine.${customInstructions}

Respond with JSON only.`,
      response_json_schema: {
        type: "object",
        properties: {
          safe: { type: "boolean" },
          reason: { type: "string" }
        }
      }
    });
    return result;
  } catch (e) {
    console.error('AI mod check failed', e);
    return { safe: true }; // fail open
  }
}

export async function moderateContent(text) {
  // Step 1: keyword filter (instant)
  const keywordResult = checkKeywordFilter(text);
  if (!keywordResult.safe) return keywordResult;
  
  // Step 2: AI mod (if enabled)
  const aiResult = await checkAIMod(text);
  return aiResult;
}