import { setPlatform } from '../src/platform/context';
import { isExtensionContextAlive } from '../src/platform/extension-alive';
import { STORAGE_KEY } from '../src/storage';
import type { Platform } from '../src/platform/types';

let storageCache: Record<string, string> = {};

async function sendServiceWorkerMessage<T>(message: unknown): Promise<T> {
  if (!isExtensionContextAlive()) {
    throw new Error('Extension context invalidated');
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage(message);
      if (response !== undefined) {
        return response as T;
      }
    } catch (err) {
      lastErr = err;
      if (!isExtensionContextAlive()) {
        throw err;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw lastErr ?? new Error('Extension service worker unavailable');
}

export async function initExtensionPlatform(): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  try {
    storageCache = JSON.parse((stored[STORAGE_KEY] as string) ?? '{}') as Record<
      string,
      string
    >;
  } catch {
    storageCache = {};
  }

  const platform: Platform = {
    storage: {
      get(key, defaultValue) {
        if (key === STORAGE_KEY) {
          return JSON.stringify(storageCache);
        }
        return defaultValue;
      },
      set(key, value) {
        if (key === STORAGE_KEY) {
          try {
            storageCache = JSON.parse(value) as Record<string, string>;
          } catch {
            storageCache = {};
          }
        }
        if (!isExtensionContextAlive()) return;
        void chrome.storage.local.set({ [key]: value });
      },
    },
    http: {
      async postForm(url, data, headers) {
        const response = await sendServiceWorkerMessage<{
          ok: boolean;
          status?: number;
          responseText?: string;
          error?: string;
        }>({ type: 'HTTP_POST_FORM', url, data, headers });

        if (!response.ok) {
          throw new Error(response.error ?? 'Extension HTTP request failed');
        }

        return {
          status: response.status ?? 0,
          responseText: response.responseText ?? '',
        };
      },
    },
    tabs: {
      open(url, active = true) {
        if (!isExtensionContextAlive()) {
          throw new Error('Extension context invalidated');
        }
        void chrome.tabs.create({ url, active });
      },
    },
  };

  setPlatform(platform);
}
