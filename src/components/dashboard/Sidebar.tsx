import React from "react";
import { UserInfo, ClassItem } from "./types";

interface SidebarProps {
  activeMenu: "classes" | "teachers" | "subjects" | "grading-systems" | "menu" | "balance" | "announcements" | "feedback" | "telegram";
  setActiveMenu: (menu: "classes" | "teachers" | "subjects" | "grading-systems" | "menu" | "balance" | "announcements" | "feedback" | "telegram") => void;
  selectedClass: ClassItem | null;
  setSelectedClass: (cls: ClassItem | null) => void;
  userInfo: UserInfo | null;
  handleLogout: () => void;
  setShowChangePasswordModal: (show: boolean) => void;
}

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  selectedClass,
  setSelectedClass,
  userInfo,
  handleLogout,
  setShowChangePasswordModal,
}: SidebarProps) {
  const menuItems = [
    { id: "classes", label: "Sinflar", icon: "🏫" },
    { id: "teachers", label: "O'qituvchilar", icon: "👨‍🏫" },
    { id: "subjects", label: "Fanlar", icon: "📚" },
    { id: "grading-systems", label: "Baholash Tizimi", icon: "⭐" },
    { id: "menu", label: "Taomnoma", icon: "🍽️" },
    { id: "balance", label: "Balans boshqaruvi", icon: "💳" },
    { id: "announcements", label: "E'lonlar", icon: "📢" },
    { id: "feedback", label: "Fikr-mulohazalar", icon: "💬" },
    { id: "telegram", label: "Telegram Bot", icon: "🤖" },
  ] as const;

  return (
    <aside className="w-64 bg-zinc-950/80 border-r border-zinc-900 flex flex-col justify-between backdrop-blur-xl shrink-0 h-screen select-none">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-lg shadow-blue-500/25">
            OJ
          </div>
          <span className="font-sans font-bold text-zinc-100 text-sm tracking-wide">
            Online Jurnal Admin
          </span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  if (item.id !== "classes") {
                    setSelectedClass(null);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-zinc-900/60 bg-zinc-950/30 space-y-4">
        <div className="flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-300 truncate">
              {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : "Admin"}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {userInfo?.role || "ADMIN"}
            </p>
          </div>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-zinc-900 rounded-lg transition cursor-pointer"
            title="Parolni o'zgartirish"
          >
            ⚙️
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-red-950/20 hover:text-red-400 border border-zinc-800 hover:border-red-900/30 text-zinc-400 text-xs font-semibold py-2 px-4 rounded-xl transition duration-250 cursor-pointer"
        >
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
