// Request/response helper for talking to the background worker.
export async function ask(type, payload = {}) {
  const res = await chrome.runtime.sendMessage({ type, ...payload });
  if (!res) throw new Error("The extension background worker didn't respond. Try reopening.");
  if (res.error) throw new Error(res.error);
  return res.data;
}

export function timeAgo(ms) {
  if (!ms) return "—";
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, size] of units) if (s >= size) return `${Math.floor(s / size)}${label} ago`;
  return "just now";
}
