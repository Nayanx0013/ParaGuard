import type { Metadata } from "next";
import Login from "./login-client";

export const metadata: Metadata = {
  title: "ParaGuard AI | AI Humanizer & Plagiarism Checker",
  description: "Bypass AI detectors instantly. The ultimate tool to humanize AI text, fix grammar, and check plagiarism for free.",
  openGraph: {
    title: "ParaGuard AI | AI Humanizer & Plagiarism Checker",
    description: "Bypass AI detectors instantly. The ultimate tool to humanize AI text, fix grammar, and check plagiarism for free.",
    type: "website",
    url: "https://para-guard-by-nayan.vercel.app/login",
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

export default function Page() {
  return <Login />;
}