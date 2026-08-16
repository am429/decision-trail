import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DecisionTrail — AI-assisted organizational memory",
  description:
    "Turn messy project notes into traceable decisions, action items, assumptions, and open questions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
