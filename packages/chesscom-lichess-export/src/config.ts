export const GAME_PATH_FRAGMENTS = ['/game/', '/play/', '/analysis/game/'];

export const ABORTED_GAME_SELECTORS = [
  '.game-over-modal-header-is-v6-aborted',
  '.game-over-aborted-body-component',
  '.game-over-header-abortedIcon',
];

/** Injection anchors — data-cy first (current chess.com), class fallbacks. */
export const BUTTON_ANCHOR_SELECTORS = [
  '[data-cy="game-over-modal-shell-buttons"]',
  '.game-over-modal-shell-buttons',
  '.game-over-buttons-component',
  '[data-cy="game-review-buttons-component"]',
  '.game-review-buttons-component',
];

export const SHARE_MODAL_SELECTORS = {
  modal: '[data-cy="share-menu-modal"], #share-modal',
  downloadBtn: 'button',
  injectId: 'cc2l-share-export-btn',
} as const;

export const PGN_SELECTORS = {
  secondaryMenu:
    '.game-controls-secondary-more > button, .game-controls-secondary-button > button',
  shareBtn:
    '[data-cy="sidebar-share-icon"], ' +
    '[data-cy="analysis-secondary-controls-menu-open-share"], ' +
    'button[aria-label="Share"], ' +
    'button.share-button-component.icon-share, ' +
    'button.share-button-component.share, ' +
    '#shareMenuButton',
  pgnTabActive: '#tab-pgn.cc-tab-item-active, [data-cy="pgn-tab-button"][aria-selected="true"]',
  pgnTab:
    '#tab-pgn, [data-cy="pgn-tab-button"], #live_ShareMenuGlobalDialogDownloadButton',
  dialogButtons:
    'dialog button, [role="dialog"] button, [class*="modal"] button, [class*="share"] button',
  textarea:
    '.share-menu-tab-pgn-textarea, ' +
    '#live_ShareMenuPgnContentTextareaId, ' +
    'textarea[name=pgn], ' +
    'textarea[aria-label="PGN"], ' +
    '#chessboard_ShareMenuPgnContentTextareaId',
  timestampsCheckbox: '#tab-pgn-timestamps',
  closeBtn:
    '.cc-close-button-component, ' +
    '[data-cy="modal-close-button"], ' +
    '#live_ShareMenuGlobalDialogCloseButton, ' +
    'button.ui_outside-close-component, ' +
    '#chessboard_ShareMenuGlobalDialogCloseButton',
} as const;

export const WIN_MODAL_TEXT = ['You Won', 'You Lost', 'Draw'];
