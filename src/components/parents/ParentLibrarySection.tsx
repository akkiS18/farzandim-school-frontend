"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Award,
  BookMarked,
  MessageSquare,
  FileText,
  Bookmark,
  Sparkles,
} from "lucide-react";

export interface StudentAssignmentItem {
  id: number;
  assignment_id: number;
  assignment_title: string;
  start_date: string;
  end_date: string;
  book_id: number;
  book_title: string;
  book_author: string;
  book_description: string;
  cover_url: string;
  download_link: string;
  location_in_school: string;
  category_name: string;
  student_id: number;
  student_name: string;
  status: string; // 'assigned' | 'reading' | 'completed' | 'graded'
  grade_value: string;
  numeric_value?: number;
  teacher_feedback: string;
  graded_at?: string;
}

export interface BookCatalogItem {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  file_url: string;
  file_size: string;
  download_link: string;
  location_in_school: string;
  category_name?: string;
  target_levels?: number[];
}

interface ParentLibrarySectionProps {
  token: string;
  apiUrl: string;
  schoolId: string;
  selectedChild?: {
    id: number;
    first_name: string;
    last_name: string;
    class_id: number;
    class_name: string;
  };
}

const DefaultCover: React.FC<{ title: string; author?: string }> = ({ title, author }) => (
  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 flex flex-col justify-between relative overflow-hidden select-none">
    <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
      <BookOpen className="w-28 h-28 text-white" />
    </div>
    <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold shadow-xs">
      <BookOpen className="w-4 h-4" />
    </div>
    <div className="relative z-10">
      <p className="text-white font-extrabold text-xs sm:text-sm line-clamp-2 leading-snug drop-shadow-xs">
        {title}
      </p>
      {author && (
        <p className="text-indigo-200 text-[10px] font-semibold mt-1 truncate">
          {author}
        </p>
      )}
    </div>
  </div>
);

export default function ParentLibrarySection({
  token,
  apiUrl,
  schoolId,
  selectedChild,
}: ParentLibrarySectionProps) {
  const [activeTab, setActiveTab] = useState<"assignments" | "catalog">("assignments");
  const [assignments, setAssignments] = useState<StudentAssignmentItem[]>([]);
  const [catalogBooks, setCatalogBooks] = useState<BookCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (schoolId) headers["X-School-ID"] = schoolId;

      const [assignmentsRes, booksRes] = await Promise.all([
        fetch(`${apiUrl}/api/schools/student/reading-assignments`, { headers }),
        fetch(`${apiUrl}/api/schools/books`, { headers }),
      ]);

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(Array.isArray(data) ? data : []);
      }

      if (booksRes.ok) {
        const data = await booksRes.json();
        setCatalogBooks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading parent library data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, [token, schoolId, selectedChild?.id]);

  // Filter assignments by selected child if available
  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (selectedChild?.id) {
      list = list.filter((a) => a.student_id === selectedChild.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.assignment_title.toLowerCase().includes(q) ||
          a.book_title.toLowerCase().includes(q) ||
          a.book_author.toLowerCase().includes(q)
      );
    }
    return list;
  }, [assignments, selectedChild?.id, searchQuery]);

  // Filter catalog books by searchQuery
  const filteredCatalog = useMemo(() => {
    let list = catalogBooks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.category_name && b.category_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [catalogBooks, searchQuery]);

  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${apiUrl}${url}`;
  };

  const getStatusBadge = (status: string, gradeValue?: string) => {
    switch (status) {
      case "graded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Baholandi {gradeValue && `(${gradeValue})`}</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>O'qib bo'lindi</span>
          </span>
        );
      case "reading":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>O'qilmoqda</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Biriktirilgan</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-indigo-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-indigo-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <BookMarked className="w-3.5 h-3.5 text-indigo-300" />
            <span>Kitobxonlik Portali</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {selectedChild
              ? `${selectedChild.first_name}ning Mutolaa va Kitoblar Markazi`
              : "Farzandingiz uchun Kitobxonlik Tizimi"}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 font-medium">
            O'quvchiga biriktirilgan topshiriqlar, o'qish darajasi va elektron kutubxona bazasi.
          </p>
        </div>

        {/* Tab Switch Buttons */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === "assignments"
                ? "bg-indigo-600 text-white shadow-md font-black"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Mutolaa Topshiriqlari</span>
            {filteredAssignments.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {filteredAssignments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === "catalog"
                ? "bg-indigo-600 text-white shadow-md font-black"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Elektron Kutubxona</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === "assignments"
              ? "Topshiriq nomi yoki kitob muallifi bo'yicha qidirish..."
              : "Kitob nomi yoki muallifi bo'yicha qidirish..."
          }
          className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 focus:outline-none placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Kitobxonlik ma'lumotlari yuklanmoqda...</p>
        </div>
      ) : activeTab === "assignments" ? (
        /* ASSIGNMENTS VIEW */
        filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200 text-center px-4">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {selectedChild
                ? `${selectedChild.first_name} uchun mutolaa topshirig'i topilmadi`
                : "Hozircha mutolaa topshiriqlari mavjud emas"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              O'qituvchi tomonidan yangi kitob va mutolaa topshiriqlari berilganda bu yerda ko'rinadi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAssignments.map((item) => {
              const fileLink = (item.download_link && item.download_link.trim() !== (item.cover_url || "").trim() ? item.download_link : "").trim();
              const fullFileUrl = getFullUrl(fileLink);
              const coverUrl = getFullUrl(item.cover_url);
              const hasCover = coverUrl && !imgErrors[item.id];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Card Header & Status */}
                  <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {item.category_name || "Mutolaa Topshirig'i"}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug mt-1">
                        {item.assignment_title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {item.start_date} ➔ {item.end_date}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(item.status, item.grade_value)}
                  </div>

                  {/* Book Content Details */}
                  <div className="p-5 flex-1 flex gap-4">
                    {/* Book Cover Thumbnail */}
                    <div className="w-24 h-32 bg-slate-900 rounded-2xl overflow-hidden shrink-0 shadow-xs relative">
                      {hasCover ? (
                        <img
                          src={coverUrl}
                          alt={item.book_title}
                          onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <DefaultCover title={item.book_title} author={item.book_author} />
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 space-y-2 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                          {item.book_title}
                        </h4>
                        {item.book_author && (
                          <p className="text-xs font-bold text-indigo-600 mt-0.5">
                            {item.book_author}
                          </p>
                        )}
                        {item.book_description && (
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {item.book_description}
                          </p>
                        )}
                      </div>

                      {/* Download Link or Location */}
                      <div className="pt-2">
                        {fullFileUrl ? (
                          <a
                            href={fullFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Kitobni Yuklash / O'qish</span>
                          </a>
                        ) : item.location_in_school ? (
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" />
                            <span>Kutubxonada: {item.location_in_school}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Feedback Section */}
                  {item.teacher_feedback && (
                    <div className="p-4 bg-indigo-50/60 border-t border-indigo-100 flex items-start gap-2.5 text-xs text-slate-700">
                      <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-indigo-900 block">O'qituvchi izohi:</span>
                        <p className="font-medium italic mt-0.5 text-slate-700">&ldquo;{item.teacher_feedback}&rdquo;</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* CATALOG VIEW */
        filteredCatalog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200 text-center px-4">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Kitoblar topilmadi</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Qidiruv so'rovingizga mos kitoblar elektron kutubxonada mavjud emas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredCatalog.map((book) => {
              const linkCandidate = (book.download_link || book.file_url || "").trim();
              const rawLink = linkCandidate !== (book.cover_url || "").trim() ? linkCandidate : "";
              const fullUrl = getFullUrl(rawLink);
              const coverUrl = getFullUrl(book.cover_url);
              const hasCover = coverUrl && !imgErrors[`cat_${book.id}`];

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  <div className="relative h-44 bg-slate-900 overflow-hidden flex items-center justify-center">
                    {hasCover ? (
                      <img
                        src={coverUrl}
                        alt={book.title}
                        onError={() => setImgErrors((prev) => ({ ...prev, [`cat_${book.id}`]: true }))}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <DefaultCover title={book.title} author={book.author} />
                    )}

                    <div className="absolute top-3 left-3">
                      <span className="bg-indigo-900/90 backdrop-blur-xs text-indigo-200 text-[10px] font-black px-2 py-1 rounded-lg border border-indigo-700 shadow-2xs">
                        {book.target_levels && book.target_levels.length > 0
                          ? `${book.target_levels.join(", ")}-sinf`
                          : "Barcha sinflar"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                        {book.title}
                      </h4>
                      {book.author && (
                        <p className="text-xs font-bold text-indigo-600 mt-0.5">
                          {book.author}
                        </p>
                      )}
                      {book.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {fullUrl ? (
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold border border-indigo-200 text-xs py-2 rounded-xl transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          <span>O'qish {book.file_size && `(${book.file_size})`}</span>
                        </a>
                      ) : book.location_in_school ? (
                        <div className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-50 text-amber-800 font-bold border border-amber-200 text-xs py-2 rounded-xl">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span className="truncate">{book.location_in_school}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Mavjud
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
