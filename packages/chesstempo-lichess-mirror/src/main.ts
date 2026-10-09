import { startChesstempoMirror } from './chesstempo';
import { startLichessMirror } from './lichess';

declare global {
  interface Window {
    __pamCtMirrorLoaded?: boolean;
    __pamCtAnalysisReady?: boolean;
  }
}

if (window.__pamCtMirrorLoaded) {
  /* double inject */
} else {
  window.__pamCtMirrorLoaded = true;
  const host = location.hostname;
  if (host === 'lichess.org' && location.pathname.startsWith('/analysis')) {
    startLichessMirror();
  } else if (host.includes('chesstempo.com')) {
    startChesstempoMirror();
  }
}
