import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // This import is now extremely powerful

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vektorize - RAG Playground",
  description: "Your playground for building and debugging RAG pipelines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // We don't need the "dark" class anymore with this v4 setup
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}