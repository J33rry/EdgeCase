import { createRoot } from "react-dom/client";
import TutorPanel from "./TutorPanel.jsx";
import css from "./panel.css?inline";

// Mount inside a Shadow DOM so LeetCode's styles and ours never collide.
if (!document.getElementById("edgecase-root")) {
  const host = document.createElement("div");
  host.id = "edgecase-root";
  host.style.all = "initial";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = css;
  const mount = document.createElement("div");
  shadow.append(style, mount);

  createRoot(mount).render(<TutorPanel />);
}
