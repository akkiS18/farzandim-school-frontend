"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function TenantLoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"phone" | "passport">("phone");
  const [phone, setPhone] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [schools, setSchools] = useState<Array<{ id: string; name: string; subdomain: string }>>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  useEffect(() => {
    // 1. Fetch available schools for tenant routing
    fetch(`${API_URL}/api/public/schools`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSchools(data);
          const savedSchoolId = localStorage.getItem("school_id");
          if (savedSchoolId && data.some((s) => s.id === savedSchoolId)) {
            setSelectedSchoolId(savedSchoolId);
          } else if (data.length > 0) {
            setSelectedSchoolId(data[0].id);
          }
        }
      })
      .catch((err) => console.warn("Could not load schools:", err));

    // 2. Redirect if already logged in
    const token = localStorage.getItem("school_token");
    const userStr = localStorage.getItem("school_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
          router.replace("/dashboard");
          return;
        } else if (user.role === "MAIN_TEACHER" || user.role === "SUBJECT_TEACHER") {
          router.replace("/teacher");
          return;
        } else if (user.role === "PARENT") {
          router.replace("/parents");
          return;
        } else {
          localStorage.removeItem("school_token");
          localStorage.removeItem("school_refresh_token");
          localStorage.removeItem("school_user");
          localStorage.removeItem("school_id");
        }
      } catch (e) {
        localStorage.removeItem("school_token");
        localStorage.removeItem("school_refresh_token");
        localStorage.removeItem("school_user");
        localStorage.removeItem("school_id");
      }
    }
    setIsCheckingAuth(false);
  }, [router]);

  const formatPhoneNumber = (value: string) => {
    const raw = value.replace(/\D/g, "");
    let digits = raw;
    if (digits.startsWith("998")) {
      digits = digits.slice(3);
    }
    digits = digits.slice(0, 9); // Max 9 digits for local number

    if (!digits) {
      return raw.startsWith("+") || raw.length > 0 ? "+998 " : "";
    }

    let formatted = "+998 ";
    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length >= 2) {
      formatted += " " + digits.substring(2, 5);
    }
    if (digits.length >= 5) {
      formatted += " " + digits.substring(5, 7);
    }
    if (digits.length >= 7) {
      formatted += " " + digits.substring(7, 9);
    }
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;
    // Foydalanuvchi bo'shliqdan keyin Backspace bosganda, oldingi raqamni ham o'chirish
    if (phone.endsWith(" ") && inputVal.length === phone.length - 1) {
      inputVal = inputVal.trimEnd().slice(0, -1);
    }
    // +998 prefiksini o'chirganda to'liq tozalash
    const digits = inputVal.replace(/\D/g, "");
    if (digits.length <= 3 && inputVal.length < phone.length) {
      setPhone("");
      return;
    }
    const formatted = formatPhoneNumber(inputVal);
    setPhone(formatted);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: Record<string, string> = { password };
      if (loginMode === "passport") {
        const cleanPass = passportNo.trim().toUpperCase().replace(/\s+/g, "");
        if (!cleanPass) {
          throw new Error("Iltimos, pasport seriyasi va raqamini kiriting");
        }
        payload.document_no = cleanPass;
      } else {
        const cleanPhone = phone.replace(/[^\d+]/g, "");
        if (!cleanPhone || cleanPhone.length < 9) {
          throw new Error("Iltimos, to'liq telefon raqamingizni kiriting");
        }
        payload.phone = cleanPhone;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (selectedSchoolId) {
        headers["X-School-ID"] = selectedSchoolId;
      }

      const response = await fetch(`${API_URL}/api/schools/login`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Tizimga kirishda xatolik yuz berdi");
      }

      const role = data.user.role;
      if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "MAIN_TEACHER" && role !== "SUBJECT_TEACHER" && role !== "PARENT") {
        throw new Error("O'quvchilar uchun tizimga kirish taqiqlangan");
      }

      // Save token, refresh_token, user details, and school ID
      localStorage.setItem("school_token", data.token);
      if (data.refresh_token) {
        localStorage.setItem("school_refresh_token", data.refresh_token);
      }
      localStorage.setItem("school_id", data.user.school_id);
      localStorage.setItem("school_user", JSON.stringify(data.user));

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        router.replace("/dashboard");
      } else if (role === "MAIN_TEACHER" || role === "SUBJECT_TEACHER") {
        router.replace("/teacher");
      } else if (role === "PARENT") {
        router.replace("/parents");
      }
    } catch (err: any) {
      setError(err.message || "Ulanishda xatolik. Ma'lumotlarni tekshirib qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400 font-medium">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm">Tizimga kirish tekshirilmoqda...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-blue-200/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-100/40 blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] relative">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[20px] bg-white p-2 shadow-lg shadow-black/[0.06] border border-black/[0.06] flex items-center justify-center mb-4 transition-transform hover:scale-105">
            <img
              src="/logo_round.webp"
              alt="Farzandim Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[28px] leading-tight font-bold tracking-[-0.02em] text-[#1E2B42]">
            Farzandim-edu
          </h1>
          <p className="text-[14px] text-[#6e6e73] mt-1 tracking-[-0.01em]">
            Maktab boshqaruvi va ta'lim portali
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/85 backdrop-blur-xl border border-black/[0.06] rounded-[24px] p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06),0_12px_40px_-12px_rgba(0,0,0,0.08)]">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#e8e8ed] p-1 rounded-2xl mb-6 font-medium text-xs">
            <button
              type="button"
              onClick={() => { setLoginMode("phone"); setError(""); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                loginMode === "phone" ? "bg-white text-[#A51C30] shadow-sm font-bold" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Xodimlar / O'qituvchilar
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode("passport"); setError(""); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                loginMode === "passport" ? "bg-white text-[#1E2B42] shadow-sm font-bold" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Ota-onalar (Pasport)
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-[13px] leading-relaxed p-3.5 rounded-[14px] mb-6">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === "phone" ? (
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
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+998 90 123 45 67"
                    className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#A51C30]/50 focus:bg-white focus:ring-4 focus:ring-[#A51C30]/10 text-[#1d1d1f] placeholder:text-[#a1a1a6] rounded-[14px] pl-10 pr-4 py-3.5 text-[15px] font-medium tracking-wide transition-all duration-200 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="passport-input"
                  className="block text-[13px] font-bold text-[#1E2B42] mb-2 tracking-[-0.01em]"
                >
                  Pasport Seriyasi va Raqami
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-[#1E2B42] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    ID
                  </span>
                  <input
                    id="passport-input"
                    type="text"
                    required
                    value={passportNo}
                    onChange={(e) => setPassportNo(e.target.value.toUpperCase())}
                    placeholder="AD1234567"
                    className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#1E2B42]/50 focus:bg-white focus:ring-4 focus:ring-[#1E2B42]/10 text-[#1d1d1f] placeholder:text-[#a1a1a6] rounded-[14px] pl-12 pr-4 py-3.5 text-[15px] font-mono tracking-wider transition-all duration-200 outline-none uppercase"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password-input"
                  className="text-[13px] font-medium text-[#1d1d1f] tracking-[-0.01em]"
                >
                  Parol
                </label>
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
                  className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#A51C30]/50 focus:bg-white focus:ring-4 focus:ring-[#A51C30]/10 text-[#1d1d1f] placeholder:text-[#a1a1a6] rounded-[14px] pl-10 pr-11 py-3.5 text-[15px] transition-all duration-200 outline-none"
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
              className="w-full bg-[#A51C30] hover:bg-[#821424] active:scale-[0.98] text-white font-semibold text-[15px] py-3.5 px-4 rounded-[14px] transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_14px_-2px_rgba(165,28,48,0.4)] outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 mt-2 tracking-[-0.01em]"
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

          {/* School Selector Widget */}
          {schools.length > 0 && (
            <div className="mt-5 pt-4 border-t border-black/[0.06] flex items-center justify-between">
              <span className="text-[12px] text-[#6e6e73] font-medium flex items-center gap-1.5">
                <span>🏫</span> Maktab:
              </span>
              <div className="relative max-w-[220px]">
                <select
                  value={selectedSchoolId}
                  onChange={(e) => {
                    setSelectedSchoolId(e.target.value);
                    localStorage.setItem("school_id", e.target.value);
                  }}
                  className="w-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1E2B42] text-[12px] font-semibold py-1.5 pl-3 pr-7 rounded-xl outline-none border border-black/[0.06] cursor-pointer appearance-none truncate transition-colors"
                >
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} ({school.subdomain})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#6e6e73]">
                  ▼
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[12.5px] text-[#a1a1a6] mt-6 tracking-[-0.01em]">
          Muammo yuzaga kelsa, maktab administratoriga murojaat qiling
        </p>
      </div>
    </main>
  );
}
