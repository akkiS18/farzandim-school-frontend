"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("school_token");
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400 font-medium">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">Connecting to portal...</p>
      </div>
    </main>
  );
}
