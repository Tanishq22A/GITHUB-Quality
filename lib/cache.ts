// Simple in-memory TTL cache. Lives in the Node.js module scope,
// so it persists across requests on a warm server instance.

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs = TTL_MS): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function cacheKey(owner: string, repo: string): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
}
