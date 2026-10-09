export type BottomColor = 'white' | 'black';

export interface MirrorPayload {
  v: 1;
  seq: number;
  from: 'ct';
  fen: string;
  prevFen: string | null;
  targetId: string;
  /** Which color is shown at the bottom of the board (CT board orientation). */
  bottomColor?: BottomColor;
  ts: number;
}
