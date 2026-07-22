"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Sub-components
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewSection from "@/components/dashboard/OverviewSection";
import ClassesSection from "@/components/dashboard/ClassesSection";
import TeachersSection from "@/components/dashboard/TeachersSection";
import SubjectsSection from "@/components/dashboard/SubjectsSection";
import GradingSystemsSection from "@/components/dashboard/GradingSystemsSection";
import MenuSection from "@/components/dashboard/MenuSection";
import BalanceSection from "@/components/dashboard/BalanceSection";
import AnnouncementsSection from "@/components/dashboard/AnnouncementsSection";
import FeedbackSection from "@/components/dashboard/FeedbackSection";

// Types
import { ClassItem, UserInfo, TenantUser, SubjectItem, GradingSystem } from "@/components/dashboard/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

export default function TenantDashboard() {
  const router = useRouter();

  // Auth & General States
  const [token, setToken] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Menu
  const [activeMenu, setActiveMenu] = useState<"overview" | "classes" | "teachers" | "subjects" | "grading-systems" | "menu" | "balance" | "announcements" | "feedback" | "telegram">("overview");

  // Core Data Lists
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TenantUser[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [gradingSystems, setGradingSystems] = useState<GradingSystem[]>([]);

  // Balance & Charging States
  const [studentsBalanceList, setStudentsBalanceList] = useState<any[]>([]);
  const [studentsBalanceLoading, setStudentsBalanceLoading] = useState(false);
  const [globalTransactionsList, setGlobalTransactionsList] = useState<any[]>([]);
  const [globalTransactionsLoading, setGlobalTransactionsLoading] = useState(false);
  const [chargePlans, setChargePlans] = useState<any[]>([]);
  const [chargePlansLoading, setChargePlansLoading] = useState(false);

  // Contextual selected class
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // Telegram Bot Integration States
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramConfig, setTelegramConfig] = useState<any>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramSaveLoading, setTelegramSaveLoading] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const [telegramSuccess, setTelegramSuccess] = useState("");

  const fetchTelegramConfig = async (authToken: string, sId: string) => {
    setTelegramLoading(true);
    setTelegramError("");
    setTelegramSuccess("");
    try {
      const response = await fetch(`${API_URL}/api/schools/telegram/config`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-School-ID": sId,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTelegramConfig(data);
        if (data.has_token) {
          setTelegramToken(data.bot_token);
        } else {
          setTelegramToken("");
        }
      } else {
        setTelegramError(data.error || "Sozlamalarni yuklashda xatolik");
      }
    } catch {
      setTelegramError("Server bilan bog'lanishda xatolik");
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleSaveTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramToken.trim()) {
      setTelegramError("Token kiritish majburiy");
      return;
    }
    setTelegramSaveLoading(true);
    setTelegramError("");
    setTelegramSuccess("");
    try {
      const response = await fetch(`${API_URL}/api/schools/telegram/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-School-ID": schoolId,
        },
        body: JSON.stringify({ bot_token: telegramToken.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setTelegramSuccess(data.message || "Muvaffaqiyatli saqlandi");
        fetchTelegramConfig(token, schoolId);
      } else {
        setTelegramError(data.error || "Saqlashda xatolik yuz berdi");
      }
    } catch {
      setTelegramError("Serverga bog'lanishda xatolik");
    } finally {
      setTelegramSaveLoading(false);
    }
  };

  // Change Password Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordOld, setChangePasswordOld] = useState("");
  const [changePasswordNew, setChangePasswordNew] = useState("");
  const [changePasswordConfirm, setChangePasswordConfirm] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  // Initialize
  useEffect(() => {
    const savedToken = localStorage.getItem("school_token");
    const savedSchoolId = localStorage.getItem("school_id");
    const savedUserStr = localStorage.getItem("school_user");

    if (!savedToken || !savedSchoolId || !savedUserStr) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setSchoolId(savedSchoolId);
    try {
      const parsed = JSON.parse(savedUserStr);
      if (parsed.role !== "ADMIN") {
        router.push("/login");
        return;
      }
      setUserInfo(parsed);
    } catch (e) {
      router.push("/login");
      return;
    }

    loadInitialData(savedToken);
  }, [router]);

  useEffect(() => {
    if (activeMenu === "telegram" && token && schoolId) {
      fetchTelegramConfig(token, schoolId);
    }
  }, [activeMenu, token, schoolId]);

  const loadInitialData = async (authToken: string) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClassesData(authToken),
        fetchTeachersData(authToken),
        fetchSubjectsData(authToken),
        fetchGradingSystemsData(authToken),
        fetchStudentsBalanceData(authToken),
        fetchChargePlansData(authToken),
        fetchGlobalTransactionsData(authToken),
      ]);
    } catch (err) {
      console.error("Initial load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/classes`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setClasses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeachersData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/teachers`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setTeachers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubjectsData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/subjects`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setSubjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGradingSystemsData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/grading-systems`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setGradingSystems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentsBalanceData = async (authToken: string) => {
    setStudentsBalanceLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/users?role=STUDENT`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setStudentsBalanceList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setStudentsBalanceLoading(false);
    }
  };

  const fetchChargePlansData = async (authToken: string) => {
    setChargePlansLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setChargePlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setChargePlansLoading(false);
    }
  };

  const fetchGlobalTransactionsData = async (authToken: string) => {
    setGlobalTransactionsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/balance/transactions`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setGlobalTransactionsList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setGlobalTransactionsLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordOld.trim() || !changePasswordNew.trim() || !changePasswordConfirm.trim()) {
      setChangePasswordError("Barcha maydonlarni to'ldiring");
      return;
    }
    if (changePasswordNew !== changePasswordConfirm) {
      setChangePasswordError("Yangi parollar mos kelmadi");
      return;
    }
    setChangePasswordLoading(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/schools/settings/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: changePasswordOld,
          new_password: changePasswordNew,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Parolni o'zgartirib bo'lmadi");
      }

      setChangePasswordSuccess(data.message || "Parol muvaffaqiyatli o'zgartirildi!");
      setChangePasswordOld("");
      setChangePasswordNew("");
      setChangePasswordConfirm("");
    } catch (err: any) {
      setChangePasswordError(err.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] text-zinc-400 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium animate-pulse">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070709] text-zinc-100 flex font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        userInfo={userInfo}
        handleLogout={handleLogout}
        setShowChangePasswordModal={setShowChangePasswordModal}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
      />

      {/* Main Content Area */}
      <section className="flex-1 h-screen overflow-y-auto bg-zinc-950/20 px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
          
          {activeMenu === "overview" && (
            <OverviewSection
              token={token}
              API_URL={API_URL}
              classes={classes}
            />
          )}

          {activeMenu === "classes" && (
            <ClassesSection
              classes={classes}
              subjects={subjects}
              teachers={teachers}
              token={token}
              API_URL={API_URL}
              userInfo={userInfo}
              setClasses={setClasses}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              fetchStudentsBalanceData={fetchStudentsBalanceData}
            />
          )}

          {activeMenu === "teachers" && (
            <TeachersSection
              teachers={teachers}
              token={token}
              API_URL={API_URL}
              userInfo={userInfo}
              setTeachers={setTeachers}
            />
          )}

          {activeMenu === "subjects" && (
            <SubjectsSection
              subjects={subjects}
              token={token}
              API_URL={API_URL}
              setSubjects={setSubjects}
            />
          )}

          {activeMenu === "grading-systems" && (
            <GradingSystemsSection
              gradingSystems={gradingSystems}
              token={token}
              API_URL={API_URL}
              setGradingSystems={setGradingSystems}
            />
          )}

          {activeMenu === "menu" && (
            <MenuSection
              token={token}
              API_URL={API_URL}
            />
          )}

          {activeMenu === "balance" && (
            <BalanceSection
              token={token}
              API_URL={API_URL}
              studentsBalanceList={studentsBalanceList}
              setStudentsBalanceList={setStudentsBalanceList}
              chargePlans={chargePlans}
              setChargePlans={setChargePlans}
              globalTransactionsList={globalTransactionsList}
              setGlobalTransactionsList={setGlobalTransactionsList}
              studentsBalanceLoading={studentsBalanceLoading}
              setStudentsBalanceLoading={setStudentsBalanceLoading}
              chargePlansLoading={chargePlansLoading}
              setChargePlansLoading={setChargePlansLoading}
              globalTransactionsLoading={globalTransactionsLoading}
              setGlobalTransactionsLoading={setGlobalTransactionsLoading}
            />
          )}

          {activeMenu === "announcements" && (
            <AnnouncementsSection
              token={token}
              classes={classes}
              students={studentsBalanceList}
              apiUrl={API_URL}
            />
          )}

          {activeMenu === "feedback" && (
            <FeedbackSection
              token={token}
              apiUrl={API_URL}
            />
          )}

          {activeMenu === "telegram" && (
            <div className="space-y-6 max-w-2xl mx-auto mt-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 text-zinc-100">
                <div className="border-b border-zinc-800 pb-4">
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <span>🤖 Telegram Bot Integratsiyasi</span>
                  </h3>
                  <p className="text-xs text-zinc-405 font-medium mt-1 leading-relaxed">
                    Maktabingiz ota-onalariga baholar va e'lonlarni shaxsiy Telegram bot orqali yuborishni sozlang. Har bir maktab o'z xususiy botiga ega bo'lishi mumkin.
                  </p>
                </div>

                {telegramLoading ? (
                  <div className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-500 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
                    {telegramError && (
                      <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-semibold rounded-lg">
                        {telegramError}
                      </div>
                    )}
                    {telegramSuccess && (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs font-semibold rounded-lg">
                        {telegramSuccess}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-zinc-400 uppercase tracking-wide font-mono">
                        Telegram Bot Token *
                      </label>
                      <input
                        type="text"
                        required
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        className="w-full text-xs border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-650 bg-zinc-950/50 font-mono font-bold text-zinc-200"
                        placeholder="Masalan: 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      />
                      <span className="block text-[10px] text-zinc-500 leading-normal">
                        Bot tokenini olish uchun Telegram-da <b>@BotFather</b> orqali yangi bot yarating va u bergan API Tokenni shu yerga kiriting.
                      </span>
                    </div>

                    {telegramConfig?.has_token && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                        <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block font-mono">
                          🤖 Ulanish Sozlamalari:
                        </span>
                        <div className="text-xs space-y-1.5 text-zinc-300 font-semibold">
                          <p>
                            Bot nomi: <a href={`https://t.me/${telegramConfig.bot_username}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@{telegramConfig.bot_username}</a>
                          </p>
                          <p>
                            Ota-onalar uchun taklif havolasi: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-[10px] select-all font-mono text-emerald-400 border border-zinc-800">https://t.me/{telegramConfig.bot_username}?start=1</code>
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-zinc-800">
                      <button
                        type="submit"
                        disabled={telegramSaveLoading}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        {telegramSaveLoading && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                        <span>Botni ulash & Saqlash</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Profile Settings / Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn text-zinc-200">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Profil parolini o'zgartirish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Xavfsizlik maqsadida eski parolingizni kiritib, yangi parol o'rnating.</p>

            {changePasswordError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{changePasswordError}</div>
            )}
            
            {changePasswordSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg mb-4">{changePasswordSuccess}</div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Eski Parol</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={changePasswordOld}
                  onChange={(e) => setChangePasswordOld(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Yangi Parol</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={changePasswordNew}
                  onChange={(e) => setChangePasswordNew(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Yangi Parolni Tasdiqlang</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={changePasswordConfirm}
                  onChange={(e) => setChangePasswordConfirm(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#1e1e24]/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setChangePasswordOld("");
                    setChangePasswordNew("");
                    setChangePasswordConfirm("");
                    setChangePasswordError("");
                    setChangePasswordSuccess("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {changePasswordLoading ? "Yangilanmoqda..." : "Parolni Yangilash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
