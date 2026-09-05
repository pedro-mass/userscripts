/**
 * Polls document.querySelector until an element matches an optional predicate.
 */
export function waitForElement<T extends Element>(
  selector: string,
  options: { timeoutMs?: number; predicate?: (el: T) => boolean } = {},
): Promise<T> {
  const { timeoutMs = 5000, predicate } = options;

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const check = (): void => {
      const el = document.querySelector<T>(selector);
      if (el && (!predicate || predicate(el))) {
        resolve(el);
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(`waitForElement timed out: "${selector}"`));
        return;
      }
      setTimeout(check, 100);
    };

    check();
  });
}
