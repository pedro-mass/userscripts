import type { PositionNoteHit } from './types';

export function slotId(
  studyId: string,
  chapterId: string,
  positionKey: string,
): string {
  return `${studyId}|${chapterId}|${positionKey}`;
}

export function withSlotId(hit: PositionNoteHit): PositionNoteHit {
  return {
    ...hit,
    id: slotId(hit.studyId, hit.chapterId, hit.positionKey),
  };
}

/** Same slot: newer `updatedAt` wins; tie → live over import. */
export function mergeHitsForSlot(
  a: PositionNoteHit,
  b: PositionNoteHit,
): PositionNoteHit {
  const left = withSlotId(a);
  const right = withSlotId(b);
  if (right.updatedAt > left.updatedAt) return right;
  if (left.updatedAt > right.updatedAt) return left;
  if (left.source === 'live') return left;
  if (right.source === 'live') return right;
  return left;
}

export function collapseHitsToSlots(hits: PositionNoteHit[]): PositionNoteHit[] {
  const map = new Map<string, PositionNoteHit>();
  for (const hit of hits) {
    const id = slotId(hit.studyId, hit.chapterId, hit.positionKey);
    const normalized = withSlotId(hit);
    const prev = map.get(id);
    map.set(id, prev ? mergeHitsForSlot(prev, normalized) : normalized);
  }
  return [...map.values()];
}
