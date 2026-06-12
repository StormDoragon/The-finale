import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liberation OS",
  description:
    "Monitor your Facebook pages: followers, reach, engagement, posts, and monetization progress.",
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
