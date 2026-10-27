// Turns whatever the user pasted (URL, @handle, handle with spaces) into a clean handle.

const SKIP_SEGMENTS = new Set([
  'u', 'user', 'users', 'profile', 'profiles', 'people', 'member', 'members', 'id', 'in', 'player', 'member.php',
  'accounts', 'wiki', 'feed', 'author', 'authors', 'stats', '@',
]);

/** Generic parser: URL -> first meaningful path segment, "@name" -> "name". */
export function parseHandle(raw: string): string {
  let s = String(raw ?? '').trim();
  if (!s) return '';

  const looksLikeUrl = /^https?:\/\//i.test(s) || /^([\w-]+\.)+[a-z]{2,}\/\S+/i.test(s);
  if (looksLikeUrl) {
    try {
      const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      const segs = url.pathname.split('/').filter(Boolean).map(safeDecode);
      const seg = segs.find((x) => !SKIP_SEGMENTS.has(x.toLowerCase()));
      s = seg ?? '';
    } catch {
      /* not a URL after all */
    }
  }

  s = s.replace(/^[@~]+/, '').replace(/^User:/i, '').split(/[/?#\s]/)[0].trim();
  return isSafeHandle(s) ? s : '';
}

export function isSafeHandle(s: string): boolean {
  return s.length > 0 && s.length <= 100 && !s.includes('..') && /^[\p{L}\p{N}_.@+:'-]+$/u.test(s);
}

export function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
