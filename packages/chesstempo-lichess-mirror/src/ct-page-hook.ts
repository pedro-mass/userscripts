/** Runs in the page JS world (inline script). Patches CT and emits fen events. */
export const CT_PAGE_HOOK_SOURCE = `
(function () {
  if (window.__pamCtPageHook) return;
  window.__pamCtPageHook = true;
  var EVT = 'pam-ct-mirror-fen';
  function emit(fen) {
    if (!fen) return;
    document.querySelector('opening-explorer')?.setAttribute('data-pam-mirror-fen', fen);
    window.dispatchEvent(new CustomEvent(EVT, { detail: { fen: fen } }));
  }
  function hookExplorer() {
    var explorer = document.querySelector('opening-explorer');
    if (!explorer || !explorer.setPosition || explorer.dataset.pamMirrorPageHook === '1') return;
    explorer.dataset.pamMirrorPageHook = '1';
    var orig = explorer.setPosition.bind(explorer);
    explorer.setPosition = function (fen) {
      orig(fen);
      emit(fen);
    };
    if (explorer.fen) emit(explorer.fen);
  }
  hookExplorer();
  customElements.whenDefined('opening-explorer').then(hookExplorer);
  new MutationObserver(hookExplorer).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
`;

export const CT_MIRROR_FEN_EVENT = 'pam-ct-mirror-fen';
