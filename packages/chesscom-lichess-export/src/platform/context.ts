import type { Platform } from './types';

let platform: Platform | null = null;

export function setPlatform(next: Platform): void {
  platform = next;
}

export function getPlatform(): Platform {
  if (!platform) {
    throw new Error('[cc2l] Platform not initialized');
  }
  return platform;
}
