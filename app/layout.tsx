import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { ThemeProvider } from "@/utils/providers";
import { createClient } from "@/lib/supabase/server";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://para-guard-by-nayan.vercel.app";

export const metadata: Metadata = {
  title: "ParaGuard AI | AI Humanizer & Plagiarism Checker",
  description: "Bypass AI detectors instantly. The ultimate tool to humanize AI text, fix grammar, and check plagiarism for free.",
  metadataBase: new URL(siteUrl),
  keywords: ["AI", "Paraphraser", "Plagiarism Checker", "AI Humanizer", "Text Rewriter", "Bypass AI Detection"],
  openGraph: {
    title: "ParaGuard AI | AI Humanizer & Plagiarism Checker",
    description: "Bypass AI detectors instantly. The ultimate tool to humanize AI text, fix grammar, and check plagiarism for free.",
    type: "website",
    url: siteUrl,
    siteName: "ParaGuard AI",
    images: [
      {
        url: "/og-image.jpg", // This will resolve to https://para-guard-by-nayan.vercel.app/og-image.jpg
        width: 1200,
        height: 630,
        alt: "ParaGuard AI Features Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ParaGuard AI | AI Humanizer & Plagiarism Checker",
    description: "Bypass AI detectors instantly. The ultimate tool to humanize AI text, fix grammar, and check plagiarism for free.",
    images: ["/og-image.jpg"],
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
          <nav className="w-full border-b border-white/5 bg-transparent px-4 py-3 flex justify-between items-center sticky top-0 z-[100000] gap-2">

            {/* Logo — glowing pill */}
            <Link href="/" className="flex-shrink-0">
              <div className="group relative flex items-center gap-1.5 border-2 border-purple-500/70 rounded-full px-3 h-9
                              sm:px-5 sm:h-10 sm:gap-2
                              transition-all duration-500 ease-out cursor-pointer
                              hover:border-cyan-400 hover:shadow-lg hover:shadow-purple-500/40
                              hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm
                              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                              before:via-white/5 before:to-transparent before:translate-x-[-100%]
                              hover:before:translate-x-[100%] before:transition-transform before:duration-700">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                                opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span
                  className={`${orbitron.className} text-xs sm:text-sm font-bold relative z-10`}
                  style={{
                    background: "linear-gradient(90deg, #a855f7, #06b6d4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    display: "inline-block",
                  }}
                >
                  ParaGuard AI
                </span>
                <span className="relative z-10 w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out
                                 group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                  <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60"
                    style={{ animationDuration: "2s" }} />
                </span>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0
                                group-hover:border-cyan-400/30 transition-all duration-500
                                opacity-0 group-hover:opacity-100" />
              </div>
            </Link>

            <div className="flex gap-2 items-center flex-shrink-0">
              {user ? (
                <div className="flex items-center gap-2">

                  {/* Dashboard Button */}
                  <Link href="/dashboard">
                    <button
                      className="cursor-pointer group relative flex items-center gap-1.5 border-2 border-purple-500/70 rounded-full px-3 h-9
                                 sm:px-5 sm:h-10 sm:gap-2
                                 transition-all duration-500 ease-out
                                 hover:border-cyan-400 hover:shadow-lg hover:shadow-purple-500/40
                                 hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm
                                 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                                 before:via-white/5 before:to-transparent before:translate-x-[-100%]
                                 hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="text-white font-medium tracking-wide text-xs sm:text-sm transition-all duration-300
                                       group-hover:text-cyan-100 relative z-10">
                        Dashboard
                      </span>
                      <span className="relative z-10 w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out
                                       group-hover:bg-purple-400 group-hover:shadow-lg group-hover:shadow-purple-400/50 group-hover:scale-110">
                        <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-0 group-hover:opacity-60"
                          style={{ animationDuration: "2s" }} />
                      </span>
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0
                                      group-hover:border-cyan-400/30 transition-all duration-500
                                      opacity-0 group-hover:opacity-100" />
                    </button>
                  </Link>

                  {/* Email — hidden on mobile, show on sm+ */}
                  <div className="relative hidden md:inline-flex items-center gap-2 border-2 border-purple-500/70 rounded-full px-4 h-10
                                  backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0" />
                    <span className="relative z-10 text-sm font-medium text-gray-300 max-w-[150px] truncate">
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
                      className="cursor-pointer group relative flex items-center gap-1.5 border-2 border-purple-500/70 rounded-full px-3 h-9
                                 sm:px-5 sm:h-10 sm:gap-2
                                 transition-all duration-500 ease-out
                                 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/40
                                 hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm
                                 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                                 before:via-white/5 before:to-transparent before:translate-x-[-100%]
                                 hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <LogOut size={12} className="relative z-10 text-cyan-400 group-hover:text-red-400 transition-colors duration-300 sm:w-3.5 sm:h-3.5" />
                      <span className="text-white font-medium tracking-wide text-xs sm:text-sm transition-all duration-300
                                       group-hover:text-red-300 relative z-10">
                        Sign Out
                      </span>
                      <span className="relative z-10 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full transition-all duration-500 ease-out
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
                    className="cursor-pointer group relative flex items-center gap-1.5 border-2 border-purple-500/70 rounded-full px-3 h-9
                               sm:px-5 sm:h-10 sm:gap-2
                               transition-all duration-500 ease-out
                               hover:border-cyan-400 hover:shadow-lg hover:shadow-purple-500/40
                               hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-sm
                               before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent
                               before:via-white/5 before:to-transparent before:translate-x-[-100%]
                               hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-cyan-500/0
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="text-white font-medium tracking-wide text-xs sm:text-sm transition-all duration-300
                                     group-hover:text-cyan-100 relative z-10">
                      Login
                    </span>
                    <span className="relative z-10 w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full transition-all duration-500 ease-out
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