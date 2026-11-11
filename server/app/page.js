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
        <li>Nothing is stored on this server. Requests are processed and discarded.</li>
        <li>A random install id and your IP address are used only for in-memory rate limiting.</li>
        <li>Your LeetCode profile and friends list are fetched by the extension directly from LeetCode and never sent here.</li>
      </ul>
    </main>
  );
}
