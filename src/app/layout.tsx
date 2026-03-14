import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portify",
  description: "Spotify to YouTube Music playlist migration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
