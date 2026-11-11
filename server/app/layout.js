export const metadata = {
  title: "EdgeCase",
  description: "Backend for the EdgeCase LeetCode companion extension.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#111",
          color: "#e6e6e6",
        }}
      >
        {children}
      </body>
    </html>
  );
}
