import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayres Parallel Chatbot",
  description: "Sales assistant chat untuk custom jersey Ayres Parallel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
