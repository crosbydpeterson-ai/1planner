/**
 * Remembers, per account, that a student dismissed the reward-code widget.
 *
 * The key is namespaced with the profile id on purpose: dismissing the widget
 * for one student must never hide it for another on the same device.
 */
const KEY_PREFIX = 'quest_reward_widget_dismissed:';

const keyFor = (profileId) => `${KEY_PREFIX}${profileId}`;

/**
 * True only when this exact account has dismissed the widget.
 * If storage is unavailable (private mode, disabled) we show the widget rather
 * than fail — the student can still dismiss it for the session.
 */
export function isRedeemWidgetDismissed(profileId) {
  if (!profileId) return false;
  try {
    return localStorage.getItem(keyFor(profileId)) === 'true';
  } catch (e) {
    console.warn('Reward widget dismissal could not be read:', e);
    return false;
  }
}

/**
 * Hide the widget for this account from now on. Never throws: if the choice
 * cannot be saved, the widget still hides for the current session.
 */
export function dismissRedeemWidget(profileId) {
  if (!profileId) return false;
  try {
    localStorage.setItem(keyFor(profileId), 'true');
    return true;
  } catch (e) {
    console.warn('Reward widget dismissal could not be saved:', e);
    return false;
  }
}