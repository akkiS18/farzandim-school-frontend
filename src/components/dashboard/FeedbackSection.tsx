"use client";

import React, { useState, useEffect } from "react";

interface FeedbackComment {
  id: number;
  type: "GRADE" | "MENU";
  grade_id?: number;
  parent_id: number;
  author_id: number;
  content: string;
  created_at: string;
  author_name: string;
  subject_name?: string;
  grade_value?: string;
  student_name?: string;
  class_name?: string;
  menu_date?: string;
}

interface ChatMessage {
  id: number;
  author_id: number;
  author_name: string;
  role: string;
  content: string;
  created_at: string;
}

interface FeedbackSectionProps {
  token: string;
  apiUrl: string;
}

export default function FeedbackSection({ token, apiUrl }: FeedbackSectionProps) {
  const [feed, setFeed] = useState<FeedbackComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Chat States
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatComment, setSelectedChatComment] = useState<FeedbackComment | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replySubmitLoading, setReplySubmitLoading] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/schools/comments/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setFeed(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch feedback feed:", data.error);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (comment: FeedbackComment) => {
    setChatLoading(true);
    try {
      let url = "";
      if (comment.type === "GRADE") {
        url = `${apiUrl}/api/schools/grades/${comment.grade_id}/comments`;
      } else {
        const dateStr = comment.menu_date ? comment.menu_date.split("T")[0] : "";
        url = `${apiUrl}/api/schools/menu/comments?menu_date=${dateStr}&parent_id=${comment.parent_id}`;
      }
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setChatMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatComment) return;

    setReplySubmitLoading(true);
    setReplyError("");
    try {
      let url = "";
      let body = {};
      if (selectedChatComment.type === "GRADE") {
        url = `${apiUrl}/api/schools/grades/${selectedChatComment.grade_id}/comments`;
        body = { content: replyText.trim() };
      } else {
        const dateStr = selectedChatComment.menu_date ? selectedChatComment.menu_date.split("T")[0] : "";
        url = `${apiUrl}/api/schools/menu/comments`;
        body = {
          menu_date: dateStr,
          parent_id: selectedChatComment.parent_id,
          content: replyText.trim(),
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        setReplyText("");
        fetchChatMessages(selectedChatComment);
      } else {
        setReplyError(data.error || "Xatolik yuz berdi");
      }
    } catch {
      setReplyError("Server bilan bog'lanishda xatolik");
    } finally {
      setReplySubmitLoading(false);
    }
  };

  const getGradeColor = (val?: string) => {
    if (!val) return "text-zinc-400 bg-zinc-900 border-zinc-800";
    const num = parseFloat(val);
    if (isNaN(num)) return "text-zinc-400 bg-zinc-900 border-zinc-800";
    if (num >= 4.5) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (num >= 3.5) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (num >= 2.5) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const filteredFeed = feed.filter((item) =>
    item.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.subject_name && item.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.student_name && item.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-100">💬 Ota-onalar Fikr-mulohazalari</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Ota-onalarning kundalik baholari va taomnoma bo&apos;yicha yuborgan fikr va e&apos;tirozlari.
        </p>
      </div>

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex items-center">
          <span className="text-zinc-600 text-base mr-3">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Fikrlar, fanlar yoki ota-onalar ismi bo'yicha qidirish..."
            className="w-full bg-transparent border-none text-xs text-zinc-200 outline-none"
          />
        </div>

        {/* Feedback Feed */}
        <div className="space-y-3.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-600 space-y-2">
              <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-500 rounded-full animate-spin" />
              <span className="text-xs">Fikrlar yuklanmoqda...</span>
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="text-center p-12 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl text-zinc-500 text-xs">
              📭 Fikr-mulohazalar mavjud emas.
            </div>
          ) : (
            filteredFeed.map((item) => (
              <div
                key={item.id + "-" + item.type}
                className="bg-zinc-950/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl p-5 space-y-3.5 transition duration-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900/60 pb-3">
                  <div className="flex items-center space-x-2.5">
                    {item.type === "GRADE" ? (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                        📝 Bahoga izoh
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        🍽️ Taomnomaga izoh
                      </span>
                    )}
                    <span className="text-xs font-bold text-zinc-200">{item.author_name}</span>
                    <span className="text-[10px] text-zinc-500">Vasiy</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    📅 {new Date(item.created_at).toLocaleString("uz-UZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {item.type === "GRADE" ? (
                  <div className="flex items-center space-x-3 bg-zinc-900/20 border border-zinc-900 p-3 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${getGradeColor(item.grade_value)}`}>
                      {item.grade_value}
                    </div>
                    <div className="text-xs">
                      <span className="text-zinc-300 font-bold block">{item.subject_name}</span>
                      <span className="text-zinc-500 text-[10px]">
                        O&apos;quvchi: <b>{item.student_name}</b> ({item.class_name} sinfi)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/20 border border-zinc-900 p-3 rounded-xl text-xs">
                    <span className="text-zinc-300 font-semibold block">🍽️ Taomnoma kuni: {new Date(item.menu_date || "").toLocaleDateString("uz-UZ", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}</span>
                  </div>
                )}

                <div className="text-xs text-zinc-300 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-900 font-medium leading-relaxed italic">
                  &ldquo;{item.content}&rdquo;
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChatComment(item);
                      setReplyText("");
                      setReplyError("");
                      setChatModalOpen(true);
                      fetchChatMessages(item);
                    }}
                    className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    💬 Chatni ochish
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Chat Modal */}
      {chatModalOpen && selectedChatComment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 w-full max-w-[450px] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-3 border-b border-zinc-900 pb-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">💬 Muhokama (Chat)</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Ota-ona: <b>{selectedChatComment.author_name}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xl border-none background-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Chat messages */}
            <div className="max-h-[300px] min-h-[150px] overflow-y-auto border border-zinc-900 rounded-xl p-3 mb-4 bg-zinc-950/50 flex flex-col gap-2.5 flex-1">
              {chatLoading && chatMessages.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">Yuklanmoqda...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 italic">Xabarlar yo'q.</div>
              ) : (
                chatMessages.map((msg, idx) => {
                  // If role is PARENT, it's the parent, otherwise it's school staff (teacher or admin)
                  const isParent = msg.role === "PARENT";
                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        alignSelf: !isParent ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <span style={{ fontSize: "9px", color: "#6B7280", marginBottom: "2px", fontWeight: 700, alignSelf: !isParent ? "flex-end" : "flex-start" }}>
                        {msg.author_name} ({msg.role === "ADMIN" ? "Admin" : msg.role === "PARENT" ? "Ota-ona" : "O'qituvchi"})
                      </span>
                      <div
                        style={{
                          backgroundColor: !isParent ? "#10B981" : "#1F2937",
                          color: "#F3F4F6",
                          borderRadius: "12px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 500,
                          lineHeight: "1.4",
                          border: !isParent ? "none" : "1px solid #374151",
                        }}
                      >
                        {msg.content}
                      </div>
                      <span
                        style={{
                          fontSize: "8px",
                          color: "#6B7280",
                          marginTop: "2px",
                          alignSelf: !isParent ? "flex-end" : "flex-start",
                          fontFamily: "monospace",
                        }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("uz-UZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {replyError && <div className="text-xs text-red-500 font-semibold mb-2">⚠️ {replyError}</div>}

            <form onSubmit={handleReplySubmit} className="flex gap-2 items-end">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="flex-1 p-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-lg text-xs text-zinc-200 outline-none resize-none transition"
                placeholder="Admin nomidan javob yozing..."
              />
              <button
                type="submit"
                disabled={replySubmitLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition cursor-pointer h-10 flex items-center justify-center shrink-0"
              >
                {replySubmitLoading ? "..." : "Yuborish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
