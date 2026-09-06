import { setPlatform } from '../src/platform/context';
import { STORAGE_KEY } from '../src/storage';
import type { Platform } from '../src/platform/types';

let storageCache: Record<string, string> = {};

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
        void chrome.storage.local.set({ [key]: value });
      },
    },
    http: {
      postForm(url, data, headers) {
        return chrome.runtime
          .sendMessage({ type: 'HTTP_POST_FORM', url, data, headers })
          .then((response: { ok: boolean; status?: number; responseText?: string; error?: string }) => {
            if (!response?.ok) {
              throw new Error(response?.error ?? 'Extension HTTP request failed');
            }
            return {
              status: response.status ?? 0,
              responseText: response.responseText ?? '',
            };
          });
      },
    },
    tabs: {
      open(url, active = true) {
        void chrome.tabs.create({ url, active });
      },
    },
  };

  setPlatform(platform);
}
