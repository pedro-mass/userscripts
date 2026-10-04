export type NoteSource = 'import' | 'live';

export interface PositionNoteHit {
  id: string;
  positionKey: string;
  fenFull: string;
  text: string;
  studyId: string;
  studyName: string;
  chapterId: string;
  chapterName: string;
  gameId?: string;
  white?: string;
  black?: string;
  date?: string;
  path: string;
  ply: number;
  san: string;
  uciTrail: string[];
  onMainline: boolean;
  lichessCommentId?: string;
  chapterUrl: string;
  positionUrl: string;
  source: NoteSource;
  importedAt: number;
  updatedAt: number;
}
