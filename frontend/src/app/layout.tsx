import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BowlSmart — AI-Powered Fast Bowling Coaching",
  description:
    "Unlock your pace potential. AI-powered bowling analysis, injury risk assessment, and personalized coaching for cricket fast bowlers.",
  keywords: [
    "cricket",
    "fast bowling",
    "bowling analysis",
    "biomechanics",
    "pace",
    "coaching",
    "AI",
    "injury prevention",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
