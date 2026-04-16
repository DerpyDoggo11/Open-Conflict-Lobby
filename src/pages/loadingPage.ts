import { attachUISounds } from '../misc/attachSounds.js';
import { SERVER_HTTP_URL } from '../misc/serverConfig.js';
import type { NavigateFn } from '../types.js';

const PING_INTERVAL_MS = 3_000;
const PING_TIMEOUT_MS  = 5_000;

async function pingServer(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(`${SERVER_HTTP_URL}/lobby-rooms`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

export function createLoadingPage(navigate: NavigateFn): HTMLElement {
  const page = document.createElement('div');
  page.className = 'page page--loading';
  page.id = 'page-loading';

  const labelWrap = document.createElement('div');
  labelWrap.className = 'loading__label-wrap';

  const statusText = document.createElement('div');
  statusText.className = 'loading__status';
  statusText.textContent = 'Loading';

  const dots = document.createElement('span');
  dots.className = 'loading__dots';
  dots.textContent = '';
  statusText.appendChild(dots);

  const subText = document.createElement('div');
  subText.className = 'loading__substatus';
  subText.textContent = 'Server may take up to 30s to boot';

  labelWrap.appendChild(statusText);
  labelWrap.appendChild(subText);
  page.appendChild(labelWrap);

  const imageWrap = document.createElement('div');
  imageWrap.className = 'loading__image-wrap';

  const img = new Image();
  img.className = 'loading__image';
  img.alt = '';
  img.src = '/assets/images/oc2.png';
  imageWrap.appendChild(img);

  page.appendChild(imageWrap);

  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let dotTimer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let dotCount = 0;

  dotTimer = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    dots.textContent = '.'.repeat(dotCount);
  }, 500);

  async function doPing() {
    if (disposed) return;
    const alive = await pingServer();
    if (disposed) return;

    if (alive) {
      cleanup();
      navigate('home');
    }
  }

  function cleanup() {
    disposed = true;
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    if (dotTimer)  { clearInterval(dotTimer);  dotTimer = null;  }
  }

  doPing();
  pingTimer = setInterval(doPing, PING_INTERVAL_MS);

  const observer = new MutationObserver(() => {
    if (!document.contains(page)) {
      cleanup();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  attachUISounds(page);

  return page;
}