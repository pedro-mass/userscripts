import { deleteHitById, liveNodeId, replaceLiveNodeHit } from './db';
import { liveHitFromAnalysis, waitForAnalysis } from './lichess';

let wsHooked = false;
let studyHooked = false;

function notifyDbChanged(): void {
  window.dispatchEvent(new CustomEvent('lpn-db-changed'));
}

async function onSetComment(data: {
  ch?: string;
  path?: string;
  text?: string;
}): Promise<void> {
  const study = window.site?.analysis?.study;
  const analysis = window.site?.analysis;
  const studyId = study?.data?.id;
  if (!studyId) return;

  const chapterId = data.ch ?? study.vm.chapterId ?? '';
  const path = data.path ?? analysis?.path ?? '';
  const trimmed = (data.text ?? '').trim();

  if (!trimmed) {
    if (chapterId && path) {
      await deleteHitById(liveNodeId(studyId, chapterId, path));
      notifyDbChanged();
    }
    return;
  }

  const hit = liveHitFromAnalysis(trimmed);
  if (!hit) return;
  hit.chapterId = chapterId || hit.chapterId;
  hit.path = path || hit.path;
  await replaceLiveNodeHit(hit);
  notifyDbChanged();
}

function hookWebSocketSend(): void {
  if (wsHooked) return;
  wsHooked = true;

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
        if (msg.t === 'setComment' && msg.d) {
          void onSetComment(msg.d);
        }
      } catch {
        /* ignore */
      }
    }
    return OrigSend.call(this, data);
  };
}

async function hookStudyMakeChange(): Promise<void> {
  if (studyHooked) return;
  await waitForAnalysis();
  const study = window.site?.analysis?.study;
  if (!study) return;
  studyHooked = true;

  const orig = study.makeChange.bind(study);
  study.makeChange = (type, data) => {
    const ok = orig(type, data);
    if (type === 'setComment') void onSetComment(data);
    return ok;
  };
}

export function installLiveCapture(): void {
  hookWebSocketSend();
  void hookStudyMakeChange();
}
