import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Odysseus",
  description: "A myth-grounded Odysseus conversation interface based on Homer's Odyssey."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
