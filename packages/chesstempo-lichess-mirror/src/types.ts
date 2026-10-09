export interface MirrorPayload {
  v: 1;
  seq: number;
  from: 'ct';
  fen: string;
  prevFen: string | null;
  targetId: string;
  ts: number;
}
