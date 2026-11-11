import { useState } from "react";
import ProfileView from "./ProfileView.jsx";
import FriendsView from "./FriendsView.jsx";
import SettingsView from "./SettingsView.jsx";

export default function App() {
  const [tab, setTab] = useState("me");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <img src="/icons/icon48.png" alt="" width="22" height="22" />
          <span>{settingsOpen ? "Settings" : "EdgeCase"}</span>
        </div>
        {!settingsOpen && (
          <nav className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "me"} onClick={() => setTab("me")}>
              Me
            </button>
            <button role="tab" aria-selected={tab === "friends"} onClick={() => setTab("friends")}>
              Friends
            </button>
          </nav>
        )}
        <button
          className="icon-btn"
          style={settingsOpen ? { marginLeft: "auto" } : undefined}
          title={settingsOpen ? "Close settings" : "Settings"}
          aria-pressed={settingsOpen}
          onClick={() => setSettingsOpen((o) => !o)}
        >
          {settingsOpen ? "✕" : "⚙"}
        </button>
      </header>
      <main>
        {settingsOpen ? (
          <SettingsView onDone={() => setSettingsOpen(false)} />
        ) : tab === "me" ? (
          <ProfileView />
        ) : (
          <FriendsView />
        )}
      </main>
    </div>
  );
}
