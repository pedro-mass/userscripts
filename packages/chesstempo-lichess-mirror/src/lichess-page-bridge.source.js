/* Runs in the page main world (not TM isolated world). */
(() => {
  if (window.__pamCtLichessBridge) return;
  const pieceSideKey = (fen) => {
    const p = fen.trim().split(/\s+/);
    return `${p[0]} ${p[1]}`;
  };
  const currentFen = () => window.site?.analysis?.node?.fen ?? null;
  const waitPlayUci = () =>
    new Promise((resolve) => {
      if (window.lichess?.analysis?.playUci) {
        resolve(window.lichess.analysis.playUci);
        return;
      }
      const deadline = Date.now() + 60_000;
      const tick = () => {
        if (window.lichess?.analysis?.playUci) {
          resolve(window.lichess.analysis.playUci);
          return;
        }
        if (Date.now() > deadline) {
          resolve(null);
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  const applyOrient = (bottomColor) => {
    const g = window.lichess?.chessground?.();
    if (g && bottomColor && g.state.orientation !== bottomColor) {
      g.set({ orientation: bottomColor });
    }
  };
  document.addEventListener('pam-ct-apply-position', async (ev) => {
    const d = ev.detail || {};
    const { id, fen, uci, navigateUrl, bottomColor } = d;
    let result = 'failed';
    try {
      const playUci = await waitPlayUci();
      applyOrient(bottomColor);
      const here = currentFen();
      if (here && pieceSideKey(here) === pieceSideKey(fen)) {
        result = 'at_target';
      } else if (playUci && uci) {
        playUci(uci);
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 40));
          const after = currentFen();
          if (after && pieceSideKey(after) === pieceSideKey(fen)) {
            result = 'played';
            break;
          }
        }
      }
      if (result === 'failed' && navigateUrl && location.href !== navigateUrl) {
        result = 'navigating';
        location.assign(navigateUrl);
      } else if (result === 'failed' && here && pieceSideKey(here) === pieceSideKey(fen)) {
        result = 'at_target';
      }
    } catch (e) {
      result = 'failed';
    }
    document.dispatchEvent(
      new CustomEvent('pam-ct-apply-result', { detail: { id, result } }),
    );
  });
  window.__pamCtLichessBridge = true;
  document.dispatchEvent(new CustomEvent('pam-ct-bridge-ready'));
})();
