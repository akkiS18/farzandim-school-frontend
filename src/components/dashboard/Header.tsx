import React, { useState } from "react";
import { UserInfo } from "./types";

interface HeaderProps {
  userInfo: UserInfo | null;
  setShowChangePasswordModal: (show: boolean) => void;
  handleLogout: () => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Header({
  userInfo,
  setShowChangePasswordModal,
  handleLogout,
  mobileOpen = false,
  setMobileOpen,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="flex items-center justify-between gap-4 mb-6 select-none font-sans">
      {/* Left Welcome Title & Mobile Hamburger Button */}
      <div className="flex items-center space-x-3">
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 rounded-2xl bg-white border border-slate-100/80 text-[#1D1E26] shadow-xs hover:bg-slate-50 transition cursor-pointer"
            title="Menu"
          >
            <svg className="w-5 h-5 text-[#1D1E26]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div>
          <h1 className="text-xl sm:text-3xl font-black text-[#1D1E26] tracking-tight flex items-center gap-2">
            Welcome back {userInfo?.first_name || "Admin"} 👋
          </h1>
        </div>
      </div>

      {/* Right User Avatar Controls */}
      <div className="flex items-center space-x-3 justify-end">
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-[#1D1E26] text-white flex items-center justify-center font-black text-sm shadow-md ring-2 ring-white hover:opacity-90 transition cursor-pointer"
            title={userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : "Admin"}
          >
            {userInfo?.first_name ? userInfo.first_name[0] : "A"}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn text-xs text-slate-700 font-bold">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-slate-900 truncate">
                  {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : "Admin"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {userInfo?.role || "ADMIN"}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowChangePasswordModal(true);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Parolni o'zgartirish</span>
              </button>
              <div className="my-1 border-t border-slate-100"></div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center space-x-2.5"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Tizimdan Chiqish</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
