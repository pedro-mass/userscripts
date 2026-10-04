/// <reference types="vite/client" />

interface Site {
  load: Promise<void>;
  analysis?: LichessAnalyseCtrl;
}

interface LichessAnalyseCtrl {
  path: string;
  node: { fen: string; ply: number; san: string; comments?: unknown[] };
  study?: LichessStudyCtrl;
  userJump(path: string): void;
}

interface LichessStudyCtrl {
  data: { study: { id: string; name: string } };
  vm: { chapterId: string; mode: { write: boolean } };
  makeChange(
    type: string,
    data: { ch: string; path: string; text: string },
  ): boolean;
}

interface Window {
  site?: Site;
  lichess?: {
    events: {
      on(name: string, fn: (...args: unknown[]) => void): void;
    };
    analysis?: { playUci(uci: string): void };
  };
}
