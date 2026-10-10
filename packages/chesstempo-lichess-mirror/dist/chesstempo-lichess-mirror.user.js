// ==UserScript==
// @name         ChessTempo → Lichess mirror
// @namespace    https://github.com/pedro-mass/userscripts/chesstempo-lichess-mirror
// @version      0.1.14
// @author       pedro-mass
// @description  Mirror ChessTempo opening-training position to a Lichess analysis tab (Open in Lichess + live FEN sync).
// @license      GPL-3.0-only
// @icon         https://lichess.org/favicon.ico
// @homepageURL  https://github.com/pedro-mass/userscripts/tree/main/packages/chesstempo-lichess-mirror
// @supportURL   https://github.com/pedro-mass/userscripts/issues
// @downloadURL  https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesstempo-lichess-mirror/dist/chesstempo-lichess-mirror.user.js
// @updateURL    https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesstempo-lichess-mirror/dist/chesstempo-lichess-mirror.meta.js
// @match        https://chesstempo.com/opening-training/*
// @match        https://www.chesstempo.com/opening-training/*
// @match        https://lichess.org/analysis*
// @grant        GM_addElement
// @grant        GM_addValueChangeListener
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_openInTab
// @grant        GM_setValue
// @inject-into  page
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  function scriptVersion() {
    var _a;
    try {
      if ("0.1.14") {
        return "0.1.14";
      }
    } catch {
    }
    try {
      const v = (_a = GM_info == null ? void 0 : GM_info.script) == null ? void 0 : _a.version;
      if (v) return String(v);
    } catch {
    }
    return "unknown";
  }
  const NS = "[ct-mirror]";
  const LOG_KEY = "ctLichessMirror.recentLog";
  function isDebugEnabled() {
    try {
      if (localStorage.getItem("pamCtMirrorDebug") === "1") return true;
    } catch {
    }
    return GM_getValue("ctLichessMirror.debug", false) === true;
  }
  function pushLog(entry) {
    if (!isDebugEnabled()) return;
    const prev = GM_getValue(LOG_KEY, []) ?? [];
    const next = [...prev, entry].slice(-40);
    GM_setValue(LOG_KEY, next);
  }
  function mirrorLog(level, message, data) {
    const version = scriptVersion();
    const entry = { t: Date.now(), level, message, version, ...data };
    if (level === "debug" && !isDebugEnabled()) return;
    const fn = level === "warn" ? console.warn : console.info;
    fn(NS, `v${version}`, message, data ?? "");
    pushLog(entry);
  }
  function readBottomColorFromBoard() {
    const board = document.querySelector("chess-board");
    if (board == null ? void 0 : board.classList.contains("flipped")) return "black";
    return "white";
  }
  function readFenFromChessBoard() {
    const board = document.querySelector("chess-board");
    if (!(board == null ? void 0 : board.toFen)) return null;
    try {
      const fen = board.toFen();
      return (fen == null ? void 0 : fen.includes("/")) ? fen : null;
    } catch (e2) {
      mirrorLog("warn", "chess-board.toFen failed", { err: String(e2) });
      return null;
    }
  }
  function readFenFromExplorerElement() {
    const explorer = document.querySelector("opening-explorer");
    if (!explorer) return null;
    if (explorer.fen) return explorer.fen;
    return null;
  }
  function readCurrentCtFen(lastFen2) {
    if (lastFen2) return lastFen2;
    const fromExplorer = readFenFromExplorerElement();
    if (fromExplorer) return fromExplorer;
    const fromBoard = readFenFromChessBoard();
    return fromBoard;
  }
  function fenDiagnostics() {
    const explorer = document.querySelector("opening-explorer");
    const board = document.querySelector("chess-board");
    return {
      openingExplorer: !!explorer,
      chessBoard: !!board,
      domProbe: (() => {
        var _a;
        const wrap = document.getElementById("pam-ct-mirror-wrap");
        if (!wrap) return void 0;
        for (const n2 of Array.from(wrap.childNodes)) {
          if (n2.nodeType !== Node.COMMENT_NODE) continue;
          const c = n2;
          if (c.data.startsWith("pam-ct-mirror-probe:")) {
            return c.data.slice("pam-ct-mirror-probe:".length).slice(0, 120);
          }
        }
        return (_a = wrap.getAttribute("data-pam-probe")) == null ? void 0 : _a.slice(0, 120);
      })(),
      toFen: readFenFromChessBoard(),
      pageHookFlag: !!window.__pamCtPageHook,
      injectFlag: document.documentElement.dataset.pamCtPageHookInjected
    };
  }
  class r {
    unwrap(r2, t2) {
      const e2 = this._chain((t3) => n.ok(r2 ? r2(t3) : t3), (r3) => t2 ? n.ok(t2(r3)) : n.err(r3));
      if (e2.isErr) throw e2.error;
      return e2.value;
    }
    map(r2, t2) {
      return this._chain((t3) => n.ok(r2(t3)), (r3) => n.err(t2 ? t2(r3) : r3));
    }
    chain(r2, t2) {
      return this._chain(r2, t2 || ((r3) => n.err(r3)));
    }
  }
  class t extends r {
    constructor(r2) {
      super(), this.value = void 0, this.isOk = true, this.isErr = false, this.value = r2;
    }
    _chain(r2, t2) {
      return r2(this.value);
    }
  }
  class e extends r {
    constructor(r2) {
      super(), this.error = void 0, this.isOk = false, this.isErr = true, this.error = r2;
    }
    _chain(r2, t2) {
      return t2(this.error);
    }
  }
  var n;
  !(function(r2) {
    r2.ok = function(r3) {
      return new t(r3);
    }, r2.err = function(r3) {
      return new e(r3 || new Error());
    }, r2.all = function(t2) {
      if (Array.isArray(t2)) {
        const e3 = [];
        for (let r3 = 0; r3 < t2.length; r3++) {
          const n3 = t2[r3];
          if (n3.isErr) return n3;
          e3.push(n3.value);
        }
        return r2.ok(e3);
      }
      const e2 = {}, n2 = Object.keys(t2);
      for (let r3 = 0; r3 < n2.length; r3++) {
        const s = t2[n2[r3]];
        if (s.isErr) return s;
        e2[n2[r3]] = s.value;
      }
      return r2.ok(e2);
    };
  })(n || (n = {}));
  const popcnt32 = (n2) => {
    n2 = n2 - (n2 >>> 1 & 1431655765);
    n2 = (n2 & 858993459) + (n2 >>> 2 & 858993459);
    return Math.imul(n2 + (n2 >>> 4) & 252645135, 16843009) >> 24;
  };
  const bswap32 = (n2) => {
    n2 = n2 >>> 8 & 16711935 | (n2 & 16711935) << 8;
    return n2 >>> 16 & 65535 | (n2 & 65535) << 16;
  };
  const rbit32 = (n2) => {
    n2 = n2 >>> 1 & 1431655765 | (n2 & 1431655765) << 1;
    n2 = n2 >>> 2 & 858993459 | (n2 & 858993459) << 2;
    n2 = n2 >>> 4 & 252645135 | (n2 & 252645135) << 4;
    return bswap32(n2);
  };
  class SquareSet {
    constructor(lo, hi) {
      this.lo = lo | 0;
      this.hi = hi | 0;
    }
    static fromSquare(square) {
      return square >= 32 ? new SquareSet(0, 1 << square - 32) : new SquareSet(1 << square, 0);
    }
    static fromRank(rank) {
      return new SquareSet(255, 0).shl64(8 * rank);
    }
    static fromFile(file) {
      return new SquareSet(16843009 << file, 16843009 << file);
    }
    static empty() {
      return new SquareSet(0, 0);
    }
    static full() {
      return new SquareSet(4294967295, 4294967295);
    }
    static corners() {
      return new SquareSet(129, 2164260864);
    }
    static center() {
      return new SquareSet(402653184, 24);
    }
    static backranks() {
      return new SquareSet(255, 4278190080);
    }
    static backrank(color) {
      return color === "white" ? new SquareSet(255, 0) : new SquareSet(0, 4278190080);
    }
    static lightSquares() {
      return new SquareSet(1437226410, 1437226410);
    }
    static darkSquares() {
      return new SquareSet(2857740885, 2857740885);
    }
    complement() {
      return new SquareSet(~this.lo, ~this.hi);
    }
    xor(other) {
      return new SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
    }
    union(other) {
      return new SquareSet(this.lo | other.lo, this.hi | other.hi);
    }
    intersect(other) {
      return new SquareSet(this.lo & other.lo, this.hi & other.hi);
    }
    diff(other) {
      return new SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
    }
    intersects(other) {
      return this.intersect(other).nonEmpty();
    }
    isDisjoint(other) {
      return this.intersect(other).isEmpty();
    }
    supersetOf(other) {
      return other.diff(this).isEmpty();
    }
    subsetOf(other) {
      return this.diff(other).isEmpty();
    }
    shr64(shift) {
      if (shift >= 64)
        return SquareSet.empty();
      if (shift >= 32)
        return new SquareSet(this.hi >>> shift - 32, 0);
      if (shift > 0)
        return new SquareSet(this.lo >>> shift ^ this.hi << 32 - shift, this.hi >>> shift);
      return this;
    }
    shl64(shift) {
      if (shift >= 64)
        return SquareSet.empty();
      if (shift >= 32)
        return new SquareSet(0, this.lo << shift - 32);
      if (shift > 0)
        return new SquareSet(this.lo << shift, this.hi << shift ^ this.lo >>> 32 - shift);
      return this;
    }
    bswap64() {
      return new SquareSet(bswap32(this.hi), bswap32(this.lo));
    }
    rbit64() {
      return new SquareSet(rbit32(this.hi), rbit32(this.lo));
    }
    minus64(other) {
      const lo = this.lo - other.lo;
      const c = (lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1) >>> 31;
      return new SquareSet(lo, this.hi - (other.hi + c));
    }
    equals(other) {
      return this.lo === other.lo && this.hi === other.hi;
    }
    size() {
      return popcnt32(this.lo) + popcnt32(this.hi);
    }
    isEmpty() {
      return this.lo === 0 && this.hi === 0;
    }
    nonEmpty() {
      return this.lo !== 0 || this.hi !== 0;
    }
    has(square) {
      return (square >= 32 ? this.hi & 1 << square - 32 : this.lo & 1 << square) !== 0;
    }
    set(square, on) {
      return on ? this.with(square) : this.without(square);
    }
    with(square) {
      return square >= 32 ? new SquareSet(this.lo, this.hi | 1 << square - 32) : new SquareSet(this.lo | 1 << square, this.hi);
    }
    without(square) {
      return square >= 32 ? new SquareSet(this.lo, this.hi & ~(1 << square - 32)) : new SquareSet(this.lo & ~(1 << square), this.hi);
    }
    toggle(square) {
      return square >= 32 ? new SquareSet(this.lo, this.hi ^ 1 << square - 32) : new SquareSet(this.lo ^ 1 << square, this.hi);
    }
    last() {
      if (this.hi !== 0)
        return 63 - Math.clz32(this.hi);
      if (this.lo !== 0)
        return 31 - Math.clz32(this.lo);
      return;
    }
    first() {
      if (this.lo !== 0)
        return 31 - Math.clz32(this.lo & -this.lo);
      if (this.hi !== 0)
        return 63 - Math.clz32(this.hi & -this.hi);
      return;
    }
    withoutFirst() {
      if (this.lo !== 0)
        return new SquareSet(this.lo & this.lo - 1, this.hi);
      return new SquareSet(0, this.hi & this.hi - 1);
    }
    moreThanOne() {
      return this.hi !== 0 && this.lo !== 0 || (this.lo & this.lo - 1) !== 0 || (this.hi & this.hi - 1) !== 0;
    }
    singleSquare() {
      return this.moreThanOne() ? void 0 : this.last();
    }
    *[Symbol.iterator]() {
      let lo = this.lo;
      let hi = this.hi;
      while (lo !== 0) {
        const idx = 31 - Math.clz32(lo & -lo);
        lo ^= 1 << idx;
        yield idx;
      }
      while (hi !== 0) {
        const idx = 31 - Math.clz32(hi & -hi);
        hi ^= 1 << idx;
        yield 32 + idx;
      }
    }
    *reversed() {
      let lo = this.lo;
      let hi = this.hi;
      while (hi !== 0) {
        const idx = 31 - Math.clz32(hi);
        hi ^= 1 << idx;
        yield 32 + idx;
      }
      while (lo !== 0) {
        const idx = 31 - Math.clz32(lo);
        lo ^= 1 << idx;
        yield idx;
      }
    }
  }
  const FILE_NAMES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const RANK_NAMES = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const COLORS = ["white", "black"];
  const ROLES = ["pawn", "knight", "bishop", "rook", "queen", "king"];
  const CASTLING_SIDES = ["a", "h"];
  const isDrop = (v) => "role" in v;
  const defined = (v) => v !== void 0;
  const opposite = (color) => color === "white" ? "black" : "white";
  const squareRank = (square) => square >> 3;
  const squareFile = (square) => square & 7;
  const squareFromCoords = (file, rank) => 0 <= file && file < 8 && 0 <= rank && rank < 8 ? file + 8 * rank : void 0;
  const roleToChar = (role) => {
    switch (role) {
      case "pawn":
        return "p";
      case "knight":
        return "n";
      case "bishop":
        return "b";
      case "rook":
        return "r";
      case "queen":
        return "q";
      case "king":
        return "k";
    }
  };
  function charToRole(ch) {
    switch (ch.toLowerCase()) {
      case "p":
        return "pawn";
      case "n":
        return "knight";
      case "b":
        return "bishop";
      case "r":
        return "rook";
      case "q":
        return "queen";
      case "k":
        return "king";
      default:
        return;
    }
  }
  function parseSquare(str) {
    if (str.length !== 2)
      return;
    return squareFromCoords(str.charCodeAt(0) - "a".charCodeAt(0), str.charCodeAt(1) - "1".charCodeAt(0));
  }
  const makeSquare = (square) => FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)];
  const makeUci = (move) => isDrop(move) ? `${roleToChar(move.role).toUpperCase()}@${makeSquare(move.to)}` : makeSquare(move.from) + makeSquare(move.to) + (move.promotion ? roleToChar(move.promotion) : "");
  const kingCastlesTo = (color, side) => color === "white" ? side === "a" ? 2 : 6 : side === "a" ? 58 : 62;
  const rookCastlesTo = (color, side) => color === "white" ? side === "a" ? 3 : 5 : side === "a" ? 59 : 61;
  const computeRange = (square, deltas) => {
    let range = SquareSet.empty();
    for (const delta of deltas) {
      const sq = square + delta;
      if (0 <= sq && sq < 64 && Math.abs(squareFile(square) - squareFile(sq)) <= 2) {
        range = range.with(sq);
      }
    }
    return range;
  };
  const tabulate = (f) => {
    const table = [];
    for (let square = 0; square < 64; square++)
      table[square] = f(square);
    return table;
  };
  const KING_ATTACKS = tabulate((sq) => computeRange(sq, [-9, -8, -7, -1, 1, 7, 8, 9]));
  const KNIGHT_ATTACKS = tabulate((sq) => computeRange(sq, [-17, -15, -10, -6, 6, 10, 15, 17]));
  const PAWN_ATTACKS = {
    white: tabulate((sq) => computeRange(sq, [7, 9])),
    black: tabulate((sq) => computeRange(sq, [-7, -9]))
  };
  const kingAttacks = (square) => KING_ATTACKS[square];
  const knightAttacks = (square) => KNIGHT_ATTACKS[square];
  const pawnAttacks = (color, square) => PAWN_ATTACKS[color][square];
  const FILE_RANGE = tabulate((sq) => SquareSet.fromFile(squareFile(sq)).without(sq));
  const RANK_RANGE = tabulate((sq) => SquareSet.fromRank(squareRank(sq)).without(sq));
  const DIAG_RANGE = tabulate((sq) => {
    const diag = new SquareSet(134480385, 2151686160);
    const shift = 8 * (squareRank(sq) - squareFile(sq));
    return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
  });
  const ANTI_DIAG_RANGE = tabulate((sq) => {
    const diag = new SquareSet(270549120, 16909320);
    const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
    return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
  });
  const hyperbola = (bit, range, occupied) => {
    let forward = occupied.intersect(range);
    let reverse = forward.bswap64();
    forward = forward.minus64(bit);
    reverse = reverse.minus64(bit.bswap64());
    return forward.xor(reverse.bswap64()).intersect(range);
  };
  const fileAttacks = (square, occupied) => hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
  const rankAttacks = (square, occupied) => {
    const range = RANK_RANGE[square];
    let forward = occupied.intersect(range);
    let reverse = forward.rbit64();
    forward = forward.minus64(SquareSet.fromSquare(square));
    reverse = reverse.minus64(SquareSet.fromSquare(63 - square));
    return forward.xor(reverse.rbit64()).intersect(range);
  };
  const bishopAttacks = (square, occupied) => {
    const bit = SquareSet.fromSquare(square);
    return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
  };
  const rookAttacks = (square, occupied) => fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
  const queenAttacks = (square, occupied) => bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
  const ray = (a, b) => {
    const other = SquareSet.fromSquare(b);
    if (RANK_RANGE[a].intersects(other))
      return RANK_RANGE[a].with(a);
    if (ANTI_DIAG_RANGE[a].intersects(other))
      return ANTI_DIAG_RANGE[a].with(a);
    if (DIAG_RANGE[a].intersects(other))
      return DIAG_RANGE[a].with(a);
    if (FILE_RANGE[a].intersects(other))
      return FILE_RANGE[a].with(a);
    return SquareSet.empty();
  };
  const between = (a, b) => ray(a, b).intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b))).withoutFirst();
  class Board {
    constructor() {
    }
    static default() {
      const board = new Board();
      board.reset();
      return board;
    }
    /**
     * Resets all pieces to the default starting position for standard chess.
     */
    reset() {
      this.occupied = new SquareSet(65535, 4294901760);
      this.promoted = SquareSet.empty();
      this.white = new SquareSet(65535, 0);
      this.black = new SquareSet(0, 4294901760);
      this.pawn = new SquareSet(65280, 16711680);
      this.knight = new SquareSet(66, 1107296256);
      this.bishop = new SquareSet(36, 603979776);
      this.rook = new SquareSet(129, 2164260864);
      this.queen = new SquareSet(8, 134217728);
      this.king = new SquareSet(16, 268435456);
    }
    static empty() {
      const board = new Board();
      board.clear();
      return board;
    }
    clear() {
      this.occupied = SquareSet.empty();
      this.promoted = SquareSet.empty();
      for (const color of COLORS)
        this[color] = SquareSet.empty();
      for (const role of ROLES)
        this[role] = SquareSet.empty();
    }
    clone() {
      const board = new Board();
      board.occupied = this.occupied;
      board.promoted = this.promoted;
      for (const color of COLORS)
        board[color] = this[color];
      for (const role of ROLES)
        board[role] = this[role];
      return board;
    }
    getColor(square) {
      if (this.white.has(square))
        return "white";
      if (this.black.has(square))
        return "black";
      return;
    }
    getRole(square) {
      for (const role of ROLES) {
        if (this[role].has(square))
          return role;
      }
      return;
    }
    get(square) {
      const color = this.getColor(square);
      if (!color)
        return;
      const role = this.getRole(square);
      const promoted = this.promoted.has(square);
      return { color, role, promoted };
    }
    /**
     * Removes and returns the piece from the given `square`, if any.
     */
    take(square) {
      const piece = this.get(square);
      if (piece) {
        this.occupied = this.occupied.without(square);
        this[piece.color] = this[piece.color].without(square);
        this[piece.role] = this[piece.role].without(square);
        if (piece.promoted)
          this.promoted = this.promoted.without(square);
      }
      return piece;
    }
    /**
     * Put `piece` onto `square`, potentially replacing an existing piece.
     * Returns the existing piece, if any.
     */
    set(square, piece) {
      const old = this.take(square);
      this.occupied = this.occupied.with(square);
      this[piece.color] = this[piece.color].with(square);
      this[piece.role] = this[piece.role].with(square);
      if (piece.promoted)
        this.promoted = this.promoted.with(square);
      return old;
    }
    has(square) {
      return this.occupied.has(square);
    }
    *[Symbol.iterator]() {
      for (const square of this.occupied) {
        yield [square, this.get(square)];
      }
    }
    pieces(color, role) {
      return this[color].intersect(this[role]);
    }
    rooksAndQueens() {
      return this.rook.union(this.queen);
    }
    bishopsAndQueens() {
      return this.bishop.union(this.queen);
    }
    /**
     * Finds the unique king of the given `color`, if any.
     */
    kingOf(color) {
      return this.pieces(color, "king").singleSquare();
    }
  }
  var IllegalSetup;
  (function(IllegalSetup2) {
    IllegalSetup2["Empty"] = "ERR_EMPTY";
    IllegalSetup2["OppositeCheck"] = "ERR_OPPOSITE_CHECK";
    IllegalSetup2["PawnsOnBackrank"] = "ERR_PAWNS_ON_BACKRANK";
    IllegalSetup2["Kings"] = "ERR_KINGS";
    IllegalSetup2["Variant"] = "ERR_VARIANT";
  })(IllegalSetup || (IllegalSetup = {}));
  class PositionError extends Error {
  }
  const attacksTo = (square, attacker, board, occupied) => board[attacker].intersect(rookAttacks(square, occupied).intersect(board.rooksAndQueens()).union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens())).union(knightAttacks(square).intersect(board.knight)).union(kingAttacks(square).intersect(board.king)).union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)));
  class Castles {
    constructor() {
    }
    static default() {
      const castles = new Castles();
      castles.castlingRights = SquareSet.corners();
      castles.rook = {
        white: { a: 0, h: 7 },
        black: { a: 56, h: 63 }
      };
      castles.path = {
        white: { a: new SquareSet(14, 0), h: new SquareSet(96, 0) },
        black: { a: new SquareSet(0, 234881024), h: new SquareSet(0, 1610612736) }
      };
      return castles;
    }
    static empty() {
      const castles = new Castles();
      castles.castlingRights = SquareSet.empty();
      castles.rook = {
        white: { a: void 0, h: void 0 },
        black: { a: void 0, h: void 0 }
      };
      castles.path = {
        white: { a: SquareSet.empty(), h: SquareSet.empty() },
        black: { a: SquareSet.empty(), h: SquareSet.empty() }
      };
      return castles;
    }
    clone() {
      const castles = new Castles();
      castles.castlingRights = this.castlingRights;
      castles.rook = {
        white: { a: this.rook.white.a, h: this.rook.white.h },
        black: { a: this.rook.black.a, h: this.rook.black.h }
      };
      castles.path = {
        white: { a: this.path.white.a, h: this.path.white.h },
        black: { a: this.path.black.a, h: this.path.black.h }
      };
      return castles;
    }
    add(color, side, king, rook) {
      const kingTo = kingCastlesTo(color, side);
      const rookTo = rookCastlesTo(color, side);
      this.castlingRights = this.castlingRights.with(rook);
      this.rook[color][side] = rook;
      this.path[color][side] = between(rook, rookTo).with(rookTo).union(between(king, kingTo).with(kingTo)).without(king).without(rook);
    }
    static fromSetup(setup) {
      const castles = Castles.empty();
      const rooks = setup.castlingRights.intersect(setup.board.rook);
      for (const color of COLORS) {
        const backrank = SquareSet.backrank(color);
        const king = setup.board.kingOf(color);
        if (!defined(king) || !backrank.has(king))
          continue;
        const side = rooks.intersect(setup.board[color]).intersect(backrank);
        const aSide = side.first();
        if (defined(aSide) && aSide < king)
          castles.add(color, "a", king, aSide);
        const hSide = side.last();
        if (defined(hSide) && king < hSide)
          castles.add(color, "h", king, hSide);
      }
      return castles;
    }
    discardRook(square) {
      if (this.castlingRights.has(square)) {
        this.castlingRights = this.castlingRights.without(square);
        for (const color of COLORS) {
          for (const side of CASTLING_SIDES) {
            if (this.rook[color][side] === square)
              this.rook[color][side] = void 0;
          }
        }
      }
    }
    discardColor(color) {
      this.castlingRights = this.castlingRights.diff(SquareSet.backrank(color));
      this.rook[color].a = void 0;
      this.rook[color].h = void 0;
    }
  }
  class Position {
    constructor(rules) {
      this.rules = rules;
    }
    reset() {
      this.board = Board.default();
      this.pockets = void 0;
      this.turn = "white";
      this.castles = Castles.default();
      this.epSquare = void 0;
      this.remainingChecks = void 0;
      this.halfmoves = 0;
      this.fullmoves = 1;
    }
    setupUnchecked(setup) {
      this.board = setup.board.clone();
      this.board.promoted = SquareSet.empty();
      this.pockets = void 0;
      this.turn = setup.turn;
      this.castles = Castles.fromSetup(setup);
      this.epSquare = validEpSquare(this, setup.epSquare);
      this.remainingChecks = void 0;
      this.halfmoves = setup.halfmoves;
      this.fullmoves = setup.fullmoves;
    }
    // When subclassing overwrite at least:
    //
    // - static default()
    // - static fromSetup()
    // - static clone()
    //
    // - dests()
    // - isVariantEnd()
    // - variantOutcome()
    // - hasInsufficientMaterial()
    // - isStandardMaterial()
    kingAttackers(square, attacker, occupied) {
      return attacksTo(square, attacker, this.board, occupied);
    }
    playCaptureAt(square, captured) {
      this.halfmoves = 0;
      if (captured.role === "rook")
        this.castles.discardRook(square);
      if (this.pockets)
        this.pockets[opposite(captured.color)][captured.promoted ? "pawn" : captured.role]++;
    }
    ctx() {
      const variantEnd = this.isVariantEnd();
      const king = this.board.kingOf(this.turn);
      if (!defined(king)) {
        return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
      }
      const snipers = rookAttacks(king, SquareSet.empty()).intersect(this.board.rooksAndQueens()).union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens())).intersect(this.board[opposite(this.turn)]);
      let blockers = SquareSet.empty();
      for (const sniper of snipers) {
        const b = between(king, sniper).intersect(this.board.occupied);
        if (!b.moreThanOne())
          blockers = blockers.union(b);
      }
      const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occupied);
      return {
        king,
        blockers,
        checkers,
        variantEnd,
        mustCapture: false
      };
    }
    clone() {
      var _a, _b;
      const pos = new this.constructor();
      pos.board = this.board.clone();
      pos.pockets = (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone();
      pos.turn = this.turn;
      pos.castles = this.castles.clone();
      pos.epSquare = this.epSquare;
      pos.remainingChecks = (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone();
      pos.halfmoves = this.halfmoves;
      pos.fullmoves = this.fullmoves;
      return pos;
    }
    validate() {
      if (this.board.occupied.isEmpty())
        return n.err(new PositionError(IllegalSetup.Empty));
      if (this.board.king.size() !== 2)
        return n.err(new PositionError(IllegalSetup.Kings));
      if (!defined(this.board.kingOf(this.turn)))
        return n.err(new PositionError(IllegalSetup.Kings));
      const otherKing = this.board.kingOf(opposite(this.turn));
      if (!defined(otherKing))
        return n.err(new PositionError(IllegalSetup.Kings));
      if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
        return n.err(new PositionError(IllegalSetup.OppositeCheck));
      }
      if (SquareSet.backranks().intersects(this.board.pawn)) {
        return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
      }
      return n.ok(void 0);
    }
    dropDests(_ctx) {
      return SquareSet.empty();
    }
    dests(square, ctx) {
      ctx = ctx || this.ctx();
      if (ctx.variantEnd)
        return SquareSet.empty();
      const piece = this.board.get(square);
      if (!piece || piece.color !== this.turn)
        return SquareSet.empty();
      let pseudo, legal;
      if (piece.role === "pawn") {
        pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite(this.turn)]);
        const delta = this.turn === "white" ? 8 : -8;
        const step = square + delta;
        if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
          pseudo = pseudo.with(step);
          const canDoubleStep = this.turn === "white" ? square < 16 : square >= 64 - 16;
          const doubleStep = step + delta;
          if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
            pseudo = pseudo.with(doubleStep);
          }
        }
        if (defined(this.epSquare) && canCaptureEp(this, square, ctx)) {
          legal = SquareSet.fromSquare(this.epSquare);
        }
      } else if (piece.role === "bishop")
        pseudo = bishopAttacks(square, this.board.occupied);
      else if (piece.role === "knight")
        pseudo = knightAttacks(square);
      else if (piece.role === "rook")
        pseudo = rookAttacks(square, this.board.occupied);
      else if (piece.role === "queen")
        pseudo = queenAttacks(square, this.board.occupied);
      else
        pseudo = kingAttacks(square);
      pseudo = pseudo.diff(this.board[this.turn]);
      if (defined(ctx.king)) {
        if (piece.role === "king") {
          const occ = this.board.occupied.without(square);
          for (const to of pseudo) {
            if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty())
              pseudo = pseudo.without(to);
          }
          return pseudo.union(castlingDest(this, "a", ctx)).union(castlingDest(this, "h", ctx));
        }
        if (ctx.checkers.nonEmpty()) {
          const checker = ctx.checkers.singleSquare();
          if (!defined(checker))
            return SquareSet.empty();
          pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
        }
        if (ctx.blockers.has(square))
          pseudo = pseudo.intersect(ray(square, ctx.king));
      }
      if (legal)
        pseudo = pseudo.union(legal);
      return pseudo;
    }
    isVariantEnd() {
      return false;
    }
    variantOutcome(_ctx) {
      return;
    }
    hasInsufficientMaterial(color) {
      if (this.board[color].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty())
        return false;
      if (this.board[color].intersects(this.board.knight)) {
        return this.board[color].size() <= 2 && this.board[opposite(color)].diff(this.board.king).diff(this.board.queen).isEmpty();
      }
      if (this.board[color].intersects(this.board.bishop)) {
        const sameColor = !this.board.bishop.intersects(SquareSet.darkSquares()) || !this.board.bishop.intersects(SquareSet.lightSquares());
        return sameColor && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
      }
      return true;
    }
    // The following should be identical in all subclasses
    toSetup() {
      var _a, _b;
      return {
        board: this.board.clone(),
        pockets: (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone(),
        turn: this.turn,
        castlingRights: this.castles.castlingRights,
        epSquare: legalEpSquare(this),
        remainingChecks: (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone(),
        halfmoves: Math.min(this.halfmoves, 150),
        fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999)
      };
    }
    isInsufficientMaterial() {
      return COLORS.every((color) => this.hasInsufficientMaterial(color));
    }
    hasDests(ctx) {
      ctx = ctx || this.ctx();
      for (const square of this.board[this.turn]) {
        if (this.dests(square, ctx).nonEmpty())
          return true;
      }
      return this.dropDests(ctx).nonEmpty();
    }
    isLegal(move, ctx) {
      if (isDrop(move)) {
        if (!this.pockets || this.pockets[this.turn][move.role] <= 0)
          return false;
        if (move.role === "pawn" && SquareSet.backranks().has(move.to))
          return false;
        return this.dropDests(ctx).has(move.to);
      } else {
        if (move.promotion === "pawn")
          return false;
        if (move.promotion === "king" && this.rules !== "antichess")
          return false;
        if (!!move.promotion !== (this.board.pawn.has(move.from) && SquareSet.backranks().has(move.to)))
          return false;
        const dests = this.dests(move.from, ctx);
        return dests.has(move.to) || dests.has(normalizeMove(this, move).to);
      }
    }
    isCheck() {
      const king = this.board.kingOf(this.turn);
      return defined(king) && this.kingAttackers(king, opposite(this.turn), this.board.occupied).nonEmpty();
    }
    isEnd(ctx) {
      if (ctx ? ctx.variantEnd : this.isVariantEnd())
        return true;
      return this.isInsufficientMaterial() || !this.hasDests(ctx);
    }
    isCheckmate(ctx) {
      ctx = ctx || this.ctx();
      return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
    }
    isStalemate(ctx) {
      ctx = ctx || this.ctx();
      return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
    }
    outcome(ctx) {
      const variantOutcome = this.variantOutcome(ctx);
      if (variantOutcome)
        return variantOutcome;
      ctx = ctx || this.ctx();
      if (this.isCheckmate(ctx))
        return { winner: opposite(this.turn) };
      else if (this.isInsufficientMaterial() || this.isStalemate(ctx))
        return { winner: void 0 };
      else
        return;
    }
    allDests(ctx) {
      ctx = ctx || this.ctx();
      const d = /* @__PURE__ */ new Map();
      if (ctx.variantEnd)
        return d;
      for (const square of this.board[this.turn]) {
        d.set(square, this.dests(square, ctx));
      }
      return d;
    }
    play(move) {
      const turn = this.turn;
      const epSquare = this.epSquare;
      const castling = castlingSide(this, move);
      this.epSquare = void 0;
      this.halfmoves += 1;
      if (turn === "black")
        this.fullmoves += 1;
      this.turn = opposite(turn);
      if (isDrop(move)) {
        this.board.set(move.to, { role: move.role, color: turn });
        if (this.pockets)
          this.pockets[turn][move.role]--;
        if (move.role === "pawn")
          this.halfmoves = 0;
      } else {
        const piece = this.board.take(move.from);
        if (!piece)
          return;
        let epCapture;
        if (piece.role === "pawn") {
          this.halfmoves = 0;
          if (move.to === epSquare) {
            epCapture = this.board.take(move.to + (turn === "white" ? -8 : 8));
          }
          const delta = move.from - move.to;
          if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) {
            this.epSquare = move.from + move.to >> 1;
          }
          if (move.promotion) {
            piece.role = move.promotion;
            piece.promoted = !!this.pockets;
          }
        } else if (piece.role === "rook") {
          this.castles.discardRook(move.from);
        } else if (piece.role === "king") {
          if (castling) {
            const rookFrom = this.castles.rook[turn][castling];
            if (defined(rookFrom)) {
              const rook = this.board.take(rookFrom);
              this.board.set(kingCastlesTo(turn, castling), piece);
              if (rook)
                this.board.set(rookCastlesTo(turn, castling), rook);
            }
          }
          this.castles.discardColor(turn);
        }
        if (!castling) {
          const capture = this.board.set(move.to, piece) || epCapture;
          if (capture)
            this.playCaptureAt(move.to, capture);
        }
      }
      if (this.remainingChecks) {
        if (this.isCheck())
          this.remainingChecks[turn] = Math.max(this.remainingChecks[turn] - 1, 0);
      }
    }
  }
  class Chess extends Position {
    constructor() {
      super("chess");
    }
    static default() {
      const pos = new this();
      pos.reset();
      return pos;
    }
    static fromSetup(setup) {
      const pos = new this();
      pos.setupUnchecked(setup);
      return pos.validate().map((_) => pos);
    }
    clone() {
      return super.clone();
    }
  }
  const validEpSquare = (pos, square) => {
    if (!defined(square))
      return;
    const epRank = pos.turn === "white" ? 5 : 2;
    const forward = pos.turn === "white" ? 8 : -8;
    if (squareRank(square) !== epRank)
      return;
    if (pos.board.occupied.has(square + forward))
      return;
    const pawn = square - forward;
    if (!pos.board.pawn.has(pawn) || !pos.board[opposite(pos.turn)].has(pawn))
      return;
    return square;
  };
  const legalEpSquare = (pos) => {
    if (!defined(pos.epSquare))
      return;
    const ctx = pos.ctx();
    const ourPawns = pos.board.pieces(pos.turn, "pawn");
    const candidates = ourPawns.intersect(pawnAttacks(opposite(pos.turn), pos.epSquare));
    for (const candidate of candidates) {
      if (pos.dests(candidate, ctx).has(pos.epSquare))
        return pos.epSquare;
    }
    return;
  };
  const canCaptureEp = (pos, pawnFrom, ctx) => {
    if (!defined(pos.epSquare))
      return false;
    if (!pawnAttacks(pos.turn, pawnFrom).has(pos.epSquare))
      return false;
    if (!defined(ctx.king))
      return true;
    const delta = pos.turn === "white" ? 8 : -8;
    const captured = pos.epSquare - delta;
    return pos.kingAttackers(ctx.king, opposite(pos.turn), pos.board.occupied.toggle(pawnFrom).toggle(captured).with(pos.epSquare)).without(captured).isEmpty();
  };
  const castlingDest = (pos, side, ctx) => {
    if (!defined(ctx.king) || ctx.checkers.nonEmpty())
      return SquareSet.empty();
    const rook = pos.castles.rook[pos.turn][side];
    if (!defined(rook))
      return SquareSet.empty();
    if (pos.castles.path[pos.turn][side].intersects(pos.board.occupied))
      return SquareSet.empty();
    const kingTo = kingCastlesTo(pos.turn, side);
    const kingPath = between(ctx.king, kingTo);
    const occ = pos.board.occupied.without(ctx.king);
    for (const sq of kingPath) {
      if (pos.kingAttackers(sq, opposite(pos.turn), occ).nonEmpty())
        return SquareSet.empty();
    }
    const rookTo = rookCastlesTo(pos.turn, side);
    const after = pos.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
    if (pos.kingAttackers(kingTo, opposite(pos.turn), after).nonEmpty())
      return SquareSet.empty();
    return SquareSet.fromSquare(rook);
  };
  const castlingSide = (pos, move) => {
    if (isDrop(move))
      return;
    const delta = move.to - move.from;
    if (Math.abs(delta) !== 2 && !pos.board[pos.turn].has(move.to))
      return;
    if (!pos.board.king.has(move.from))
      return;
    return delta > 0 ? "h" : "a";
  };
  const normalizeMove = (pos, move) => {
    const side = castlingSide(pos, move);
    if (!side)
      return move;
    const rookFrom = pos.castles.rook[pos.turn][side];
    return {
      from: move.from,
      to: defined(rookFrom) ? rookFrom : move.to
    };
  };
  class MaterialSide {
    constructor() {
    }
    static empty() {
      const m = new MaterialSide();
      for (const role of ROLES)
        m[role] = 0;
      return m;
    }
    static fromBoard(board, color) {
      const m = new MaterialSide();
      for (const role of ROLES)
        m[role] = board.pieces(color, role).size();
      return m;
    }
    clone() {
      const m = new MaterialSide();
      for (const role of ROLES)
        m[role] = this[role];
      return m;
    }
    equals(other) {
      return ROLES.every((role) => this[role] === other[role]);
    }
    add(other) {
      const m = new MaterialSide();
      for (const role of ROLES)
        m[role] = this[role] + other[role];
      return m;
    }
    subtract(other) {
      const m = new MaterialSide();
      for (const role of ROLES)
        m[role] = this[role] - other[role];
      return m;
    }
    nonEmpty() {
      return ROLES.some((role) => this[role] > 0);
    }
    isEmpty() {
      return !this.nonEmpty();
    }
    hasPawns() {
      return this.pawn > 0;
    }
    hasNonPawns() {
      return this.knight > 0 || this.bishop > 0 || this.rook > 0 || this.queen > 0 || this.king > 0;
    }
    size() {
      return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
    }
  }
  class Material {
    constructor(white, black) {
      this.white = white;
      this.black = black;
    }
    static empty() {
      return new Material(MaterialSide.empty(), MaterialSide.empty());
    }
    static fromBoard(board) {
      return new Material(MaterialSide.fromBoard(board, "white"), MaterialSide.fromBoard(board, "black"));
    }
    clone() {
      return new Material(this.white.clone(), this.black.clone());
    }
    equals(other) {
      return this.white.equals(other.white) && this.black.equals(other.black);
    }
    add(other) {
      return new Material(this.white.add(other.white), this.black.add(other.black));
    }
    subtract(other) {
      return new Material(this.white.subtract(other.white), this.black.subtract(other.black));
    }
    count(role) {
      return this.white[role] + this.black[role];
    }
    size() {
      return this.white.size() + this.black.size();
    }
    isEmpty() {
      return this.white.isEmpty() && this.black.isEmpty();
    }
    nonEmpty() {
      return !this.isEmpty();
    }
    hasPawns() {
      return this.white.hasPawns() || this.black.hasPawns();
    }
    hasNonPawns() {
      return this.white.hasNonPawns() || this.black.hasNonPawns();
    }
  }
  class RemainingChecks {
    constructor(white, black) {
      this.white = white;
      this.black = black;
    }
    static default() {
      return new RemainingChecks(3, 3);
    }
    clone() {
      return new RemainingChecks(this.white, this.black);
    }
    equals(other) {
      return this.white === other.white && this.black === other.black;
    }
  }
  var InvalidFen;
  (function(InvalidFen2) {
    InvalidFen2["Fen"] = "ERR_FEN";
    InvalidFen2["Board"] = "ERR_BOARD";
    InvalidFen2["Pockets"] = "ERR_POCKETS";
    InvalidFen2["Turn"] = "ERR_TURN";
    InvalidFen2["Castling"] = "ERR_CASTLING";
    InvalidFen2["EpSquare"] = "ERR_EP_SQUARE";
    InvalidFen2["RemainingChecks"] = "ERR_REMAINING_CHECKS";
    InvalidFen2["Halfmoves"] = "ERR_HALFMOVES";
    InvalidFen2["Fullmoves"] = "ERR_FULLMOVES";
  })(InvalidFen || (InvalidFen = {}));
  class FenError extends Error {
  }
  const nthIndexOf = (haystack, needle, n2) => {
    let index = haystack.indexOf(needle);
    while (n2-- > 0) {
      if (index === -1)
        break;
      index = haystack.indexOf(needle, index + needle.length);
    }
    return index;
  };
  const parseSmallUint = (str) => /^\d{1,4}$/.test(str) ? parseInt(str, 10) : void 0;
  const charToPiece = (ch) => {
    const role = charToRole(ch);
    return role && { role, color: ch.toLowerCase() === ch ? "black" : "white" };
  };
  const parseBoardFen = (boardPart) => {
    const board = Board.empty();
    let rank = 7;
    let file = 0;
    for (let i = 0; i < boardPart.length; i++) {
      const c = boardPart[i];
      if (c === "/" && file === 8) {
        file = 0;
        rank--;
      } else {
        const step = parseInt(c, 10);
        if (step > 0)
          file += step;
        else {
          if (file >= 8 || rank < 0)
            return n.err(new FenError(InvalidFen.Board));
          const square = file + rank * 8;
          const piece = charToPiece(c);
          if (!piece)
            return n.err(new FenError(InvalidFen.Board));
          if (boardPart[i + 1] === "~") {
            piece.promoted = true;
            i++;
          }
          board.set(square, piece);
          file++;
        }
      }
    }
    if (rank !== 0 || file !== 8)
      return n.err(new FenError(InvalidFen.Board));
    return n.ok(board);
  };
  const parsePockets = (pocketPart) => {
    if (pocketPart.length > 64)
      return n.err(new FenError(InvalidFen.Pockets));
    const pockets = Material.empty();
    for (const c of pocketPart) {
      const piece = charToPiece(c);
      if (!piece)
        return n.err(new FenError(InvalidFen.Pockets));
      pockets[piece.color][piece.role]++;
    }
    return n.ok(pockets);
  };
  const parseCastlingFen = (board, castlingPart) => {
    let castlingRights = SquareSet.empty();
    if (castlingPart === "-")
      return n.ok(castlingRights);
    for (const c of castlingPart) {
      const lower = c.toLowerCase();
      const color = c === lower ? "black" : "white";
      const rank = color === "white" ? 0 : 7;
      if ("a" <= lower && lower <= "h") {
        castlingRights = castlingRights.with(squareFromCoords(lower.charCodeAt(0) - "a".charCodeAt(0), rank));
      } else if (lower === "k" || lower === "q") {
        const rooksAndKings = board[color].intersect(SquareSet.backrank(color)).intersect(board.rook.union(board.king));
        const candidate = lower === "k" ? rooksAndKings.last() : rooksAndKings.first();
        castlingRights = castlingRights.with(defined(candidate) && board.rook.has(candidate) ? candidate : squareFromCoords(lower === "k" ? 7 : 0, rank));
      } else
        return n.err(new FenError(InvalidFen.Castling));
    }
    if (COLORS.some((color) => SquareSet.backrank(color).intersect(castlingRights).size() > 2)) {
      return n.err(new FenError(InvalidFen.Castling));
    }
    return n.ok(castlingRights);
  };
  const parseRemainingChecks = (part) => {
    const parts = part.split("+");
    if (parts.length === 3 && parts[0] === "") {
      const white = parseSmallUint(parts[1]);
      const black = parseSmallUint(parts[2]);
      if (!defined(white) || white > 3 || !defined(black) || black > 3) {
        return n.err(new FenError(InvalidFen.RemainingChecks));
      }
      return n.ok(new RemainingChecks(3 - white, 3 - black));
    } else if (parts.length === 2) {
      const white = parseSmallUint(parts[0]);
      const black = parseSmallUint(parts[1]);
      if (!defined(white) || white > 3 || !defined(black) || black > 3) {
        return n.err(new FenError(InvalidFen.RemainingChecks));
      }
      return n.ok(new RemainingChecks(white, black));
    } else
      return n.err(new FenError(InvalidFen.RemainingChecks));
  };
  const parseFen = (fen) => {
    const parts = fen.split(/[\s_]+/);
    const boardPart = parts.shift();
    let board;
    let pockets = n.ok(void 0);
    if (boardPart.endsWith("]")) {
      const pocketStart = boardPart.indexOf("[");
      if (pocketStart === -1)
        return n.err(new FenError(InvalidFen.Fen));
      board = parseBoardFen(boardPart.slice(0, pocketStart));
      pockets = parsePockets(boardPart.slice(pocketStart + 1, -1));
    } else {
      const pocketStart = nthIndexOf(boardPart, "/", 7);
      if (pocketStart === -1)
        board = parseBoardFen(boardPart);
      else {
        board = parseBoardFen(boardPart.slice(0, pocketStart));
        pockets = parsePockets(boardPart.slice(pocketStart + 1));
      }
    }
    let turn;
    const turnPart = parts.shift();
    if (!defined(turnPart) || turnPart === "w")
      turn = "white";
    else if (turnPart === "b")
      turn = "black";
    else
      return n.err(new FenError(InvalidFen.Turn));
    return board.chain((board2) => {
      const castlingPart = parts.shift();
      const castlingRights = defined(castlingPart) ? parseCastlingFen(board2, castlingPart) : n.ok(SquareSet.empty());
      const epPart = parts.shift();
      let epSquare;
      if (defined(epPart) && epPart !== "-") {
        epSquare = parseSquare(epPart);
        if (!defined(epSquare))
          return n.err(new FenError(InvalidFen.EpSquare));
      }
      let halfmovePart = parts.shift();
      let earlyRemainingChecks;
      if (defined(halfmovePart) && halfmovePart.includes("+")) {
        earlyRemainingChecks = parseRemainingChecks(halfmovePart);
        halfmovePart = parts.shift();
      }
      const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
      if (!defined(halfmoves))
        return n.err(new FenError(InvalidFen.Halfmoves));
      const fullmovesPart = parts.shift();
      const fullmoves = defined(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
      if (!defined(fullmoves))
        return n.err(new FenError(InvalidFen.Fullmoves));
      const remainingChecksPart = parts.shift();
      let remainingChecks = n.ok(void 0);
      if (defined(remainingChecksPart)) {
        if (defined(earlyRemainingChecks))
          return n.err(new FenError(InvalidFen.RemainingChecks));
        remainingChecks = parseRemainingChecks(remainingChecksPart);
      } else if (defined(earlyRemainingChecks)) {
        remainingChecks = earlyRemainingChecks;
      }
      if (parts.length > 0)
        return n.err(new FenError(InvalidFen.Fen));
      return pockets.chain((pockets2) => castlingRights.chain((castlingRights2) => remainingChecks.map((remainingChecks2) => {
        return {
          board: board2,
          pockets: pockets2,
          turn,
          castlingRights: castlingRights2,
          remainingChecks: remainingChecks2,
          epSquare,
          halfmoves,
          fullmoves: Math.max(1, fullmoves)
        };
      })));
    });
  };
  const makePiece = (piece) => {
    let r2 = roleToChar(piece.role);
    if (piece.color === "white")
      r2 = r2.toUpperCase();
    if (piece.promoted)
      r2 += "~";
    return r2;
  };
  const makeBoardFen = (board) => {
    let fen = "";
    let empty = 0;
    for (let rank = 7; rank >= 0; rank--) {
      for (let file = 0; file < 8; file++) {
        const square = file + rank * 8;
        const piece = board.get(square);
        if (!piece)
          empty++;
        else {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          fen += makePiece(piece);
        }
        if (file === 7) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          if (rank !== 0)
            fen += "/";
        }
      }
    }
    return fen;
  };
  const makePocket = (material) => ROLES.map((role) => roleToChar(role).repeat(material[role])).join("");
  const makePockets = (pocket) => makePocket(pocket.white).toUpperCase() + makePocket(pocket.black);
  const makeCastlingFen = (board, castlingRights) => {
    let fen = "";
    for (const color of COLORS) {
      const backrank = SquareSet.backrank(color);
      let king = board.kingOf(color);
      if (defined(king) && !backrank.has(king))
        king = void 0;
      const candidates = board.pieces(color, "rook").intersect(backrank);
      for (const rook of castlingRights.intersect(backrank).reversed()) {
        if (rook === candidates.first() && defined(king) && rook < king) {
          fen += color === "white" ? "Q" : "q";
        } else if (rook === candidates.last() && defined(king) && king < rook) {
          fen += color === "white" ? "K" : "k";
        } else {
          const file = FILE_NAMES[squareFile(rook)];
          fen += color === "white" ? file.toUpperCase() : file;
        }
      }
    }
    return fen || "-";
  };
  const makeRemainingChecks = (checks) => `${checks.white}+${checks.black}`;
  const makeFen = (setup, opts) => [
    makeBoardFen(setup.board) + (setup.pockets ? `[${makePockets(setup.pockets)}]` : ""),
    setup.turn[0],
    makeCastlingFen(setup.board, setup.castlingRights),
    defined(setup.epSquare) ? makeSquare(setup.epSquare) : "-",
    ...setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : [],
    ...[Math.max(0, Math.min(setup.halfmoves, 9999)), Math.max(1, Math.min(setup.fullmoves, 9999))]
  ].join(" ");
  function legalMoves(chess) {
    const out = [];
    for (const [from, dests] of chess.allDests()) {
      for (const to of dests) {
        out.push({ from, to });
      }
    }
    return out;
  }
  function positionKey(fen) {
    const parts = fen.trim().split(/\s+/);
    return parts.slice(0, 4).join(" ");
  }
  function pieceSideKey(fen) {
    const parts = fen.trim().split(/\s+/);
    return `${parts[0]} ${parts[1]}`;
  }
  function encodeFenForAnalysisUrl(fen) {
    return encodeURIComponent(fen.trim()).replace(/%20/g, "_").replace(/%2F/g, "/");
  }
  function analysisBoardUrl(fen, pairId, bottomColor = "white") {
    const pathFen = encodeFenForAnalysisUrl(fen);
    const q = new URLSearchParams({
      pamMirror: pairId,
      pamOrient: bottomColor
    });
    return `https://lichess.org/analysis/standard/${pathFen}?${q.toString()}`;
  }
  function parsePamOrientParam() {
    const v = new URLSearchParams(location.search).get("pamOrient");
    return v === "white" || v === "black" ? v : null;
  }
  function parsePamMirrorParam() {
    const q = new URLSearchParams(location.search).get("pamMirror");
    return (q == null ? void 0 : q.trim()) || null;
  }
  function singleMoveUci(fromFen, toFen) {
    if (positionKey(fromFen) === positionKey(toFen)) return null;
    const from = parseFen(fromFen);
    const to = parseFen(toFen);
    if (!from.isOk || !to.isOk) return null;
    const pos = Chess.fromSetup(from.value);
    if (!pos.isOk) return null;
    const chess = pos.value;
    const targetKey = positionKey(toFen);
    for (const move of legalMoves(chess)) {
      const next = chess.clone();
      next.play(move);
      const nextFen = makeFen(next.toSetup());
      if (positionKey(nextFen) === targetKey) return makeUci(move);
    }
    return null;
  }
  const PAYLOAD_KEY = "ctLichessMirror.payload";
  const TARGET_KEY = "ctLichessMirror.targetId";
  const SEQ_KEY = "ctLichessMirror.seq";
  const APPLIED_SEQ_KEY = "ctLichessMirror.lastAppliedSeq";
  const SESSION_MIRROR = "pamMirrorId";
  function parsePayload(raw) {
    if (raw == null) return null;
    let obj;
    if (typeof raw === "string") {
      try {
        obj = JSON.parse(raw);
      } catch {
        return null;
      }
    } else if (typeof raw === "object") {
      obj = raw;
    } else {
      return null;
    }
    if (Number(obj.v) !== 1 || obj.from !== "ct") return null;
    const seq = Number(obj.seq);
    const fen = obj.fen;
    const targetId = obj.targetId;
    if (!Number.isFinite(seq) || typeof fen !== "string" || typeof targetId !== "string") {
      return null;
    }
    const prevFen = obj.prevFen;
    const bottomColor = obj.bottomColor;
    return {
      v: 1,
      seq,
      from: "ct",
      fen,
      prevFen: typeof prevFen === "string" ? prevFen : prevFen == null ? null : null,
      targetId,
      bottomColor: bottomColor === "white" || bottomColor === "black" ? bottomColor : void 0,
      ts: Number(obj.ts) || Date.now()
    };
  }
  function getMirrorSessionId() {
    return sessionStorage.getItem(SESSION_MIRROR);
  }
  function setMirrorSessionId(id) {
    sessionStorage.setItem(SESSION_MIRROR, id);
  }
  function getTargetId() {
    const v = GM_getValue(TARGET_KEY, void 0);
    return (v == null ? void 0 : v.trim()) || null;
  }
  function getPairingTargetId() {
    if (location.hostname === "lichess.org") {
      return parsePamMirrorParam() || getMirrorSessionId() || getTargetId() || null;
    }
    return getTargetId() || getMirrorSessionId() || parsePamMirrorParam() || null;
  }
  function setTargetId(id) {
    GM_setValue(TARGET_KEY, id);
  }
  function getLatestPayload() {
    return parsePayload(GM_getValue(PAYLOAD_KEY, void 0));
  }
  function getPublishedSeq() {
    return GM_getValue(SEQ_KEY, 0) || 0;
  }
  function publishFromCt(fen, prevFen, targetId, bottomColor) {
    const seq = getPublishedSeq() + 1;
    GM_setValue(SEQ_KEY, seq);
    const payload = {
      v: 1,
      seq,
      from: "ct",
      fen,
      prevFen,
      targetId,
      bottomColor,
      ts: Date.now()
    };
    GM_setValue(PAYLOAD_KEY, payload);
    mirrorLog("debug", "GM publish", { seq, targetId, fen });
  }
  function appliedSeqStorageKey(targetId) {
    return `${APPLIED_SEQ_KEY}.${targetId}`;
  }
  function loadLastAppliedSeqForTarget(targetId) {
    if (!targetId) return 0;
    const n2 = Number(GM_getValue(appliedSeqStorageKey(targetId), 0));
    return Number.isFinite(n2) && n2 > 0 ? n2 : 0;
  }
  function persistLastAppliedSeq(targetId, seq) {
    GM_setValue(appliedSeqStorageKey(targetId), seq);
  }
  function onMirrorPayload(handler) {
    GM_addValueChangeListener(PAYLOAD_KEY, (_key, _old, newValue) => {
      const p = parsePayload(newValue);
      if (!p) return;
      handler(p);
    });
  }
  let lastAppliedSeq = 0;
  function initLastAppliedSeqFromStorage() {
    const targetId = getPairingTargetId();
    lastAppliedSeq = loadLastAppliedSeqForTarget(targetId);
  }
  function getLastAppliedSeq() {
    return lastAppliedSeq;
  }
  function payloadMatchesSession(payload) {
    const targetId = getPairingTargetId();
    return !!(targetId && payload.targetId === targetId);
  }
  function shouldApply(payload) {
    if (!payloadMatchesSession(payload)) {
      mirrorLog("debug", "skip apply: target mismatch", {
        have: getPairingTargetId(),
        want: payload.targetId
      });
      return false;
    }
    if (payload.seq <= lastAppliedSeq) {
      mirrorLog("debug", "skip apply: stale seq", {
        seq: payload.seq,
        lastAppliedSeq
      });
      return false;
    }
    return true;
  }
  function markPayloadApplied(seq, targetId) {
    const tid = targetId ?? getPairingTargetId();
    if (seq > lastAppliedSeq) lastAppliedSeq = seq;
    if (tid && seq > 0) persistLastAppliedSeq(tid, seq);
  }
  function drainDiagnostics() {
    const p = getLatestPayload();
    const pairingTarget = getPairingTargetId();
    const matches = !!(p && payloadMatchesSession(p));
    return {
      hasPayload: !!p,
      payloadSeq: (p == null ? void 0 : p.seq) ?? null,
      payloadFen: (p == null ? void 0 : p.fen) ?? null,
      payloadTarget: (p == null ? void 0 : p.targetId) ?? null,
      pairingTarget,
      matches,
      wouldApply: !!(p && shouldApply(p))
    };
  }
  function startChessBoardPoll(onFen) {
    let lastSeen = null;
    setInterval(() => {
      if (!getTargetId()) return;
      const fen = readFenFromChessBoard();
      if (!fen) return;
      if (lastSeen && pieceSideKey(fen) === pieceSideKey(lastSeen)) return;
      lastSeen = fen;
      mirrorLog("debug", "board poll fen change", { fen });
      onFen(fen);
    }, 250);
  }
  const hookedExplorers = /* @__PURE__ */ new WeakSet();
  function hookOpeningExplorerSetPosition(onFen) {
    const hookOne = (explorer) => {
      if (!explorer.setPosition || hookedExplorers.has(explorer)) return false;
      hookedExplorers.add(explorer);
      const orig = explorer.setPosition.bind(explorer);
      explorer.setPosition = (fen) => {
        orig(fen);
        if (fen) onFen(fen);
      };
      mirrorLog("debug", "hooked opening-explorer.setPosition");
      return true;
    };
    const scan = () => {
      const el = document.querySelector("opening-explorer");
      return el ? hookOne(el) : false;
    };
    if (scan()) return;
    customElements.whenDefined("opening-explorer").then(scan);
    let tries = 0;
    const interval = setInterval(() => {
      if (scan() || ++tries >= 40) clearInterval(interval);
    }, 500);
  }
  const PROBE_WRAP_ID = "pam-ct-mirror-wrap";
  const PROBE_COMMENT_PREFIX = "pam-ct-mirror-probe:";
  let lastProbeJson = "";
  function removeLegacyProbeNodes() {
    var _a;
    (_a = document.getElementById("pam-ct-mirror-probe")) == null ? void 0 : _a.remove();
  }
  function probeComment(anchor) {
    for (const n2 of Array.from(anchor.childNodes)) {
      if (n2.nodeType !== Node.COMMENT_NODE) continue;
      const c = n2;
      if (c.data.startsWith(PROBE_COMMENT_PREFIX)) return c;
    }
    return null;
  }
  function ensureProbeHost() {
    if (document.getElementById(PROBE_WRAP_ID)) return;
    const el = document.createElement("div");
    el.id = PROBE_WRAP_ID;
    el.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:2147483646;display:flex;flex-direction:column;gap:6px;align-items:flex-end;max-width:min(360px,90vw);pointer-events:none;";
    const comment = document.createComment(`${PROBE_COMMENT_PREFIX}{}`);
    el.append(comment);
    document.body.append(el);
  }
  function writeDomProbe(partial) {
    const anchor = document.getElementById(PROBE_WRAP_ID);
    if (!anchor) return;
    const seq = partial.seq ?? GM_getValue("ctLichessMirror.seq", null) ?? null;
    const state = {
      v: 1,
      scriptVersion: scriptVersion(),
      host: location.hostname,
      path: location.pathname + location.search,
      ts: Date.now(),
      targetId: getPairingTargetId(),
      sessionId: getMirrorSessionId(),
      pamMirrorUrl: new URLSearchParams(location.search).get("pamMirror"),
      lastFen: partial.lastFen ?? null,
      boardFen: readFenFromChessBoard(),
      explorerFen: readFenFromExplorerElement(),
      seq,
      publishedSeq: getPublishedSeq(),
      lastAppliedSeq: getLastAppliedSeq(),
      ...location.hostname === "lichess.org" ? {
        drain: drainDiagnostics(),
        bridgeReady: window.__pamCtAnalysisReady ?? false
      } : {}
    };
    const json = JSON.stringify(state);
    if (json === lastProbeJson) return;
    lastProbeJson = json;
    let comment = probeComment(anchor);
    if (!comment) {
      comment = document.createComment(`${PROBE_COMMENT_PREFIX}${json}`);
      anchor.append(comment);
    } else {
      comment.data = `${PROBE_COMMENT_PREFIX}${json}`;
    }
  }
  const BTN_ID = "pam-ct-open-lichess";
  const BTN_LABEL = "mirror in lichess";
  let lastFen = null;
  let debounceTimer = null;
  function mirrorButton() {
    return document.getElementById(BTN_ID);
  }
  function setButtonTitle(text) {
    const btn = mirrorButton();
    if (btn) btn.title = text;
  }
  function onFenChange(fen) {
    if (lastFen && pieceSideKey(lastFen) === pieceSideKey(fen)) return;
    const prev = lastFen;
    lastFen = fen;
    const targetId = getTargetId();
    if (!targetId) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      mirrorLog("debug", "publish", { fen, prev, targetId });
      publishFromCt(fen, prev, targetId, readBottomColorFromBoard());
      writeDomProbe({ lastFen: fen });
    }, 120);
  }
  function styleMirrorButton(btn) {
    btn.textContent = BTN_LABEL;
    btn.type = "button";
    btn.style.cssText = "pointer-events:auto;cursor:pointer;margin:0;padding:8px 14px;border-radius:999px;border:none;background:#3d3d3d;color:#fff;font:500 13px/1.2 system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,0.35);white-space:nowrap;";
    btn.title = "Open Lichess analysis at this position and mirror further moves from ChessTempo";
  }
  function injectUi() {
    var _a, _b;
    if (!document.body) return;
    ensureProbeHost();
    const wrap = document.getElementById(PROBE_WRAP_ID);
    if (!wrap) return;
    (_a = document.getElementById("pam-ct-mirror-status")) == null ? void 0 : _a.remove();
    (_b = wrap.querySelector("[data-pam-ct-ui-row]")) == null ? void 0 : _b.remove();
    let btn = mirrorButton();
    if (!btn) {
      btn = document.createElement("button");
      btn.id = BTN_ID;
      btn.addEventListener("click", () => {
        const fen = readCurrentCtFen(lastFen);
        const diag = fenDiagnostics();
        mirrorLog("info", "mirror in lichess click", { fen, ...diag });
        if (!fen) {
          setButtonTitle("No position — reload training or check console [ct-mirror]");
          mirrorLog("warn", "no FEN", diag);
          return;
        }
        const pairId = crypto.randomUUID();
        const bottomColor = readBottomColorFromBoard();
        setTargetId(pairId);
        lastFen = fen;
        publishFromCt(fen, null, pairId, bottomColor);
        GM_openInTab(analysisBoardUrl(fen, pairId, bottomColor), { active: true });
        setButtonTitle("Mirroring — play moves on ChessTempo");
        mirrorLog("info", "opened tab", { pairId, fen });
        writeDomProbe({ lastFen: fen });
      });
      wrap.insertBefore(btn, wrap.firstChild);
    }
    styleMirrorButton(btn);
    if (isDebugEnabled()) {
      btn.title = "Debug on — see console [ct-mirror]";
    }
    writeDomProbe({ lastFen });
  }
  function startChesstempoMirror() {
    removeLegacyProbeNodes();
    mirrorLog("info", "CT mirror start", {
      injectInto: "page",
      debug: isDebugEnabled()
    });
    hookOpeningExplorerSetPosition(onFenChange);
    startChessBoardPoll(onFenChange);
    const mount = () => {
      injectUi();
      const fen = readCurrentCtFen(lastFen);
      if (fen && !lastFen) {
        lastFen = fen;
        mirrorLog("debug", "seed FEN from board", { fen });
      }
    };
    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });
    const uiInterval = setInterval(() => {
      mount();
      if (mirrorButton()) clearInterval(uiInterval);
    }, 500);
    setTimeout(() => clearInterval(uiInterval), 12e4);
    setInterval(() => writeDomProbe({ lastFen }), 2e3);
  }
  const bridgeSource = "/* Runs in the page main world (not TM isolated world). */\n(() => {\n  if (window.__pamCtLichessBridge) return;\n  const pieceSideKey = (fen) => {\n    const p = fen.trim().split(/\\s+/);\n    return `${p[0]} ${p[1]}`;\n  };\n  const currentFen = () => window.site?.analysis?.node?.fen ?? null;\n  const waitPlayUci = () =>\n    new Promise((resolve) => {\n      if (window.lichess?.analysis?.playUci) {\n        resolve(window.lichess.analysis.playUci);\n        return;\n      }\n      const deadline = Date.now() + 60_000;\n      const tick = () => {\n        if (window.lichess?.analysis?.playUci) {\n          resolve(window.lichess.analysis.playUci);\n          return;\n        }\n        if (Date.now() > deadline) {\n          resolve(null);\n          return;\n        }\n        setTimeout(tick, 50);\n      };\n      tick();\n    });\n  const pamOrientFromUrl = () => {\n    const v = new URLSearchParams(location.search).get('pamOrient');\n    return v === 'black' || v === 'white' ? v : 'white';\n  };\n  const applyOrient = (bottomColor) => {\n    const want = bottomColor || pamOrientFromUrl();\n    const g = window.lichess?.chessground?.();\n    if (g && want && g.state.orientation !== want) {\n      g.set({ orientation: want });\n    }\n  };\n  const settleOrient = async (bottomColor) => {\n    applyOrient(bottomColor);\n    await new Promise((r) => setTimeout(r, 0));\n    applyOrient(bottomColor);\n    await new Promise((r) => setTimeout(r, 80));\n    applyOrient(bottomColor);\n  };\n  void waitPlayUci().then(() => settleOrient(pamOrientFromUrl()));\n  document.addEventListener('pam-ct-apply-position', async (ev) => {\n    const d = ev.detail || {};\n    const { id, fen, uci, navigateUrl, bottomColor } = d;\n    let result = 'failed';\n    try {\n      const playUci = await waitPlayUci();\n      await settleOrient(bottomColor);\n      const here = currentFen();\n      if (here && pieceSideKey(here) === pieceSideKey(fen)) {\n        result = 'at_target';\n      } else if (playUci && uci) {\n        playUci(uci);\n        for (let i = 0; i < 40; i++) {\n          await new Promise((r) => setTimeout(r, 40));\n          const after = currentFen();\n          if (after && pieceSideKey(after) === pieceSideKey(fen)) {\n            result = 'played';\n            break;\n          }\n        }\n        if (result === 'played') await settleOrient(bottomColor);\n      }\n      if (result === 'failed' && navigateUrl && location.href !== navigateUrl) {\n        result = 'navigating';\n        location.assign(navigateUrl);\n      } else if (result === 'failed' && here && pieceSideKey(here) === pieceSideKey(fen)) {\n        result = 'at_target';\n      }\n    } catch (e) {\n      result = 'failed';\n    }\n    document.dispatchEvent(\n      new CustomEvent('pam-ct-apply-result', { detail: { id, result } }),\n    );\n  });\n  window.__pamCtLichessBridge = true;\n  document.dispatchEvent(new CustomEvent('pam-ct-bridge-ready'));\n})();\n";
  function installPageBridge() {
    if (document.getElementById("pam-ct-page-bridge-installed")) return;
    const marker = document.createElement("div");
    marker.id = "pam-ct-page-bridge-installed";
    marker.hidden = true;
    document.documentElement.append(marker);
    GM_addElement("script", {
      id: "pam-ct-page-bridge",
      textContent: bridgeSource
    });
  }
  function waitForPageBridge() {
    return new Promise((resolve) => {
      const done = () => {
        document.removeEventListener("pam-ct-bridge-ready", done);
        resolve();
      };
      document.addEventListener("pam-ct-bridge-ready", done);
      installPageBridge();
      setTimeout(() => {
        document.removeEventListener("pam-ct-bridge-ready", done);
        resolve();
      }, 6e4);
    });
  }
  function applyViaPageBridge(fen, prevFen, bottomColor) {
    const pairId = getMirrorSessionId() || parsePamMirrorParam();
    const orient = bottomColor ?? parsePamOrientParam() ?? "white";
    const navigateUrl = pairId ? analysisBoardUrl(fen, pairId, orient) : `https://lichess.org/analysis/standard/${encodeFenForAnalysisUrl(fen)}`;
    const uciMove = prevFen && prevFen !== fen ? singleMoveUci(prevFen, fen) : null;
    const id = crypto.randomUUID();
    return new Promise((resolve) => {
      const onResult = (ev) => {
        const detail = ev.detail;
        if (!detail || detail.id !== id) return;
        document.removeEventListener("pam-ct-apply-result", onResult);
        resolve(detail.result ?? "failed");
      };
      document.addEventListener("pam-ct-apply-result", onResult);
      document.dispatchEvent(
        new CustomEvent("pam-ct-apply-position", {
          detail: {
            id,
            fen,
            uci: uciMove,
            navigateUrl,
            bottomColor: orient
          }
        })
      );
      setTimeout(() => {
        document.removeEventListener("pam-ct-apply-result", onResult);
        resolve("failed");
      }, 12e3);
    });
  }
  let drainInFlight = false;
  let pendingPayload = null;
  let analysisReady = false;
  async function drainPayload(payload) {
    if (!analysisReady) return;
    if (!shouldApply(payload)) return;
    if (drainInFlight) {
      if (!pendingPayload || payload.seq > pendingPayload.seq) {
        pendingPayload = payload;
      }
      return;
    }
    drainInFlight = true;
    try {
      if (!getMirrorSessionId()) setMirrorSessionId(payload.targetId);
      mirrorLog("info", "apply position", {
        seq: payload.seq,
        fen: payload.fen,
        prevFen: payload.prevFen
      });
      writeDomProbe({ lastFen: payload.fen, seq: payload.seq });
      const result = await applyViaPageBridge(
        payload.fen,
        payload.prevFen,
        payload.bottomColor
      );
      if (result === "navigating") {
        markPayloadApplied(payload.seq, payload.targetId);
        mirrorLog("info", "marked applied (navigating)", { seq: payload.seq });
        return;
      }
      if (result === "at_target" || result === "played") {
        markPayloadApplied(payload.seq, payload.targetId);
        mirrorLog("info", "marked applied", { seq: payload.seq, result });
      } else {
        mirrorLog("warn", "position not at target after apply", {
          seq: payload.seq,
          want: payload.fen,
          result
        });
      }
    } catch (e2) {
      mirrorLog("warn", "drain failed", { seq: payload.seq, err: String(e2) });
    } finally {
      drainInFlight = false;
      const next = pendingPayload;
      pendingPayload = null;
      if (next && shouldApply(next)) void drainPayload(next);
    }
  }
  function startLichessMirror() {
    const mountProbe = () => ensureProbeHost();
    if (document.body) mountProbe();
    else document.addEventListener("DOMContentLoaded", mountProbe, { once: true });
    const fromUrl = parsePamMirrorParam();
    if (fromUrl) {
      setMirrorSessionId(fromUrl);
      setTargetId(fromUrl);
    }
    initLastAppliedSeqFromStorage();
    void waitForPageBridge().then(() => {
      analysisReady = true;
      window.__pamCtAnalysisReady = true;
      mirrorLog("info", "Lichess mirror listening (page bridge)", {
        pamMirror: fromUrl,
        session: getMirrorSessionId(),
        targetId: getTargetId()
      });
      const latest = getLatestPayload();
      if (latest) void drainPayload(latest);
      setInterval(() => {
        const p = getLatestPayload();
        if (p) void drainPayload(p);
      }, 400);
    });
    setInterval(() => writeDomProbe({}), 2e3);
    onMirrorPayload((payload) => {
      mirrorLog("debug", "payload event", { seq: payload.seq });
      void drainPayload(payload);
    });
  }
  if (window.__pamCtMirrorLoaded) ;
  else {
    window.__pamCtMirrorLoaded = true;
    const host = location.hostname;
    if (host === "lichess.org" && location.pathname.startsWith("/analysis")) {
      startLichessMirror();
    } else if (host.includes("chesstempo.com")) {
      startChesstempoMirror();
    }
  }

})();