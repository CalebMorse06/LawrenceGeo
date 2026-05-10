import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lawrence Geo — guess your way around LFK",
  description:
    "A guess-the-place game for Lawrence, KS. From Mass St on a Saturday night to the back end of Jayhawk Blvd. Five rounds. How well do you really know your town?",
  openGraph: {
    title: "Lawrence Geo",
    description: "Five rounds. How well do you really know LFK?",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col paper-grain">{children}</body>
    </html>
  );
}
