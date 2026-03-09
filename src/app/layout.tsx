import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ikctl — Remote Application Manager",
  description:
    "Install and manage applications on remote servers via SSH using ikctl.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
