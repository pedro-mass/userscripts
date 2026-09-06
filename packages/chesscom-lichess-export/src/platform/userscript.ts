import {
  GM_getValue,
  GM_openInTab,
  GM_setValue,
  GM_xmlhttpRequest,
} from '$';
import type { Platform } from './types';

export const userscriptPlatform: Platform = {
  storage: {
    get(key, defaultValue) {
      return GM_getValue(key, defaultValue);
    },
    set(key, value) {
      GM_setValue(key, value);
    },
  },
  http: {
    postForm(url, data, headers) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'POST',
          url,
          headers,
          data,
          onload(response) {
            resolve({
              status: response.status,
              responseText: response.responseText,
            });
          },
          onerror() {
            reject(new Error('Network error'));
          },
        });
      });
    },
  },
  tabs: {
    open(url, active = true) {
      GM_openInTab(url, { active, insert: true });
    },
  },
};
