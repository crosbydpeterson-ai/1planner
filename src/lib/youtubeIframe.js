// Shared, one-time loader for the YouTube IFrame API.
//
// The script is injected once no matter how many components ask for it, and
// every caller awaits the same promise instead of polling for window.YT on a
// timer. A failed or timed-out load is reported to the caller (which shows a
// retryable message) and the promise is dropped so a later attempt can start a
// fresh load — there is no background retry loop.

const TIMEOUT_MS = 15000;
const SCRIPT_SELECTOR = 'script[src*="youtube.com/iframe_api"]';

let apiPromise = null;

export function loadYouTubeIframeApi() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('The YouTube player needs a browser'));
  }
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (ok && window.YT && window.YT.Player) {
        resolve(window.YT);
      } else {
        apiPromise = null; // let a later attempt try again
        reject(new Error('The YouTube player did not load'));
      }
    };

    // The API calls this global exactly once, when the script has executed.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') {
        try { previous(); } catch (e) { /* another listener failed — ignore */ }
      }
      finish(true);
    };

    if (!document.querySelector(SCRIPT_SELECTOR)) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }

    timer = setTimeout(() => finish(false), TIMEOUT_MS);
  });

  return apiPromise;
}