import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liberation OS",
  description: "Turn useful trends into thoughtful Facebook posts.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
