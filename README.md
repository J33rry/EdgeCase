# EdgeCase

A Chrome extension for LeetCode:

- **Me**: your profile, with solved counts by difficulty, rank, contest rating, streak and recent solves.
- **Friends**: add friends by username and see a leaderboard you can sort by solved count, contest rating or most recent activity.
- **Tutor**: on any `leetcode.com/problems/*` page, a side panel with an AI coach. It explains the problem, walks through examples, gives hints in three levels, names patterns, sets a complexity target, lists edge cases and reviews your approach. It can also **review the code in your LeetCode editor**, pointing out failing inputs and complexity. It **won't write or fix the solution for you.**

```
extension/   React + Vite + CRXJS (Manifest V3)
server/      Next.js. /api/tutor sends requests to any OpenAI-compatible AI provider
```

## 1. Run the server

```bash
npm install
cp server/.env.example server/.env.local
```

Fill in `server/.env.local`:

| Variable | What it is |
|---|---|
| `AI_BASE_URL` | Any OpenAI-compatible endpoint (OpenAI, Groq, OpenRouter, Gemini's OpenAI endpoint, Ollama…). There are examples in `.env.example`. |
| `AI_API_KEY` | Your provider key. It stays on the server. |
| `AI_MODEL` | The provider's model name. |
| `ALLOWED_ORIGINS` | `chrome-extension://<your-extension-id>` (see step 2). Separate several with commas. |
| `RATE_LIMIT_PER_HOUR` | Requests allowed per install and per IP each hour (default 40). |
| `MAX_OUTPUT_TOKENS` | Reply length cap (default 1200). |
| `MAX_TOKENS_PARAM` | Set to `max_completion_tokens` if your model rejects `max_tokens`. |

```bash
npm run dev:server        # http://localhost:3000
```

## 2. Load the extension

```bash
cp extension/.env.example extension/.env   # sets VITE_SERVER_URL (default http://localhost:3000)
npm run build -w extension     # or: npm run dev:ext  (rebuilds as you edit)
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose `extension/dist`.
3. Copy the extension's ID from its card on `chrome://extensions`, put `chrome-extension://<that-id>` in `ALLOWED_ORIGINS`, then restart the server.
4. Sign in to leetcode.com in the same browser so your profile is detected automatically. You can also enter your username under ⚙ in the popup.

## 3. Deploy the server (Vercel)

1. Import the repo into Vercel with **Root Directory** set to `server`.
2. Add the environment variables from step 1.
3. Set `VITE_SERVER_URL` in `extension/.env` to the deployed URL (copy `extension/.env.example` if the file doesn't exist), then rebuild with `npm run build -w extension`. The URL is fixed at build time, and users can't change it.

> **Rate limiting on Vercel:** `server/lib/rateLimit.js` keeps its counts in memory, and serverless instances don't share memory. Before you share the extension widely, swap it for a shared store such as [Upstash Ratelimit](https://github.com/upstash/ratelimit-js), because you pay for every tutor request.

## How it works

- **LeetCode data** comes from `leetcode.com/graphql` and is fetched by the background service worker (`extension/src/lib/leetcode.js`). A session-scoped `declarativeNetRequest` rule sets `Origin`/`Referer` to leetcode.com, but only on requests the extension itself makes. Results are cached for 10 minutes, and ↻ refreshes them.
- **Friends** are stored in `chrome.storage.sync`, so the list follows your Chrome profile (50 at most).
- **Tutor chats** are saved per problem in `chrome.storage.session` and cleared when the browser closes. The panel runs inside a Shadow DOM so LeetCode's CSS doesn't affect it.
- **Review my code** reads the LeetCode editor through `chrome.scripting.executeScript` in the page's main world, because LeetCode's Monaco editor isn't visible to content scripts. If the editor still has the starter code, the review isn't sent. Anything typed in the chat box is sent along with the code.
- **Guardrails** live in the system prompt in `server/lib/prompt.js`. The server also checks and trims every request before passing it to the provider.

## Notes and limits

- LeetCode's GraphQL API is unofficial and can change without notice. If profiles stop loading, check the queries in `extension/src/lib/leetcode.js` first.
- Premium problems only work if your account can see them.
- The extension ID changes if you load the extension from a different folder. To pin it, add a `"key"` to `extension/manifest.json`.
