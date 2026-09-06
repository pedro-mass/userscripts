interface HttpPostMessage {
  type: 'HTTP_POST_FORM';
  url: string;
  data: string;
  headers: Record<string, string>;
}

type ServiceWorkerMessage = HttpPostMessage;

interface HttpPostResponse {
  ok: boolean;
  status?: number;
  responseText?: string;
  error?: string;
}

chrome.runtime.onMessage.addListener(
  (
    message: ServiceWorkerMessage,
    _sender,
    sendResponse: (response: HttpPostResponse) => void,
  ) => {
    if (message.type !== 'HTTP_POST_FORM') return;

    void fetch(message.url, {
      method: 'POST',
      headers: message.headers,
      body: message.data,
    })
      .then(async (response) => {
        sendResponse({
          ok: true,
          status: response.status,
          responseText: await response.text(),
        });
      })
      .catch((err: unknown) => {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return true;
  },
);

if (import.meta.env.DEV) {
  let lastStamp = '';

  setInterval(() => {
    void (async () => {
      try {
        const res = await fetch(chrome.runtime.getURL('build-meta.json'));
        if (!res.ok) return;
        const meta = (await res.json()) as { stamp?: string; appChunk?: string };
        if (!meta.stamp || meta.stamp === lastStamp) return;

        if (lastStamp) {
          const tabs = await chrome.tabs.query({
            url: ['*://www.chess.com/*', '*://chess.com/*'],
          });
          for (const tab of tabs) {
            if (!tab.id) continue;
            void chrome.tabs
              .sendMessage(tab.id, {
                type: 'DEV_RELOAD',
                appChunk: meta.appChunk ?? 'app.js',
              })
              .catch(() => undefined);
          }
        }

        lastStamp = meta.stamp;
      } catch {
        // build-meta not ready yet
      }
    })();
  }, 1000);
}
