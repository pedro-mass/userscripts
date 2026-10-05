import type { PositionNoteHit } from './types';

export function isCurrentChapterNote(
  hit: PositionNoteHit,
  studyId: string | undefined,
  chapterId: string | undefined,
): boolean {
  if (!studyId || !chapterId) return false;
  return hit.studyId === studyId && hit.chapterId === chapterId;
}

/** One row per chapter (newest wins). */
export function dedupeNewestPerChapter(
  hits: PositionNoteHit[],
): PositionNoteHit[] {
  const byChapter = new Map<string, PositionNoteHit>();
  for (const hit of hits) {
    const key = hit.chapterId || hit.chapterUrl;
    const prev = byChapter.get(key);
    if (!prev || hit.updatedAt > prev.updatedAt) byChapter.set(key, hit);
  }
  return [...byChapter.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function hitsForDisplay(
  hits: PositionNoteHit[],
  studyId: string | undefined,
  chapterId: string | undefined,
): PositionNoteHit[] {
  const others = hits.filter(
    (hit) => !isCurrentChapterNote(hit, studyId, chapterId),
  );
  return dedupeNewestPerChapter(others);
}
