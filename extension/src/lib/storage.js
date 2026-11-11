// Thin promise wrappers around chrome.storage.
// sync  → settings + friends (follow the user's Chrome profile)
// local → API response cache, install id
// session → per-problem tutor chat (cleared when the browser closes)

// Tutor backend, fixed at build time: VITE_SERVER_URL=https://… npm run build
export const SERVER_URL = (import.meta.env.VITE_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function getSettings() {
  const { settings } = await chrome.storage.sync.get("settings");
  return { username: settings?.username || "" };
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const settings = { ...current, ...patch };
  await chrome.storage.sync.set({ settings });
  return settings;
}

export async function getFriends() {
  const { friends } = await chrome.storage.sync.get("friends");
  return Array.isArray(friends) ? friends : [];
}

export async function setFriends(friends) {
  await chrome.storage.sync.set({ friends });
  return friends;
}

export async function cacheGet(key) {
  const k = `cache:${key}`;
  const { [k]: entry } = await chrome.storage.local.get(k);
  if (entry && Date.now() - entry.at < CACHE_TTL_MS) return entry.value;
  return undefined;
}

export async function cacheSet(key, value) {
  await chrome.storage.local.set({ [`cache:${key}`]: { at: Date.now(), value } });
}

export async function cacheDelete(key) {
  await chrome.storage.local.remove(`cache:${key}`);
}

export async function getInstallId() {
  const { installId } = await chrome.storage.local.get("installId");
  if (installId) return installId;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ installId: id });
  return id;
}

export async function getChat(slug) {
  const k = `chat:${slug}`;
  const { [k]: chat } = await chrome.storage.session.get(k);
  return chat || { messages: [], hintLevel: 0 };
}

export async function saveChat(slug, chat) {
  await chrome.storage.session.set({ [`chat:${slug}`]: chat });
}

export async function clearChat(slug) {
  await chrome.storage.session.remove(`chat:${slug}`);
}
