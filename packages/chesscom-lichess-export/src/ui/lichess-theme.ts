/**
 * Lichess lila theme accents (lichess-org/lila ui/lib/css/theme).
 * Site chrome is light (warm white) or dark (near-black) + orange --c-brag accent.
 */
export const LICHESS_THEME = {
  /** --c-brag: DONATE, active tabs, main orange accent (dark + light) */
  brag: 'hsl(37 74% 43%)',
  bragHover: 'hsl(37 100% 70%)',
  /** --c-accent: stronger orange for emphasis */
  accent: 'hsl(22 100% 42%)',
  accentHover: 'hsl(22 100% 48%)',
  textOnBrand: '#ffffff',
  buttonShadow: '0 2px 4px 0 hsl(0 0% 0% / 0.225)',
  textShadow: '0.5px 0.5px 0 rgb(0 0 0 / 0.5)',
  radius: '3px',
} as const;
