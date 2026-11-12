import SectionLink from "./SectionLink";
import { DOCS_URL, REPO_URL } from "./config";
import { GithubIcon, Logo } from "./icons";

/** Public star count, cached for an hour. Hidden if GitHub is unreachable or rate-limited. */
async function getStars(): Promise<number | null> {
  try {
    const res = await fetch("https://api.github.com/repos/J33rry/EdgeCase", {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

const link = "transition-colors hover:text-white";

export default async function Footer() {
  const stars = await getStars();
  return (
    <footer className="relative border-t border-white/[0.06] px-4 pb-10 pt-14 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,174,0,0.4), rgba(0,229,160,0.4), transparent)" }}
      />
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr] md:items-start">
        <div className="text-center md:text-left">
          <Logo size={28} className="justify-center text-[22px] md:justify-start" />
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-white/50 md:mx-0">
            An AI tutor for LeetCode that teaches you the idea, finds your edge cases and never writes the solution for you.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost mt-5 h-10 gap-2 rounded-full px-4 text-[14px]"
          >
            <GithubIcon size={16} />
            Star on GitHub
            {/* A tiny count reads as negative proof, so only show it once it means something. */}
            {stars != null && stars >= 10 && (
              <span className="ml-1 rounded-full bg-white/10 px-2 py-[1px] font-mono text-[12px] tabular-nums text-ec-orange">
                ★ {stars.toLocaleString("en-US")}
              </span>
            )}
          </a>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 text-center text-[15px] md:text-left">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/30">Product</p>
            <ul className="mt-4 space-y-3 text-white/60">
              <li>
                <SectionLink anchor="features" className={link}>Features</SectionLink>
              </li>
              <li>
                <SectionLink anchor="how-it-works" className={link}>How it works</SectionLink>
              </li>
              <li>
                <SectionLink anchor="leaderboard" className={link}>Leaderboard</SectionLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/30">Resources</p>
            <ul className="mt-4 space-y-3 text-white/60">
              <li>
                <a href={DOCS_URL} className={link}>Documentation</a>
              </li>
              <li>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className={link}>GitHub</a>
              </li>
              <li>
                <a href="/privacy" className={link}>Privacy Policy</a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <p className="mx-auto mt-12 max-w-6xl text-center text-[13px] text-white/30 md:text-left">© {new Date().getFullYear()} EdgeCase</p>
    </footer>
  );
}
