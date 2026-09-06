interface HttpPostMessage {
  type: 'HTTP_POST_FORM';
  url: string;
  data: string;
  headers: Record<string, string>;
}

interface OpenTabMessage {
  type: 'OPEN_TAB';
  url: string;
  active: boolean;
}

type ServiceWorkerMessage = HttpPostMessage | OpenTabMessage;

interface ServiceWorkerResponse {
  ok: boolean;
  status?: number;
  responseText?: string;
  error?: string;
}

chrome.runtime.onMessage.addListener(
  (
    message: ServiceWorkerMessage,
    _sender,
    sendResponse: (response: ServiceWorkerResponse) => void,
  ) => {
    if (message.type === 'OPEN_TAB') {
      void chrome.tabs
        .create({ url: message.url, active: message.active })
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) => {
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      return true;
    }

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
        const meta = (await res.json()) as { stamp?: string };
        if (!meta.stamp || meta.stamp === lastStamp) return;

        if (lastStamp) {
          console.info(
            '[cc2l] Extension rebuilt — reload this extension, then refresh chess.com',
          );
        }

        lastStamp = meta.stamp;
      } catch {
        // build-meta not ready yet
      }
    })();
  }, 1000);
}
