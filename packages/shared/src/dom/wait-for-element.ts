export function waitForElement(
  root: ParentNode,
  selector: string,
): Promise<Element> {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const element = root.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    const existing = root.querySelector(selector);
    if (existing) {
      observer.disconnect();
      resolve(existing);
    }
  });
}
