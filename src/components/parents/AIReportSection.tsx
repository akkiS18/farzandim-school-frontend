import React, { useState, useEffect, useRef } from "react";

interface AIReportItem {
  id: string;
  student_id: number;
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  report_text: string;
  summary_json?: {
    average_grade?: number;
    prev_average_grade?: number;
    grade_trend?: string;
    total_grades?: number;
    books_read_count?: number;
  };
  created_at: string;
}

interface AIReportSectionProps {
  token: string;
  API_URL: string;
  studentId?: number;
  studentName?: string;
}

export default function AIReportSection({
  token,
  API_URL,
  studentId,
  studentName = "O'quvchi",
}: AIReportSectionProps) {
  const [reports, setReports] = useState<AIReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [previewReport, setPreviewReport] = useState<AIReportItem | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);

  const storyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!studentId || studentId <= 0) return;

    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/schools/parent/ai-reports?student_id=${studentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-School-ID": localStorage.getItem("school_id") || "",
          },
        });
        if (!res.ok) {
          throw new Error("Hisobotlarni yuklashda xatolik yuz berdi");
        }
        const data = await res.json();
        const fetchedReports: AIReportItem[] = data.reports || [];
        setReports(fetchedReports);
      } catch (err: any) {
        setError(err.message || "Xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [studentId, token, API_URL]);

  // Helper to format ISO date strings cleanly (e.g., 2026-08-10T00:00:00Z -> 2026-08-10)
  const formatDateOnly = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  // Close preview on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewReport) {
        setPreviewReport(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewReport]);

  useEffect(() => {
    if (previewReport) {
      setActiveStoryIndex(0);
    }
  }, [previewReport]);

  // Helper to parse markdown into story sections cleanly
  const parseMarkdownSections = (text: string) => {
    if (!text) return [];
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");

    // Check if text uses explicit ---SECTION:--- markers
    if (cleanText.includes("---SECTION:")) {
      const parts = cleanText.split(/---SECTION:\s*/g).filter(s => s.trim().length > 0);
      return parts.map((part) => {
        const lines = part.split("\n").filter(l => l.trim().length > 0);
        let title = lines[0]?.replace(/---/g, "").replace(/\*\*/g, "").trim() || "Bo'lim";
        const bodyLines = lines.slice(1).map(l => l.replace(/\*\*/g, "").trim());
        return { title, bodyLines, fullContent: bodyLines.join("\n") };
      });
    }

    // Fallback parsing for legacy reports
    const sectionNames = ["HAFTALIK XULOSA", "DINAMIKA TAHLILI", "FANLAR VA KITOBXONLIK", "OTA-ONAGA AMALIY TAVSIYALAR"];
    const rawBlocks = cleanText.split(/(?=\*\*(?:Haftalik|O'sish|Fanlar|Ota-onaga)[^*]+\*\*)/g).filter(s => s.trim().length > 0);

    return rawBlocks.map((block, idx) => {
      const lines = block.split("\n").filter(l => l.trim().length > 0);
      const titleLine = lines[0] || sectionNames[idx] || `Bo'lim ${idx + 1}`;
      const title = titleLine.replace(/\*\*/g, "").replace(/^#+\s*/, "").replace(/^[0-9]\.\s*/, "").trim();
      const bodyLines = lines.slice(1).map(l => l.replace(/\*\*/g, "").trim());
      return { title, bodyLines, fullContent: bodyLines.join("\n") };
    });
  };

  const scrollToStory = (index: number) => {
    if (!storyScrollRef.current) return;
    const container = storyScrollRef.current;
    const childHeight = container.clientHeight;
    container.scrollTo({
      top: index * childHeight,
      behavior: "smooth",
    });
    setActiveStoryIndex(index);
  };

  const handleStoryScroll = () => {
    if (!storyScrollRef.current) return;
    const container = storyScrollRef.current;
    const childHeight = container.clientHeight;
    const newIndex = Math.round(container.scrollTop / childHeight);
    if (newIndex !== activeStoryIndex && newIndex >= 0) {
      setActiveStoryIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4 min-h-[300px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600 animate-pulse">
          AI haftalik hisobotlar yuklanmoqda...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center min-h-[260px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl mb-3">
          <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-800 mb-1">{error}</p>
        <p className="text-xs text-slate-500">Iltimos, sahifani qayta yangilab ko'ring.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans select-none">
      {/* Week Cards Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {reports.length === 0 ? (
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "20px", padding: "32px", textAlign: "center", border: "1px solid #E2E8F0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="24" height="24" fill="none" stroke="#4F46E5" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>Hali AI hisobot mavjud emas</div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>O'qituvchi haftalik hisobot tayyorlagandan so'ng bu yerda ko'rinadi.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {reports.map((rep, idx) => {
              const isLatest = idx === 0;
              const avg = rep.summary_json?.average_grade || 0;
              const startDate = formatDateOnly(rep.start_date);
              const endDate = formatDateOnly(rep.end_date);

              // Friendly message based on data
              let friendlyMsg = "Farzandingizning haftalik bilim tahlili va ta'limiy hikoyasi";
              if (avg > 0) {
                if (avg >= 4.5) friendlyMsg = "Ajoyib hafta — o'zlashtirish va faollik darajasi yuqori!";
                else if (avg >= 3.5) friendlyMsg = "Yaxshi natijalar — bilim olishda davomiylik saqlandi";
                else if (avg >= 2.5) friendlyMsg = "Ushbu haftadagi fanlar bo'yicha muhim tavsiyalar";
                else friendlyMsg = "Farzandingizga o'zlashtirishda yordam berish bo'yicha maslahatlar";
              }

              return (
                <div
                  key={rep.id}
                  onClick={() => setPreviewReport(rep)}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px",
                    padding: "18px",
                    border: isLatest ? "2px solid #6366F1" : "1px solid #E2E8F0",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    transition: "all 0.2s ease",
                    boxShadow: isLatest ? "0 8px 24px rgba(99,102,241,0.12)" : "0 2px 8px rgba(0,0,0,0.03)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Subtle top decorative accent bar for latest */}
                  {isLatest && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
                    }} />
                  )}

                  {/* Top row: Dates & Oxirgi Badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
                      {startDate} — {endDate}
                    </span>
                    {isLatest && (
                      <span style={{
                        backgroundColor: "#EEF2FF",
                        color: "#4F46E5",
                        fontSize: "9px",
                        fontWeight: 900,
                        padding: "3px 10px",
                        borderRadius: "999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        border: "1px solid #C7D2FE",
                      }}>
                        Oxirgi
                      </span>
                    )}
                  </div>

                  {/* AI Hisobot Title in distinct larger colored font */}
                  <div>
                    <div style={{
                      fontSize: "17px",
                      fontWeight: 900,
                      background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}>
                      <span>✨</span> AI Hisobot
                    </div>
                    <p style={{ fontSize: "12px", color: "#475569", marginTop: "4px", lineHeight: 1.45, fontWeight: 500 }}>
                      {friendlyMsg}
                    </p>
                  </div>

                  {/* Bottom row: Week label + Play button (No score/dynamics) */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "10px",
                    borderTop: "1px solid #F1F5F9",
                    marginTop: "2px",
                  }}>
                    <span style={{
                      fontSize: "11px",
                      color: "#94A3B8",
                      fontWeight: 700,
                      backgroundColor: "#F8FAFC",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}>
                      {rep.year}-yil / {rep.week_number}-hafta
                    </span>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#EEF2FF",
                      color: "#4F46E5",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontWeight: 800,
                      fontSize: "11px",
                      transition: "transform 0.15s ease",
                    }}>
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Story
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FULL-SCREEN YANDEX MUSIC / SPOTIFY WRAPPED STYLE STORY REEL MODAL ── */}
      {previewReport && (() => {
        const sections = parseMarkdownSections(previewReport.report_text);
        const totalSlides = 1 + sections.length;

        const cardThemes = [
          {
            bg: "bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#311042]",
            tag: "HAFTALIK HISOBOT",
          },
          {
            bg: "bg-gradient-to-b from-[#064E3B] via-[#047857] to-[#065F46]",
            tag: "01 / HAFTALIK XULOSA",
          },
          {
            bg: "bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF]",
            tag: "02 / DINAMIKA TAHLILI",
          },
          {
            bg: "bg-gradient-to-b from-[#4C1D95] via-[#6D28D9] to-[#5B21B6]",
            tag: "03 / FANLAR VA KITOBXONLIK",
          },
          {
            bg: "bg-gradient-to-b from-[#7C2D12] via-[#C2410C] to-[#9A3412]",
            tag: "04 / OTA-ONAGA TAVSIYALAR",
          },
        ];

        return (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewReport(null);
            }}
            className="fixed inset-0 bg-[#0B0C10]/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md h-[90vh] max-h-[780px] rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex flex-col select-none"
            >
              {/* Top Story Navigation Progress Bars */}
              <div className="absolute top-4 left-4 right-4 z-30 flex items-center gap-1.5">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => scrollToStory(idx)}
                    className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden cursor-pointer backdrop-blur-xs transition"
                  >
                    <div
                      className={`h-full bg-white transition-all duration-300 ${
                        idx === activeStoryIndex ? "w-full" : idx < activeStoryIndex ? "w-full opacity-60" : "w-0"
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setPreviewReport(null)}
                className="absolute top-7 right-5 z-30 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md border border-white/10 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Vertical Scroll Snap Container */}
              <div
                ref={storyScrollRef}
                onScroll={handleStoryScroll}
                className="snap-y snap-mandatory"
                style={{
                  width: "100%",
                  height: "100%",
                  overflowY: "auto",
                  scrollSnapType: "y mandatory",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                } as React.CSSProperties}
              >
                {/* ── SLIDE 0: Cover & Key Metrics Card ── */}
                <div className={`w-full h-full snap-start snap-always shrink-0 p-6 pt-16 flex flex-col gap-6 relative overflow-hidden ${cardThemes[0].bg} text-white`}>
                  <div className="space-y-4 z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-[10px] font-black uppercase tracking-widest border border-white/15 backdrop-blur-md">
                      {cardThemes[0].tag}
                    </span>

                    <div className="space-y-1">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black mb-3 text-white shadow-inner">
                        {studentName.slice(0, 2).toUpperCase()}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                        {studentName}
                      </h2>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-white/70 font-semibold">
                          {formatDateOnly(previewReport.start_date)} — {formatDateOnly(previewReport.end_date)}
                        </span>
                      </div>
                    </div>

                    {/* Key Metrics Horizon Cards */}
                    <div className="grid grid-cols-3 gap-2.5 pt-4">
                      <div className="bg-white/10 border border-white/15 p-3 rounded-2xl backdrop-blur-md text-center flex flex-col justify-center min-h-[64px]">
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-wider block">O'rtacha</span>
                        <span className="text-xs font-black text-white mt-0.5 block">
                          {previewReport.summary_json?.average_grade && previewReport.summary_json.average_grade > 0
                            ? previewReport.summary_json.average_grade.toFixed(1)
                            : "Mavjud emas"}
                        </span>
                      </div>

                      <div className="bg-white/10 border border-white/15 p-3 rounded-2xl backdrop-blur-md text-center flex flex-col justify-center min-h-[64px]">
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-wider block">Dinamika</span>
                        <span className="text-xs font-black text-emerald-300 mt-0.5 block">
                          {previewReport.summary_json?.grade_trend === "UP" && "O'sdi"}
                          {previewReport.summary_json?.grade_trend === "DOWN" && "Pasaydi"}
                          {previewReport.summary_json?.grade_trend === "STABLE" && "Barqaror"}
                          {(!previewReport.summary_json?.grade_trend || previewReport.summary_json?.grade_trend === "") && "Aniqlanmadi"}
                        </span>
                      </div>

                      <div className="bg-white/10 border border-white/15 p-3 rounded-2xl backdrop-blur-md text-center flex flex-col justify-center min-h-[64px]">
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-wider block">Kitoblar</span>
                        <span className="text-xs font-black text-amber-300 mt-0.5 block">
                          {previewReport.summary_json?.books_read_count && previewReport.summary_json.books_read_count > 0
                            ? `${previewReport.summary_json.books_read_count} ta`
                            : "Yangi tugatilmadi"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scroll Down Hint */}
                  <div className="z-10 mt-auto text-center space-y-1 pb-4 animate-bounce">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block">
                      Pastga suring
                    </span>
                    <svg className="w-5 h-5 mx-auto text-white/70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {/* ── SLIDES 1..4: Report Sections Story Cards ── */}
                {sections.map((sec, idx) => {
                  const theme = cardThemes[Math.min(idx + 1, cardThemes.length - 1)];

                  return (
                    <div
                      key={idx}
                      className={`w-full h-full snap-start snap-always shrink-0 p-6 pt-16 flex flex-col justify-between relative overflow-hidden ${theme.bg} text-white`}
                    >
                      <div className="space-y-5 z-10 flex-1 overflow-y-auto scrollbar-none pr-1">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-[10px] font-black uppercase tracking-widest border border-white/15 backdrop-blur-md">
                          {theme.tag}
                        </span>

                        <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                          {sec.title}
                        </h3>

                        <div className="space-y-3 text-sm text-white/95 leading-relaxed font-medium">
                          {sec.bodyLines.length > 0 ? (
                            sec.bodyLines.map((line, lIdx) => {
                              let textLine = line.trim();
                              if (textLine.startsWith("-") || textLine.startsWith("*")) {
                                return (
                                  <div key={lIdx} className="bg-white/10 border border-white/15 p-3.5 rounded-2xl backdrop-blur-md my-2">
                                    <span className="text-white font-semibold">{textLine.replace(/^[-*]\s*/, "")}</span>
                                  </div>
                                );
                              }
                              return <p key={lIdx} className="bg-white/10 border border-white/15 p-4 rounded-2xl backdrop-blur-md leading-relaxed">{textLine}</p>;
                            })
                          ) : (
                            <p className="bg-white/10 border border-white/15 p-4 rounded-2xl backdrop-blur-md leading-relaxed">{sec.fullContent}</p>
                          )}
                        </div>
                      </div>

                      {/* Footer Progress & Scroll Hint */}
                      <div className="z-10 pt-4 flex items-center justify-between border-t border-white/15 shrink-0">
                        <span className="text-[11px] font-extrabold text-white/70">
                          {idx + 1} / {sections.length} bo'lim
                        </span>

                        {idx < sections.length - 1 ? (
                          <button
                            onClick={() => scrollToStory(idx + 2)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition cursor-pointer shadow-lg"
                          >
                            <span>Keyingisi</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => setPreviewReport(null)}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition cursor-pointer shadow-lg"
                          >
                            <span>Tugatish</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
