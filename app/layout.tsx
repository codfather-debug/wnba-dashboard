import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "WNBA Team Stats Dashboard",
  description: "2025 WNBA team offensive and defensive stats with daily matchup breakdowns",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#07070e" }}>{children}</body>
    </html>
  );
}
