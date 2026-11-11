export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 16px", lineHeight: 1.6 }}>
      <h1 style={{ color: "#ffa116", marginBottom: 4 }}>EdgeCase</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>A LeetCode companion that coaches, not cheats.</p>
      <p>
        This server powers the AI tutor in the EdgeCase Chrome extension. The extension sends the
        problem you have open and your chat with the tutor to <code>/api/tutor</code>, which
        forwards it to an AI provider and streams the reply back.
      </p>
      <h2 style={{ fontSize: 18 }}>Privacy</h2>
      <ul>
        <li>Your chat with the tutor and your code are never stored. Requests are processed and discarded.</li>
        <li>
          For each tutor request we keep anonymous usage data: a one-way hash of a random install id,
          which problem and tutor feature you used, and timings. No IP address, chat text or code.
        </li>
        <li>Your IP address and the install id are used only for rate limiting and expire within an hour.</li>
        <li>Your LeetCode profile and friends list are fetched by the extension directly from LeetCode and never sent here.</li>
      </ul>
    </main>
  );
}
