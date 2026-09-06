/** True for userscript; false after extension reload invalidates the content-script context. */
export function isExtensionContextAlive(): boolean {
  if (typeof chrome === 'undefined' || !chrome.runtime) return true;
  try {
    void chrome.runtime.id;
    return true;
  } catch {
    return false;
  }
}

export function extensionErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('Extension context invalidated')) {
    return 'Extension was reloaded — refresh this page and try again';
  }
  if (message.includes('Receiving end does not exist')) {
    return 'Extension service worker unavailable — refresh this page and try again';
  }
  return message;
}
