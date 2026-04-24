import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomePage from "./home";

export const metadata: Metadata = {
  title: "ParaGuard AI | AI Humanizer & Plagiarism Checker",
  description: "Bypass AI detectors instantly. The ultimate tool to humanize AI text, fix grammar, and check plagiarism for free.",
  openGraph: {
    title: "ParaGuard AI | AI Humanizer & Plagiarism Checker",
    description: "Bypass AI detectors instantly. The ultimate tool to humanize AI text, fix grammar, and check plagiarism for free.",
    type: "website",
    url: "https://para-guard-by-nayan.vercel.app",
    siteName: "ParaGuard AI",
    images: [
      {
        url: "https://para-guard-by-nayan.vercel.app/og-image.jpg",
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
    images: ["https://para-guard-by-nayan.vercel.app/og-image.jpg"],
  },
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return <HomePage />;
}