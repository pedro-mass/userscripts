declare const __CT_MIRROR_VERSION__: string;

/** Build-time version from package.json (vite define). */
export function scriptVersion(): string {
  try {
    if (typeof __CT_MIRROR_VERSION__ === 'string' && __CT_MIRROR_VERSION__) {
      return __CT_MIRROR_VERSION__;
    }
  } catch {
    /* bundled */
  }
  try {
    const v = GM_info?.script?.version;
    if (v) return String(v);
  } catch {
    /* no GM */
  }
  return 'unknown';
}
