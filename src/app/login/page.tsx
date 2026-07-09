"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Phone, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function TenantLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          localStorage.clear();
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

      const role = data.user.role;
      if (role !== "ADMIN" && role !== "MAIN_TEACHER" && role !== "SUBJECT_TEACHER" && role !== "PARENT") {
        throw new Error("O'quvchilar uchun tizimga kirish taqiqlangan");
      }

      // Save token, user details, and school ID
      localStorage.setItem("school_token", data.token);
      localStorage.setItem("school_id", data.user.school_id);
      localStorage.setItem("school_user", JSON.stringify(data.user));

      if (role === "ADMIN") {
        router.push("/dashboard");
      } else if (role === "MAIN_TEACHER" || role === "SUBJECT_TEACHER") {
        router.push("/teacher");
      } else if (role === "PARENT") {
        router.push("/parents");
      }
    } catch (err: any) {
      setError(err.message || "Ulanishda xatolik. Ma'lumotlarni tekshirib qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4 relative overflow-hidden">
      {/* Ambient background glow — Apple-style soft light, not a gradient card bg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-blue-200/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-100/40 blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] relative">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-[16px] bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-5">
            <GraduationCap className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-[#1d1d1f]">
            Online Jurnal
          </h1>
          <p className="text-[15px] text-[#6e6e73] mt-1.5 tracking-[-0.01em]">
            Maktab ma'muriyati va xodimlari portali
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-[24px] p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06),0_12px_40px_-12px_rgba(0,0,0,0.08)]">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-[13px] leading-relaxed p-3.5 rounded-[14px] mb-6">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="phone-input"
                className="block text-[13px] font-medium text-[#1d1d1f] mb-2 tracking-[-0.01em]"
              >
                Telefon raqam
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#a1a1a6]" strokeWidth={1.75} />
                <input
                  id="phone-input"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-[#f5f5f7] border border-transparent focus:border-blue-500/40 focus:bg-white focus:ring-4 focus:ring-blue-500/10 text-[#1d1d1f] placeholder:text-[#a1a1a6] rounded-[14px] pl-10 pr-4 py-3.5 text-[15px] transition-all duration-200 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password-input"
                  className="text-[13px] font-medium text-[#1d1d1f] tracking-[-0.01em]"
                >
                  Parol
                </label>
                <a href="#" className="text-[13px] text-blue-600 hover:text-blue-700 tracking-[-0.01em]">
                  Unutdingizmi?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#a1a1a6]" strokeWidth={1.75} />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f5f5f7] border border-transparent focus:border-blue-500/40 focus:bg-white focus:ring-4 focus:ring-blue-500/10 text-[#1d1d1f] placeholder:text-[#a1a1a6] rounded-[14px] pl-10 pr-11 py-3.5 text-[15px] transition-all duration-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a6] hover:text-[#6e6e73] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.75} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-[15px] py-3.5 px-4 rounded-[14px] transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(37,99,235,0.35)] outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 mt-2 tracking-[-0.01em]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Tekshirilmoqda...
                </span>
              ) : (
                "Tizimga kirish"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12.5px] text-[#a1a1a6] mt-6 tracking-[-0.01em]">
          Muammo yuzaga kelsa, maktab administratoriga murojaat qiling
        </p>
      </div>
    </main>
  );
}
