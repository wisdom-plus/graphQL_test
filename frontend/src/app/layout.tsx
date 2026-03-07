import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GraphQL Flight Deck",
  description: "Next.js frontend for exercising the Rails GraphQL endpoint",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
