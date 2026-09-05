export type ButtonState = 'idle' | 'cached' | 'loading' | 'error';

export const MAIN_LABELS: Record<ButtonState, string> = {
  idle: 'Open in Lichess',
  cached: 'View on Lichess again',
  loading: 'Opening Lichess…',
  error: 'Import failed — retry',
};

export const SHARE_LABELS: Record<ButtonState, string> = {
  idle: 'Send to Lichess',
  cached: 'View on Lichess again',
  loading: 'Opening Lichess…',
  error: 'Import failed — retry',
};
