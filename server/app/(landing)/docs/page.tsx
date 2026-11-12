import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsToc, { type TocGroup } from "@/components/docs/DocsToc";
import { REPO_URL } from "@/components/landing/config";

export const metadata: Metadata = {
  title: "Docs · EdgeCase",
  description: "Install EdgeCase, use the AI tutor on LeetCode, and self-host the server.",
};

const TOC: TocGroup[] = [
  {
    title: "Getting started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "install", label: "Install the extension" },
    ],
  },
  {
    title: "Using EdgeCase",
    items: [
      { id: "tutor", label: "AI tutor" },
      { id: "hints", label: "Hint levels" },
      { id: "review", label: "Review my code" },
      { id: "profile", label: "Profile & friends" },
    ],
  },
  {
    title: "Self-hosting",
    items: [
      { id: "server", label: "Run the server" },
      { id: "env", label: "Environment variables" },
      { id: "storage", label: "Redis & Postgres" },
      { id: "load", label: "Load the extension" },
      { id: "deploy", label: "Deploy to Vercel" },
    ],
  },
  {
    title: "Reference",
    items: [
      { id: "architecture", label: "How it works" },
      { id: "privacy", label: "Privacy & data" },
      { id: "limits", label: "Notes & limits" },
    ],
  },
];

const ACTIONS: [string, string][] = [
  ["Explain the problem", "What is actually being asked, in plain words."],
  ["Walk an example", "Steps through one of the examples so the expected output makes sense."],
  ["Give me a hint", "The next hint, one level deeper than the last."],
  ["Which pattern fits?", "Patterns that might apply, and what in the problem points to them."],
  ["Target complexity", "The time complexity to aim for, based on the constraints."],
  ["Edge cases", "Inputs worth thinking about before you submit."],
  ["Check my approach", "Describe your plan in words and get feedback on it."],
  ["Review my code", "Reads your editor and reviews what you wrote."],
];

const ENV: [string, string, string?][] = [
  ["AI_BASE_URL", "Any OpenAI-compatible endpoint: OpenAI, Groq, OpenRouter, Gemini's OpenAI endpoint, Ollama…", "required"],
  ["AI_API_KEY", "Your provider key. It stays on the server.", "required"],
  ["AI_MODEL", "The provider's model name, e.g. gpt-4o-mini.", "required"],
  ["ALLOWED_ORIGINS", "chrome-extension://<your-extension-id>. Separate several with commas.", "required"],
  ["RATE_LIMIT_PER_HOUR", "Requests allowed per install and per IP each hour. Default 40."],
  ["MAX_OUTPUT_TOKENS", "Reply length cap. Default 1200."],
  ["MAX_TOKENS_PARAM", "Set to max_completion_tokens if your model rejects max_tokens."],
  ["UPSTASH_REDIS_REST_URL / _TOKEN", "Upstash Redis for rate limiting. Empty means in-memory limits (local dev only)."],
  ["DATABASE_URL", "Neon Postgres connection string for analytics. Empty turns analytics off."],
  ["ANALYTICS_SALT", "Random string used to hash install ids. Set it once and don't change it."],
  ["ANALYTICS_PASSWORD / _SECRET", "Password for /analytics, and a random secret that signs its cookie."],
];

/* ───────────────────────── Small building blocks ───────────────────────── */

function Section({ id, eyebrow, title, children }: { id: string; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-white/[0.06] py-12 first:border-t-0 first:pt-0">
      {eyebrow && <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-ec-orange">{eyebrow}</p>}
      <h2 className="font-display mt-2 text-[clamp(1.75rem,3.2vw,2.25rem)] font-bold tracking-[-0.03em] text-white">{title}</h2>
      <div className="docs-prose mt-5">{children}</div>
    </section>
  );
}

function Callout({ tone = "green", title, children }: { tone?: "green" | "orange"; title: string; children: ReactNode }) {
  const c = tone === "green" ? "border-ec-green/30 bg-ec-green/[0.06]" : "border-ec-orange/30 bg-ec-orange/[0.06]";
  const t = tone === "green" ? "text-ec-green" : "text-ec-orange";
  return (
    <div className={`my-6 rounded-[14px] border px-5 py-4 ${c}`}>
      <p className={`text-[13px] font-semibold uppercase tracking-[0.08em] ${t}`}>{title}</p>
      <div className="mt-1.5 text-[15px] leading-[1.65] text-white/75">{children}</div>
    </div>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="docs-steps my-5 space-y-4">{children}</ol>;
}

const C = ({ children }: { children: ReactNode }) => <code className="docs-code">{children}</code>;

/* ───────────────────────── Page ───────────────────────── */

export default function DocsPage() {
  return (
    <main id="top" className="relative overflow-x-clip">
      <Navbar />
      {/* Same light as the landing page, kept to the header area. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(50% 70% at 10% 0%, rgba(255,150,0,0.12), transparent 70%), radial-gradient(45% 70% at 92% 0%, rgba(0,229,160,0.1), transparent 70%)",
        }}
      />

      <header className="relative mx-auto max-w-6xl px-4 pb-12 pt-32 sm:px-8 sm:pt-40">
        <p className="font-mono text-[13px] uppercase tracking-[0.16em] text-ec-green">Documentation</p>
        <h1 className="font-display mt-4 max-w-3xl text-[clamp(2.75rem,7vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.045em] text-white">
          Everything you need to get the tutor running.
        </h1>
        <p className="mt-5 max-w-2xl text-[clamp(1.05rem,1.8vw,1.25rem)] leading-[1.55] text-white/65">
          Install the extension, learn what the tutor can do, or run your own server with any OpenAI-compatible model.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#install" className="btn-primary h-12 gap-2 rounded-xl px-6 text-[16px]">
            Get started →
          </a>
          <a href="#server" className="btn-ghost h-12 rounded-xl px-6 text-[16px] font-medium">
            Self-host the server
          </a>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-24 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <DocsToc groups={TOC} />
          </div>
        </aside>

        <article className="min-w-0 max-w-[760px]">
          {/* ── Getting started ── */}
          <Section id="overview" eyebrow="Getting started" title="Overview">
            <p>
              EdgeCase is a Chrome extension for LeetCode. It puts an AI tutor beside every problem that helps you
              understand it without solving it for you, plus your profile stats and a leaderboard of your friends.
            </p>
            <div className="my-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Me", "Solved counts by difficulty, rank, contest rating, streak and recent solves."],
                ["Friends", "Add friends by username and sort a leaderboard by solved, rating or recent activity."],
                ["Tutor", "A side panel on every leetcode.com/problems page. It explains, hints and reviews, but never writes the solution."],
              ].map(([t, d], i) => (
                <div key={t} className="glass glass-edge rounded-[16px] p-5" style={{ ["--edge" as string]: i === 2 ? "linear-gradient(160deg, rgba(0,229,160,0.5), rgba(255,255,255,0.05) 50%)" : "linear-gradient(160deg, rgba(255,174,0,0.45), rgba(255,255,255,0.05) 50%)" }}>
                  <p className="text-[16px] font-semibold text-white">{t}</p>
                  <p className="mt-1.5 text-[14px] leading-[1.55] text-white/60">{d}</p>
                </div>
              ))}
            </div>
            <p>
              The repository has two parts: <C>extension/</C> (React, Vite and CRXJS, Manifest V3) and <C>server/</C>{" "}
              (Next.js), whose <C>/api/tutor</C> route forwards requests to your AI provider.
            </p>
          </Section>

          <Section id="install" title="Install the extension">
            <p>EdgeCase isn't on the Chrome Web Store yet, so you load it from a build:</p>
            <CodeBlock code={`git clone ${REPO_URL}.git\ncd EdgeCase\nnpm install\nnpm run build -w extension`} />
            <Steps>
              <li>
                Open <C>chrome://extensions</C> and turn on <strong>Developer mode</strong>.
              </li>
              <li>
                Click <strong>Load unpacked</strong> and choose <C>extension/dist</C>.
              </li>
              <li>
                Sign in to leetcode.com in the same browser so your profile is picked up. You can also enter your username
                under ⚙ in the popup.
              </li>
            </Steps>
            <Callout tone="orange" title="Needs a server">
              The tutor talks to an EdgeCase server. The build uses <C>VITE_SERVER_URL</C> from <C>extension/.env</C>{" "}
              (default <C>http://localhost:3000</C>). To run your own, see <a href="#server">Run the server</a>.
            </Callout>
          </Section>

          {/* ── Using EdgeCase ── */}
          <Section id="tutor" eyebrow="Using EdgeCase" title="AI tutor">
            <p>
              Open any problem on leetcode.com and click the <strong>EdgeCase</strong> launcher to open the tutor panel.
              Type a question, or start from one of the quick actions:
            </p>
            <div className="my-6 overflow-hidden rounded-[14px] border border-white/[0.08]">
              {ACTIONS.map(([a, d], i) => (
                <div key={a} className={`grid gap-1 px-5 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-6 ${i % 2 ? "bg-white/[0.015]" : ""} ${i ? "border-t border-white/[0.06]" : ""}`}>
                  <span className="text-[15px] font-medium text-white">{a}</span>
                  <span className="text-[15px] text-white/60">{d}</span>
                </div>
              ))}
            </div>
            <p>
              Chats are saved per problem for the browser session, so you can switch tabs and come back. Use the panel&apos;s
              Start over button to clear a chat.
            </p>
          </Section>

          <Section id="hints" title="Hint levels">
            <p>Hints go one level deeper each time you ask, so you can stop as soon as it clicks.</p>
            <div className="my-6 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Nudge", "What to notice in the problem."],
                ["2", "Direction", "Which idea or data structure to reach for."],
                ["3", "Key insight", "The core idea, still without code."],
              ].map(([n, t, d]) => (
                <div key={n} className="rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-5">
                  <span className="font-mono text-[12px] text-ec-green">LEVEL {n}/3</span>
                  <p className="mt-2 text-[16px] font-semibold text-white">{t}</p>
                  <p className="mt-1 text-[14px] text-white/60">{d}</p>
                </div>
              ))}
            </div>
            <Callout title="It won't write the solution">
              The tutor declines to write a complete or near-complete solution in any language or pseudocode, even if you
              insist. It offers the next hint instead.
            </Callout>
          </Section>

          <Section id="review" title="Review my code">
            <p>
              <strong>Review my code</strong> reads what's in the LeetCode editor and tells you whether it's correct, shows
              an input where it fails if it doesn't work, and gives its time and space complexity. It doesn't fix it for
              you.
            </p>
            <ul>
              <li>If the editor still has the starter code, nothing is sent.</li>
              <li>Anything you've typed in the chat box is sent along with the code, so you can ask about a specific part.</li>
            </ul>
          </Section>

          <Section id="profile" title="Profile & friends">
            <p>
              Click the EdgeCase icon in the toolbar. <strong>Me</strong> shows your LeetCode stats;{" "}
              <strong>Friends</strong> lets you add usernames and compare. Data comes straight from LeetCode, is cached for
              10 minutes, and ↻ refreshes it.
            </p>
            <p>Your friends list syncs with your Chrome profile and holds up to 50 people.</p>
          </Section>

          {/* ── Self-hosting ── */}
          <Section id="server" eyebrow="Self-hosting" title="Run the server">
            <CodeBlock code={`npm install\ncp server/.env.example server/.env.local`} />
            <p>
              Fill in <C>server/.env.local</C> (see below), create the analytics table once, then start the server:
            </p>
            <CodeBlock code={`npm run db:migrate -w server   # only if DATABASE_URL is set\nnpm run dev:server              # http://localhost:3000`} />
          </Section>

          <Section id="env" title="Environment variables">
            <div className="my-6 overflow-x-auto rounded-[14px] border border-white/[0.08]">
              <table className="w-full min-w-[560px] text-left text-[14px]">
                <thead className="bg-white/[0.03] text-white/45">
                  <tr>
                    <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em]">Variable</th>
                    <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em]">What it is</th>
                  </tr>
                </thead>
                <tbody>
                  {ENV.map(([k, v, req]) => (
                    <tr key={k} className="border-t border-white/[0.06] align-top">
                      <td className="whitespace-nowrap px-5 py-3">
                        <code className="font-mono text-[13px] text-ec-orange">{k}</code>
                        {req && <span className="ml-2 rounded-full bg-white/[0.06] px-1.5 py-[1px] text-[10.5px] text-white/50">{req}</span>}
                      </td>
                      <td className="px-5 py-3 leading-[1.55] text-white/65">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <C>.env.example</C> has ready-made base URLs for OpenAI, Groq, OpenRouter, Gemini and Ollama.
            </p>
          </Section>

          <Section id="storage" title="Redis & Postgres">
            <ul>
              <li>
                <strong>Upstash Redis</strong> (free tier): create a database at console.upstash.com and copy the REST URL
                and token. Rate limits use a 1-hour sliding window per IP and per install, shared by every server instance.
              </li>
              <li>
                <strong>Neon Postgres</strong> (free tier): create a project at console.neon.tech and copy the pooled
                connection string into <C>DATABASE_URL</C>.
              </li>
            </ul>
            <p>Tables are defined with Drizzle. After changing the schema:</p>
            <CodeBlock code={`npm run db:generate -w server\nnpm run db:migrate -w server\nnpm run db:studio -w server    # table browser`} />
          </Section>

          <Section id="load" title="Load the extension">
            <CodeBlock code={`cp extension/.env.example extension/.env   # sets VITE_SERVER_URL\nnpm run build -w extension                # or: npm run dev:ext`} />
            <Steps>
              <li>
                Load <C>extension/dist</C> from <C>chrome://extensions</C> as in <a href="#install">Install</a>.
              </li>
              <li>
                Copy the extension's ID from its card and put <C>chrome-extension://&lt;that-id&gt;</C> in{" "}
                <C>ALLOWED_ORIGINS</C>.
              </li>
              <li>Restart the server.</li>
            </Steps>
            <Callout tone="orange" title="Tip">
              The ID changes if you load the extension from a different folder. To pin it, add a <C>&quot;key&quot;</C> to{" "}
              <C>extension/manifest.json</C>.
            </Callout>
          </Section>

          <Section id="deploy" title="Deploy to Vercel">
            <Steps>
              <li>
                Import the repo into Vercel with <strong>Root Directory</strong> set to <C>server</C>.
              </li>
              <li>Add the environment variables from above.</li>
              <li>
                Set <C>VITE_SERVER_URL</C> in <C>extension/.env</C> to the deployed URL and rebuild with{" "}
                <C>npm run build -w extension</C>. The URL is fixed at build time.
              </li>
            </Steps>
          </Section>

          {/* ── Reference ── */}
          <Section id="architecture" eyebrow="Reference" title="How it works">
            <ul>
              <li>
                <strong>LeetCode data</strong> comes from <C>leetcode.com/graphql</C>, fetched by the background service
                worker (<C>extension/src/lib/leetcode.js</C>).
              </li>
              <li>
                <strong>Tutor chats</strong> live in <C>chrome.storage.session</C> and are cleared when the browser closes.
                The panel runs in a Shadow DOM so LeetCode&apos;s CSS doesn&apos;t affect it.
              </li>
              <li>
                <strong>Review my code</strong> reads the Monaco editor through <C>chrome.scripting.executeScript</C> in
                the page&apos;s main world, because content scripts can&apos;t see it.
              </li>
              <li>
                <strong>Guardrails</strong> live in the system prompt in <C>server/lib/prompt.js</C>, and the server
                checks and trims every request before passing it on.
              </li>
              <li>
                <strong>Rate limiting</strong> (<C>server/lib/rateLimit.js</C>) uses Upstash Redis, falling back to an
                in-memory limit if Redis isn&apos;t configured or is down.
              </li>
              <li>
                <strong>Analytics</strong>: open <C>/analytics</C> on the server and sign in with{" "}
                <C>ANALYTICS_PASSWORD</C> to see requests per day, feature usage, top problems, latency and recent
                failures.
              </li>
            </ul>
          </Section>

          <Section id="privacy" title="Privacy & data">
            <ul>
              <li>Your chat with the tutor and your code are never stored. Requests are processed and discarded.</li>
              <li>
                Each tutor request keeps one anonymous row: a hashed install id, the tutor feature, the problem, the status
                and timings. No IP address, chat text or code.
              </li>
              <li>Your IP and install id are used only for rate limiting and expire within an hour.</li>
              <li>Your profile and friends list are fetched straight from LeetCode and never sent to the server.</li>
            </ul>
            <p>
              Full policy: <a href="/privacy">Privacy Policy</a>.
            </p>
          </Section>

          <Section id="limits" title="Notes & limits">
            <ul>
              <li>
                LeetCode&apos;s GraphQL API is unofficial and can change without notice. If profiles stop loading, check
                the queries in <C>extension/src/lib/leetcode.js</C> first.
              </li>
              <li>Premium problems only work if your account can see them.</li>
              <li>
                Something missing? <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">Open an issue on GitHub</a>.
              </li>
            </ul>
          </Section>
        </article>
      </div>

      <Footer />
    </main>
  );
}
