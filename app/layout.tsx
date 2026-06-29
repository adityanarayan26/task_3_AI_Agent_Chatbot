import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universal AI Agent Chatbot",
  description:
    "An agentic AI chatbot powered by Gemini. Equipped with browser search, coding assistant, and deep research tools.",
  keywords: ["AI", "chatbot", "agentic AI", "Gemini", "Playwright", "deep research"],
  authors: [{ name: "AbylWorks" }],
  openGraph: {
    title: "Universal AI Agent Chatbot",
    description: "Reason → Select Tool → Execute → Respond",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
