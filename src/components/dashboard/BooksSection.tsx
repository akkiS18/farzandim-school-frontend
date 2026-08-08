import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Upload,
  FileText,
  Trash2,
  Edit,
  Download,
  ExternalLink,
  Loader2,
  Check,
  X,
  Filter,
  Bookmark,
  Sparkles,
  Cloud,
  Server,
} from "lucide-react";
import { useDialog } from "../../hooks/useDialog";
import CustomDialogModal from "../CustomDialogModal";

export interface BookItem {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  file_url: string;
  download_link?: string;
  location_in_school?: string;
  file_size: string;
  target_levels: number[];
  class_ids: number[];
  created_at: string;
}

interface BooksSectionProps {
  token: string;
  API_URL: string;
}

const DefaultBookCover: React.FC<{ title: string; author?: string }> = ({ title, author }) => (
  <div className="w-full h-full bg-gradient-to-br from-[#1D1E26] via-slate-800 to-[#1D1E26] p-4 flex flex-col justify-between relative overflow-hidden select-none">
    <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
      <BookOpen className="w-28 h-28 text-white" />
    </div>
    <div className="w-8 h-8 rounded-xl bg-[#D4F562] text-[#1D1E26] flex items-center justify-center font-bold shadow-2xs">
      <BookOpen className="w-4 h-4" />
    </div>
    <div className="relative z-10">
      <p className="text-white font-extrabold text-xs sm:text-sm line-clamp-2 leading-snug drop-shadow-xs">
        {title}
      </p>
      {author && (
        <p className="text-slate-400 text-[10px] font-semibold mt-1 truncate">
          {author}
        </p>
      )}
    </div>
  </div>
);

const BookCoverItem: React.FC<{ coverUrl?: string; title: string; author?: string; getFullUrl: (url: string) => string }> = ({ coverUrl, title, author, getFullUrl }) => {
  const [imgError, setImgError] = useState(false);

  if (!coverUrl || imgError) {
    return <DefaultBookCover title={title} author={author} />;
  }

  return (
    <img
      src={getFullUrl(coverUrl)}
      alt={title}
      onError={() => setImgError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
    />
  );
};

export default function BooksSection({ token, API_URL }: BooksSectionProps) {
  const { dialogState, showAlert, showConfirm } = useDialog();

  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | "ALL">("ALL");

  // Modal & Notification States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form States
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [targetLevels, setTargetLevels] = useState<number[]>([]);

  // File Uploading States
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/books`, {
        headers: safeFetchHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setBooks(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch books:", data?.error);
        setBooks([]);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [token]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedLevelFilter]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "cover") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFile = files[0];
    const formData = new FormData();
    formData.append("file", selectedFile);

    if (type === "file") setUploadingFile(true);
    else setUploadingCover(true);

    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const res = await fetch(`${API_URL}/api/schools/upload/book`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(sId ? { "X-School-ID": sId } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        if (type === "file") {
          setFileUrl(data.url);
          setFileSize(data.file_size || "");
        } else {
          setCoverUrl(data.url);
        }
      } else {
        setFormError(data.error || "Faylni yuklashda xatolik");
      }
    } catch {
      setFormError("Fayl yuklashda server xatoligi");
    } finally {
      if (type === "file") setUploadingFile(false);
      else setUploadingCover(false);
    }
  };

  const openAddModal = () => {
    setEditingBook(null);
    setTitle("");
    setAuthor("");
    setDescription("");
    setFileUrl("");
    setFileSize("");
    setCoverUrl("");
    setTargetLevels([]);
    setFormError("");
    setShowAddModal(true);
  };

  const openEditModal = (book: BookItem) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author || "");
    setDescription(book.description || "");
    setFileUrl(book.file_url);
    setFileSize(book.file_size || "");
    setCoverUrl(book.cover_url || "");
    setTargetLevels(book.target_levels || []);
    setFormError("");
    setShowAddModal(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!title.trim() || !fileUrl.trim()) {
      setFormError("Iltimos, sarlavha va elektron faylni yuklang!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        cover_url: coverUrl.trim(),
        file_url: fileUrl.trim(),
        file_size: fileSize.trim(),
        target_levels: targetLevels,
        class_ids: [],
      };

      const url = editingBook
        ? `${API_URL}/api/schools/books/${editingBook.id}`
        : `${API_URL}/api/schools/books`;
      const method = editingBook ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: safeFetchHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          editingBook
            ? "Kitob muvaffaqiyatli tahrirlandi!"
            : "Yangi kitob kutubxonaga qo'shildi!",
          "success"
        );
        setShowAddModal(false);
        fetchBooks();
      } else {
        setFormError(data.error || data.details || "Kitobni saqlashda xatolik yuz berdi");
      }
    } catch {
      setFormError("Server bilan bog'lanishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = (id: number, bookTitle: string) => {
    showConfirm(
      `Haqiqatan ham "${bookTitle}" kitobini o'chirmoqchimisiz?`,
      async () => {
        try {
          const res = await fetch(`${API_URL}/api/schools/books/${id}`, {
            method: "DELETE",
            headers: safeFetchHeaders(),
          });
          if (res.ok) {
            showAlert("Kitob o'chirildi!");
            fetchBooks();
          } else {
            const data = await res.json();
            showAlert(data.error || "O'chirishda xatolik");
          }
        } catch {
          showAlert("Server bilan bog'lanishda xatolik");
        }
      },
      { title: "Kitobni o'chirish", type: "danger", confirmText: "Ha, o'chirish" }
    );
  };

  const toggleLevel = (lvl: number) => {
    if (targetLevels.includes(lvl)) {
      setTargetLevels(targetLevels.filter((l) => l !== lvl));
    } else {
      setTargetLevels([...targetLevels, lvl]);
    }
  };

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    const matchesLevel =
      selectedLevelFilter === "ALL" ||
      (b.target_levels && b.target_levels.length === 0) ||
      (b.target_levels && b.target_levels.includes(selectedLevelFilter));
    return matchesSearch && matchesLevel;
  });

  const totalCount = filteredBooks.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentBooks = filteredBooks.slice(startIndex, startIndex + pageSize);

  const getPaginationGroup = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_URL}${url}`;
  };

  // Esc key listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAddModal) {
        setShowAddModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal]);

  return (
    <div className="space-y-6 font-sans text-[#1D1E26] select-none relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border font-bold text-xs flex items-center gap-2 animate-fadeIn ${
          toastMessage.type === "success" ? "bg-[#1D1E26] text-white border-slate-700" : "bg-red-600 text-white border-red-700"
        }`}>
          <span className="w-2 h-2 rounded-full bg-[#D4F562]"></span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight">Kitobxonlik Boshqaruvi</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            O'quvchilar va ularning ota-onalari uchun yillik elektron kitoblar bazasi.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 shrink-0 justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Kitob Qo'shish</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kitob nomi yoki muallifi bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F562] transition text-[#1D1E26] font-medium"
          />
        </div>

        {/* Level Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none min-w-0 max-w-full">
          <button
            onClick={() => setSelectedLevelFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
              selectedLevelFilter === "ALL"
                ? "bg-[#1D1E26] text-white shadow-xs font-black"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Barchasi
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                selectedLevelFilter === lvl
                  ? "bg-[#1D1E26] text-white shadow-xs font-black"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {lvl}-sinf
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-100">
          <Loader2 className="w-8 h-8 text-[#1D1E26] animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-500">Kitoblar yuklanmoqda...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-100 text-center px-4">
          <div className="w-16 h-16 bg-[#ECFCCA] text-[#1D1E26] border border-lime-300 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#1D1E26]">Hech qanday kitob topilmadi</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            Hali bu sinf uchun kitoblar qo'shilmagan yoki qidiruv so'rovingizga mos natija yo'q.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#D4F562] text-[#1D1E26] font-black px-4 py-2.5 rounded-xl text-xs hover:opacity-90 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Birinchi Kitobni Qo'shish</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
            >
              {/* Cover Image Header */}
              <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                <BookCoverItem
                  coverUrl={book.cover_url}
                  title={book.title}
                  author={book.author}
                  getFullUrl={getFullUrl}
                />
                {/* Levels Tag */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {book.target_levels && book.target_levels.length > 0 ? (
                    book.target_levels.slice(0, 3).map((lvl) => (
                      <span
                        key={lvl}
                        className="bg-[#ECFCCA] text-[#1D1E26] border border-lime-300 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-2xs"
                      >
                        {lvl}-sinf
                      </span>
                    ))
                  ) : (
                    <span className="bg-[#1D1E26] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                      Barcha sinflar
                    </span>
                  )}
                  {book.target_levels && book.target_levels.length > 3 && (
                    <span className="bg-[#ECFCCA] text-[#1D1E26] border border-lime-300 text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                      +{book.target_levels.length - 3}
                    </span>
                  )}
                </div>

                {/* Storage Provider Badge (Cloud vs Server) */}
                <div className="absolute top-3 right-3">
                  {book.file_url && (book.file_url.startsWith("http://") || book.file_url.startsWith("https://")) ? (
                    <span
                      className="inline-flex items-center gap-1 bg-[#1D1E26]/90 backdrop-blur-xs text-[#D4F562] text-[10px] font-black px-2 py-0.5 rounded-lg border border-slate-700 shadow-2xs"
                      title="Cloudflare R2 Bulutida saqlangan"
                    >
                      <Cloud className="w-3 h-3 text-[#D4F562]" />
                      <span>Cloud</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-slate-700 shadow-2xs"
                      title="Server diskida saqlangan"
                    >
                      <Server className="w-3 h-3 text-sky-300" />
                      <span>Server</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[#1D1E26] text-base leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {book.author}
                    </p>
                  )}
                  {book.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const bookLink = (book.download_link || book.file_url || "").trim();
                      const fullUrl = getFullUrl(bookLink);
                      if (!fullUrl) return null;
                      return (
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#ECFCCA] hover:bg-[#D4F562] text-[#1D1E26] font-extrabold border border-lime-300 text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>O'qish {book.file_size && `(${book.file_size})`}</span>
                        </a>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(book)}
                      className="p-2 text-slate-400 hover:text-[#1D1E26] hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      title="Tahrirlash"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {filteredBooks.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-slate-500 font-medium text-center sm:text-left">
            <p className="text-slate-400 font-medium">
              Jami <strong className="text-[#1D1E26] font-mono">{totalCount}</strong> ta kitobdan{" "}
              <span className="font-mono text-[#1D1E26]">
                {startIndex + 1}-{Math.min(startIndex + pageSize, totalCount)}
              </span>{" "}
              ko'rsatilmoqda
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Har sahifada:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-2 py-1 rounded-xl outline-none cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-[#D4F562] transition"
              >
                <option value={6}>6 ta</option>
                <option value={12}>12 ta</option>
                <option value={24}>24 ta</option>
                <option value={48}>48 ta</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 bg-white hover:bg-slate-200 text-[#1D1E26] rounded-xl flex items-center justify-center font-bold text-sm shadow-xs transition cursor-pointer disabled:opacity-40"
                title="Oldingi sahifa"
              >
                ‹
              </button>

              {getPaginationGroup().map((item, idx) => {
                if (item === "...") {
                  return (
                    <span key={`dots-${idx}`} className="px-1 text-slate-400 font-mono font-bold select-none text-xs">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(item);
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-mono font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
                        : "bg-white text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 bg-white hover:bg-slate-200 text-[#1D1E26] rounded-xl flex items-center justify-center font-bold text-sm shadow-xs transition cursor-pointer disabled:opacity-40"
                title="Keyingi sahifa"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 relative flex flex-col max-h-[90vh] my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ECFCCA] text-[#1D1E26] border border-lime-300 rounded-2xl flex items-center justify-center font-bold shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#1D1E26] leading-tight">
                    {editingBook ? "Kitobni Tahrirlash" : "Yangi Kitob Qo'shish"}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Elektron kitob va uning ma'lumotlarini yuklang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-[#1D1E26] p-2 rounded-full hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body & Actions */}
            <form onSubmit={handleSaveBook} className="flex flex-col min-h-0 flex-1">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {/* Form Error Banner */}
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn">
                    <span>{formError}</span>
                    <button
                      type="button"
                      onClick={() => setFormError("")}
                      className="text-red-500 hover:text-red-800 p-1 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kitob Sarlavhasi / Nomi *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: O'tkan kunlar - Abdulla Qodiriy"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F562] font-medium text-[#1D1E26]"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Muallifi
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Masalan: Abdulla Qodiriy"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F562] font-medium text-[#1D1E26]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Qisqacha Tavsifi / Haqida
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kitob mazmuni va o'quvchiga tavsiyasi..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F562] font-medium text-[#1D1E26]"
                  />
                </div>

                {/* Target Class Levels Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Mo'ljallangan Sinflar (Levellar)
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => {
                      const isSelected = targetLevels.includes(lvl);
                      return (
                        <button
                          type="button"
                          key={lvl}
                          onClick={() => toggleLevel(lvl)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "bg-[#1D1E26] text-white shadow-xs font-black"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {lvl}-sinf
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    (Agarda hechnarsa tanlanmasa, barcha sinf o'quvchilariga ko'rinadi)
                  </p>
                </div>

                {/* Direct File Upload (PDF / EPUB) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Elektron Fayl (PDF / EPUB) *
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-[#1D1E26] bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition">
                      {uploadingFile ? (
                        <div className="flex items-center gap-2 text-[#1D1E26] text-xs font-bold">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Fayl yuklanmoqda...</span>
                        </div>
                      ) : fileUrl ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                          <Check className="w-5 h-5" />
                          <span className="line-clamp-1">Fayl yuklandi {fileSize && `(${fileSize})`}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs font-bold text-[#1D1E26]">Kompyuterdan PDF yuklash</span>
                          <span className="text-[10px] text-slate-400">PDF yoki EPUB faylni tanlang</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.epub"
                        onChange={(e) => handleFileUpload(e, "file")}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {fileUrl && (
                    <p className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                      Fayl manzili: {fileUrl}
                    </p>
                  )}
                </div>

                {/* Cover Image Upload (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kitob Muqovasi Rasmi (Ixtiyoriy)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 border border-slate-200 bg-slate-50 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition">
                      <span className="text-xs font-medium text-slate-600">
                        {uploadingCover
                          ? "Rasm yuklanmoqda..."
                          : coverUrl
                          ? "Muqova rasmi tanlandi"
                          : "Rasm faylini tanlang (JPG/PNG)"}
                      </span>
                      <Upload className="w-4 h-4 text-slate-400" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "cover")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D4F562] text-[#1D1E26] font-black text-xs rounded-xl hover:opacity-90 transition cursor-pointer shadow-xs"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingBook ? "Saqlash" : "Qo'shish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Dialog Modal */}
      <CustomDialogModal
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </div>
  );
}
