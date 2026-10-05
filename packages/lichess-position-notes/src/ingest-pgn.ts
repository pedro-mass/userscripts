import { makeFen } from 'chessops/fen';
import type { Position } from 'chessops';
import { parsePgn, startingPosition, walk, type Game } from 'chessops/pgn';
import { makeSanAndPlay, parseSan } from 'chessops/san';
import { makeUci } from 'chessops/util';
import { humanTextFromPgnComment } from './comment-text';
import { positionKeyFromFen } from './position-key';
import { withSlotId } from './slot-id';
import type { PositionNoteHit } from './types';

interface WalkState {
  pos: Position;
  ply: number;
  uciTrail: string[];
  onMainline: boolean;
  clone(): WalkState;
}

function makeWalkState(pos: Position): WalkState {
  const state: WalkState = {
    pos,
    ply: 0,
    uciTrail: [],
    onMainline: true,
    clone() {
      return {
        pos: state.pos.clone(),
        ply: state.ply,
        uciTrail: [...state.uciTrail],
        onMainline: state.onMainline,
        clone: state.clone,
      };
    },
  };
  return state;
}

function header(game: Game<unknown>, name: string): string {
  return game.headers.get(name) ?? '';
}

function chapterMeta(game: Game<unknown>, fallbackStudyId: string) {
  const chapterUrl = header(game, 'ChapterURL');
  const m = chapterUrl.match(/\/study\/([A-Za-z0-9]{8})\/([A-Za-z0-9]{8})/);
  const studyId = m?.[1] ?? fallbackStudyId;
  const chapterId = m?.[2] ?? '';
  const chapterUrlNorm = chapterId
    ? `https://lichess.org/study/${studyId}/${chapterId}`
    : `https://lichess.org/study/${studyId}`;
  return {
    studyId,
    studyName: header(game, 'StudyName'),
    chapterId,
    chapterName: header(game, 'ChapterName'),
    chapterUrl: chapterUrlNorm,
    gameId: header(game, 'GameId') || undefined,
    white: header(game, 'White') || undefined,
    black: header(game, 'Black') || undefined,
    date: header(game, 'Date') || undefined,
  };
}

function makeHit(
  meta: ReturnType<typeof chapterMeta>,
  fields: {
    fenFull: string;
    text: string;
    ply: number;
    san: string;
    uciTrail: string[];
    onMainline: boolean;
  },
  now: number,
): PositionNoteHit | null {
  const text = fields.text.trim();
  if (!text) return null;
  const positionKey = positionKeyFromFen(fields.fenFull);
  const positionUrl = fields.onMainline
    ? `${meta.chapterUrl}#${fields.ply}`
    : meta.chapterUrl;
  const hit: PositionNoteHit = {
    id: '',
    positionKey,
    fenFull: fields.fenFull,
    text,
    studyId: meta.studyId,
    studyName: meta.studyName,
    chapterId: meta.chapterId,
    chapterName: meta.chapterName,
    gameId: meta.gameId,
    white: meta.white,
    black: meta.black,
    date: meta.date,
    path: '',
    ply: fields.ply,
    san: fields.san,
    uciTrail: [...fields.uciTrail],
    onMainline: fields.onMainline,
    chapterUrl: meta.chapterUrl,
    positionUrl,
    source: 'import',
    importedAt: now,
    updatedAt: now,
  };
  return withSlotId(hit);
}

function pushComments(
  meta: ReturnType<typeof chapterMeta>,
  state: WalkState,
  san: string,
  raws: string[],
  now: number,
  out: PositionNoteHit[],
): void {
  for (const raw of raws) {
    const text = humanTextFromPgnComment(raw);
    const hit = makeHit(
      meta,
      {
        fenFull: makeFen(state.pos.toSetup()),
        text,
        ply: state.ply,
        san,
        uciTrail: state.uciTrail,
        onMainline: state.onMainline,
      },
      now,
    );
    if (hit) out.push(hit);
  }
}

export function splitStudyPgn(pgn: string): string[] {
  return pgn
    .split(/\n\n(?=\[)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export function hitsFromChapterPgn(
  pgn: string,
  fallbackStudyId: string,
): PositionNoteHit[] {
  const games = parsePgn(pgn);
  const game = Array.isArray(games) ? games[0] : [...games][0];
  if (!game) return [];

  const meta = chapterMeta(game, fallbackStudyId);
  const start = startingPosition(game.headers);
  if (start.isErr) return [];

  const now = Date.now();
  const out: PositionNoteHit[] = [];
  const root = makeWalkState(start.value);

  walk(game.moves, root, (state, data, childIndex) => {
    if (childIndex > 0) state.onMainline = false;

    pushComments(meta, state, data.san, data.startingComments ?? [], now, out);

    const move = parseSan(state.pos, data.san);
    if (!move) return false;
    makeSanAndPlay(state.pos, move);
    state.ply += 1;
    state.uciTrail.push(makeUci(move));

    pushComments(meta, state, data.san, data.comments ?? [], now, out);
    return undefined;
  });

  return out;
}

export function hitsFromStudyPgn(
  pgn: string,
  studyId: string,
): PositionNoteHit[] {
  const chapters = splitStudyPgn(pgn);
  const all: PositionNoteHit[] = [];
  for (const chapter of chapters) {
    all.push(...hitsFromChapterPgn(chapter, studyId));
  }
  return all;
}
