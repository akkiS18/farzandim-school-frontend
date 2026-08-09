"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import CustomDialogModal from "@/components/CustomDialogModal";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import OverviewSection from "@/components/dashboard/OverviewSection";
import ClassesSection from "@/components/dashboard/ClassesSection";
import TeachersSection from "@/components/dashboard/TeachersSection";
import SubjectsSection from "@/components/dashboard/SubjectsSection";
import GradingSystemsSection from "@/components/dashboard/GradingSystemsSection";
import MenuSection from "@/components/dashboard/MenuSection";
import BalanceSection from "@/components/dashboard/BalanceSection";
import AnnouncementsSection from "@/components/dashboard/AnnouncementsSection";
import FeedbackSection from "@/components/dashboard/FeedbackSection";
import HolidaysSection from "@/components/dashboard/HolidaysSection";
import ScheduleOverviewSection from "@/components/dashboard/ScheduleOverviewSection";
import BooksSection from "@/components/dashboard/BooksSection";
import LibrarySection from "@/components/dashboard/LibrarySection";
import AIReportsSection from "@/components/dashboard/AIReportsSection";
import useSwipeMobileMenu from "@/hooks/useSwipeMobileMenu";

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
  const [activeMenu, setActiveMenu] = useState<"overview" | "classes" | "teachers" | "subjects" | "grading-systems" | "menu" | "balance" | "announcements" | "feedback" | "telegram" | "holidays" | "schedule-overview" | "books" | "ai-reports">("overview");

  // Classes section: initial tab when redirecting from schedule overview
  const [classesInitialTab, setClassesInitialTab] = useState<"students" | "teachers" | "parents" | "schedule" | undefined>(undefined);

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Mobile Swipe Gesture Handler
  useSwipeMobileMenu({
    isOpen: mobileSidebarOpen,
    onOpen: () => setMobileSidebarOpen(true),
    onClose: () => setMobileSidebarOpen(false),
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("school_token");
    const savedUser = localStorage.getItem("school_user");
    const sId = localStorage.getItem("school_id") || "";
    setSchoolId(sId);

    if (!savedToken || !savedUser) {
      router.replace("/login");
      return;
    }

    setToken(savedToken);
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed.role !== "ADMIN" && parsed.role !== "SUPER_ADMIN") {
        if (parsed.role === "PARENT") {
          router.replace("/parents");
        } else if (parsed.role === "MAIN_TEACHER" || parsed.role === "SUBJECT_TEACHER") {
          router.replace("/teacher");
        } else {
          router.replace("/login");
        }
        return;
      }
      setUserInfo(parsed);
    } catch (e) {
      router.replace("/login");
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

  const getAuthHeaders = (authToken: string) => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || schoolId || "" : "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${authToken}`,
    };
    if (sId) {
      headers["X-School-ID"] = sId;
    }
    return headers;
  };

  const safeFetchData = async (url: string, authToken: string) => {
    try {
      const response = await fetch(url, { headers: getAuthHeaders(authToken) });
      if (!response.ok) return null;
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    } catch (e) {
      console.error("Fetch error for " + url, e);
      return null;
    }
  };

  const fetchClassesData = async (authToken: string) => {
    const data = await safeFetchData(`${API_URL}/api/schools/classes`, authToken);
    if (Array.isArray(data)) setClasses(data);
  };

  const fetchTeachersData = async (authToken: string) => {
    const data = await safeFetchData(`${API_URL}/api/schools/teachers`, authToken);
    if (Array.isArray(data)) setTeachers(data);
  };

  const fetchSubjectsData = async (authToken: string) => {
    const data = await safeFetchData(`${API_URL}/api/schools/subjects`, authToken);
    if (Array.isArray(data)) setSubjects(data);
  };

  const fetchGradingSystemsData = async (authToken: string) => {
    const data = await safeFetchData(`${API_URL}/api/schools/grading-systems`, authToken);
    if (Array.isArray(data)) setGradingSystems(data);
  };

  const fetchStudentsBalanceData = async (authToken: string) => {
    setStudentsBalanceLoading(true);
    const data = await safeFetchData(`${API_URL}/api/schools/users?role=STUDENT`, authToken);
    if (Array.isArray(data)) setStudentsBalanceList(data);
    setStudentsBalanceLoading(false);
  };

  const fetchChargePlansData = async (authToken: string) => {
    setChargePlansLoading(true);
    const data = await safeFetchData(`${API_URL}/api/schools/balance/charge-plans`, authToken);
    if (Array.isArray(data)) setChargePlans(data);
    setChargePlansLoading(false);
  };

  const fetchGlobalTransactionsData = async (authToken: string) => {
    setGlobalTransactionsLoading(true);
    const data = await safeFetchData(`${API_URL}/api/schools/balance/transactions`, authToken);
    if (Array.isArray(data)) setGlobalTransactionsList(data);
    setGlobalTransactionsLoading(false);
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

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_refresh_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F7] text-slate-600 flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-10 h-10 border-4 border-[#D4F562] border-t-[#1D1E26] rounded-full animate-spin"></div>
        <p className="text-sm font-black text-[#1D1E26] animate-pulse">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F4F7] text-[#1D1E26] flex font-sans overflow-hidden p-3 sm:p-4">
      <div className="flex w-full h-[calc(100vh-2rem)] bg-[#F7F7FA] rounded-[36px] overflow-hidden shadow-2xl border border-slate-200/60">
        {/* Sidebar Navigation */}
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Main Content Area */}
        <section className="flex-1 h-full overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Top Bar Header */}
            <Header
              userInfo={userInfo}
              setShowChangePasswordModal={setShowChangePasswordModal}
              handleLogout={() => setShowLogoutModal(true)}
              mobileOpen={mobileSidebarOpen}
              setMobileOpen={setMobileSidebarOpen}
            />
            
            {activeMenu === "overview" && (
              <OverviewSection
                token={token}
                API_URL={API_URL}
                classes={classes}
                userInfo={userInfo}
                setActiveMenu={setActiveMenu}
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
              setSubjects={setSubjects}
              initialTab={classesInitialTab}
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
              classes={classes}
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

          {activeMenu === "holidays" && (
            <HolidaysSection
              token={token}
              API_URL={API_URL}
              userInfo={userInfo}
              classes={classes}
            />
          )}

          {activeMenu === "schedule-overview" && (
            <ScheduleOverviewSection
              classes={classes}
              token={token}
              API_URL={API_URL}
              onEditSchedule={(cls) => {
                setSelectedClass(cls);
                setClassesInitialTab("schedule");
                setActiveMenu("classes");
              }}
            />
          )}

          {activeMenu === "announcements" && (
            <AnnouncementsSection
              token={token}
              classes={classes}
              students={studentsBalanceList}
              apiUrl={API_URL}
              userRole={userInfo?.role}
            />
          )}

          {activeMenu === "books" && (
            <LibrarySection />
          )}

          {activeMenu === "ai-reports" && (
            <AIReportsSection
              token={token}
              API_URL={API_URL}
              classes={classes}
            />
          )}

          {activeMenu === "feedback" && (
            <FeedbackSection
              token={token}
              apiUrl={API_URL}
            />
          )}

          {/* 10. TELEGRAM BOT SETTINGS TAB */}
          {activeMenu === "telegram" && (
            <div className="space-y-6 max-w-2xl mx-auto mt-6 font-sans text-[#1D1E26] select-none">
              <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-[#1D1E26] flex items-center gap-2">
                    <span>Telegram Bot Integratsiyasi</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                    Maktabingiz ota-onalariga baholar va e'lonlarni shaxsiy Telegram bot orqali yuborishni sozlang. Har bir maktab o'z xususiy botiga ega bo'lishi mumkin.
                  </p>
                </div>

                {telegramLoading ? (
                  <div className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-slate-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
                    {telegramError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                        {telegramError}
                      </div>
                    )}
                    {telegramSuccess && (
                      <div className="p-3.5 bg-[#ECFCCA] border border-lime-200 text-[#65A30D] text-xs font-bold rounded-2xl">
                        {telegramSuccess}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide font-mono">
                        Telegram Bot Token *
                      </label>
                      <input
                        type="text"
                        required
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4F562] bg-slate-50 font-mono font-bold text-slate-800 transition"
                        placeholder="Masalan: 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      />
                      <span className="block text-[10px] text-slate-400 font-medium">
                        Bot tokenini olish uchun Telegram-da <b>@BotFather</b> orqali yangi bot yarating va u bergan API Tokenni shu yerga kiriting.
                      </span>
                    </div>

                    {telegramConfig?.has_token && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">
                          Ulanish Sozlamalari:
                        </span>
                        <div className="text-xs space-y-1.5 text-slate-700 font-semibold">
                          <p>
                            Bot nomi: <a href={`https://t.me/${telegramConfig.bot_username}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">@{telegramConfig.bot_username}</a>
                          </p>
                          <p>
                            Ota-onalar uchun taklif havolasi: <code className="bg-white px-2 py-0.5 rounded text-[10px] select-all font-mono text-[#65A30D] border border-slate-200">https://t.me/{telegramConfig.bot_username}?start=1</code>
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={telegramSaveLoading}
                        className="px-5 py-2.5 bg-[#D4F562] text-[#1D1E26] font-black rounded-xl text-xs shadow-xs hover:opacity-90 transition flex items-center space-x-1 cursor-pointer"
                      >
                        {telegramSaveLoading && <span className="w-3.5 h-3.5 border border-[#1D1E26] border-t-transparent rounded-full animate-spin shrink-0"></span>}
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
      </div>

      {/* Profile Settings / Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn text-[#1D1E26] font-sans">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-base font-black text-[#1D1E26] mb-1">Profil parolini o'zgartirish</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Xavfsizlik maqsadida eski parolingizni kiritib, yangi parol o'rnating.</p>

            {changePasswordError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-2xl mb-4 font-medium">{changePasswordError}</div>
            )}
            
            {changePasswordSuccess && (
              <div className="bg-[#ECFCCA] border border-lime-200 text-[#65A30D] text-xs p-3 rounded-2xl mb-4 font-bold">{changePasswordSuccess}</div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Eski Parol</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={changePasswordOld}
                  onChange={(e) => setChangePasswordOld(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Yangi Parol</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={changePasswordNew}
                  onChange={(e) => setChangePasswordNew(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Yangi Parolni Tasdiqlang</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={changePasswordConfirm}
                  onChange={(e) => setChangePasswordConfirm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
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
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  {changePasswordLoading ? "Yangilanmoqda..." : "Parolni Yangilash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      <CustomDialogModal
        isOpen={showLogoutModal}
        type="danger"
        title="Tizimdan chiqish"
        message="Haqiqatan ham ma'muriyat panelidan chiqmoqchimisiz?"
        confirmText="Ha, chiqish"
        cancelText="Bekor qilish"
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </main>
  );
}
