import { fetchProfile, fetchQuestion, fetchSignedInUser } from "../lib/leetcode.js";
import {
  cacheDelete,
  cacheGet,
  cacheSet,
  getFriends,
  getInstallId,
  getSettings,
  SERVER_URL,
  setFriends,
} from "../lib/storage.js";

// ---- Setup ---------------------------------------------------------------

// LeetCode rejects GraphQL POSTs whose Origin isn't leetcode.com. This rule
// rewrites Origin/Referer only for requests made by this extension
// (tabId -1 = not from a tab), never for the user's own browsing.
async function installHeaderRule() {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { header: "origin", operation: "set", value: "https://leetcode.com" },
            { header: "referer", operation: "set", value: "https://leetcode.com/" },
          ],
        },
        condition: {
          urlFilter: "|https://leetcode.com/graphql",
          tabIds: [-1],
          resourceTypes: ["xmlhttprequest", "other"],
        },
      },
    ],
  });
}

// Let the content script read/write per-problem chats in storage.session.
chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" });
const ready = installHeaderRule().catch((e) => console.error("DNR rule failed", e));

// ---- Data helpers --------------------------------------------------------

async function cached(key, force, load) {
  if (!force) {
    const hit = await cacheGet(key);
    if (hit !== undefined) return hit;
  }
  const value = await load();
  await cacheSet(key, value);
  return value;
}

const norm = (u) => u.trim().toLowerCase();

async function resolveMe() {
  const { username } = await getSettings();
  if (username) return username;
  try {
    return await fetchSignedInUser();
  } catch {
    return null;
  }
}

const getProfile = (username, force) =>
  cached(`profile:${norm(username)}`, force, () => fetchProfile(username));

// ---- Message handlers ----------------------------------------------------

const handlers = {
  async getMe({ force }) {
    const username = await resolveMe();
    if (!username) return { needsUsername: true };
    return { profile: await getProfile(username, force) };
  },

  async getFriends({ force }) {
    const [friends, me] = await Promise.all([getFriends(), resolveMe()]);
    const names = me && !friends.some((f) => norm(f) === norm(me)) ? [me, ...friends] : friends;
    const results = await Promise.allSettled(names.map((n) => getProfile(n, force)));
    return {
      me,
      rows: results.map((r, i) =>
        r.status === "fulfilled"
          ? { username: names[i], profile: r.value }
          : { username: names[i], error: r.reason?.message || "Failed to load" },
      ),
    };
  },

  async addFriend({ username }) {
    const name = (username || "").trim();
    if (!/^[\w.-]{1,40}$/.test(name)) throw new Error("That doesn't look like a LeetCode username.");
    const friends = await getFriends();
    if (friends.some((f) => norm(f) === norm(name))) throw new Error(`${name} is already in your list.`);
    if (friends.length >= 50) throw new Error("You can track up to 50 friends.");
    const profile = await getProfile(name, true); // throws if the user doesn't exist
    await setFriends([...friends, profile.username]);
    return { username: profile.username };
  },

  async removeFriend({ username }) {
    const friends = await getFriends();
    await setFriends(friends.filter((f) => norm(f) !== norm(username)));
    await cacheDelete(`profile:${norm(username)}`);
    return { ok: true };
  },

  async getProblem({ slug }) {
    return cached(`problem:${slug}`, false, () => fetchQuestion(slug));
  },

  // Reads the code in LeetCode's Monaco editor. Content scripts can't see the
  // page's `monaco` global, so run a function in the page's main world.
  async readCode(_msg, sender) {
    const tabId = sender.tab?.id;
    if (tabId == null) throw new Error("Can only read code from a LeetCode tab.");
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: readEditorInPage,
    });
    const value = result?.result;
    if (!value?.code?.trim()) throw new Error("Couldn't find any code in the LeetCode editor.");
    return value;
  },
};

// Runs inside leetcode.com, so it must be self-contained.
function readEditorInPage() {
  const ed = window.monaco?.editor;
  if (ed) {
    const editors = ed.getEditors ? ed.getEditors() : [];
    const models = editors.length ? editors.map((e) => e.getModel()) : ed.getModels();
    const code = models
      .filter((m) => m && m.getLanguageId() !== "plaintext")
      .sort((a, b) => b.getValueLength() - a.getValueLength())[0];
    if (code) return { code: code.getValue(), language: code.getLanguageId() };
  }
  // Fallback: rendered lines (may miss lines scrolled out of view).
  const view = document.querySelector(".view-lines");
  if (!view) return null;
  const lines = [...view.querySelectorAll(".view-line")]
    .sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top))
    .map((l) => l.textContent.replace(/\u00a0/g, " "));
  return { code: lines.join("\n"), language: "", partial: true };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = handlers[msg?.type];
  if (!handler) return false;
  ready
    .then(() => handler(msg, sender))
    .then((data) => sendResponse({ data }))
    .catch((err) => sendResponse({ error: err?.message || String(err) }));
  return true; // keep the channel open for the async response
});

// ---- Tutor streaming -----------------------------------------------------
// The content script opens a port named "tutor" and sends one request;
// we stream the backend's text response back chunk by chunk.

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "tutor") return;
  const abort = new AbortController();
  port.onDisconnect.addListener(() => abort.abort());

  port.onMessage.addListener(async (req) => {
    const post = (m) => {
      try {
        port.postMessage(m);
      } catch {
        /* port closed */
      }
    };
    try {
      const installId = await getInstallId();
      const res = await fetch(`${SERVER_URL}/api/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req, installId }),
        signal: abort.signal,
      });
      if (!res.ok) {
        let error = `Tutor server responded with ${res.status}.`;
        try {
          error = (await res.json()).error || error;
        } catch {
          /* not JSON */
        }
        return post({ type: "error", error });
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        post({ type: "chunk", text: decoder.decode(value, { stream: true }) });
      }
      post({ type: "done" });
    } catch (err) {
      if (abort.signal.aborted) return;
      post({
        type: "error",
        error: `Couldn't reach the tutor server (${err.message}). Try again in a moment.`,
      });
    }
  });
});
