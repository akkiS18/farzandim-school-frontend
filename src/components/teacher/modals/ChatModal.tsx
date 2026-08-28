"use client";

import React from "react";
import { X } from "lucide-react";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChatComment: any;
  userInfo: any;
  chatLoading: boolean;
  chatMessages: any[];
  replyText: string;
  setReplyText: (text: string) => void;
  replyError: string;
  replySubmitLoading: boolean;
  onReplySubmit: (e: React.FormEvent) => void;
}

export default function ChatModal({
  isOpen,
  onClose,
  selectedChatComment,
  userInfo,
  chatLoading,
  chatMessages,
  replyText,
  setReplyText,
  replyError,
  replySubmitLoading,
  onReplySubmit,
}: ChatModalProps) {
  if (!isOpen || !selectedChatComment) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 w-full max-w-[480px] shadow-2xl flex flex-col max-h-[90vh] text-zinc-900 animate-fadeIn space-y-3">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#16193E] flex items-center gap-2">
              <span>💬 Muhokama (Chat)</span>
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Ota-ona: <b className="text-zinc-800">{selectedChatComment.author_name}</b>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat messages */}
        <div className="max-h-[300px] min-h-[150px] overflow-y-auto border border-zinc-200/70 rounded-2xl p-3 bg-zinc-50 flex flex-col gap-2.5 flex-1">
          {chatLoading && chatMessages.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-400">Yuklanmoqda...</div>
          ) : chatMessages.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-450 italic">Xabarlar yo'q.</div>
          ) : (
            chatMessages.map((msg, idx) => {
              const isMyMessage = msg.author_id === userInfo?.id;
              return (
                <div
                  key={msg.id || idx}
                  style={{
                    alignSelf: isMyMessage ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {!isMyMessage && (
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#9CA3AF",
                        marginBottom: "2px",
                        fontWeight: 700,
                      }}
                    >
                      {msg.author_name} ({msg.role === "PARENT" ? "Ota-ona" : "Maktab"})
                    </span>
                  )}
                  <div
                    style={{
                      backgroundColor: isMyMessage ? "#5B50EC" : "#E5E7EB",
                      color: isMyMessage ? "white" : "#374151",
                      borderRadius: "14px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 500,
                      lineHeight: "1.4",
                    }}
                  >
                    {msg.content}
                  </div>
                  <span
                    style={{
                      fontSize: "8px",
                      color: "#9CA3AF",
                      marginTop: "2px",
                      alignSelf: isMyMessage ? "flex-end" : "flex-start",
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

        <form onSubmit={onReplySubmit} className="flex gap-2 items-end">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="flex-1 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none resize-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
            placeholder="Javobingizni yozing..."
          />
          <button
            type="submit"
            disabled={replySubmitLoading}
            className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer h-10 flex items-center justify-center shrink-0 shadow-xs"
          >
            {replySubmitLoading ? "..." : "Yuborish"}
          </button>
        </form>
      </div>
    </div>
  );
}
