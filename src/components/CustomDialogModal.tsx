"use client";

import React from "react";
import { AlertTriangle, CheckCircle, X, LogOut, Info } from "lucide-react";

export interface CustomDialogProps {
  isOpen: boolean;
  type?: "alert" | "confirm" | "danger";
  theme?: "teacher" | "admin" | "parent";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function CustomDialogModal({
  isOpen,
  type = "confirm",
  theme = "teacher",
  title,
  message,
  confirmText,
  cancelText = "Bekor qilish",
  onConfirm = () => {},
  onCancel,
}: CustomDialogProps) {
  if (!isOpen) return null;

  const isDanger = type === "danger";
  const isTeacherTheme = theme === "teacher";
  const isAdminTheme = theme === "admin";

  if (isAdminTheme) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans select-none"
        onClick={onCancel || onConfirm}
      >
        <div
          className="w-full max-w-md bg-white border border-slate-200 rounded-none p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 border ${
                isDanger
                  ? "bg-red-50 text-red-600 border-red-200"
                  : type === "alert"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-100 text-[#1D1E26] border-slate-200"
              }`}
            >
              {isDanger ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : type === "alert" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <Info className="w-5 h-5 text-[#1D1E26]" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h3 className="text-base font-extrabold text-[#1D1E26] tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1">
                {message}
              </p>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-7 h-7 rounded-none bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                aria-label="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            {type !== "alert" && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1E26] text-xs font-extrabold transition cursor-pointer rounded-none"
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2 text-xs font-black transition cursor-pointer rounded-none ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800"
              }`}
            >
              {confirmText || (type === "alert" ? "Tushunarli" : "Ha, tasdiqlayman")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isTeacherTheme) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
        onClick={onCancel || onConfirm}
      >
        <div
          className="w-full max-w-md bg-white border border-neutral-200 rounded-none p-6 shadow-none flex flex-col gap-5 animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 border ${
                isDanger
                  ? "bg-[#A51C30]/10 text-[#A51C30] border-[#A51C30]/25"
                  : "bg-[#1E2B42]/10 text-[#1E2B42] border-[#1E2B42]/25"
              }`}
            >
              {isDanger ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-1">
                {message}
              </p>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="p-1 text-slate-400 hover:text-slate-800 bg-transparent border-0 shadow-none cursor-pointer transition"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200">
            {type !== "alert" && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-neutral-200 text-xs font-bold font-sans uppercase tracking-wider transition cursor-pointer rounded-none"
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2 text-xs font-bold font-sans uppercase tracking-wider transition cursor-pointer rounded-none border ${
                isDanger
                  ? "bg-[#A51C30] hover:bg-[#8B1828] text-white border-[#A51C30]"
                  : "bg-[#1E2B42] hover:bg-[#141E2E] text-white border-[#1E2B42]"
              }`}
            >
              {confirmText || (type === "alert" ? "Tushunarli" : "Ha, tasdiqlayman")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback Modern Rounded Theme (Admin / Parent default)
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onCancel || onConfirm}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              backgroundColor: isDanger ? "#FEF2F2" : "#ECFDF5",
              color: isDanger ? "#EF4444" : "#00A389",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isDanger ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.3 }}>
              {title}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "6px 0 0 0", fontWeight: 500, lineHeight: 1.4 }}>
              {message}
            </p>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: "none",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "2px",
                borderRadius: "6px",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          {type !== "alert" && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: isDanger ? "#DC2626" : "#00A389",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: isDanger ? "0 4px 12px rgba(220,38,38,0.25)" : "0 4px 12px rgba(0,163,137,0.25)",
              transition: "all 0.15s ease",
            }}
          >
            {confirmText || (type === "alert" ? "Tushunarli" : "Ha, tasdiqlayman")}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
