export function debounce<T extends (...args: never[]) => void>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function toNumber(input: string | null, defaultValue = 0): number {
  const number = parseFloat(input ?? '');
  return Number.isNaN(number) ? defaultValue : number;
}
