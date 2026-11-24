"use client";

import React, { useState, useEffect } from "react";
import { DoorOpen, LogIn, LogOut, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface ParentGateDay {
  date: string;
  incoming_time?: string | null;
  outgoing_time?: string | null;
  late_minutes: number;
  is_inside: boolean;
}

interface ParentGateCardProps {
  studentId: number | null;
  token: string;
  API_URL: string;
}

export default function ParentGateCard({ studentId, token, API_URL }: ParentGateCardProps) {
  const [visible, setVisible] = useState(false);
  const [today, setToday] = useState<ParentGateDay | null>(null);
  const [history, setHistory] = useState<ParentGateDay[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!studentId || !token) {
      setVisible(false);
      return;
    }
    let cancelled = false;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (typeof window !== "undefined") {
      const sId = localStorage.getItem("school_id");
      if (sId) headers["X-School-ID"] = sId;
    }

    fetch(`${API_URL}/api/schools/parent/gate-attendance?student_id=${studentId}&days=14`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && data.enabled && data.mapped) {
          setVisible(true);
          setToday(data.today || null);
          setHistory(data.history || []);
        } else {
          setVisible(false);
        }
      })
      .catch(() => {
        if (!cancelled) setVisible(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId, token, API_URL]);

  if (!visible) return null;

  const isPresentToday = !!(today && (today.incoming_time || today.outgoing_time));
  const isInside = !!(today && (today.is_inside || (today.incoming_time && !today.outgoing_time)));

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: "14px 16px",
        marginBottom: "16px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              backgroundColor: isPresentToday ? "#ECFDF5" : "#F8FAFC",
              color: isPresentToday ? "#059669" : "#64748B",
              border: `1px solid ${isPresentToday ? "#A7F3D0" : "#E2E8F0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <DoorOpen size={18} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Bugungi Turniket (Kirish / Chiqish)</span>
              {isPresentToday ? (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: isInside ? "#DCFCE7" : "#DBEAFE",
                    color: isInside ? "#166534" : "#1E40AF",
                  }}
                >
                  {isInside ? "Maktabda" : "Chiqib ketgan"}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "#F1F5F9",
                    color: "#64748B",
                  }}
                >
                  Hali qayd etilmagan
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "4px", fontSize: "12px", color: "#475569", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <LogIn size={13} color="#059669" />
                Kirish: <b style={{ color: "#0F172A" }}>{today?.incoming_time || "—"}</b>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <LogOut size={13} color="#2563EB" />
                Chiqish: <b style={{ color: "#0F172A" }}>{today?.outgoing_time || "—"}</b>
              </span>
              {today && today.late_minutes > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#D97706", fontWeight: 700 }}>
                  <Clock size={13} /> +{today.late_minutes} daq kechikdi
                </span>
              )}
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "6px 10px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            <span>Tarix ({history.length} kun)</span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {showHistory && history.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid #F1F5F9",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: "8px",
          }}
        >
          {history.map((day) => (
            <div
              key={day.date}
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "8px 10px",
                fontSize: "11px",
              }}
            >
              <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>{day.date}</div>
              <div style={{ color: "#475569" }}>
                Kirdi: <b style={{ color: "#059669" }}>{day.incoming_time || "—"}</b> • Chiqdi:{" "}
                <b style={{ color: "#2563EB" }}>{day.outgoing_time || "—"}</b>
              </div>
              {day.late_minutes > 0 && (
                <div style={{ color: "#D97706", fontWeight: 700, marginTop: "2px" }}>
                  +{day.late_minutes} daq kechikish
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
