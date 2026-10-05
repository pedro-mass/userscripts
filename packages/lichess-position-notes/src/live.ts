import { replaceLiveNodeHit } from './db';
import { liveHitFromAnalysis } from './lichess';

let hooked = false;

export function installLiveCapture(): void {
  if (hooked) return;
  hooked = true;

  const OrigSend = WebSocket.prototype.send;
  WebSocket.prototype.send = function (
    data: string | ArrayBufferLike | Blob | ArrayBufferView,
  ) {
    if (typeof data === 'string' && data.includes('"setComment"')) {
      try {
        const msg = JSON.parse(data) as {
          t?: string;
          d?: { ch?: string; path?: string; text?: string };
        };
        if (msg.t === 'setComment' && msg.d?.text) {
          const hit = liveHitFromAnalysis(msg.d.text);
          if (hit) {
            hit.chapterId = msg.d.ch ?? hit.chapterId;
            hit.path = msg.d.path ?? hit.path;
            void replaceLiveNodeHit(hit).then(() => {
              window.dispatchEvent(new CustomEvent('lpn-db-changed'));
            });
          }
        }
      } catch {
        /* ignore */
      }
    }
    return OrigSend.call(this, data);
  };
}
