"use client";

import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  hasMainClass?: boolean;
}

type NavEntry =
  | {
      type: "single";
      id: string;
      label: string;
      icon: any;
      badge?: number;
    }
  | {
      type: "group";
      id: string;
      label: string;
      icon: any;
      items: {
        id: string;
        label: string;
        icon: any;
        badge?: number;
      }[];
    };

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
  hasMainClass = true,
}: TeacherSidebarProps) {
  const isCollapsedDesktop = sidebarCollapsed && !sidebarOpen;

  // 6 Main Grouped Entries (Consistent Title Case)
  const allNavEntries: NavEntry[] = [
    {
      type: "single",
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      type: "group",
      id: "academic_group",
      label: "O'quv jarayoni",
      icon: BookOpen,
      items: [
        { id: "journal", label: "Sinf jurnali", icon: BookOpen },
        { id: "schedule", label: "Dars jadvali", icon: Calendar },
        { id: "lesson-plans", label: "Ish rejasi", icon: FileText },
        { id: "unapproved", label: "Tasdiqlanmagan", icon: CheckSquare, badge: unapprovedCount },
      ],
    },
    {
      type: "group",
      id: "students_group",
      label: "O'quvchilar & Vasiylar",
      icon: Users,
      items: [
        { id: "students", label: "O'quvchilar", icon: Users },
        { id: "parents", label: "Ota-onalar", icon: UserCheck },
        { id: "social-passport", label: "Ijtimoiy pasport", icon: FileSpreadsheet },
      ],
    },
    {
      type: "group",
      id: "communication_group",
      label: "Muloqot & E'lonlar",
      icon: MessageSquare,
      items: [
        { id: "feedback", label: "Izoh va fikrlar", icon: MessageSquare },
        { id: "announcements", label: "E'lonlar", icon: Megaphone },
      ],
    },
    {
      type: "group",
      id: "activities_group",
      label: "To'garak & Mutolaa",
      icon: Sparkles,
      items: [
        { id: "clubs", label: "To'garaklar", icon: Sparkles },
        { id: "books", label: "Kitobxonlik", icon: BookMarked },
      ],
    },
    {
      type: "single",
      id: "settings",
      label: "Sozlamalar",
      icon: Settings,
    },
  ];

  const navEntries = allNavEntries.filter((entry) => {
    if (entry.id === "students_group" && !hasMainClass) {
      return false;
    }
    return true;
  });

  // State to track which groups are expanded (VS Code tree style - closed by default)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Automatically expand group containing active tab
  useEffect(() => {
    navEntries.forEach((entry) => {
      if (entry.type === "group") {
        const hasActive = entry.items.some((sub) => sub.id === teacherTab);
        if (hasActive) {
          setOpenGroups((prev) => ({ ...prev, [entry.id]: true }));
        }
      }
    });
  }, [teacherTab]);

  const toggleGroup = (groupId: string) => {
    if (isCollapsedDesktop) {
      setSidebarCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [groupId]: true }));
      return;
    }
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleSelectTab = (tabId: string) => {
    setTeacherTab(tabId);
    if (onTabClick) onTabClick(tabId);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Full Screen Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[#1E2B42] text-slate-100 flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
          {/* Mobile Fullscreen Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-700/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-none bg-[#A51C30] flex items-center justify-center text-white shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif text-sm font-bold tracking-wider text-white uppercase">FARZANDIM</h1>
                <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest font-semibold">
                  O'qituvchi Portali
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-white bg-transparent border-0 shadow-none cursor-pointer transition"
              aria-label="Yopish"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Fullscreen Nav Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 [scrollbar-width:none]">
            {navEntries.map((entry) => {
              if (entry.type === "single") {
                const Icon = entry.icon;
                const isActive = teacherTab === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleSelectTab(entry.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-none text-sm transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#141E2E] text-white font-semibold border-l-3 border-[#A51C30]"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-[#A51C30]" : "text-slate-400"}`} />
                      <span>{entry.label}</span>
                    </div>
                  </button>
                );
              }

              // Group on Mobile
              const GroupIcon = entry.icon;
              const isGroupOpen = !!openGroups[entry.id];
              const hasActiveChild = entry.items.some((sub) => sub.id === teacherTab);
              const groupBadgeCount = entry.items.reduce((acc, sub) => acc + (sub.badge || 0), 0);

              return (
                <div key={entry.id} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(entry.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-none text-sm transition-all cursor-pointer ${
                      hasActiveChild ? "text-white bg-slate-800/40 font-semibold" : "text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GroupIcon className={`w-4.5 h-4.5 shrink-0 ${hasActiveChild ? "text-[#A51C30]" : "text-slate-400"}`} />
                      <span>{entry.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {groupBadgeCount > 0 && !isGroupOpen && (
                        <span className="bg-[#A51C30] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-none">
                          {groupBadgeCount}
                        </span>
                      )}
                      {isGroupOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Group Children (VS Code style indent) */}
                  {isGroupOpen && (
                    <div className="pl-4 ml-3 border-l border-slate-700/60 space-y-0.5 py-1">
                      {entry.items.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = teacherTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSelectTab(sub.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-none text-sm transition-all cursor-pointer ${
                              isSubActive
                                ? "bg-[#141E2E] text-white font-semibold border-l-2 border-[#A51C30]"
                                : "text-slate-300 hover:bg-slate-800/40 hover:text-white font-normal"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? "text-[#A51C30]" : "text-slate-400"}`} />
                              <span>{sub.label}</span>
                            </div>
                            {sub.badge && sub.badge > 0 ? (
                              <span className="bg-[#A51C30] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-none">
                                {sub.badge}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-slate-700/60 bg-[#141E2E] flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-none bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {userInfo?.first_name ? userInfo.first_name[0] : "T"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {userInfo?.first_name} {userInfo?.last_name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {userInfo?.role === "MAIN_TEACHER" ? "Sinf Rahbari" : "O'qituvchi"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 bg-transparent border-0 cursor-pointer"
              title="Chiqish"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden md:flex sticky top-0 left-0 h-screen bg-[#1E2B42] text-slate-100 border-r border-slate-800 flex-col justify-between shrink-0 z-40 transition-all duration-200 ease-in-out ${
          isCollapsedDesktop ? "w-16" : "w-64"
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div
            className={`h-16 flex items-center border-b border-slate-700/60 ${
              isCollapsedDesktop ? "justify-center px-2" : "justify-between px-4"
            }`}
          >
            {isCollapsedDesktop ? (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                title="Kengaytirish"
                className="p-1 bg-transparent border-0 shadow-none text-slate-400 hover:text-white cursor-pointer transition flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-none bg-[#A51C30] flex items-center justify-center text-white shrink-0">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h1 className="font-serif text-xs font-bold tracking-wider text-white uppercase">FARZANDIM</h1>
                    <p className="text-[9px] text-slate-400 font-sans uppercase tracking-widest font-semibold">
                      O'qituvchi Portali
                    </p>
                  </div>
                </div>

                {/* Desktop Naked Collapse Toggle Button (<) */}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1 text-slate-400 hover:text-white bg-transparent border-0 shadow-none cursor-pointer transition"
                  title="Qisqartirish"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Desktop Nav List */}
          <nav className="p-2.5 space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)] [scrollbar-width:none]">
            {navEntries.map((entry) => {
              if (entry.type === "single") {
                const Icon = entry.icon;
                const isActive = teacherTab === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    title={isCollapsedDesktop ? entry.label : undefined}
                    onClick={() => handleSelectTab(entry.id)}
                    className={`w-full flex items-center rounded-none text-xs transition-all cursor-pointer ${
                      isCollapsedDesktop ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                    } ${
                      isActive
                        ? "text-white bg-[#141E2E] font-semibold border-l-3 border-[#A51C30]"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#A51C30]" : "text-slate-400"}`} />
                      {!isCollapsedDesktop && <span className="truncate">{entry.label}</span>}
                    </div>
                  </button>
                );
              }

              // Group entry
              const GroupIcon = entry.icon;
              const isGroupOpen = !!openGroups[entry.id];
              const hasActiveChild = entry.items.some((sub) => sub.id === teacherTab);
              const groupBadgeCount = entry.items.reduce((acc, sub) => acc + (sub.badge || 0), 0);

              if (isCollapsedDesktop) {
                return (
                  <div key={entry.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => toggleGroup(entry.id)}
                      title={entry.label}
                      className={`w-full flex items-center justify-center p-2.5 rounded-none text-xs transition-all cursor-pointer relative ${
                        hasActiveChild ? "text-white bg-[#141E2E] border-l-3 border-[#A51C30]" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <GroupIcon className={`w-4 h-4 ${hasActiveChild ? "text-[#A51C30]" : "text-slate-400"}`} />
                      {groupBadgeCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#A51C30]" />
                      )}
                    </button>
                  </div>
                );
              }

              return (
                <div key={entry.id} className="space-y-0.5">
                  {/* Group Title Bar */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(entry.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-none text-xs transition-all cursor-pointer ${
                      hasActiveChild ? "text-white bg-slate-800/40 font-semibold" : "text-slate-300 hover:text-white hover:bg-slate-800/50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GroupIcon className={`w-4 h-4 shrink-0 ${hasActiveChild ? "text-[#A51C30]" : "text-slate-400"}`} />
                      <span className="truncate">{entry.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {groupBadgeCount > 0 && !isGroupOpen && (
                        <span className="bg-[#A51C30] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-none">
                          {groupBadgeCount}
                        </span>
                      )}
                      {isGroupOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Group Children (VS Code style indentation) */}
                  {isGroupOpen && (
                    <div className="pl-3 ml-3 border-l border-slate-700/60 space-y-0.5 py-0.5">
                      {entry.items.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = teacherTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSelectTab(sub.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-none text-xs transition-all cursor-pointer ${
                              isSubActive
                                ? "bg-[#141E2E] text-white font-semibold border-l-2 border-[#A51C30]"
                                : "text-slate-300 hover:bg-slate-800/50 hover:text-white font-normal"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-[#A51C30]" : "text-slate-400"}`} />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {sub.badge && sub.badge > 0 ? (
                              <span className="bg-[#A51C30] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-none">
                                {sub.badge}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Desktop Profile & Logout Footer */}
        <div className="p-3 border-t border-slate-700/60 bg-[#141E2E]">
          {isCollapsedDesktop ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title={`${userInfo?.first_name || ""} ${userInfo?.last_name || ""}`}
                className="w-8 h-8 rounded-none bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0"
              >
                {userInfo?.first_name ? userInfo.first_name[0] : "T"}
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Tizimdan chiqish"
                className="p-1.5 text-slate-400 hover:text-rose-400 bg-transparent border-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-none bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {userInfo?.first_name ? userInfo.first_name[0] : "T"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">
                    {userInfo?.first_name} {userInfo?.last_name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {userInfo?.role === "MAIN_TEACHER" ? "Sinf Rahbari" : "O'qituvchi"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Chiqish"
                className="p-1.5 text-slate-400 hover:text-rose-400 bg-transparent border-0 cursor-pointer transition"
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
