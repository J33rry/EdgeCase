// Shared by server and client components.
export const fmtN = (v) => (v == null ? "—" : Math.round(v).toLocaleString("en-US"));
export const fmtMs = (v) => (v == null ? "—" : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}s` : `${Math.round(v)}ms`);
