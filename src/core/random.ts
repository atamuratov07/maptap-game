export function pickRandomIds(ids: string[], count: number): string[] {
  if (ids.length === 0 || count <= 0) {
    return [];
  }

  const pool = [...ids];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}
