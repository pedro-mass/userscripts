import { makeFen } from 'chessops/fen';
import type { Position } from 'chessops';
import {
  parseComment,
  parsePgn,
  startingPosition,
  transform,
  type Game,
} from 'chessops/pgn';
import { makeSanAndPlay, parseSan } from 'chessops/san';
import { makeUci } from 'chessops/util';
import { positionKeyFromFen } from './position-key';
import type { PositionNoteHit } from './types';

interface WalkCtx {
  pos: Position;
  ply: number;
  uciTrail: string[];
  onMainline: boolean;
  clone(): WalkCtx;
}

function makeCtx(pos: Position): WalkCtx {
  return {
    pos,
    ply: 0,
    uciTrail: [],
    onMainline: true,
    clone() {
      return {
        pos: this.pos.clone(),
        ply: this.ply,
        uciTrail: [...this.uciTrail],
        onMainline: this.onMainline,
        clone: this.clone,
      };
    },
  };
}

function header(game: Game<unknown>, name: string): string {
  return game.headers.get(name) ?? '';
}

function chapterMeta(game: Game<unknown>, fallbackStudyId: string) {
  const chapterUrl = header(game, 'ChapterURL');
  const m = chapterUrl.match(/\/study\/([A-Za-z0-9]{8})\/([A-Za-z0-9]{8})/);
  const studyId = m?.[1] ?? fallbackStudyId;
  const chapterId = m?.[2] ?? '';
  const chapterUrlNorm =
    chapterId
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
    path: string;
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
  const dedupe = `${meta.studyId}|${meta.chapterId}|${fields.uciTrail.join(',')}|${text}`;
  return {
    id: dedupe,
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
    path: fields.path,
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
}

function pushComment(
  meta: ReturnType<typeof chapterMeta>,
  ctx: WalkCtx,
  san: string,
  raw: string,
  now: number,
  out: PositionNoteHit[],
): void {
  const parsed = parseComment(raw);
  const hit = makeHit(
    meta,
    {
      fenFull: makeFen(ctx.pos.toSetup()),
      text: parsed.text,
      path: '',
      ply: ctx.ply,
      san,
      uciTrail: ctx.uciTrail,
      onMainline: ctx.onMainline,
    },
    now,
  );
  if (hit) out.push(hit);
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
  const game = games[0];
  if (!game) return [];

  const meta = chapterMeta(game, fallbackStudyId);
  const start = startingPosition(game.headers);
  if (start.isErr) return [];

  const now = Date.now();
  const out: PositionNoteHit[] = [];
  const ctx = makeCtx(start.value);

  transform(game.moves, ctx, (walkCtx, data, childIndex) => {
    if (childIndex > 0) walkCtx.onMainline = false;

    for (const raw of data.startingComments ?? []) {
      pushComment(meta, walkCtx, data.san, raw, now, out);
    }

    const move = parseSan(walkCtx.pos, data.san);
    if (!move) return;
    makeSanAndPlay(walkCtx.pos, move);
    walkCtx.ply += 1;
    walkCtx.uciTrail.push(makeUci(move));

    for (const raw of data.comments ?? []) {
      pushComment(meta, walkCtx, data.san, raw, now, out);
    }

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
