export function watchElement(
  root: ParentNode,
  onChange: MutationCallback,
): MutationObserver {
  const observer = new MutationObserver(onChange);
  observer.observe(root, { childList: true, subtree: true });
  return observer;
}
