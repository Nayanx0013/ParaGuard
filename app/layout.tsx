import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { UserCircle, LogOut } from "lucide-react";
import { ThemeProvider } from "@/utils/providers";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://para-guard-qourolr5l-nayanx0013s-projects.vercel.app";

export const metadata: Metadata = {
  title: "AI Paraphraser & Plagiarism Checker",
  description: "Production grade AI paraphrasing tool with plagiarism detection.",
  metadataBase: new URL(siteUrl),
  keywords: ["AI", "Paraphraser", "Plagiarism Checker", "Rewriter"],
  openGraph: {
    title: "AI Paraphraser & Plagiarism Checker",
    description: "Production grade AI paraphrasing tool.",
    type: "website",
    url: siteUrl,
    siteName: "ParaphraseAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Paraphraser",
    description: "Production grade AI paraphrasing tool.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/50 backdrop-blur-md shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors duration-300">
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              ParaphraseAI
            </Link>
            <div className="flex gap-6 items-center">
              <ThemeToggle />
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-1 transition">
                 <UserCircle size={20} /> Dashboard
              </Link>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline-block">
                    {user.email}
                  </span>
                  <form action="/auth/signout" method="post" className="inline">
                    <button type="submit" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition" title="Sign out">
                      <LogOut size={20} />
                    </button>
                  </form>
                </div>
              ) : (
                <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
                   Login
                </Link>
              )}
            </div>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
