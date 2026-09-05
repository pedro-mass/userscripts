export const ids = {
  stats: 'pm-stats',
} as const;

export const selectors = {
  results: '.result-empty',
  stats: `#${ids.stats}`,
  puzzleHolder: '.puzzle__session',
} as const;

export const constants = {
  failure: 'result-false',
  success: 'result-true',
} as const;
