"use client";

import React, { useState } from "react";
import { ClassItem } from "./types";
import { useRouter, useSearchParams } from "next/navigation";

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  selectedClass?: ClassItem | null;
  setSelectedClass?: (cls: ClassItem | null) => void;
}

export default function Sidebar({
  mobileOpen = false,
  setMobileOpen,
  selectedClass,
  setSelectedClass,
}: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  // Group open/close states
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "O'quv bo'limi": true,
    "Boshqaruv va Moliya": false,
    "Aloqa va Hisobotlar": false,
  });

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const handleNavigate = (tabId: string) => {
    router.push(`?tab=${tabId}`);
    if (tabId !== "classes" && setSelectedClass) {
      setSelectedClass(null);
    }
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  // SVG Icon Renderer
  const renderIcon = (id: string) => {
    switch (id) {
      case "overview":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
          </svg>
        );
      case "classes":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
          </svg>
        );
      case "teachers":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "subjects":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case "books":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        );
      case "grading-systems":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case "menu":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
      case "balance":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      case "announcements":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
          </svg>
        );
      case "feedback":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case "telegram":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        );
      case "holidays":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "schedule-overview":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="8" y1="14" x2="8" y2="14" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3" strokeLinecap="round" />
            <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3" strokeLinecap="round" />
            <line x1="8" y1="18" x2="8" y2="18" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case "ai-reports":
        return (
          <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" />
            <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" />
          </svg>
        );
      case "social-passport":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M8 13h8" />
            <path d="M8 17h8" />
            <path d="M10 9h4" />
          </svg>
        );
      case "settings":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      
      // Group Icons
      case "education-group":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        );
      case "finance-group":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      case "communication-group":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );

      default:
        return null;
    }
  };

  type MenuItem = { type: "single", id: string, label: string, badge: string | null };
  type MenuGroup = { type: "group", id: string, title: string, items: { id: string, label: string, badge: string | null }[] };
  type MenuStructure = (MenuItem | MenuGroup)[];

  const menuStructure: MenuStructure = [
    { type: "single", id: "overview", label: "Dashboard", badge: null },
    {
      type: "group",
      id: "education-group",
      title: "O'quv bo'limi",
      items: [
        { id: "classes", label: "Sinflar", badge: null },
        { id: "schedule-overview", label: "Dars jadvali", badge: null },
        { id: "teachers", label: "O'qituvchilar", badge: null },
        { id: "subjects", label: "Fanlar", badge: null },
        { id: "books", label: "Kitobxonlik", badge: null },
      ]
    },
    {
      type: "group",
      id: "finance-group",
      title: "Boshqaruv va Moliya",
      items: [
        { id: "grading-systems", label: "Baholash Tizimi", badge: null },
        { id: "balance", label: "Balans boshqaruvi", badge: null },
        { id: "holidays", label: "Dam olish kunlari", badge: null },
      ]
    },
    {
      type: "group",
      id: "communication-group",
      title: "Aloqa va Hisobotlar",
      items: [
        { id: "announcements", label: "E'lonlar", badge: null },
        { id: "feedback", label: "Fikr-mulohazalar", badge: null },
        { id: "menu", label: "Taomnoma", badge: null },
        { id: "telegram", label: "Telegram Bot", badge: null },
        { id: "ai-reports", label: "AI Hisobotlar", badge: "New" },
        { id: "social-passport", label: "Ijtimoiy pasport", badge: null },
      ]
    },
    { type: "single", id: "settings", label: "Sozlamalar", badge: null },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#1D1E26] text-white flex flex-col shrink-0 h-[100dvh] max-h-[100dvh] select-none shadow-2xl font-sans overflow-hidden transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 pb-4 shrink-0">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#D4F562] text-[#1D1E26] flex items-center justify-center font-black text-sm shadow-md shrink-0">
                <svg className="w-5 h-5 text-[#1D1E26]" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                </svg>
              </div>
              <span className="font-black text-white text-xl tracking-tight">
                Farzandim
              </span>
            </div>

            {setMobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Menyuni yopish"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2">
          <nav className="space-y-1.5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
            {menuStructure.map((section, idx) => {
              if (section.type === "single") {
                const isActive = activeTab === section.id;
                return (
                  <div key={section.id || idx}>
                    <button
                      onClick={() => handleNavigate(section.id!)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer min-h-[44px] ${
                        isActive
                          ? "bg-[#D4F562] text-[#1D1E26] shadow-lg shadow-lime-500/10 font-bold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={isActive ? "text-[#1D1E26]" : "text-slate-400"}>{renderIcon(section.id!)}</span>
                        <span>{section.label}</span>
                      </div>
                      {section.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-[#1D1E26] text-[#D4F562]" : "bg-[#FF7A00] text-white"}`}>
                          {section.badge}
                        </span>
                      )}
                    </button>
                  </div>
                );
              }

              if (section.type === "group") {
                const isExpanded = expandedGroups[section.title];
                const isGroupActive = section.items.some(item => item.id === activeTab);
                
                return (
                  <div key={section.title} className="space-y-1">
                    <button
                      onClick={() => toggleGroup(section.title)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer min-h-[44px] ${
                        isGroupActive
                          ? "bg-[#D4F562] text-[#1D1E26] shadow-lg shadow-lime-500/10 font-bold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={isGroupActive ? "text-[#1D1E26]" : "text-slate-400"}>{renderIcon(section.id)}</span>
                        <span>{section.title}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"}`} aria-hidden={!isExpanded}>
                      {section.items?.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`w-full flex items-center justify-between pl-11 pr-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer min-h-[44px] ${
                              isActive
                                ? "text-[#D4F562] font-bold"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className={isActive ? "text-[#D4F562]" : "text-slate-400"}>{renderIcon(item.id)}</span>
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-[#1D1E26] text-[#D4F562]" : "bg-[#FF7A00] text-white"}`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
