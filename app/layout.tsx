import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { ThemeProvider } from "@/utils/providers";
import { createClient } from "@/lib/supabase/server";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://para-guard-qourolr5l-nayanx0013s-projects.vercel.app";

export const metadata: Metadata = {
  title: "ParaGuard AI",
  description: "Production grade AI paraphrasing tool with plagiarism detection.",
  metadataBase: new URL(siteUrl),
  keywords: ["AI", "Paraphraser", "Plagiarism Checker", "Rewriter"],
  openGraph: {
    title: "ParaGuard AI",
    description: "Production grade AI paraphrasing tool.",
    type: "website",
    url: siteUrl,
    siteName: "ParaGuard AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ParaGuard AI",
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
      <body className={`${inter.className} bg-black text-gray-100 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          <nav className="w-full border-b border-white/5 bg-transparent px-6 py-4 flex justify-between items-center sticky top-0 z-50">
            
            {/* Logo — Orbitron + inline gradient fix */}
            <Link
              href="/"
              className={`${orbitron.className} text-xl font-bold`}
              style={{
                background: "linear-gradient(90deg, #a855f7, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ParaGuard AI
            </Link>

            <div className="flex gap-3 items-center">
              {user ? (
                <div className="flex items-center gap-3">

                  {/* Dashboard Button */}
                  <Link href="/dashboard">
                    <button
                      className="group relative flex items-center gap-2 border-2 border-purple-500/70 rounded-full px-5 h-10
                                 transition-all duration-500 ease-out
                                 hover:border-cyan-400 hover:shadow-lg hover:shadow-purple-500/40
                                 hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm
                                 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                                 before:via-white/5 before:to-transparent before:translate-x-[-100%]
                                 hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="text-white font-medium tracking-wide text-sm transition-all duration-300
                                       group-hover:text-cyan-100 relative z-10">
                        Dashboard
                      </span>
                      <span className="relative z-10 w-3 h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out
                                       group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                        <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60"
                          style={{ animationDuration: "2s" }} />
                      </span>
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0
                                      group-hover:border-cyan-400/30 transition-all duration-500
                                      opacity-0 group-hover:opacity-100" />
                    </button>
                  </Link>

                  {/* Email — glowing pill */}
                  <div className="relative hidden sm:inline-flex items-center gap-2 border-2 border-purple-500/70 rounded-full px-4 h-10
                                  backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0" />
                    <span className="relative z-10 text-sm font-medium text-gray-300">
                      {user.email}
                    </span>
                    <span className="relative z-10 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 flex-shrink-0">
                      <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-60"
                        style={{ animationDuration: "2s" }} />
                    </span>
                  </div>

                  {/* Sign Out Button */}
                  <form action="/auth/signout" method="post" className="inline">
                    <button
                      type="submit"
                      className="group relative flex items-center gap-2 border-2 border-purple-500/70 rounded-full px-5 h-10
                                 transition-all duration-500 ease-out
                                 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/40
                                 hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm
                                 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                                 before:via-white/5 before:to-transparent before:translate-x-[-100%]
                                 hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <LogOut size={14} className="relative z-10 text-cyan-400 group-hover:text-red-400 transition-colors duration-300" />
                      <span className="text-white font-medium tracking-wide text-sm transition-all duration-300
                                       group-hover:text-red-300 relative z-10">
                        Sign Out
                      </span>
                      <span className="relative z-10 w-3 h-3 bg-red-400 rounded-full transition-all duration-500 ease-out
                                       group-hover:bg-red-300 group-hover:shadow-lg group-hover:shadow-red-400/50 group-hover:scale-110">
                        <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-0 group-hover:opacity-60"
                          style={{ animationDuration: "2s" }} />
                      </span>
                      <div className="absolute inset-0 rounded-full border-2 border-red-400/0
                                      group-hover:border-red-400/30 transition-all duration-500
                                      opacity-0 group-hover:opacity-100" />
                    </button>
                  </form>

                </div>
              ) : (
                /* Login Button */
                <Link href="/login">
                  <button
                    className="group relative flex items-center gap-2 border-2 border-purple-500/70 rounded-full px-5 h-10
                               transition-all duration-500 ease-out
                               hover:border-cyan-400 hover:shadow-lg hover:shadow-purple-500/40
                               hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm
                               before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                               before:via-white/5 before:to-transparent before:translate-x-[-100%]
                               hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="text-white font-medium tracking-wide text-sm transition-all duration-300
                                     group-hover:text-cyan-100 relative z-10">
                      Login
                    </span>
                    <span className="relative z-10 w-3 h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out
                                     group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                      <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60"
                        style={{ animationDuration: "2s" }} />
                    </span>
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0
                                    group-hover:border-cyan-400/30 transition-all duration-500
                                    opacity-0 group-hover:opacity-100" />
                  </button>
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