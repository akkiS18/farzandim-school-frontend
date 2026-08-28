"use client";

import React from "react";
import { Menu } from "lucide-react";

interface TeacherHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title?: string;
}

export default function TeacherHeader({
  sidebarOpen,
  setSidebarOpen,
  title = "FARZANDIM",
}: TeacherHeaderProps) {
  return (
    <div className="md:hidden pt-4 px-4 flex items-center justify-between">
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 bg-white text-zinc-700 hover:text-zinc-900 rounded-xl shadow-xs border border-zinc-200/80 transition cursor-pointer flex items-center space-x-2 text-xs font-bold"
      >
        <Menu className="w-4 h-4" />
        <span>Menyu</span>
      </button>
      <span className="text-xs font-black text-indigo-900 tracking-wider uppercase">
        {title}
      </span>
    </div>
  );
}
