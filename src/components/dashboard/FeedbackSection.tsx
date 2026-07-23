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

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/schools/comments/feed`, {
        headers: safeFetchHeaders(),
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
        headers: safeFetchHeaders(),
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

      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(url, {
        method: "POST",
        headers,
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
    if (!val) return "text-slate-500 bg-slate-100 border-slate-200";
    const num = parseFloat(val);
    if (isNaN(num)) return "text-slate-500 bg-slate-100 border-slate-200";
    if (num >= 4.5) return "text-[#65A30D] bg-[#ECFCCA] border-lime-200";
    if (num >= 3.5) return "text-[#0284C7] bg-[#E0F2FE] border-sky-200";
    if (num >= 2.5) return "text-[#FF7A00] bg-[#FFEADB] border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const filteredFeed = feed.filter(
    (item) =>
      item.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.student_name && item.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans text-[#1D1E26] select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1D1E26] tracking-tight">Fikr-mulohazalar va Izohlar</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Ota-onalar tomonidan baholar hamda taomnomalarga qoldirilgan barcha izohlar lenti va javob berish paneli.
          </p>
        </div>

        <input
          type="text"
          placeholder="Fikr-mulohazalarni izlash..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white border border-slate-200 text-xs text-slate-700 font-medium px-3.5 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D4F562] shadow-xs w-64"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-mono text-xs">
          Izohlar yuklanmoqda...
        </div>
      ) : filteredFeed.length === 0 ? (
        <div className="py-20 text-center text-slate-400 font-medium text-xs italic border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          Hozircha hech qanday fikr-mulohaza kelib tushmagan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeed.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="bg-white border border-slate-100/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1D1E26] text-white flex items-center justify-center text-xs font-black">
                      {item.author_name ? item.author_name[0] : "P"}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#1D1E26]">{item.author_name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase font-mono border ${
                      item.type === "GRADE"
                        ? "bg-[#E0F2FE] text-[#0284C7] border-sky-200"
                        : "bg-[#FFEADB] text-[#FF7A00] border-orange-200"
                    }`}
                  >
                    {item.type === "GRADE" ? "Baho izohi" : "Taomnoma izohi"}
                  </span>
                </div>

                {/* Content details */}
                {item.type === "GRADE" ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#1D1E26]">
                        {item.student_name} ({item.class_name})
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${getGradeColor(item.grade_value)}`}>
                        Baho: {item.grade_value}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Fan: {item.subject_name}</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                    <p className="text-[11px] font-extrabold text-[#1D1E26]">
                      Sana: {item.menu_date ? new Date(item.menu_date).toLocaleDateString() : "Bugun"}
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  "{item.content}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => {
                    setSelectedChatComment(item);
                    setChatModalOpen(true);
                    fetchChatMessages(item);
                  }}
                  className="bg-[#D4F562] text-[#1D1E26] font-black text-xs px-4 py-2 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  Muloqotni ko'rish / Javob berish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Dialog Modal */}
      {chatModalOpen && selectedChatComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-4 text-[#1D1E26] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">
                  Muloqot: {selectedChatComment.author_name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {selectedChatComment.type === "GRADE" ? `Baho: ${selectedChatComment.grade_value}` : "Taomnoma"}
                </p>
              </div>
              <button
                onClick={() => setChatModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Chat messages scrollable */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-80">
              {chatLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs font-mono">
                  Suhbat ma'lumotlari yuklanmoqda...
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium italic">
                  Hali muloqot xabarlari mavjud emas.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isAdmin = msg.role === "ADMIN" || msg.role === "TEACHER" || msg.role === "MAIN_TEACHER";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 max-w-[80%] ${
                        isAdmin ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <span className="text-[9px] text-slate-400 font-mono">
                        {msg.author_name} ({msg.role})
                      </span>
                      <div
                        className={`p-3 rounded-2xl text-xs font-medium shadow-xs ${
                          isAdmin
                            ? "bg-[#1D1E26] text-white rounded-br-none"
                            : "bg-slate-100 text-slate-800 border border-slate-200/60 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleReplySubmit} className="pt-3 border-t border-slate-100 space-y-2">
              {replyError && <div className="text-xs text-red-500 font-bold">{replyError}</div>}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Javob xabarini yozing..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-800 px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#D4F562]"
                />
                <button
                  type="submit"
                  disabled={replySubmitLoading || !replyText.trim()}
                  className="bg-[#D4F562] text-[#1D1E26] font-black text-xs px-4 py-2.5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {replySubmitLoading ? "..." : "Yuborish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
