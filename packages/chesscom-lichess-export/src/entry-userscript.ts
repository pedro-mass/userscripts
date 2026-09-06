import { setPlatform } from './platform/context';
import { userscriptPlatform } from './platform/userscript';

setPlatform(userscriptPlatform);

void import('./app').then(({ startApp }) => startApp());
