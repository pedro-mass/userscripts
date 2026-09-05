export function waitUntilTrue(
  checkFn: () => boolean,
  cb: () => void = () => {},
  timeout = 250,
): void {
  const intervalId = setInterval(() => {
    if (checkFn()) {
      clearInterval(intervalId);
      cb();
    }
  }, timeout);
}
