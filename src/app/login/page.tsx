"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TenantLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem("school_token");
    const userStr = localStorage.getItem("school_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "ADMIN") {
          router.push("/dashboard");
        } else if (user.role === "MAIN_TEACHER" || user.role === "SUBJECT_TEACHER") {
          router.push("/teacher");
        } else if (user.role === "PARENT") {
          router.push("/parents");
        } else {
          router.push("/dashboard");
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Tizimga kirishda xatolik yuz berdi");
      }

      // Save token, user details, and school ID
      localStorage.setItem("school_token", data.token);
      localStorage.setItem("school_id", data.user.school_id);
      localStorage.setItem("school_user", JSON.stringify(data.user));

      const role = data.user.role;
      if (role === "ADMIN") {
        router.push("/dashboard");
      } else if (role === "MAIN_TEACHER" || role === "SUBJECT_TEACHER") {
        router.push("/teacher");
      } else if (role === "PARENT") {
        router.push("/parents");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Ulanishda xatolik. Ma'lumotlarni tekshirib qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-radial from-[#172554] via-[#09090b] to-[#09090b] px-4">
      <div className="w-full max-w-md bg-[#09090b]/80 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-blue-500/5">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Online Jurnal
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Maktab Ma'muriyati va Xodimlari Portali
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="phone-input" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Telefon Raqam
            </label>
            <input
              id="phone-input"
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Masalan: +998942551314"
              className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-4 py-3 text-sm transition outline-none"
            />
          </div>

          <div>
            <label htmlFor="password-input" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Parol
            </label>
            <input
              id="password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-4 py-3 text-sm transition outline-none"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shadow-blue-600/25 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Tekshirilmoqda..." : "Tizimga Kirish"}
          </button>
        </form>
      </div>
    </main>
  );
}
