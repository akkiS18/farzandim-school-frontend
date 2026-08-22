"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Plus,
  FolderPlus,
  Search,
  ExternalLink,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit3,
  Award,
  Users,
  X,
  BookMarked,
  Filter,
  Check,
  ChevronDown,
  UserCheck,
  Layers,
  BookmarkPlus,
  FileSpreadsheet,
  Download,
  UploadCloud,
} from "lucide-react";
import api from "@/lib/api";
import { DateRangePresets } from "../DateRangePresets";
import { useDialog } from "../../hooks/useDialog";
import CustomDialogModal from "../CustomDialogModal";

interface BookCategory {
  id: number;
  name: string;
  description?: string;
}

interface BookItem {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  category_id?: number;
  category_name?: string;
  download_link: string;
  location_in_school: string;
  created_at: string;
}

interface StudentItem {
  id: number;
  student_id?: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  class_id?: number;
  class_name?: string;
}

interface ClassItem {
  id: number;
  name: string;
  level?: number;
}

interface TargetPreset {
  id: number;
  name: string;
  target_levels?: number[];
  target_classes?: number[];
  target_students?: number[];
}

interface ReadingAssignment {
  id: number;
  title: string;
  teacher_name?: string;
  start_date: string;
  end_date: string;
  description: string;
  books?: BookItem[];
  students?: StudentReadingProgress[];
  created_at: string;
}

interface StudentReadingProgress {
  id: number;
  assignment_id: number;
  book_id: number;
  student_id: number;
  student_name: string;
  class_name?: string;
  status?: string;
  grade_value: string;
  teacher_feedback: string;
}

interface LibrarySectionProps {
  token?: string;
  API_URL?: string;
}

export default function LibrarySection({ token, API_URL }: LibrarySectionProps) {
  const effectiveApiUrl = API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";
  const [activeTab, setActiveTab] = useState<"catalog" | "assignments">("catalog");

  // Data states
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [assignments, setAssignments] = useState<ReadingAssignment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [presets, setPresets] = useState<TargetPreset[]>([]);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

  // Modals state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCategoryId, setImportCategoryId] = useState<number | "">("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported_count: number;
    failed_count: number;
    errors: { row: number; error: string }[];
  } | null>(null);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);

  // Grade Modal State
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState<ReadingAssignment | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingProgressItem, setGradingProgressItem] = useState<StudentReadingProgress | null>(null);
  const [gradingScore, setGradingScore] = useState("5");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Category Form State
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Edit Book Modal State
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Searchable Presets Dropdown State
  const [presetSearch, setPresetSearch] = useState("");
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);

  // Book Form State
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookCategory, setBookCategory] = useState<number | "">("");
  const [bookDownloadLink, setBookDownloadLink] = useState("");
  const [bookLocation, setBookLocation] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [bookCoverUrl, setBookCoverUrl] = useState("");

  // Assignment Form State
  const [assignTitle, setAssignTitle] = useState("");
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignEndDate, setAssignEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [assignDescription, setAssignDescription] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);

  // Multi-target Selection States
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedPresetIds, setSelectedPresetIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  const { dialogState, showAlert, showConfirm } = useDialog();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Searchable Multi-Select Dropdown State for Books
  const [bookDropdownSearch, setBookDropdownSearch] = useState("");
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Esc key listener for closing modals and dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddCategoryModal(false);
        setShowAddBookModal(false);
        setShowCreateAssignmentModal(false);
        setShowGradeModal(false);
        setSelectedAssignmentDetails(null);
        setIsBookDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load Library Initial Data
  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const [catData, bookData, assignData, clsData, presetData, studentData] = await Promise.all([
        api.get("/api/schools/book-categories"),
        api.get("/api/schools/books"),
        api.get("/api/schools/reading-assignments"),
        api.get("/api/schools/classes?all=true"),
        api.get("/api/schools/target-presets"),
        api.get("/api/schools/users?role=STUDENT"),
      ]);

      setCategories(Array.isArray(catData) ? catData : []);
      setBooks(Array.isArray(bookData) ? bookData : []);
      setAssignments(Array.isArray(assignData) ? assignData : []);
      setClasses(Array.isArray(clsData) ? clsData : []);
      setPresets(Array.isArray(presetData) ? presetData : []);

      if (Array.isArray(studentData)) {
        const studentMap = new Map<number, any>();
        studentData.forEach((u: any) => {
          const stId = Number(u.student_id || u.id);
          if (stId && !studentMap.has(stId)) {
            studentMap.set(stId, {
              id: stId,
              student_id: stId,
              user_id: Number(u.user_id || u.id),
              first_name: u.first_name,
              last_name: u.last_name,
              class_id: u.class_id || 0,
              class_name: u.class_name || "Noma'lum sinf",
            });
          }
        });
        setAllStudents(Array.from(studentMap.values()));
      }
    } catch (err) {
      console.error("Failed to load library data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  // Compute Unique Resolved Student Set
  const resolvedStudentSet = useMemo(() => {
    const set = new Set<number>();

    // 1. Direct individual students
    selectedStudentIds.forEach((id) => set.add(id));

    // 2. Class IDs
    const classIdSet = new Set(selectedClassIds);
    allStudents.forEach((st) => {
      if (st.class_id && classIdSet.has(st.class_id)) {
        set.add(st.id);
      }
    });

    // 3. Grade Level numbers
    const levelSet = new Set(selectedLevels);
    if (levelSet.size > 0) {
      allStudents.forEach((st) => {
        if (st.class_name) {
          const match = st.class_name.match(/^\d+/);
          if (match && levelSet.has(parseInt(match[0], 10))) {
            set.add(st.id);
          }
        }
      });
    }

    // 4. Target Presets
    selectedPresetIds.forEach((pid) => {
      const preset = presets.find((p) => p.id === pid);
      if (preset) {
        if (preset.target_students) {
          preset.target_students.forEach((sid) => set.add(sid));
        }
        if (preset.target_classes) {
          const pClassSet = new Set(preset.target_classes);
          allStudents.forEach((st) => {
            if (st.class_id && pClassSet.has(st.class_id)) {
              set.add(st.id);
            }
          });
        }
        if (preset.target_levels) {
          const pLvlSet = new Set(preset.target_levels);
          allStudents.forEach((st) => {
            if (st.class_name) {
              const match = st.class_name.match(/^\d+/);
              if (match && pLvlSet.has(parseInt(match[0], 10))) {
                set.add(st.id);
              }
            }
          });
        }
      }
    });

    return set;
  }, [selectedStudentIds, selectedClassIds, selectedLevels, selectedPresetIds, allStudents, presets]);

  // Unique Categories sorted A-Z
  const uniqueCategories = useMemo(() => {
    const map = new Map<string, BookCategory>();
    categories.forEach((cat) => {
      const key = cat.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, cat);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [categories]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    const selectedCatObj = categories.find((c) => c.id === selectedCategoryId);
    const selectedCatName = selectedCatObj?.name.trim().toLowerCase();

    return books.filter((bk) => {
      let matchesCat = selectedCategoryId === "all";
      if (!matchesCat) {
        matchesCat = Boolean(
          bk.category_id === selectedCategoryId ||
            (bk.category_name && selectedCatName && bk.category_name.trim().toLowerCase() === selectedCatName)
        );
      }
      const titleAuthor = `${bk.title} ${bk.author || ""} ${bk.location_in_school || ""}`.toLowerCase();
      const matchesSearch = titleAuthor.includes(searchQuery.toLowerCase().trim());
      return matchesCat && matchesSearch;
    });
  }, [books, selectedCategoryId, categories, searchQuery]);

  // Filtered Classes for search
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => cls.name.toLowerCase().includes(classSearch.toLowerCase().trim()));
  }, [classes, classSearch]);

  // Filtered Students for search
  const filteredStudents = useMemo(() => {
    return allStudents.filter((st) => {
      const fullname = `${st.first_name} ${st.last_name} ${st.class_name}`.toLowerCase();
      return fullname.includes(studentSearch.toLowerCase().trim());
    });
  }, [allStudents, studentSearch]);

  // Handle Add Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!catName.trim()) return;

    try {
      await api.post("/api/schools/book-categories", {
        name: catName.trim(),
        description: catDesc.trim(),
      });
      setActionSuccess("Yangi kitob guruhi muvaffaqiyatli yaratildi!");
      setCatName("");
      setCatDesc("");
      setShowAddCategoryModal(false);
      loadLibraryData();
    } catch (err: any) {
      setActionError(err.message || "Guruh yaratishda xatolik");
    }
  };

  // Handle Add Book
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!bookTitle.trim()) return;

    try {
      await api.post("/api/schools/books", {
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        category_id: bookCategory ? Number(bookCategory) : null,
        download_link: bookDownloadLink.trim(),
        location_in_school: bookLocation.trim(),
        description: bookDescription.trim(),
        cover_url: bookCoverUrl.trim(),
      });
      setActionSuccess("Kitob kutubxonaga muvaffaqiyatli qo'shildi!");
      setBookTitle("");
      setBookAuthor("");
      setBookCategory("");
      setBookDownloadLink("");
      setBookLocation("");
      setBookDescription("");
      setBookCoverUrl("");
      setShowAddBookModal(false);
      loadLibraryData();
    } catch (err: any) {
      setActionError(err.message || "Kitob qo'shishda xatolik");
    }
  };

  // Handle Edit Book
  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!editingBook || !bookTitle.trim()) return;

    try {
      await api.put(`/api/schools/books/${editingBook.id}`, {
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        category_id: bookCategory ? Number(bookCategory) : null,
        download_link: bookDownloadLink.trim(),
        location_in_school: bookLocation.trim(),
        description: bookDescription.trim(),
        cover_url: bookCoverUrl.trim(),
      });
      showToast("Kitob muvaffaqiyatli tahrirlandi!", "success");
      setShowEditBookModal(false);
      setEditingBook(null);
      loadLibraryData();
    } catch (err: any) {
      setActionError(err.message || "Kitobni tahrirlashda xatolik yuz berdi");
    }
  };

  // Handle Save Target Preset
  const handleSavePreset = async () => {
    const presetName = prompt("Yangi to'plam nomini kiriting (masalan: 5-A a'lochilari):");
    if (!presetName || !presetName.trim()) return;

    try {
      setSavingPreset(true);
      await api.post("/api/schools/target-presets", {
        name: presetName.trim(),
        target_levels: selectedLevels,
        target_classes: selectedClassIds,
        target_students: selectedStudentIds,
      });
      showToast("O'quvchilar to'plami muvaffaqiyatli saqlandi!", "success");
      loadLibraryData();
    } catch (err: any) {
      showToast(err.message || "To'plamni saqlashda xatolik", "error");
    } finally {
      setSavingPreset(false);
    }
  };

  // Handle Create Reading Assignment with Unique Set
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");

    if (selectedBookIds.length === 0) {
      setActionError("Iltimos, kamida bitta kitobni tanlang!");
      return;
    }

    const finalStudentArray = Array.from(resolvedStudentSet);
    if (finalStudentArray.length === 0) {
      setActionError("Iltimos, kamida bitta sinf, level, to'plam yoki o'quvchini tanlang!");
      return;
    }

    try {
      await api.post("/api/schools/reading-assignments", {
        title: assignTitle.trim() || "Mutolaa Topshirig'i",
        start_date: assignStartDate,
        end_date: assignEndDate,
        description: assignDescription.trim(),
        book_ids: selectedBookIds,
        student_ids: finalStudentArray,
      });

      setActionSuccess(`Mutolaa topshirig'i ${finalStudentArray.length} ta takrorlanmas o'quvchiga biriktirildi!`);
      setAssignTitle("");
      setSelectedBookIds([]);
      setSelectedLevels([]);
      setSelectedClassIds([]);
      setSelectedPresetIds([]);
      setSelectedStudentIds([]);
      setShowCreateAssignmentModal(false);
      loadLibraryData();
    } catch (err: any) {
      setActionError(err.message || "Topshiriq yaratishda xatolik");
    }
  };

  // Open Assignment Details
  const handleOpenAssignmentDetails = async (assignmentId: number) => {
    try {
      const data = await api.get(`/api/schools/reading-assignments/${assignmentId}`);
      setSelectedAssignmentDetails(data);
    } catch (err) {
      console.error("Failed to load assignment details:", err);
    }
  };

  // Grade Student Reading
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingProgressItem || !selectedAssignmentDetails) return;

    setSubmittingGrade(true);
    try {
      await api.post(`/api/schools/reading-assignments/${selectedAssignmentDetails.id}/grade`, {
        assignment_id: selectedAssignmentDetails.id,
        book_id: gradingProgressItem.book_id,
        student_id: gradingProgressItem.student_id,
        status: "graded",
        grade_value: gradingScore,
        teacher_feedback: gradingFeedback.trim(),
      });

      setShowGradeModal(false);
      showToast("Baho muvaffaqiyatli saqlandi!", "success");
      handleOpenAssignmentDetails(selectedAssignmentDetails.id);
    } catch (err: any) {
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Download Excel Template for Books
  const handleDownloadBookTemplate = async () => {
    try {
      const tokenVal = token || (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {};
      if (tokenVal) headers["Authorization"] = `Bearer ${tokenVal}`;
      if (sId) headers["X-School-ID"] = sId;

      const response = await fetch(`${effectiveApiUrl}/api/schools/import/template/books`, { headers });
      if (!response.ok) throw new Error("Shablonni yuklab bo'lmadi");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kitoblar_shablon.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast(err.message || "Shablon yuklashda xatolik", "error");
    }
  };

  // Import Books from Excel
  const handleImportBooks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Iltimos, Excel (.xlsx) faylini tanlang");
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);
    if (importCategoryId) {
      formData.append("category_id", String(importCategoryId));
    }

    try {
      const tokenVal = token || (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {};
      if (tokenVal) headers["Authorization"] = `Bearer ${tokenVal}`;
      if (sId) headers["X-School-ID"] = sId;

      const response = await fetch(`${effectiveApiUrl}/api/schools/import/books`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
          setImportResult(data);
        } else {
          throw new Error(data.error || "Kitoblarni import qilishda xatolik");
        }
        return;
      }

      setImportResult(data);
      showToast(`${data.imported_count} ta kitob muvaffaqiyatli yuklandi!`, "success");
      loadLibraryData();
      if (!data.errors || data.errors.length === 0) {
        setTimeout(() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
        }, 1800);
      }
    } catch (err: any) {
      setImportError(err.message || "Kitoblarni import qilishda xatolik");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Maktab E-Kutubxona & Mutolaa Tizimi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Maktab Kutubxonasi</h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Elektron va jismoniy kitoblar katalogi, guruhlar hamda o'quvchilarga muddatli mutolaa topshiriqlarini biriktirib baholash paneli.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => {
              setImportFile(null);
              setImportError("");
              setImportResult(null);
              setImportCategoryId("");
              setShowImportModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-500/30 text-white font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/25 backdrop-blur-md"
            title="Kitoblarni Excel shablon orqali ommaviy yuklash"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Excel Import</span>
          </button>
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-2 backdrop-blur-md"
          >
            <FolderPlus className="w-4 h-4 text-indigo-300" />
            <span>Guruh Qo'shish</span>
          </button>
          <button
            onClick={() => setShowAddBookModal(true)}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Kitob Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
      )}

      {/* Main Tabs Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === "catalog"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kitoblar Katalogi & Guruhlar ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === "assignments"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Mutolaa Topshiriqlari & Baholash ({assignments.length})</span>
        </button>
      </div>

      {/* TAB 1: BOOKS CATALOG & CATEGORIES */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Category Filter Pills & Search */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kitob nomi, muallifi yoki joylashuv bo'yicha qidiruv..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Guruh bo'yicha:</span>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategoryId("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategoryId === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Barchasi ({books.length})
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Book Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-indigo-600 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold">Kutubxona kitoblari yuklanmoqda...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto opacity-40 text-slate-500" />
              <p className="text-sm font-bold text-slate-700">Hozircha hech qanday kitob topilmadi</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Yangi kitob qo'shish tugmasini bosib, elektron havola yoki maktab kutubxonasidagi jismoniy kitobni ro'yxatga kiritishingiz mumkin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredBooks.map((bk) => (
                <div
                  key={bk.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-lg transition flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Category Badge Header */}
                    {bk.category_name && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-xl text-[10px] font-extrabold uppercase tracking-wider">
                          {bk.category_name}
                        </span>
                      </div>
                    )}

                    {/* Book Cover or Placeholder */}
                    {bk.cover_url ? (
                      <div className="h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <img src={bk.cover_url} alt={bk.title} className="h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                    ) : (
                      <div className="h-36 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100/60 border border-indigo-100 flex flex-col items-center justify-center p-4 text-center">
                        <BookOpen className="w-8 h-8 text-indigo-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kutubxona Kitobi</span>
                      </div>
                    )}

                    {/* Title & Author */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                        {bk.title}
                      </h3>
                      {bk.author && (
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          Muallif: <span className="text-slate-700">{bk.author}</span>
                        </p>
                      )}
                    </div>

                    {/* Physical Location or Description */}
                    {bk.location_in_school && (
                      <div className="flex items-center gap-1.5 p-2 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] font-bold text-amber-900">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Kutubxonada: {bk.location_in_school}</span>
                      </div>
                    )}

                    {bk.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                        {bk.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    {bk.download_link ? (
                      <a
                        href={bk.download_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Yuklab Olish</span>
                      </a>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500 italic">
                        Kutubxonada mavjud
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBook(bk);
                          setBookTitle(bk.title);
                          setBookAuthor(bk.author || "");
                          setBookCategory(bk.category_id || "");
                          setBookDownloadLink(bk.download_link || "");
                          setBookLocation(bk.location_in_school || "");
                          setBookDescription(bk.description || "");
                          setBookCoverUrl(bk.cover_url || "");
                          setShowEditBookModal(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                        title="Kitobni tahrirlash"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Haqiqatan ham "${bk.title}" kitobini o'chirmoqchimisiz?`)) {
                            try {
                              await api.delete(`/api/schools/books/${bk.id}`);
                              loadLibraryData();
                            } catch (err: any) {
                              alert(err.message || "O'chirishda xatolik");
                            }
                          }
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Kitobni o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: READING ASSIGNMENTS & GRADING */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mutolaa Topshiriqlari Ro'yxati</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sinf o'quvchilariga biriktirilgan vaqt oralig'idagi kitob topshiriqlari va baholash matrisi.
              </p>
            </div>

            <button
              onClick={() => setShowCreateAssignmentModal(true)}
              className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Topshiriq Yaratish</span>
            </button>
          </div>

          {/* Assignments List Cards */}
          {assignments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <Award className="w-12 h-12 mx-auto opacity-40 text-indigo-500" />
              <p className="text-sm font-bold text-slate-700">Hali hech qanday mutolaa topshirig'i biriktirilmagan</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                "Yangi Topshiriq Yaratish" tugmasini bosib, kutubxonadan bir nechta kitob tanlang va o'quvchilarga belgilangan muddat davomida o'qish uchun biriktiring.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900">{asg.title}</h3>
                        {asg.teacher_name && (
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            O'qituvchi: <span className="text-slate-800">{asg.teacher_name}</span>
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{asg.start_date} ➔ {asg.end_date}</span>
                      </span>
                    </div>

                    {asg.description && (
                      <p className="text-xs text-slate-600 font-medium">
                        {asg.description}
                      </p>
                    )}

                    {/* Attached Books List */}
                    {asg.books && asg.books.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Biriktirilgan Kitoblar ({asg.books.length} ta):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {asg.books.map((bk) => (
                            <span
                              key={bk.id}
                              className="px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-extrabold text-slate-800 flex items-center gap-1"
                            >
                              <BookOpen className="w-3 h-3 text-indigo-600" />
                              <span>{bk.title}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpenAssignmentDetails(asg.id)}
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>O'quvchilar Matrisi & Baholash</span>
                    </button>

                    <button
                      onClick={() => {
                        showConfirm(
                          `Haqiqatan ham "${asg.title}" topshirig'ini o'chirmoqchimisiz?`,
                          async () => {
                            try {
                              await api.delete(`/api/schools/reading-assignments/${asg.id}`);
                              showToast("Mutolaa topshirig'i o'chirildi!", "success");
                              loadLibraryData();
                            } catch (err: any) {
                              showToast(err.message || "O'chirishda xatolik", "error");
                            }
                          },
                          { title: "Topshiriqni o'chirish", type: "danger", confirmText: "Ha, o'chirish" }
                        );
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Topshiriqni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD BOOK CATEGORY */}
      {showAddCategoryModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddCategoryModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Yangi Kitob Guruhi</h3>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Guruh Nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: IT va Texnologiya, Biologiya, Badiiy..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Izoh (Ixtiyoriy)
                </label>
                <textarea
                  rows={3}
                  placeholder="Guruh haqida qisqacha ma'lumot..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD BOOK */}
      {showAddBookModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddBookModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Kutubxonaga Yangi Kitob Qo'shish</h3>
              </div>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kitob Nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Clean Code, O'tkan Kunlar..."
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Muallif
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Abdulla Qodiriy"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kitob Guruhi
                  </label>
                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                  >
                    <option value="">-- Guruhni tanlang --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Elektron Kitob Havolasi (Google Drive / Telegram / Internet URL)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={bookDownloadLink}
                  onChange={(e) => setBookDownloadLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:border-emerald-500 outline-none transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Server tezligini oshirish uchun fayl tashqi havolada saqlanadi. Agar kiritilmasa, jismoniy kitob hisoblanadi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Maktab Kutubxonasidagi Joylashuv (Jismoniy kitoblar uchun)</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 2-qavat, 14-javon, 3-tokcha"
                  value={bookLocation}
                  onChange={(e) => setBookLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-amber-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Muqova Rasmi URL (Ixtiyoriy)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={bookCoverUrl}
                  onChange={(e) => setBookCoverUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tavsif / Qisqacha Mazmun
                </label>
                <textarea
                  rows={2}
                  placeholder="Kitob mazmuni haqida..."
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  Kitobni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2B: EDIT BOOK */}
      {showEditBookModal && editingBook && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditBookModal(false);
              setEditingBook(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#1D1E26] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#D4F562]" />
                <h3 className="text-base font-bold">Kitob Ma'lumotlarini Tahrirlash</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditBookModal(false);
                  setEditingBook(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditBook} className="p-6 overflow-y-auto space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kitob Nomi *
                </label>
                <input
                  type="text"
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Muallif Nomi
                  </label>
                  <input
                    type="text"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kategoriya (Guruh)
                  </label>
                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer"
                  >
                    <option value="">Kategoriyasiz</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Elektron Kitob Havolasi (Google Drive / Telegram / Internet URL)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={bookDownloadLink}
                  onChange={(e) => setBookDownloadLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Maktab Kutubxonasidagi Joylashuv (Jismoniy kitoblar uchun)</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 2-qavat, 14-javon, 3-tokcha"
                  value={bookLocation}
                  onChange={(e) => setBookLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-amber-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Muqova Rasmi URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={bookCoverUrl}
                  onChange={(e) => setBookCoverUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tavsif / Qisqacha Mazmun
                </label>
                <textarea
                  rows={2}
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBookModal(false);
                    setEditingBook(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  O'zgarishlarni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE READING ASSIGNMENT WITH MULTI-TARGET SELECTION */}
      {showCreateAssignmentModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateAssignmentModal(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
            <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Yangi Mutolaa Topshirig'i Yaratish</h3>
              </div>
              <button
                onClick={() => setShowCreateAssignmentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 overflow-y-auto space-y-5">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Topshiriq Nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Yozgi Mutolaa 2026, 10-A Badiiy Kitoblar..."
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* DATE RANGE PRESETS INTEGRATION */}
              <DateRangePresets
                startDate={assignStartDate}
                endDate={assignEndDate}
                onStartDateChange={setAssignStartDate}
                onEndDateChange={setAssignEndDate}
                apiUrl={effectiveApiUrl}
                token={token}
                theme="indigo"
                category="reading_assignment"
                label="Topshiriq Muddat Shablonlari (Date Presets)"
                startLabel="Boshlanish Sanasi *"
                endLabel="Tugash Sanasi *"
              />

              {/* SEARCHABLE MULTI-SELECT DROPDOWN FOR BOOKS */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kutubxonadan Kitoblarni Tanlang (Searchable Multi-Select) *</span>
                  </span>
                  <span className="text-[11px] text-indigo-600 font-bold">
                    {selectedBookIds.length} ta kitob tanlandi
                  </span>
                </label>

                {/* Selected Books Badge Tags */}
                {selectedBookIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl max-h-28 overflow-y-auto">
                    {selectedBookIds.map((bId) => {
                      const b = books.find((item) => item.id === bId);
                      if (!b) return null;
                      return (
                        <span
                          key={b.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-300 rounded-xl text-xs font-extrabold text-indigo-950 shadow-2xs group"
                        >
                          <span>{b.title}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedBookIds((prev) => prev.filter((id) => id !== b.id))}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-rose-50 transition cursor-pointer"
                            title="Tanlovdan chiqarish"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown Input / Trigger */}
                <div className="relative">
                  <div
                    onClick={() => setIsBookDropdownOpen(!isBookDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium flex items-center justify-between cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-2 text-slate-500 overflow-hidden">
                      <Search className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate text-slate-700 font-semibold">
                        {selectedBookIds.length === 0
                          ? "Kitoblarni qidirish va tanlash uchun bosing..."
                          : `${selectedBookIds.length} ta kitob tanlangan (ro'yxatni tahrirlash)`}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isBookDropdownOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded Dropdown Panel */}
                  {isBookDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2 animate-in fade-in duration-150">
                      {/* Search Bar & Select All actions */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            autoFocus
                            value={bookDropdownSearch}
                            onChange={(e) => setBookDropdownSearch(e.target.value)}
                            placeholder="Kitob nomi yoki muallifini qidirish..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedBookIds(books.map((b) => b.id))}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            Hammasi
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBookIds([])}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            Bekor qilish
                          </button>
                        </div>
                      </div>

                      {/* Book List with Scroll */}
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 space-y-1 pr-1">
                        {books.length === 0 ? (
                          <p className="text-xs text-slate-400 p-3 text-center">Kutubxonada kitob mavjud emas</p>
                        ) : (
                          (() => {
                            const filteredDropdownBooks = books.filter((bk) => {
                              const searchStr = `${bk.title} ${bk.author || ""} ${bk.category_name || ""}`.toLowerCase();
                              return searchStr.includes(bookDropdownSearch.toLowerCase().trim());
                            });

                            if (filteredDropdownBooks.length === 0) {
                              return (
                                <p className="text-xs text-slate-400 p-3 text-center">Qidiruv bo'yicha kitob topilmadi</p>
                              );
                            }

                            return filteredDropdownBooks.map((bk) => {
                              const isSelected = selectedBookIds.includes(bk.id);
                              return (
                                <div
                                  key={bk.id}
                                  onClick={() => {
                                    setSelectedBookIds((prev) =>
                                      prev.includes(bk.id) ? prev.filter((i) => i !== bk.id) : [...prev, bk.id]
                                    );
                                  }}
                                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition select-none ${
                                    isSelected
                                      ? "bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold"
                                      : "hover:bg-slate-50 text-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                                        isSelected
                                          ? "bg-indigo-600 border-indigo-600 text-white"
                                          : "border-slate-300 bg-white"
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold leading-tight">{bk.title}</p>
                                      {bk.author && <p className="text-[10px] text-slate-500 font-medium">{bk.author}</p>}
                                    </div>
                                  </div>
                                  {bk.category_name && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                                      {bk.category_name}
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          })()
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DYNAMIC MULTI-TARGET SELECTION CARDS */}
              <div className="border border-indigo-200/80 rounded-3xl p-5 bg-indigo-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Topshiriq Biriktiriladigan O'quvchilar Saralashi</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-[11px] font-black shadow-xs">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Jami Biriktiriladigan: {resolvedStudentSet.size} ta o'quvchi</span>
                  </span>
                </div>

                {/* 1. Target Presets (Searchable Multi-Select Dropdown) */}
                <div className="space-y-1.5 border-b border-indigo-100 pb-3 relative">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Saqlangan O'quvchilar To'plamlari (Presets):</span>
                    </span>
                    <span className="text-[11px] text-indigo-600 font-bold">
                      {selectedPresetIds.length} ta to'plam tanlandi
                    </span>
                  </label>

                  {/* Selected Presets Badges */}
                  {selectedPresetIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-50/70 border border-indigo-200 rounded-2xl max-h-24 overflow-y-auto">
                      {selectedPresetIds.map((pId) => {
                        const p = presets.find((item) => item.id === pId);
                        if (!p) return null;
                        return (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-300 rounded-xl text-xs font-extrabold text-indigo-950 shadow-2xs"
                          >
                            <span>📁 {p.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedPresetIds((prev) => prev.filter((id) => id !== p.id))}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-rose-50 transition cursor-pointer"
                              title="Tanlovdan chiqarish"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Searchable Dropdown Input + Save Preset Icon Button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div
                        onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl text-xs text-slate-800 font-medium flex items-center justify-between cursor-pointer transition select-none shadow-2xs"
                      >
                        <div className="flex items-center gap-2 text-slate-500 overflow-hidden">
                          <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="truncate text-slate-700 font-semibold">
                            {selectedPresetIds.length === 0
                              ? "To'plamlarni qidirish va tanlash uchun bosing..."
                              : `${selectedPresetIds.length} ta to'plam tanlangan`}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                            isPresetDropdownOpen ? "rotate-180 text-indigo-600" : ""
                          }`}
                        />
                      </div>

                      {/* Expanded Dropdown Panel */}
                      {isPresetDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2 animate-in fade-in duration-150">
                          {/* Search Bar & Select All actions */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="relative flex-1">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                autoFocus
                                value={presetSearch}
                                onChange={(e) => setPresetSearch(e.target.value)}
                                placeholder="To'plam nomini qidirish..."
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedPresetIds(presets.map((p) => p.id))}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                Hammasi
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedPresetIds([])}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                Bekor qilish
                              </button>
                            </div>
                          </div>

                          {/* Presets List with Scroll */}
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 space-y-1 pr-1">
                            {presets.length === 0 ? (
                              <p className="text-xs text-slate-400 p-3 text-center">Hali to'plamlar mavjud emas</p>
                            ) : (
                              (() => {
                                const filtered = presets.filter((p) =>
                                  p.name.toLowerCase().includes(presetSearch.toLowerCase().trim())
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <p className="text-xs text-slate-400 p-3 text-center">Qidiruv bo'yicha to'plam topilmadi</p>
                                  );
                                }

                                return filtered.map((p) => {
                                  const isSelected = selectedPresetIds.includes(p.id);
                                  return (
                                    <div
                                      key={p.id}
                                      onClick={() => {
                                        setSelectedPresetIds((prev) =>
                                          prev.includes(p.id) ? prev.filter((i) => i !== p.id) : [...prev, p.id]
                                        );
                                      }}
                                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition select-none ${
                                        isSelected
                                          ? "bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold"
                                          : "hover:bg-slate-50 text-slate-700"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div
                                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                                            isSelected
                                              ? "bg-indigo-600 border-indigo-600 text-white"
                                              : "border-slate-300 bg-white"
                                          }`}
                                        >
                                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                        <span className="text-xs font-bold leading-tight">📁 {p.name}</span>
                                      </div>
                                    </div>
                                  );
                                });
                              })()
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Save Preset Icon Button */}
                    <button
                      type="button"
                      onClick={handleSavePreset}
                      disabled={savingPreset || resolvedStudentSet.size === 0}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center justify-center disabled:opacity-40"
                      title="Hozirgi saralangan o'quvchilarni to'plam (preset) sifatida saqlash"
                    >
                      <BookmarkPlus className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Grade Levels Pills */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Sinf Levellari Bo'yicha (1, 2 ... 11-sinflar):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => {
                      const isSel = selectedLevels.includes(lvl);
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            setSelectedLevels((prev) =>
                              prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
                            );
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                            isSel
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {lvl}-sinf
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Specific Classes Searchable Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Aniq Sinflar Nomlari Bo'yicha:
                    </label>
                    <input
                      type="text"
                      placeholder="Sinf qidirish..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-white flex flex-wrap gap-2">
                    {filteredClasses.map((cls) => {
                      const isSel = selectedClassIds.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setSelectedClassIds((prev) =>
                              prev.includes(cls.id) ? prev.filter((i) => i !== cls.id) : [...prev, cls.id]
                            );
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border transition ${
                            isSel
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {cls.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Individual Students Searchable Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Alohida O'quvchilar Bo'yicha:
                    </label>
                    <input
                      type="text"
                      placeholder="O'quvchi ismi bo'yicha qidiruv..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-white divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <p className="text-[11px] text-slate-400 p-2 text-center">O'quvchilar topilmadi</p>
                    ) : (
                      filteredStudents.map((st, idx) => {
                        const isSel = selectedStudentIds.includes(st.id);
                        return (
                          <div
                            key={`st_${st.id}_${st.class_id}_${idx}`}
                            onClick={() => {
                              setSelectedStudentIds((prev) =>
                                prev.includes(st.id) ? prev.filter((i) => i !== st.id) : [...prev, st.id]
                              );
                            }}
                            className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs ${
                              isSel ? "bg-indigo-50 text-indigo-950 font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={isSel} readOnly className="w-3.5 h-3.5 rounded text-indigo-600" />
                              <span>{st.first_name} {st.last_name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">{st.class_name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Qo'shimcha Izoh
                </label>
                <textarea
                  rows={2}
                  placeholder="Topshiriq yuzasidan izoh..."
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={selectedBookIds.length === 0 || resolvedStudentSet.size === 0}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  Topshiriqni Saqlash & Yuborish ({resolvedStudentSet.size} ta o'quvchi)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGNMENT MATRIX & EVALUATION */}
      {selectedAssignmentDetails && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAssignmentDetails(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold">{selectedAssignmentDetails.title}</h3>
                <p className="text-xs text-slate-400">
                  Muddat: {selectedAssignmentDetails.start_date} ➔ {selectedAssignmentDetails.end_date}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  O'quvchilar va Kitoblar Natijalari Matrisi
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Har bir o'quvchi va kitob kesimidagi holatni ko'rishingiz hamda tegishli yachekani bosib baholashingiz mumkin.
                </p>
              </div>

              {/* Progress Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">O'quvchi (Sinf)</th>
                      {selectedAssignmentDetails.books?.map((bk) => (
                        <th key={bk.id} className="p-3 text-center min-w-[140px]">
                          {bk.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedAssignmentDetails.students && selectedAssignmentDetails.students.length > 0 ? (
                      selectedAssignmentDetails.students.map((stProgress) => (
                        <tr key={stProgress.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-900">
                            {stProgress.student_name}
                            {stProgress.class_name && (
                              <span className="block text-[10px] text-slate-400 font-medium">
                                {stProgress.class_name}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setGradingProgressItem(stProgress);
                                setGradingScore(stProgress.grade_value || "5");
                                setGradingFeedback(stProgress.teacher_feedback || "");
                                setShowGradeModal(true);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                                stProgress.grade_value
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs"
                                  : stProgress.status === "completed"
                                  ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {stProgress.grade_value ? (
                                <>
                                  <Award className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Baho: {stProgress.grade_value}</span>
                                </>
                              ) : (
                                <span>Baholash</span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-slate-400">
                          O'quvchilar ro'yxati topilmadi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: GRADE STUDENT ITEM */}
      {showGradeModal && gradingProgressItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGradeModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">O'quvchini Baholash</h3>
                <p className="text-xs text-slate-500 font-semibold">{gradingProgressItem.student_name}</p>
              </div>
              <button
                onClick={() => setShowGradeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Baho Qiymati (5, 4, 3, 2, A, B...) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="5"
                  value={gradingScore}
                  onChange={(e) => setGradingScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  O'qituvchi Izohi / Taqriz (Feedback)
                </label>
                <textarea
                  rows={3}
                  placeholder="Kitob tahlili haqida izoh..."
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingGrade}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                >
                  {submittingGrade && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Bahoni Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Books from Excel */}
      {showImportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImportModal(false);
              setImportFile(null);
              setImportError("");
              setImportResult(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative text-slate-900 animate-fadeIn space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Kitoblarni Excel orqali import qilish</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Excel shablonini to'ldiring va bir vaqtning o'zida ko'plab kitoblarni yuklang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportError("");
                  setImportResult(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template download & rules info banner */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-950 block">Excel Shablon formati:</span>
                  <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                    1. <b>Kitob nomi</b> — <span className="text-rose-600 font-bold">Majburiy</span> (bo'sh qoldirilsa xatolik beradi).<br />
                    2. <b>Muallif</b>, <b>muqova rasmi linki</b>, <b>kitob download linki</b>, <b>kitobning kutubxona javonidagi o'rni</b>, <b>Tavsif / Qisqacha Mazmun</b> — Ixtiyoriy (bo'sh bo'lsa ham muvaffaqiyatli saqlanadi).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBookTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm shadow-emerald-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Shablonni yuklab olish</span>
                </button>
              </div>
            </div>

            {importError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Import result summary */}
            {importResult && (
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border text-xs font-bold ${
                  importResult.failed_count === 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Natija: {importResult.imported_count} ta kitob muvaffaqiyatli qo'shildi, {importResult.failed_count} ta qatorda xatolik.</span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-rose-200 bg-rose-50/50 p-3 space-y-1.5 text-xs">
                    <span className="font-extrabold text-rose-900 block mb-1">Xatoliklar ro'yxati:</span>
                    {importResult.errors.map((err, eIdx) => (
                      <div key={eIdx} className="text-rose-700 flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-rose-100">
                        <span className="font-mono font-black text-rose-800 shrink-0">Qator {err.row}:</span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleImportBooks} className="space-y-5">
              {/* Optional Category Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kitoblar Guruhini tanlang (Ixtiyoriy)
                </label>
                <select
                  value={importCategoryId}
                  onChange={(e) => setImportCategoryId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="">Guruh biriktirilmasin (Guruhsiz)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Excel (.xlsx) Faylini tanlang *
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 transition cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                        setImportError("");
                        setImportResult(null);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    {importFile ? (
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{importFile.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-700">Faylni shu yerga tashlang yoki tanlash uchun bosing</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Faqat .xlsx (Excel) format</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportError("");
                    setImportResult(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !importFile}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{importLoading ? "Yuklanmoqda..." : "Kitoblarni Import Qilish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border font-bold text-xs flex items-center gap-2 animate-fadeIn ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-700"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>{toastMessage.text}</span>
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
