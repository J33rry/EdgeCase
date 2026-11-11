// Tiny Markdown renderer that builds React elements (never raw HTML), so
// model output can't inject markup. Supports headings, fenced code, bullet
// and numbered lists, paragraphs, `code`, **bold**, and *italic*.

function inline(text, keyBase) {
  const out = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("`")) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++; // closing fence (or end of a still-streaming block)
      blocks.push(
        <pre key={k++}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const Tag = `h${Math.min(h[1].length + 2, 6)}`;
      blocks.push(<Tag key={k++}>{inline(h[2], k)}</Tag>);
      i++;
      continue;
    }

    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/, ""));
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={k++}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${k}-${j}`)}</li>
          ))}
        </List>,
      );
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])
    ) {
      para.push(lines[i++]);
    }
    blocks.push(<p key={k++}>{inline(para.join(" "), k)}</p>);
  }

  return <div className="md">{blocks}</div>;
}
