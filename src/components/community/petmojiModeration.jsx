// Blocked words/patterns for kid-safe petmoji content
const BLOCKED_PATTERNS = [
  /middle\s*finger/i, /flip\s*(off|the\s*bird)/i, /flipping\s*off/i,
  /naked/i, /nude/i, /nsfw/i, /sex/i, /porn/i, /erotic/i,
  /kill/i, /murder/i, /blood/i, /gore/i, /dead\s*body/i, /suicide/i,
  /gun\b/i, /shoot/i, /stab/i, /knife\s*attack/i, /weapon/i,
  /drug/i, /weed/i, /cocaine/i, /meth/i, /alcohol/i, /drunk/i, /beer/i, /wine/i,
  /swear/i, /cuss/i, /profan/i,
  /f+u+c+k/i, /s+h+i+t/i, /b+i+t+c+h/i, /a+s+s+h+o+l+e/i, /d+a+m+n/i, /h+e+l+l\b/i,
  /butt\s*(naked|hole)/i, /poop/i, /pee\s*(ing|on)/i,
  /racist/i, /hate/i, /slur/i,
  /scary/i, /horror/i, /demon/i, /devil/i, /satan/i,
  /vomit/i, /puke/i, /barf/i,
  /twerk/i, /stripper/i, /lap\s*dance/i,
  /rude\s*gesture/i, /obscene/i, /vulgar/i, /offensive/i,
  /inappropriate/i,
];

export function checkContentSafe(text) {
  if (!text) return { safe: true };
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'Your description contains content that isn\'t kid-friendly. Please try something cute and positive!' };
    }
  }
  return { safe: true };
}

// Build a safe prompt suffix to enforce kid-friendly output
export const SAFE_PROMPT_SUFFIX = ' IMPORTANT: This MUST be 100% kid-friendly, cute, wholesome, and appropriate for children. No rude gestures, no middle fingers, no inappropriate content whatsoever. Keep it adorable and positive.';