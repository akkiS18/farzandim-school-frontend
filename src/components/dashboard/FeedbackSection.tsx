"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Search } from "lucide-react";

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

// A "chat thread" is a group of FeedbackComments that share the same context
interface ChatThread {
  key: string;
  type: "GRADE" | "MENU";
  grade_id?: number;
  parent_id: number;
  menu_date?: string;
  // Representative metadata (from first/latest message)
  author_name: string;
  subject_name?: string;
  grade_value?: string;
  student_name?: string;
  class_name?: string;
  // Messages sorted by time, latest last
  messages: FeedbackComment[];
  // The representative comment for opening the chat
  representative: FeedbackComment;
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
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replySubmitLoading, setReplySubmitLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChatModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => { fetchFeedback(); }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatModalOpen) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [chatMessages, chatModalOpen]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/schools/comments/feed`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok) setFeed(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (thread: ChatThread) => {
    setChatLoading(true);
    try {
      let url = "";
      if (thread.type === "GRADE") {
        url = `${apiUrl}/api/schools/grades/${thread.grade_id}/comments`;
      } else {
        const dateStr = thread.menu_date ? thread.menu_date.split("T")[0] : "";
        url = `${apiUrl}/api/schools/menu/comments?menu_date=${dateStr}&parent_id=${thread.parent_id}`;
      }
      const response = await fetch(url, { headers: safeFetchHeaders() });
      const data = await response.json();
      if (response.ok) setChatMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching chat:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThread) return;

    setReplySubmitLoading(true);
    setReplyError("");
    try {
      let url = "";
      let body = {};
      if (selectedThread.type === "GRADE") {
        url = `${apiUrl}/api/schools/grades/${selectedThread.grade_id}/comments`;
        body = { content: replyText.trim() };
      } else {
        const dateStr = selectedThread.menu_date ? selectedThread.menu_date.split("T")[0] : "";
        url = `${apiUrl}/api/schools/menu/comments`;
        body = { menu_date: dateStr, parent_id: selectedThread.parent_id, content: replyText.trim() };
      }

      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.ok) {
        setReplyText("");
        fetchChatMessages(selectedThread);
        fetchFeedback();
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

  // ── Group feed items into ChatThread[] ────────────────────────────
  const buildThreads = (items: FeedbackComment[]): ChatThread[] => {
    const map = new Map<string, ChatThread>();

    for (const item of items) {
      let key: string;
      if (item.type === "GRADE") {
        key = `GRADE-${item.grade_id}`;
      } else {
        const d = item.menu_date ? item.menu_date.split("T")[0] : "unknown";
        key = `MENU-${item.parent_id}-${d}`;
      }

      if (!map.has(key)) {
        map.set(key, {
          key,
          type: item.type,
          grade_id: item.grade_id,
          parent_id: item.parent_id,
          menu_date: item.menu_date,
          author_name: item.author_name,
          subject_name: item.subject_name,
          grade_value: item.grade_value,
          student_name: item.student_name,
          class_name: item.class_name,
          messages: [],
          representative: item,
        });
      }
      map.get(key)!.messages.push(item);
    }

    // Sort messages within each thread by time ascending
    for (const thread of map.values()) {
      thread.messages.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      // Use the latest message as the "preview" representative
      thread.representative = thread.messages[thread.messages.length - 1];
    }

    // Sort threads by latest message time (most recent first)
    return [...map.values()].sort((a, b) =>
      new Date(b.representative.created_at).getTime() - new Date(a.representative.created_at).getTime()
    );
  };

  const allThreads = buildThreads(feed);

  const filteredThreads = allThreads.filter((thread) => {
    const q = searchQuery.toLowerCase();
    return (
      thread.author_name.toLowerCase().includes(q) ||
      thread.messages.some((m) => m.content.toLowerCase().includes(q)) ||
      (thread.student_name && thread.student_name.toLowerCase().includes(q)) ||
      (thread.subject_name && thread.subject_name.toLowerCase().includes(q))
    );
  });

  const openThread = (thread: ChatThread) => {
    setSelectedThread(thread);
    setChatModalOpen(true);
    fetchChatMessages(thread);
    setReplyText("");
    setReplyError("");
  };

  return (
    <div className="space-y-6 font-sans text-[#1D1E26]">
      {/* ── Unified Header ── */}
      <div className="bg-white border border-slate-100/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-500 font-mono">
            Jami: <strong className="text-[#1D1E26] font-extrabold">{allThreads.length}</strong> ta muloqot
          </span>
        </div>

        <div className="relative min-w-[260px] sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Fikr-mulohazalarni izlash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-none outline-none focus:ring-2 focus:ring-[#1D1E26] transition placeholder:text-slate-400 placeholder:font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-4 h-4 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-xs">Izohlar yuklanmoqda...</p>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="py-20 text-center text-slate-400 font-medium text-xs italic border border-dashed border-slate-200 rounded-none bg-slate-50/50">
          Hozircha hech qanday fikr-mulohaza kelib tushmagan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredThreads.map((thread) => {
            const latest = thread.representative;
            const msgCount = thread.messages.length;
            const latestTime = new Date(latest.created_at);

            return (
              <div
                key={thread.key}
                onClick={() => openThread(thread)}
                className="bg-white border border-slate-200 rounded-none p-5 shadow-xs flex flex-col gap-3.5 hover:border-[#1D1E26] transition-all duration-150 cursor-pointer group select-none"
              >
                {/* Thread header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-none bg-[#1D1E26] text-[#D4F562] flex items-center justify-center text-sm font-black shrink-0">
                      {thread.author_name ? thread.author_name[0] : "P"}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#1D1E26] leading-tight">{thread.author_name}</h4>
                      <p className="text-[9px] text-slate-400 font-mono">
                        {latestTime.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" })}
                        {" · "}
                        {latestTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Message count badge */}
                    <span className="flex items-center gap-1 bg-slate-100 text-[#1D1E26] text-[9px] font-mono font-bold px-2 py-1 rounded-none border border-slate-200">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {msgCount}
                    </span>
                    {/* Type badge */}
                    <span className="px-2 py-1 rounded-none text-[9px] font-extrabold uppercase font-mono border bg-slate-100 text-[#1D1E26] border-slate-200">
                      {thread.type === "GRADE" ? "Baho" : "Taom"}
                    </span>
                  </div>
                </div>

                {/* Context info */}
                {thread.type === "GRADE" ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-none px-3.5 py-2.5">
                    <div>
                      <p className="text-[11px] font-extrabold text-[#1D1E26] leading-tight">
                        {thread.student_name}
                        {thread.class_name && <span className="text-slate-400 font-normal"> · {thread.class_name}</span>}
                      </p>
                      {thread.subject_name && (
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">{thread.subject_name}</p>
                      )}
                    </div>
                    {thread.grade_value && (
                      <span className={`px-2 py-0.5 rounded-none text-[10px] font-mono font-black border ${getGradeColor(thread.grade_value)}`}>
                        {thread.grade_value}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-none px-3.5 py-2.5">
                    <p className="text-[11px] font-extrabold text-[#1D1E26]">
                      Sana: {thread.menu_date
                        ? new Date(thread.menu_date).toLocaleDateString("uz-UZ", { day: "2-digit", month: "long" })
                        : "Bugun"}
                    </p>
                  </div>
                )}

                {/* Message preview strip — last 2 messages */}
                <div className="space-y-1.5">
                  {thread.messages.slice(-2).map((msg, idx) => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <div className={`w-1 h-full rounded-none self-stretch shrink-0 ${idx === thread.messages.length - 2 && thread.messages.length > 1 ? "bg-slate-200" : "bg-[#1D1E26]"}`} style={{ minHeight: 16 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-slate-400 font-mono leading-tight">{msg.author_name}</p>
                        <p className="text-[11px] text-slate-700 font-medium leading-snug truncate">
                          &ldquo;{msg.content}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-mono">
                    {msgCount > 1 ? `${msgCount} ta xabar` : "1 ta xabar"}
                  </span>
                  <span className="text-[10px] font-extrabold text-[#1D1E26] group-hover:text-[#1D1E26] transition-colors">
                    Ochish →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chat Modal */}
      {chatModalOpen && selectedThread && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setChatModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-none shadow-2xl text-[#1D1E26] max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-none bg-[#1D1E26] text-[#D4F562] flex items-center justify-center text-sm font-black shrink-0">
                  {selectedThread.author_name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1D1E26] leading-tight">
                    {selectedThread.author_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {selectedThread.type === "GRADE"
                      ? `${selectedThread.subject_name} · Baho: ${selectedThread.grade_value} · ${selectedThread.student_name}`
                      : `Taomnoma · ${selectedThread.menu_date ? new Date(selectedThread.menu_date).toLocaleDateString("uz-UZ") : ""}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatModalOpen(false)}
                className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer shrink-0 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatLoading ? (
                <div className="py-10 text-center">
                  <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-mono">Suhbat yuklanmoqda...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-medium italic">
                  Hali muloqot xabarlari mavjud emas.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isAdmin = msg.role === "ADMIN" || msg.role === "TEACHER" || msg.role === "MAIN_TEACHER" || msg.role === "SUBJECT_TEACHER";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-0.5 max-w-[80%] ${isAdmin ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <span className="text-[9px] text-slate-400 font-mono px-1">
                        {msg.author_name}
                      </span>
                      <div className={`px-3.5 py-2.5 rounded-none text-xs font-medium leading-relaxed ${isAdmin ? "bg-[#1D1E26] text-[#D4F562]" : "bg-slate-100 text-slate-800 border border-slate-200"}`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reply form */}
            <form onSubmit={handleReplySubmit} className="p-4 border-t border-slate-100 space-y-2 shrink-0 bg-slate-50/50">
              {replyError && <div className="text-xs text-red-500 font-bold">{replyError}</div>}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Javob xabarini yozing..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 text-xs text-slate-800 px-3.5 py-2.5 rounded-none outline-none focus:ring-2 focus:ring-[#1D1E26] font-medium"
                />
                <button
                  type="submit"
                  disabled={replySubmitLoading || !replyText.trim()}
                  className="bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 font-extrabold text-xs px-5 py-2.5 rounded-none transition cursor-pointer disabled:opacity-50 shrink-0"
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
