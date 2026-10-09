import { scriptVersion } from './version';

const NS = '[ct-mirror]';
const LOG_KEY = 'ctLichessMirror.recentLog';

type LogLevel = 'info' | 'warn' | 'debug';

export function isDebugEnabled(): boolean {
  try {
    if (localStorage.getItem('pamCtMirrorDebug') === '1') return true;
  } catch {
    /* private mode */
  }
  return GM_getValue<boolean>('ctLichessMirror.debug', false) === true;
}

function pushLog(entry: Record<string, unknown>): void {
  if (!isDebugEnabled()) return;
  const prev = GM_getValue<Record<string, unknown>[]>(LOG_KEY, []) ?? [];
  const next = [...prev, entry].slice(-40);
  GM_setValue(LOG_KEY, next);
}

export function mirrorLog(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
): void {
  const version = scriptVersion();
  const entry = { t: Date.now(), level, message, version, ...data };
  if (level === 'debug' && !isDebugEnabled()) return;
  const fn = level === 'warn' ? console.warn : console.info;
  fn(NS, `v${version}`, message, data ?? '');
  pushLog(entry);
}

export function readRecentLog(): Record<string, unknown>[] {
  return GM_getValue<Record<string, unknown>[]>(LOG_KEY, []) ?? [];
}
