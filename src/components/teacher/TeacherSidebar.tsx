"use client";

import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileText,
  Users,
  UserCheck,
  FileSpreadsheet,
  CheckSquare,
  MessageSquare,
  Megaphone,
  Sparkles,
  BookMarked,
  Settings,
  GraduationCap,
  PanelLeftClose,
  X,
  LogOut,
} from "lucide-react";

interface TeacherSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  teacherTab: string;
  setTeacherTab: (tab: any) => void;
  userInfo: {
    first_name?: string;
    last_name?: string;
    role?: string;
  } | null;
  unapprovedCount?: number;
  onTabClick?: (tabId: string) => void;
  onLogout: () => void;
}

export default function TeacherSidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  teacherTab,
  setTeacherTab,
  userInfo,
  unapprovedCount = 0,
  onTabClick,
  onLogout,
}: TeacherSidebarProps) {
  const isCollapsedDesktop = sidebarCollapsed && !sidebarOpen;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "journal", label: "Sinf Jurnali", icon: BookOpen },
    { id: "schedule", label: "Dars Jadvali", icon: Calendar },
    { id: "lesson-plans", label: "Ish rejasi", icon: FileText },
    { id: "students", label: "O'quvchilar", icon: Users },
    { id: "parents", label: "Ota-onalar", icon: UserCheck },
    { id: "social-passport", label: "Ijtimoiy pasport", icon: FileSpreadsheet },
    { id: "unapproved", label: "Tasdiqlanmagan", icon: CheckSquare, badge: unapprovedCount },
    { id: "feedback", label: "Izoh va Fikrlar", icon: MessageSquare },
    { id: "announcements", label: "E'lonlar", icon: Megaphone },
    { id: "clubs", label: "To'garaklar", icon: Sparkles },
    { id: "books", label: "Kitobxonlik", icon: BookMarked },
    { id: "settings", label: "Sozlamalar", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Left Fixed Vertical Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-[#16193E] text-white flex flex-col justify-between shrink-0 z-50 transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0 w-64"
            : `-translate-x-full md:translate-x-0 ${isCollapsedDesktop ? "w-20" : "w-64"}`
        }`}
      >
        {/* Brand logo & collapse toggle header */}
        <div>
          <div
            className={`h-20 flex items-center border-b border-white/10 ${
              isCollapsedDesktop ? "justify-center px-2" : "justify-between px-6"
            }`}
          >
            {isCollapsedDesktop ? (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                title="Yonga kengaytirish"
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0 cursor-pointer hover:scale-105 transition-transform"
              >
                <GraduationCap className="w-6 h-6" />
              </button>
            ) : (
              <>
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-base font-black tracking-wider text-white uppercase">FARZANDIM</h1>
                    <p className="text-[9px] text-indigo-200/70 uppercase tracking-widest font-mono font-bold">
                      O'qituvchi Portali
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (sidebarOpen) {
                      setSidebarOpen(false);
                    } else {
                      setSidebarCollapsed(true);
                    }
                  }}
                  className="flex items-center justify-center w-8 h-8 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
                  title={sidebarOpen ? "Yopish" : "Yonga qisqartirish"}
                >
                  {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <PanelLeftClose className="w-4 h-4 hidden md:block" />}
                </button>
              </>
            )}
          </div>

          {/* Sidebar Nav Items */}
          <nav className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-160px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = teacherTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={isCollapsedDesktop ? item.label : undefined}
                  onClick={() => {
                    setTeacherTab(item.id);
                    if (onTabClick) onTabClick(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all relative cursor-pointer group ${
                    isCollapsedDesktop ? "justify-center p-3" : "space-x-3.5 px-4 py-3"
                  } ${
                    isActive
                      ? "text-white font-bold bg-white/10"
                      : "text-indigo-200/60 hover:text-white hover:bg-white/5 font-medium"
                  }`}
                >
                  {/* Left Pill Notch */}
                  {isActive && (
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 w-2 h-7 bg-white rounded-r-full shadow-sm ${
                        isCollapsedDesktop ? "-left-3" : "-left-4"
                      }`}
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "text-white scale-110" : "text-indigo-300/60 group-hover:text-white"
                    }`}
                  />
                  {!isCollapsedDesktop && <span className="truncate">{item.label}</span>}

                  {item.badge && item.badge > 0 ? (
                    isCollapsedDesktop ? (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#16193E]" />
                    ) : (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-3 border-t border-white/10">
          {isCollapsedDesktop ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                title={`${userInfo?.first_name || ""} ${userInfo?.last_name || ""} (${
                  userInfo?.role === "MAIN_TEACHER" ? "Sinf Rahbari" : "O'qituvchi"
                }) - Bosib yonga kengaytirish`}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-indigo-400/40 text-white font-black text-sm flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer shrink-0"
              >
                {userInfo?.first_name ? userInfo.first_name[0] : "T"}
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Tizimdan chiqish"
                className="w-8 h-8 flex items-center justify-center text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {userInfo?.first_name ? userInfo.first_name[0] : "T"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">
                    {userInfo?.first_name} {userInfo?.last_name}
                  </p>
                  <p className="text-[10px] text-indigo-300/80 truncate">
                    {userInfo?.role === "MAIN_TEACHER" ? "Sinf Rahbari" : "O'qituvchi"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Chiqish"
                className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
