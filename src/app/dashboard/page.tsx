"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Sub-components
import Sidebar from "@/components/dashboard/Sidebar";
import ClassesSection from "@/components/dashboard/ClassesSection";
import TeachersSection from "@/components/dashboard/TeachersSection";
import SubjectsSection from "@/components/dashboard/SubjectsSection";
import GradingSystemsSection from "@/components/dashboard/GradingSystemsSection";
import MenuSection from "@/components/dashboard/MenuSection";
import BalanceSection from "@/components/dashboard/BalanceSection";

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
  const [activeMenu, setActiveMenu] = useState<"classes" | "teachers" | "subjects" | "grading-systems" | "menu" | "balance">("classes");

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
