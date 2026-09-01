"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, FileText, Utensils, RefreshCw } from "lucide-react";

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
    return tB - tA; // descending (newest first)
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
  const [page, setPage] = useState(1);
  const CHATS_PER_PAGE = 10;
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const filteredThreads = buildThreads(feedbackFeed).filter((thread) => {
    const q = feedbackSearch.toLowerCase();
    return (
      thread.author_name.toLowerCase().includes(q) ||
      thread.messages.some((m: any) => m.content.toLowerCase().includes(q)) ||
      (thread.student_name && thread.student_name.toLowerCase().includes(q)) ||
      (thread.subject_name && thread.subject_name.toLowerCase().includes(q))
    );
  });

  const displayedThreads = filteredThreads.slice(0, page * CHATS_PER_PAGE);
  const hasMore = displayedThreads.length < filteredThreads.length;

  useEffect(() => {
    setPage(1);
  }, [feedbackSearch]);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white border border-neutral-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900">
        <div>
          <h3 className="text-sm sm:text-base font-bold font-serif text-[#1E2B42]">
            Ota-onalardan Kelgan Fikr-mulohazalar
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Siz dars beradigan fanlar va siz rahbarlik qiladigan sinf ota-onalarining izohlari.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-neutral-200 px-3.5 py-2 shrink-0">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={feedbackSearch}
            onChange={(e) => setFeedbackSearch(e.target.value)}
            placeholder="Qidirish..."
            className="bg-transparent border-none text-xs font-bold text-slate-800 outline-none w-36 sm:w-48 transition-all"
          />
        </div>
      </div>

      {feedbackLoading && page === 1 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 shadow-sm">
          <RefreshCw className="w-6 h-6 text-[#1E2B42] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-sans">Yuklanmoqda...</p>
        </div>
      ) : feedbackFeed.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-neutral-300">
          <p className="text-sm font-bold font-serif text-[#1E2B42] mb-1">Fikrlar mavjud emas</p>
          <p className="text-xs text-slate-500 font-sans">
            Hozircha ota-onalardan hech qanday izoh yoki fikrlar kelmagan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedThreads.map((thread) => {
            const isGrade = thread.type === "GRADE";
            const rep = thread.representative;

            return (
              <div
                key={thread.key}
                onClick={() => onOpenChat(rep)}
                className="bg-white border border-neutral-200 border-l-4 border-l-[#1E2B42] p-5 shadow-sm hover:shadow-md transition text-slate-900 space-y-3.5 cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div className="flex items-center space-x-2.5">
                    {isGrade ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-800 bg-sky-50 px-3 py-1 border border-sky-200">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Bahoga izoh</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 px-3 py-1 border border-amber-200">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Taomnomaga izoh</span>
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#1E2B42]">{thread.author_name}</span>
                    <span className="text-[10px] text-slate-500 font-sans">Ota-ona</span>
                    {thread.messages.length > 1 && (
                      <span className="text-[10px] font-bold text-[#1E2B42] bg-slate-100 border border-neutral-200 px-2.5 py-0.5">
                        {thread.messages.length} ta xabar
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans">
                    {new Date(rep.created_at).toLocaleString("uz-UZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {isGrade && (
                  <div className="flex items-center space-x-3 bg-slate-50 border border-neutral-200 p-3 text-xs">
                    <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                      {thread.grade_value || "-"}
                    </div>
                    <div>
                      <span className="text-[#1E2B42] font-bold block text-xs">{thread.subject_name}</span>
                      <span className="text-slate-500 text-[11px] font-sans">
                        O'quvchi: <b className="text-slate-800">{thread.student_name}</b>
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 border border-neutral-200 leading-relaxed italic flex items-center justify-between">
                  <span className="truncate pr-4">"{rep.content}"</span>
                  <span className="text-sm text-[#1E2B42] font-bold not-italic hover:underline cursor-pointer shrink-0 ml-2">
                    Chatni ochish &rarr;
                  </span>
                </div>
              </div>
            );
          })}
          
          {hasMore && (
            <div ref={observerTarget} className="py-6 text-center">
              <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Yana chatlar yuklanmoqda...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


