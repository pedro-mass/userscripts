import type { PositionNoteHit } from './types';
import { positionKeyFromFen } from './position-key';
import { withSlotId } from './slot-id';

export function studyIdFromLocation(): string | null {
  const m = location.pathname.match(/\/study\/([A-Za-z0-9]{8})/);
  return m?.[1] ?? null;
}

export function waitForAnalysis(): Promise<void> {
  if (window.site?.analysis?.node) return Promise.resolve();
  return new Promise((resolve) => {
    const tick = () => {
      if (window.site?.analysis?.node) resolve();
      else requestAnimationFrame(tick);
    };
    window.site?.load?.then(() => requestAnimationFrame(tick));
  });
}

export async function fetchStudyPgn(studyId: string): Promise<string> {
  const url = `https://lichess.org/api/study/${studyId}.pgn?comments=1&variations=1&clocks=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PGN fetch failed: ${res.status}`);
  return res.text();
}

export function liveHitFromAnalysis(text: string): PositionNoteHit | null {
  const analysis = window.site?.analysis;
  const study = analysis?.study;
  if (!analysis || !study) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenFull = analysis.node.fen;
  const positionKey = positionKeyFromFen(fenFull);
  const studyId = study.data.id;
  const studyName = study.data.name;
  const chapterId = study.vm.chapterId;
  const chapterName =
    (study.data as { chapter?: { name?: string } }).chapter?.name ?? '';
  const path = analysis.path;
  const ply = analysis.node.ply;
  const san = analysis.node.san;
  const chapterUrl = `https://lichess.org/study/${studyId}/${chapterId}`;
  const onMainline = true; // refined when we can read tree; ply hash still helps mainline

  const hit: PositionNoteHit = {
    id: '',
    positionKey,
    fenFull,
    text: trimmed,
    studyId,
    studyName,
    chapterId,
    chapterName,
    path,
    ply,
    san,
    uciTrail: [],
    onMainline,
    chapterUrl,
    positionUrl: `${chapterUrl}#${ply}`,
    source: 'live',
    importedAt: Date.now(),
    updatedAt: Date.now(),
  };
  return withSlotId(hit);
}

export async function jumpToHit(hit: PositionNoteHit): Promise<void> {
  await waitForAnalysis();
  const analysis = window.site?.analysis;
  if (!analysis) return;

  const sameChapter =
    analysis.study?.vm.chapterId === hit.chapterId &&
    analysis.study?.data?.id === hit.studyId;

  if (sameChapter && hit.path) {
    analysis.userJump(hit.path);
    return;
  }

  if (sameChapter && hit.uciTrail.length > 0) {
    analysis.userJump('');
    for (const uci of hit.uciTrail) {
      window.lichess?.analysis?.playUci(uci);
    }
    return;
  }

  window.open(hit.positionUrl || hit.chapterUrl, '_blank', 'noopener');
}
