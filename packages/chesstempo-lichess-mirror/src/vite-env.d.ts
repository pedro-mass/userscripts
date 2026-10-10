/// <reference types="vite/client" />

declare const __CT_MIRROR_VERSION__: string;

interface GMInfoScript {
  version?: string;
  name?: string;
}
declare const GM_info: { script: GMInfoScript };

interface Site {
  load: Promise<void>;
  analysis?: {
    node: { fen: string };
  };
}

interface Window {
  site?: Site;
  lichess?: {
    analysis?: {
      playUci(uci: string, uciQueue?: string[]): void;
    };
    chessground?: () => {
      getFen(): string;
      state: { orientation: 'white' | 'black' };
      set(opts: { orientation: 'white' | 'black' }): void;
    };
  };
}

declare const GM_setValue: (name: string, value: unknown) => void;
declare const GM_getValue: <T>(name: string, defaultValue?: T) => T;
declare const GM_addValueChangeListener: (
  name: string,
  listener: (
    name: string,
    oldValue: unknown,
    newValue: unknown,
    remote: boolean,
  ) => void,
) => number;
interface GmOpenTab {
  closed?: boolean;
  close?: () => void;
  onclosed?: () => void;
}

declare const GM_openInTab: (
  url: string,
  options?: { active?: boolean; insert?: boolean; setParent?: boolean },
) => GmOpenTab | undefined;
declare const GM_addElement: (
  tagName: string,
  attributes: Record<string, string>,
) => HTMLElement;
