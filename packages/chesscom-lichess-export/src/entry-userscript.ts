import { setPlatform } from './platform/context';
import { userscriptPlatform } from './platform/userscript';

if (document.documentElement.dataset.cc2lExtension) {
  console.warn(
    '[cc2l] Extension active on this page; userscript will not run.',
  );
} else {
  setPlatform(userscriptPlatform);
  void import('./app').then(({ startApp }) => startApp());
}
