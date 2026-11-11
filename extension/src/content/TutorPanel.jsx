import { useCallback, useEffect, useRef, useState } from "react";
import { ask } from "../lib/messages.js";
import { clearChat, getChat, saveChat } from "../lib/storage.js";
import Markdown from "./Markdown.jsx";

const QUICK = [
  { id: "explain", label: "Explain the problem", text: "Explain this problem to me in plain words. What exactly is being asked?" },
  { id: "example", label: "Walk an example", text: "Walk me through one of the examples step by step so I understand why the output is what it is." },
  { id: "hint", label: "Give me a hint" },
  { id: "pattern", label: "Which pattern fits?", text: "Which problem-solving patterns might fit here, and what in the problem points to them?" },
  { id: "complexity", label: "Target complexity", text: "Based on the constraints, what time complexity should I aim for, and why?" },
  { id: "edges", label: "Edge cases", text: "What edge cases should I think about for this problem?" },
  { id: "approach", label: "Check my approach", prefill: "Here's my approach: " },
  { id: "code", label: "Review my code", primary: true },
];

const LANG_NAMES = {
  cpp: "C++", c: "C", java: "Java", python: "Python", javascript: "JavaScript", typescript: "TypeScript",
  csharp: "C#", go: "Go", rust: "Rust", kotlin: "Kotlin", swift: "Swift", ruby: "Ruby", php: "PHP",
  scala: "Scala", dart: "Dart", elixir: "Elixir", erlang: "Erlang", racket: "Racket", sql: "SQL", mysql: "SQL",
};
const MAX_CODE_CHARS = 12000;
const squash = (s) => s.replace(/\s+/g, "");

const slugFromPath = () => location.pathname.match(/^\/problems\/([^/]+)/)?.[1] || null;

function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("sup").forEach((s) => (s.textContent = `^${s.textContent}`));
  doc.querySelectorAll("li").forEach((li) => li.prepend("- "));
  doc.querySelectorAll("p, pre, li, br, div, h1, h2, h3, h4").forEach((el) => el.append("\n"));
  return doc.body.textContent.replace(/ /g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function usePath() {
  const [slug, setSlug] = useState(slugFromPath);
  useEffect(() => {
    // LeetCode is a single-page app; poll for route changes.
    const t = setInterval(() => setSlug(slugFromPath()), 800);
    return () => clearInterval(t);
  }, []);
  return slug;
}

export default function TutorPanel() {
  const slug = usePath();
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(400);
  const [problem, setProblem] = useState({ loading: true });
  const [messages, setMessages] = useState([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const portRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Restore panel preferences.
  useEffect(() => {
    chrome.storage.local.get(["panelOpen", "panelWidth"]).then((v) => {
      if (v.panelOpen) setOpen(true);
      if (v.panelWidth) setWidth(v.panelWidth);
    });
  }, []);

  const toggle = (value) => {
    setOpen(value);
    chrome.storage.local.set({ panelOpen: value });
  };

  // Load problem + saved chat whenever the problem changes.
  useEffect(() => {
    portRef.current?.disconnect();
    portRef.current = null;
    setStreaming(false);
    setError("");
    setInput("");
    setMessages([]);
    setHintLevel(0);
    if (!slug) return;

    let cancelled = false;
    setProblem({ loading: true });
    ask("getProblem", { slug })
      .then((q) => {
        if (cancelled) return;
        setProblem({
          ...q,
          statement: q.html ? htmlToText(q.html) : "",
        });
      })
      .catch((e) => !cancelled && setProblem({ error: e.message }));
    getChat(slug).then((c) => {
      if (cancelled) return;
      setMessages(c.messages);
      setHintLevel(c.hintLevel);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const send = useCallback(
    (text, { isHint = false, restore } = {}) => {
      const content = text.trim();
      if (!content || streaming || !problem.title || !problem.statement) return;
      setError("");
      const history = [...messages, { role: "user", content }];
      setMessages([...history, { role: "assistant", content: "", pending: true }]);
      setInput("");
      setStreaming(true);

      const port = chrome.runtime.connect({ name: "tutor" });
      portRef.current = port;
      let acc = "";
      const nextHint = isHint ? Math.min(hintLevel + 1, 3) : hintLevel;

      const finish = (final) => {
        setStreaming(false);
        portRef.current = null;
        port.disconnect();
        if (final) {
          setMessages(final);
          setHintLevel(nextHint);
          saveChat(slug, { messages: final, hintLevel: nextHint });
        }
      };

      port.onMessage.addListener((m) => {
        if (m.type === "chunk") {
          acc += m.text;
          setMessages([...history, { role: "assistant", content: acc, pending: true }]);
        } else if (m.type === "done") {
          finish([...history, { role: "assistant", content: acc || "_(No response.)_" }]);
        } else if (m.type === "error") {
          // Roll back the failed turn and give the text back to the user.
          setError(m.error);
          setMessages(messages);
          setInput(restore ?? (isHint ? "" : content));
          finish(null);
        }
      });

      port.postMessage({
        problem: {
          id: problem.id,
          title: problem.title,
          difficulty: problem.difficulty,
          tags: problem.tags,
          hints: problem.hints,
          statement: problem.statement,
        },
        messages: history.map(({ role, content }) => ({ role, content })),
        hintLevel,
      });
    },
    [messages, streaming, problem, hintLevel, slug],
  );

  const stop = () => {
    portRef.current?.disconnect();
    portRef.current = null;
    setStreaming(false);
    setMessages((ms) => {
      const final = ms.map((m) => (m.pending ? { role: m.role, content: m.content || "_(Stopped.)_" } : m));
      saveChat(slug, { messages: final, hintLevel });
      return final;
    });
  };

  const reviewCode = async () => {
    setError("");
    let result;
    try {
      result = await ask("readCode");
    } catch (e) {
      setError(e.message);
      return;
    }
    let { code, language, partial } = result;
    if ((problem.starters || []).some((s) => squash(s) === squash(code))) {
      setError("Your editor still has the starter code. Write your attempt first, then ask for a review.");
      return;
    }
    if (code.length > MAX_CODE_CHARS) {
      code = code.slice(0, MAX_CODE_CHARS);
      partial = true;
    }
    const lang = LANG_NAMES[language] || language || "";
    const note = input.trim();
    send(
      `Review my ${lang ? `${lang} ` : ""}implementation. Tell me whether it's correct, show me an input where it fails if it doesn't work, and give its time and space complexity. Don't fix it for me.` +
        (note ? `\n\n${note}` : "") +
        (partial ? "\n\n(Only part of my code could be included.)" : "") +
        `\n\n\`\`\`${language || ""}\n${code}\n\`\`\``,
      { restore: note },
    );
  };

  const quick = (q) => {
    if (q.id === "code") {
      reviewCode();
    } else if (q.prefill) {
      setInput(q.prefill);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (q.id === "hint") {
      send(
        hintLevel >= 3
          ? "I've had all three hint levels. Ask me a question that helps me get unstuck."
          : `Give me hint level ${hintLevel + 1}/3.`,
        { isHint: true },
      );
    } else {
      send(q.text);
    }
  };

  const reset = async () => {
    stop();
    await clearChat(slug);
    setMessages([]);
    setHintLevel(0);
  };

  const startResize = (e) => {
    e.preventDefault();
    const move = (ev) => setWidth(Math.min(800, Math.max(320, window.innerWidth - ev.clientX)));
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      chrome.storage.local.set({ panelWidth: Math.min(800, Math.max(320, window.innerWidth - ev.clientX)) });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (!slug) return null;

  if (!open) {
    return (
      <button className="launcher" onClick={() => toggle(true)} title="Open EdgeCase tutor">
        <span>EdgeCase</span>
      </button>
    );
  }

  const ready = problem.title && problem.statement;

  return (
    // Stop key events so LeetCode's global shortcuts don't fire while typing.
    <aside className="panel" style={{ width }} onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}>
      <div className="resize" onPointerDown={startResize} />
      <header>
        <div className="title">
          <span className="logo">E</span>
          <div>
            <div className="h">Tutor</div>
            <div className="sub">
              {problem.loading
                ? "Loading problem…"
                : problem.title
                  ? `${problem.id}. ${problem.title}`
                  : "Problem unavailable"}
              {problem.difficulty && <span className={`diff ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>}
            </div>
          </div>
        </div>
        <div className="actions">
          {messages.length > 0 && (
            <button className="ghost" onClick={reset} title="Start over">
              Reset
            </button>
          )}
          <button className="ghost" onClick={() => toggle(false)} title="Close">
            ✕
          </button>
        </div>
      </header>

      <div className="messages" ref={listRef}>
        {problem.error && <div className="notice err">{problem.error}</div>}
        {!problem.loading && !problem.error && !problem.statement && (
          <div className="notice">
            This problem's statement isn't available to your account (it may be Premium), so the tutor can't see it.
          </div>
        )}
        {messages.length === 0 && ready && (
          <div className="welcome">
            <p>
              <b>I'm here to help you understand, not to hand you the answer.</b>
            </p>
            <p>Pick a starting point below, or tell me what's confusing you. Hints come in three levels, so you can stop as soon as it clicks.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === "assistant" ? (
              m.content ? <Markdown text={m.content} /> : <div className="typing"><span /><span /><span /></div>
            ) : (
              <div className="bubble">{m.content.includes("```") ? <Markdown text={m.content} /> : m.content}</div>
            )}
          </div>
        ))}
        {error && <div className="notice err">{error}</div>}
      </div>

      <div className="chips">
        {QUICK.map((q) => (
          <button
            key={q.id}
            className={q.primary ? "primary" : undefined}
            onClick={() => quick(q)}
            disabled={!ready || streaming}
            title={q.id === "code" ? "Send the code in the LeetCode editor for review. Anything typed in the box below is sent with it." : undefined}
          >
            {q.id === "hint" && hintLevel > 0 ? `Next hint (${Math.min(hintLevel + 1, 3)}/3)` : q.label}
          </button>
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={ready ? "Ask about the problem or describe your idea…" : "Waiting for the problem…"}
          rows={2}
          disabled={!ready}
        />
        {streaming ? (
          <button type="button" className="send stop" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="submit" className="send" disabled={!ready || !input.trim()}>
            Send
          </button>
        )}
      </form>
    </aside>
  );
}
