"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FileText, Type, Percent, Calendar, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GridGlowBackground } from "@/components/ui/grid-glow-background";
import { Component as DashboardLoader } from "@/components/ui/loader-3";
import type { User } from "@supabase/supabase-js";

type ParaphraseHistory = {
  id: string;
  tone: string;
  created_at: string;
  original_text: string;
  paraphrased_text: string;
  similarity_score: number;
  web_score: number;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [histories, setHistories] = useState<ParaphraseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from("paraphrases")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setHistories((data ?? []) as ParaphraseHistory[]);
      setLoading(false);
    }
    fetchData();
  }, [router]);

  if (loading) return (
    <GridGlowBackground
      backgroundColor="#0a0a0a"
      gridColor="rgba(255, 255, 255, 0.05)"
      gridSize={50}
      glowColors={["#4A00E0", "#8E2DE2", "#4A00E0"]}
      glowCount={10}
    >
      <div className="min-h-screen flex flex-col gap-6 items-center justify-center">
        <DashboardLoader />
        <span className="text-gray-500 font-medium">Loading dashboard...</span>
      </div>
    </GridGlowBackground>
  );

  return (
    <GridGlowBackground
      backgroundColor="#0a0a0a"
      gridColor="rgba(255, 255, 255, 0.05)"
      gridSize={50}
      glowColors={["#4A00E0", "#8E2DE2", "#4A00E0"]}
      glowCount={10}
    >
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-4"
          >
            <div>
              <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Your Dashboard
              </h1>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 border dark:border-gray-800 px-4 py-1.5 rounded-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm inline-block shadow-sm">
                Logged in as <span className="font-bold text-gray-900 dark:text-gray-100">{user?.email}</span>
              </p>
            </div>
            
            <form action="/auth/signout" method="post">
              <button className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-sm">
                Sign Out
              </button>
            </form>
          </motion.div>

          {!histories || histories.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 dark:bg-[#111] backdrop-blur-md p-16 text-center rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6">
                <FileText size={64} className="text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No history found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-md">Return to the homepage and paraphrase your first document to see your intelligent insights saved securely here.</p>
            </motion.div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-2"
            >
              {histories.map((item) => (
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -5, scale: 1.01 }}
                  key={item.id} 
                  className="bg-white/90 dark:bg-[#111] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col h-full relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-blue-100 dark:border-blue-800">
                      <Type size={14} /> {item.tone}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
                      <Calendar size={14} /> {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-5 relative z-10">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Original Context</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 italic opacity-80 border-l-2 border-gray-200 dark:border-gray-700 pl-3">&quot;{item.original_text}&quot;</p>
                    </div>
                    <div className="relative">
                      <div className="flex justify-between items-center mb-2">
                         <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">AI Paraphrased</h4>
                         <button
                           onClick={(e) => {
                             e.preventDefault();
                             navigator.clipboard.writeText(item.paraphrased_text);
                             setCopiedId(item.id);
                             setTimeout(() => setCopiedId(null), 2000);
                           }}
                           className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-gray-800 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-1 text-xs font-semibold"
                           title="Copy entire text"
                         >
                           {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                           {copiedId === item.id ? "COPIED" : "COPY"}
                         </button>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 max-h-36 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 custom-scrollbar">
                        {item.paraphrased_text}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-800 flex justify-between relative z-10">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Structural Risk</span>
                      <span className={`text-lg font-bold flex items-center gap-1.5 ${item.similarity_score > 60 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        <Percent size={18} /> {item.similarity_score}%
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Web Exact Matches</span>
                      <span className={`text-lg font-bold flex items-center justify-end gap-1.5 ${item.web_score > 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {item.web_score}% 
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </GridGlowBackground>
  );
}
