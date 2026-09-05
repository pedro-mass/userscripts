export const classes = {
  sectionTime: 'section-time',
  lectureProgressTime: 'lecture-progress-time',
} as const;

export const selectors = {
  sectionCard: '[class^=section--section--] > .panel-body',
  sectionHeader: '[class^=section--section-heading--]',
  sectionTitle: '[class^=section--section-heading--] > h3',
  sectionProgress: '[class^=section--section-heading--] > .text-secondary',
  sectionTime: `.${classes.sectionTime}`,
  lectureItem: '[class^=curriculum-item--curriculum-item--]',
  lectureTime: '[class^=curriculum-item--duration--]',
  lectureStatus: '[class^=curriculum-item--progress]',
  lectureProgress: '#top-detail > div.detail__progress > div > div.fx',
  lectureCompleted: '[class^=curriculum-item--is-completed]',
} as const;
