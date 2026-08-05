"use client";

import React from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

export interface CustomDialogProps {
  isOpen: boolean;
  type?: "alert" | "confirm" | "danger";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function CustomDialogModal({
  isOpen,
  type = "confirm",
  title,
  message,
  confirmText,
  cancelText = "Bekor qilish",
  onConfirm,
  onCancel,
}: CustomDialogProps) {
  if (!isOpen) return null;

  const isDanger = type === "danger";

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
