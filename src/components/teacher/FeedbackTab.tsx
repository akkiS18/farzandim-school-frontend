"use client";

import React, { useState } from "react";
import { Search, FileText, Utensils } from "lucide-react";

export interface ChatThread {
  key: string;
  type: "GRADE" | "MENU";
  grade_id?: number;
  parent_id: number;
  menu_date?: string;
  author_name: string;
  subject_name?: string;
  grade_value?: string;
  student_name?: string;
  class_name?: string;
  messages: any[];
  representative: any;
}

export const buildThreads = (items: any[]): ChatThread[] => {
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

  return Array.from(map.values()).sort((a, b) => {
    const tA = new Date(a.representative.created_at).getTime();
    const tB = new Date(b.representative.created_at).getTime();
    return tB - tA;
  });
};

interface FeedbackTabProps {
  feedbackFeed: any[];
  feedbackLoading: boolean;
  onOpenChat: (rep: any) => void;
}

export default function FeedbackTab({
  feedbackFeed,
  feedbackLoading,
  onOpenChat,
}: FeedbackTabProps) {
  const [feedbackSearch, setFeedbackSearch] = useState("");

  const filteredThreads = buildThreads(feedbackFeed).filter((thread) => {
    const q = feedbackSearch.toLowerCase();
    return (
      thread.author_name.toLowerCase().includes(q) ||
      thread.messages.some((m: any) => m.content.toLowerCase().includes(q)) ||
      (thread.student_name && thread.student_name.toLowerCase().includes(q)) ||
      (thread.subject_name && thread.subject_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">
            Ota-onalardan Kelgan Fikr-mulohazalar
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Siz dars beradigan fanlar va siz rahbarlik qiladigan sinf ota-onalarining izohlari.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-2xl px-3.5 py-2 shrink-0">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={feedbackSearch}
            onChange={(e) => setFeedbackSearch(e.target.value)}
            placeholder="Qidirish..."
            className="bg-transparent border-none text-xs font-bold text-zinc-800 outline-none w-36 sm:w-48 transition-all"
          />
        </div>
      </div>

      {feedbackLoading ? (
        <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
        </div>
      ) : feedbackFeed.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl">
          <p className="text-sm font-bold text-zinc-800 mb-1">Fikrlar mavjud emas</p>
          <p className="text-xs text-zinc-400 font-mono">
            Hozircha ota-onalardan hech qanday izoh yoki fikrlar kelmagan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((thread) => {
            const isGrade = thread.type === "GRADE";
            const rep = thread.representative;

            return (
              <div
                key={thread.key}
                onClick={() => onOpenChat(rep)}
                className="bg-white border border-zinc-200/70 border-l-4 border-l-[#5B50EC] rounded-3xl p-5 shadow-xs hover:shadow-md transition text-zinc-900 space-y-3.5 cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    {isGrade ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#0284C7] bg-[#E0F2FE] px-3 py-1 rounded-xl">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Bahoga izoh</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Taomnomaga izoh</span>
                      </span>
                    )}
                    <span className="text-xs font-extrabold text-[#16193E]">{thread.author_name}</span>
                    <span className="text-[10px] text-zinc-400 font-medium">Ota-ona</span>
                    {thread.messages.length > 1 && (
                      <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono">
                        💬 {thread.messages.length} ta xabar
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono font-medium">
                    {new Date(rep.created_at).toLocaleString("uz-UZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {isGrade ? (
                  <div className="flex items-center space-x-3 bg-zinc-50/80 border border-zinc-200/60 p-3 rounded-2xl text-xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black flex items-center justify-center font-mono shrink-0">
                      {thread.grade_value || "-"}
                    </div>
                    <div>
                      <span className="text-[#16193E] font-extrabold block text-xs">{thread.subject_name}</span>
                      <span className="text-zinc-500 text-[11px] font-medium">
                        O&apos;quvchi: <b className="text-zinc-800">{thread.student_name}</b>{" "}
                        {thread.class_name && `(${thread.class_name})`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-zinc-50/80 border border-zinc-200/60 p-3 rounded-2xl text-xs font-bold text-zinc-700">
                    <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Taomnoma kuni:{" "}
                      {new Date(thread.menu_date || "").toLocaleDateString("uz-UZ", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                <div className="text-xs text-zinc-700 bg-zinc-50/60 p-3.5 rounded-2xl border border-zinc-200/60 font-medium leading-relaxed italic flex items-center justify-between">
                  <span>&ldquo;{rep.content}&rdquo;</span>
                  <span className="text-[10px] text-indigo-600 font-bold not-italic hover:underline cursor-pointer shrink-0 ml-2">
                    💬 Chatni ochish &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
