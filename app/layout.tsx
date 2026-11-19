import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PageTransition from "../components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow — Project Management SaaS",
  description: "Colorful, fast project management and Kanban workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} aurora-bg antialiased selection:bg-fuchsia-500/30`}>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}