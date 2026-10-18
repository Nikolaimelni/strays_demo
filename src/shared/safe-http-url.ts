// shelter sites and feed links are typed by somebody else, and React 19 puts an href
// through untouched, so `javascript:` in one runs on click. the CSP blocks it in
// production; this blocks it everywhere else too.
export const safeHttpUrl = (value: string | null): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};
