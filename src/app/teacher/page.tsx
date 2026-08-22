"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AnnouncementsSection from "@/components/dashboard/AnnouncementsSection";
import SmartCalendarModal from "@/components/SmartCalendarModal";
import CustomDialogModal from "@/components/CustomDialogModal";
import LibrarySection from "@/components/dashboard/LibrarySection";
import DateRangePresets from "@/components/DateRangePresets";
import SocialPassportImportSection from "@/components/dashboard/SocialPassportImportSection";
import LessonPlansSection from "@/components/teacher/LessonPlansSection";
import useSwipeMobileMenu from "@/hooks/useSwipeMobileMenu";
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  Calendar,
  Users,
  UserCheck,
  CheckSquare,
  MessageSquare,
  Megaphone,
  Sun,
  Search,
  Bell,
  LogOut,
  Menu,
  GraduationCap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Award,
  CheckCircle2,
  X,
  FileText,
  Clock,
  TrendingUp,
  Plus,
  MoreVertical,
  FileSpreadsheet,
  UserPlus,
  Pencil,
  Trash2,
  UserMinus,
  Utensils,
  ArrowRightLeft,
  Lock,
  ClipboardList,
  History,
  CalendarDays,
  Save,
  Settings,
} from "lucide-react";

import TransferStudentsModal from "@/components/dashboard/TransferStudentsModal";

interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  school_id: string;
}

interface ClassItem {
  id: number;
  name: string;
  subject_id?: number;
  subject_name?: string;
  main_teacher_id?: number;
  teacher_id?: number;
  is_main_teacher?: boolean;
}

interface SubjectItem {
  id: number;
  name: string;
}

interface StudentItem {
  id: number; // student_id
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

interface GradeItem {
  id: number;
  student_id: number;
  subject_id: number;
  value: string;
  grade_date: string;
  status: string;
  approved_by_parent: boolean;
  grade_type?: string;
  grade_category?: string;
  lesson_number?: number;
  teacher_name?: string;
  created_at: string;
  updated_at?: string;
}

const getInitialDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed: 8 is September
  if (month < 8) {
    return `${year}-09-01`;
  }
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function TeacherDashboard() {
  const router = useRouter();

  // Auth States
  const [token, setToken] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Core Data lists
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Teacher navigation view tab: "dashboard" | "journal" | "schedule" | "lesson-plans" | "students" | "parents" | "unapproved" | "feedback" | "announcements" | "clubs" | "books" | "social-passport" | "settings"
  const [teacherTab, setTeacherTab] = useState<"dashboard" | "journal" | "schedule" | "lesson-plans" | "students" | "parents" | "unapproved" | "feedback" | "announcements" | "clubs" | "books" | "social-passport" | "settings">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Default expanded (shows labels/tabs)

  // Profile & Settings states
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileOldPassword, setProfileOldPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Mobile Swipe Gesture Handler
  useSwipeMobileMenu({
    isOpen: sidebarOpen,
    onOpen: () => setSidebarOpen(true),
    onClose: () => setSidebarOpen(false),
  });

  // Feedback/Comments States
  const [feedbackFeed, setFeedbackFeed] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState("");

  interface ChatThread {
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

  const buildThreads = (items: any[]): ChatThread[] => {
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

    for (const thread of map.values()) {
      thread.messages.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      thread.representative = thread.messages[thread.messages.length - 1];
    }

    return [...map.values()].sort((a, b) =>
      new Date(b.representative.created_at).getTime() - new Date(a.representative.created_at).getTime()
    );
  };

  const fetchFeedbackFeed = async (authToken: string) => {
    setTeacherTab("feedback");
    setFeedbackLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/comments/feed`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setFeedbackFeed(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // All Students state (for teacher targeted announcements)
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const fetchAllStudents = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/users?role=STUDENT`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setAllStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  // Extracurricular Clubs States
  const [clubs, setClubs] = useState<any[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubSubjectId, setNewClubSubjectId] = useState<number | "">("");
  const [newClubAllowedLevels, setNewClubAllowedLevels] = useState<number[]>([]);
  const [newClubExtraStudentIds, setNewClubExtraStudentIds] = useState<number[]>([]);
  const [clubsError, setClubsError] = useState("");
  const [clubsSuccess, setClubsSuccess] = useState("");

  const [showEditClubModal, setShowEditClubModal] = useState(false);
  const [editingClub, setEditingClub] = useState<any>(null);
  const [editClubName, setEditClubName] = useState("");
  const [editClubSubjectId, setEditClubSubjectId] = useState<number | "">("");
  const [editClubAllowedLevels, setEditClubAllowedLevels] = useState<number[]>([]);

  const [showClubStudentsModal, setShowClubStudentsModal] = useState(false);
  const [selectedClubForStudents, setSelectedClubForStudents] = useState<any>(null);
  const [clubStudents, setClubStudents] = useState<any[]>([]);
  const [clubStudentsLoading, setClubStudentsLoading] = useState(false);

  // Dashboard Interactive Date Picker State
  const [selectedDashboardDate, setSelectedDashboardDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  // Search & Pagination States for Students and Parents tabs
  const [studentsSearch, setStudentsSearch] = useState("");
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPageSize, setStudentsPageSize] = useState(15);

  const [parentsSearch, setParentsSearch] = useState("");
  const [parentsPage, setParentsPage] = useState(1);
  const [parentsPageSize, setParentsPageSize] = useState(15);
  const [searchStudentTerm, setSearchStudentTerm] = useState("");

  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [selectedClubForSchedule, setSelectedClubForSchedule] = useState<any>(null);
  const [newScheduleDay, setNewScheduleDay] = useState<number>(1);
  const [newScheduleStartTime, setNewScheduleStartTime] = useState("14:00");
  const [newScheduleEndTime, setNewScheduleEndTime] = useState("15:30");

  const [showClubGradingModal, setShowClubGradingModal] = useState(false);
  const [selectedClubForGrading, setSelectedClubForGrading] = useState<any>(null);
  const [clubGradingDate, setClubGradingDate] = useState(new Date().toISOString().split("T")[0]);
  const [clubGradingStudents, setClubGradingStudents] = useState<any[]>([]);
  const [clubGradingLoading, setClubGradingLoading] = useState(false);
  const [savingClubGrades, setSavingClubGrades] = useState(false);
  const [clubJournalTab, setClubJournalTab] = useState<"grade" | "history">("grade");
  const [clubGradeHistory, setClubGradeHistory] = useState<any[]>([]);
  const [clubGradeHistoryLoading, setClubGradeHistoryLoading] = useState(false);

  const fetchClubStudentsAndGrades = async (clubId: number, dateStr: string) => {
    setClubGradingLoading(true);
    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
      if (sId) headers["X-School-ID"] = sId;

      const [stRes, grRes] = await Promise.all([
        fetch(`${API_URL}/api/schools/clubs/${clubId}/students`, { headers }),
        fetch(`${API_URL}/api/schools/clubs/${clubId}/grades?date=${dateStr}`, { headers }),
      ]);

      const stData = await stRes.json();
      const grData = await grRes.json();

      const approvedStudents = Array.isArray(stData) ? stData.filter((s: any) => s.status === "APPROVED") : [];
      const existingGrades = Array.isArray(grData) ? grData : [];

      const gradesMap = new Map();
      existingGrades.forEach((g: any) => gradesMap.set(g.student_id, g));

      const combinedList = approvedStudents.map((st: any) => {
        const existing = gradesMap.get(st.student_id);
        return {
          student_id: st.student_id,
          student_name: st.student_name,
          class_name: st.class_name,
          attendance: existing ? existing.attendance : "PRESENT",
          score_value: existing ? existing.score_value : "",
          feedback: existing ? existing.feedback : "",
        };
      });

      setClubGradingStudents(combinedList);
    } catch (err) {
      console.error("Failed to load club grading data:", err);
    } finally {
      setClubGradingLoading(false);
    }
  };

  const handleSaveClubGradesBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubForGrading) return;
    setSavingClubGrades(true);
    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const payload = {
        lesson_date: clubGradingDate,
        grades: clubGradingStudents.map((st) => ({
          student_id: st.student_id,
          attendance: st.attendance,
          score_value: st.score_value,
          feedback: st.feedback,
        })),
      };

      const res = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForGrading.id}/grades`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Baholarni saqlashda xatolik");

      setToast({ message: "To'garak mashg'uloti baholari va davomati muvaffaqiyatli saqlandi!", type: "success" });
      setShowClubGradingModal(false);
    } catch (err: any) {
      setToast({ message: err.message || "Xatolik yuz berdi", type: "error" });
    } finally {
      setSavingClubGrades(false);
    }
  };

  const fetchClubs = async (authToken: string) => {
    setClubsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setClubs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching clubs:", err);
    } finally {
      setClubsLoading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim() || !newClubSubjectId) {
      setClubsError("To'garak nomi va fanni kiriting");
      return;
    }
    setClubsError("");
    setClubsSuccess("");
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newClubName.trim(),
          subject_id: Number(newClubSubjectId),
          allowed_class_levels: newClubAllowedLevels,
          extra_student_ids: newClubExtraStudentIds,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setClubsSuccess("To'garak muvaffaqiyatli yaratildi");
        setNewClubName("");
        setNewClubSubjectId("");
        setNewClubAllowedLevels([]);
        setNewClubExtraStudentIds([]);
        fetchClubs(token);
        setTimeout(() => setShowAddClubModal(false), 1500);
      } else {
        setClubsError(data.error || "Xatolik yuz berdi");
      }
    } catch {
      setClubsError("Server bilan bog'lanishda xatolik");
    }
  };

  const fetchClubStudents = async (clubId: number) => {
    setClubStudentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/${clubId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setClubStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClubStudentsLoading(false);
    }
  };

  const handleAddDirectStudent = async (studentId: number) => {
    if (!selectedClubForStudents || !token) return;
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForStudents.id}/add-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ message: "O'quvchi to'garakka muvaffaqiyatli qo'shildi", type: "success" });
        fetchClubStudents(selectedClubForStudents.id);
      } else {
        setToast({ message: data.error || "Qo'shishda xatolik", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Tarmoq xatoligi", type: "error" });
    }
  };

  const handleApproveStudent = async (studentId: number) => {
    if (!selectedClubForStudents || !token) return;
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForStudents.id}/approve-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ message: "Qo'shilish so'rovi tasdiqlandi", type: "success" });
        fetchClubStudents(selectedClubForStudents.id);
      } else {
        setToast({ message: data.error || "Tasdiqlashda xatolik", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Tarmoq xatoligi", type: "error" });
    }
  };

  const handleRemoveStudent = (studentId: number) => {
    if (!selectedClubForStudents || !token) return;
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "O'quvchini to'garakdan chiqarish",
      message: "Ushbu o'quvchini to'garakdan chiqarmoqchimisiz?",
      confirmText: "Ha, chiqarish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForStudents.id}/remove-student`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ student_id: studentId }),
          });
          const data = await response.json();
          if (response.ok) {
            setToast({ message: "O'quvchi to'garakdan chiqarildi", type: "success" });
            fetchClubStudents(selectedClubForStudents.id);
          } else {
            setToast({ message: data.error || "Chiqarishda xatolik", type: "error" });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: "Tarmoq xatoligi", type: "error" });
        }
      },
    });
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForSchedule.id}/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day_of_week: Number(newScheduleDay),
          start_time: newScheduleStartTime,
          end_time: newScheduleEndTime,
        }),
      });
      if (response.ok) {
        fetchClubs(token);
        setShowAddScheduleModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "Jadvalni o'chirish",
      message: "Haqiqatan ham ushbu jadvalni o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`${API_URL}/api/schools/clubs/schedules/${scheduleId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
          });
          if (response.ok) {
            showToast("success", "Jadval o'chirildi!");
            fetchClubs(token);
          }
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const handleEditClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    setActionLoading(true);
    setActionError("");

    const payload = {
      name: editClubName,
      subject_id: Number(editClubSubjectId),
      allowed_class_levels: editClubAllowedLevels,
    };

    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const res = await fetch(`${API_URL}/api/schools/clubs/${editingClub.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "To'garakni yangilab bo'lmadi");

      showToast("success", "To'garak muvaffaqiyatli yangilandi!");
      setShowEditClubModal(false);
      fetchClubs(token);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClub = (clubId: number) => {
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "To'garakni o'chirish",
      message: "Haqiqatan ham ushbu to'garakni o'chirmoqchimisiz? (Barcha a'zolar va jadvallar bekor qilinadi)",
      confirmText: "Ha, o'chirish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
          const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
          if (sId) headers["X-School-ID"] = sId;
          const res = await fetch(`${API_URL}/api/schools/clubs/${clubId}`, {
            method: "DELETE",
            headers,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "To'garakni o'chirib bo'lmadi");
          showToast("success", "To'garak o'chirildi!");
          fetchClubs(token);
        } catch (err: any) {
          showToast("error", err.message);
        }
      },
    });
  };

  // Teacher Chat States
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatComment, setSelectedChatComment] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replySubmitLoading, setReplySubmitLoading] = useState(false);

  const fetchChatMessages = async (comment: any) => {
    setChatLoading(true);
    try {
      let url = "";
      if (comment.type === "GRADE") {
        url = `${API_URL}/api/schools/grades/${comment.grade_id}/comments`;
      } else {
        const dateStr = comment.menu_date ? comment.menu_date.split("T")[0] : "";
        url = `${API_URL}/api/schools/menu/comments?menu_date=${dateStr}&parent_id=${comment.parent_id}`;
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
    if (!replyText.trim()) return;

    setReplySubmitLoading(true);
    setReplyError("");
    try {
      let url = "";
      let body = {};
      if (selectedChatComment.type === "GRADE") {
        url = `${API_URL}/api/schools/grades/${selectedChatComment.grade_id}/comments`;
        body = { content: replyText.trim() };
      } else {
        const dateStr = selectedChatComment.menu_date ? selectedChatComment.menu_date.split("T")[0] : "";
        url = `${API_URL}/api/schools/menu/comments`;
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

  // Dashboard Analytics States
  const [dashboardStudents, setDashboardStudents] = useState<any[]>([]);
  const [dashboardGrades, setDashboardGrades] = useState<any[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Contextual Sub-lists
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  const [classTeachersLoading, setClassTeachersLoading] = useState(false);

  // Weekly Schedule States
  const [classSchedule, setClassSchedule] = useState<any[]>([]);
  const [classScheduleLoading, setClassScheduleLoading] = useState(false);
  const [overallSchedule, setOverallSchedule] = useState<{ [key: string]: Array<{ class_id: number; class_name: string; subject_id: number; subject_name: string }> }>({});
  const [overallScheduleLoading, setOverallScheduleLoading] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [scheduleFormState, setScheduleFormState] = useState<{ [key: string]: number }>({});
  const [scheduleStartDate, setScheduleStartDate] = useState("2026-09-01");
  const [scheduleEndDate, setScheduleEndDate] = useState("2027-05-31");
  const [editingScheduleOriginalStartDate, setEditingScheduleOriginalStartDate] = useState<string>("");
  const [schedulePeriods, setSchedulePeriods] = useState<any[]>([]);
  const [schedulePeriodsLoading, setSchedulePeriodsLoading] = useState(false);
  const [showPeriodsModal, setShowPeriodsModal] = useState(false);

  // Daily Schedule Exception States
  const [scheduleViewDate, setScheduleViewDate] = useState(getInitialDate());
  const [scheduleExceptions, setScheduleExceptions] = useState<any[]>([]);
  const [scheduleExceptionsLoading, setScheduleExceptionsLoading] = useState(false);
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false);
  const [excDate, setExcDate] = useState(getInitialDate());
  const [excLesson, setExcLesson] = useState(1);
  const [excType, setExcType] = useState("replace"); // "replace" or "cancel"
  const [excSubjectId, setExcSubjectId] = useState<number | "">("");

  // Grade Entry list (old subject-based view)
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [existingGrades, setExistingGrades] = useState<GradeItem[]>([]);
  const [gradeInputs, setGradeInputs] = useState<{ [studentId: number]: string }>({});
  const [selectedGradeIds, setSelectedGradeIds] = useState<Set<number>>(new Set());
  const [approveLoading, setApproveLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Smart Calendar State
  const [isTeacherCalendarOpen, setIsTeacherCalendarOpen] = useState(false);
  const [teacherCalendarTarget, setTeacherCalendarTarget] = useState<"journal" | "schedule" | "exception">("journal");

  // Journal View States (day-based grid)
  const [journalDate, setJournalDate] = useState(getInitialDate());
  const [journalAllGrades, setJournalAllGrades] = useState<GradeItem[]>([]);
  const [journalSubjectsToday, setJournalSubjectsToday] = useState<{ id: number; name: string }[]>([]);
  interface JournalLessonItem {
    subject_id: number;
    subject_name: string;
    lesson_number: number;
  }
  const [journalLessonsToday, setJournalLessonsToday] = useState<JournalLessonItem[]>([]);
  const [selectedLessonNumber, setSelectedLessonNumber] = useState<number | "">("");
  const [selectedGradeType, setSelectedGradeType] = useState<string>("MASTERY");
  const [selectedGradeCategory, setSelectedGradeCategory] = useState<string>("DAILY");

  // Global ESC Key Listener to close any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEditScheduleModal(false);
        setShowAddExceptionModal(false);
        setShowPeriodsModal(false);
        setShowStudentModal(false);
        setShowParentsModal(false);
        setShowImportParentsModal(false);
        setShowImportStudentsModal(false);
        setShowAddParentModal(false);
        setShowAddClubModal(false);
        setShowAddScheduleModal(false);
        setShowClubStudentsModal(false);
        setShowGradeCommentModal(false);
        setChatModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [journalLoading, setJournalLoading] = useState(false);
  const [cellInputs, setCellInputs] = useState<{ [key: string]: string }>({});
  const [cellSaving, setCellSaving] = useState<string | null>(null);
  const [selectedGradingSystems, setSelectedGradingSystems] = useState<{ [subjectId: number]: number }>({});
  const [journalColumns, setJournalColumns] = useState<{ id: string; name: string; defaultVal: string }[]>([]);
  const [columnGradingSystems, setColumnGradingSystems] = useState<{ [colId: string]: number }>({});

  // Students tab states
  const [studentsTabList, setStudentsTabList] = useState<any[]>([]);
  const [studentsTabLoading, setStudentsTabLoading] = useState(false);
  const [unapprovedGrades, setUnapprovedGrades] = useState<any[]>([]);
  const [unapprovedLoading, setUnapprovedLoading] = useState(false);
  const [unapprovedPage, setUnapprovedPage] = useState(1);
  const [unapprovedPageSize, setUnapprovedPageSize] = useState(10);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState<"create" | "edit">("create");
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentForm, setStudentForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    phone: "",
    password: "",
    address: "",
    birthdate: "",
    ina: ""
  });

  // Actions states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Excel Import states
  const [showImportSection, setShowImportSection] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importError, setImportError] = useState("");

  // Parent Management States
  const [showParentsModal, setShowParentsModal] = useState(false);
  const [selectedStudentForParents, setSelectedStudentForParents] = useState<any | null>(null);
  const [linkedParents, setLinkedParents] = useState<any[]>([]);
  const [linkedParentsLoading, setLinkedParentsLoading] = useState(false);
  const [classParents, setClassParents] = useState<any[]>([]);
  const [classParentsLoading, setClassParentsLoading] = useState(false);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [selectedStudentIdForAdd, setSelectedStudentIdForAdd] = useState<number | "">("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentMiddleName, setParentMiddleName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassport, setParentPassport] = useState("");
  const [parentPassword, setParentPassword] = useState("password123");
  const [showImportParentsModal, setShowImportParentsModal] = useState(false);
  const [showImportStudentsModal, setShowImportStudentsModal] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Grade Comment Modal state for teacher (Multiple choice support)
  const [showGradeCommentModal, setShowGradeCommentModal] = useState(false);
  const [selectedStudentForComment, setSelectedStudentForComment] = useState<any>(null);
  const [availableGradeOptions, setAvailableGradeOptions] = useState<any[]>([]);
  const [selectedGradeColIds, setSelectedGradeColIds] = useState<string[]>([]);
  const [gradeCommentsList, setGradeCommentsList] = useState<any[]>([]);
  const [gradeCommentsLoading, setGradeCommentsLoading] = useState(false);
  const [newGradeCommentText, setNewGradeCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const fetchCombinedComments = async (options: any[]) => {
    setGradeCommentsLoading(true);
    try {
      const allComments: any[] = [];
      await Promise.all(
        options.map(async (opt) => {
          if (!opt.grade?.id) return;
          try {
            const res = await fetch(`${API_URL}/api/schools/grades/${opt.grade.id}/comments`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                data.forEach((c: any) => {
                  allComments.push({ ...c, gradeColName: opt.colName, gradeVal: opt.value });
                });
              }
            }
          } catch (e) {
            console.error(e);
          }
        })
      );
      allComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setGradeCommentsList(allComments);
    } catch (err) {
      console.error(err);
      setGradeCommentsList([]);
    } finally {
      setGradeCommentsLoading(false);
    }
  };

  const handleOpenStudentCommentModal = async (student: any, gradeOptions: any[]) => {
    if (!student || !gradeOptions || gradeOptions.length === 0) return;
    setSelectedStudentForComment(student);
    setAvailableGradeOptions(gradeOptions);
    // Select all available grades by default so teacher can comment on all or uncheck
    const initialColIds = gradeOptions.map(g => g.colId);
    setSelectedGradeColIds(initialColIds);
    setNewGradeCommentText("");
    setShowGradeCommentModal(true);

    fetchCombinedComments(gradeOptions);
  };

  const handleToggleGradeColId = (colId: string) => {
    setSelectedGradeColIds(prev => {
      if (prev.includes(colId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(id => id !== colId);
      } else {
        return [...prev, colId];
      }
    });
  };

  const handleToggleSelectAllGrades = () => {
    if (selectedGradeColIds.length === availableGradeOptions.length) {
      if (availableGradeOptions.length > 0) {
        setSelectedGradeColIds([availableGradeOptions[0].colId]);
      }
    } else {
      setSelectedGradeColIds(availableGradeOptions.map(g => g.colId));
    }
  };

  const handleAddGradeComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForComment || selectedGradeColIds.length === 0 || !newGradeCommentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const selectedOptions = availableGradeOptions.filter(opt => selectedGradeColIds.includes(opt.colId));

      await Promise.all(
        selectedOptions.map(async (opt) => {
          let targetGradeId = opt.grade?.id;

          // If grade is not yet saved to DB, save it first!
          if (!targetGradeId) {
            const createRes = await fetch(`${API_URL}/api/schools/grades`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                student_id: selectedStudentForComment.id,
                subject_id: Number(selectedSubjectId),
                lesson_number: Number(selectedLessonNumber),
                grade_type: opt.colId,
                value: opt.value,
                grade_date: journalDate,
                grade_category: selectedGradeCategory || "DAILY",
                grading_system_id: columnGradingSystems[opt.colId] || undefined,
              }),
            });
            const createdGrade = await createRes.json();
            if (createRes.ok && createdGrade.id) {
              targetGradeId = createdGrade.id;
              opt.grade = createdGrade;
            }
          }

          if (targetGradeId) {
            await fetch(`${API_URL}/api/schools/grades/${targetGradeId}/comments`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ content: newGradeCommentText.trim() }),
            });
          }
        })
      );

      setNewGradeCommentText("");
      showToast("success", "Izoh tanlangan baholarga muvaffaqiyatli saqlandi!");
      fetchJournalData(journalDate);
      fetchCombinedComments(availableGradeOptions);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const scheduleDateInputRef = React.useRef<HTMLInputElement>(null);
  const exceptionsSectionRef = React.useRef<HTMLDivElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  // Active Grading System rules (for user guidance)
  const [activeGS, setActiveGS] = useState<any | null>(null);
  const [gradingSystemsList, setGradingSystemsList] = useState<any[]>([]);

  // Teacher Custom Dialog State
  const [teacherDialog, setTeacherDialog] = useState<{
    isOpen: boolean;
    type?: "alert" | "confirm" | "danger";
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const getGradeColorClasses = (valStr: string, isApproved: boolean, isParentApproved: boolean) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      return 'border-dashed border-zinc-200 hover:border-zinc-300 focus:border-[#5B50EC] text-zinc-800 bg-transparent';
    }
    // Value-based styling (green >= 4.5, blue >= 3.5, amber >= 2.5, red < 2.5)
    if (val >= 4.5) {
      return 'border-emerald-200 bg-emerald-50/70 text-emerald-700 focus:bg-white focus:border-emerald-500';
    } else if (val >= 3.5) {
      return 'border-blue-200 bg-blue-50/70 text-blue-700 focus:bg-white focus:border-blue-500';
    } else if (val >= 2.5) {
      return 'border-amber-200 bg-amber-50/70 text-amber-700 focus:bg-white focus:border-amber-500';
    } else {
      return 'border-red-200 bg-red-50/70 text-red-700 focus:bg-white focus:border-red-500';
    }
  };

  const getActiveColumnsForSubject = (classId: number | "", subjectId: number | ""): { id: string; name: string; defaultVal: string }[] => {
    const defaultCols = [
      { id: "ATTENDANCE", name: "Davomat", defaultVal: "+" },
      { id: "BEHAVIOR", name: "Xulqi", defaultVal: "0" },
      { id: "MASTERY", name: "O'zlashtirishi", defaultVal: "" }
    ];
    if (!classId || !subjectId) return defaultCols;
    const key = `school_journal_cols_${classId}_${subjectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const custom = parsed.filter((c: any) => !["ATTENDANCE", "BEHAVIOR", "MASTERY"].includes(c.id));
          return [...defaultCols, ...custom];
        }
      } catch (e) {
        // Fallback
      }
    }
    return defaultCols;
  };

  const handleAddJournalColumn = (name: string) => {
    if (!selectedClassId || !selectedSubjectId) return;
    const id = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!id) return;

    if (["ATTENDANCE", "BEHAVIOR", "MASTERY"].includes(id)) {
      showToast("error", "Tizimning asosiy ustunlari nomini qo'shib bo'lmaydi");
      return;
    }
    
    // Check if exists
    if (journalColumns.some(col => col.id === id)) {
      showToast("error", "Bunday baho turi allaqachon mavjud");
      return;
    }

    const newCol = { id, name, defaultVal: "" };
    const updated = [...journalColumns, newCol];
    setJournalColumns(updated);
    
    const key = `school_journal_cols_${selectedClassId}_${selectedSubjectId}`;
    localStorage.setItem(key, JSON.stringify(updated));
    showToast("success", `Yangi baho turi qo'shildi: ${name}`);
    
    // Reload data to initialize new inputs
    fetchJournalData(journalDate);
  };

  const handleRemoveJournalColumn = (colId: string) => {
    if (!selectedClassId || !selectedSubjectId) return;
    if (["ATTENDANCE", "BEHAVIOR", "MASTERY"].includes(colId)) {
      showToast("error", "Tizimning asosiy ustunlarini o'chirib bo'lmaydi");
      return;
    }
    const updated = journalColumns.filter(c => c.id !== colId);
    setJournalColumns(updated);
    const key = `school_journal_cols_${selectedClassId}_${selectedSubjectId}`;
    localStorage.setItem(key, JSON.stringify(updated));
    showToast("success", "Baholash turi o'chirildi");
    
    // Reload data
    fetchJournalData(journalDate);
  };

  const handleColumnGradingSystemChange = (colId: string, gsIdVal: string) => {
    if (!selectedClassId || !selectedSubjectId) return;
    const gsId = gsIdVal ? Number(gsIdVal) : 0;
    setColumnGradingSystems(prev => {
      const updated = { ...prev, [colId]: gsId };
      const key = `col_gs_${selectedClassId}_${selectedSubjectId}_${colId}`;
      if (gsId > 0) {
        localStorage.setItem(key, gsId.toString());
      } else {
        localStorage.removeItem(key);
      }
      return updated;
    });
    showToast("success", "Baholash tizimi o'zgartirildi");
    // Reload data to re-evaluate colors and input states if necessary
    fetchJournalData(journalDate);
  };

  // 1. Initial Load & Auth Check
  useEffect(() => {
    const savedToken = localStorage.getItem("school_token");
    const savedSchoolId = localStorage.getItem("school_id");
    const savedUserStr = localStorage.getItem("school_user");

    if (!savedToken || !savedSchoolId || !savedUserStr) {
      router.replace("/login");
      return;
    }

    setToken(savedToken);
    setSchoolId(savedSchoolId);
    try {
      const parsedUser = JSON.parse(savedUserStr);
      if (parsedUser.role !== "MAIN_TEACHER" && parsedUser.role !== "SUBJECT_TEACHER" && parsedUser.role !== "ADMIN") {
        if (parsedUser.role === "PARENT") {
          router.replace("/parents");
        } else {
          router.replace("/login");
        }
        return;
      }
      setUserInfo(parsedUser);
      setProfileFirstName(parsedUser.first_name || "");
      setProfileLastName(parsedUser.last_name || "");
      loadInitialData(savedToken, savedSchoolId);
    } catch (e) {
      router.replace("/login");
    }
  }, [router]);

  const fetchClassesList = async () => {
    const t = token || localStorage.getItem("school_token") || "";
    const s = schoolId || localStorage.getItem("school_id") || "";
    if (!t) return;
    try {
      const clsRes = await fetch(`${API_URL}/api/schools/classes`, {
        headers: { "Authorization": `Bearer ${t}`, "X-School-ID": s },
      });
      const clsData = await clsRes.json();
      if (clsRes.ok) setClasses(Array.isArray(clsData) ? clsData : []);
    } catch (e) {
      console.error("Error fetching classes:", e);
    }
  };

  const loadInitialData = async (authToken: string, currentSchoolId: string) => {
    setLoading(true);
    try {
      // Load classes
      const clsRes = await fetch(`${API_URL}/api/schools/classes`, {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const clsData = await clsRes.json();
      const classesList = Array.isArray(clsData) ? clsData : [];
      if (clsRes.ok) setClasses(classesList);

      // Load subjects
      const subRes = await fetch(`${API_URL}/api/schools/subjects`, {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const subData = await subRes.json();
      const subjectsList = Array.isArray(subData) ? subData : [];
      if (subRes.ok) setSubjects(subjectsList);



      // Load active grading system
      const gsRes = await fetch(`${API_URL}/api/schools/grading-systems/active`, {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const gsData = await gsRes.json();
      if (gsRes.ok) setActiveGS(gsData);

      // Load all grading systems
      const gsListRes = await fetch(`${API_URL}/api/schools/grading-systems`, {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const gsListData = await gsListRes.json();
      if (gsListRes.ok) setGradingSystemsList(Array.isArray(gsListData) ? gsListData : []);

      // Load all students for dashboard analytics
      try {
        const studRes = await fetch(`${API_URL}/api/schools/users?role=STUDENT`, {
          headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
        });
        const studData = await studRes.json();
        if (studRes.ok && Array.isArray(studData)) setDashboardStudents(studData);
      } catch (e) {
        console.error("Dashboard students load failed", e);
      }

      // Load grades for dashboard analytics
      try {
        const gradesRes = await fetch(`${API_URL}/api/schools/grades`, {
          headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
        });
        const gradesData = await gradesRes.json();
        if (gradesRes.ok && Array.isArray(gradesData)) setDashboardGrades(gradesData);
      } catch (e) {
        console.error("Dashboard grades load failed", e);
      }

      // Load holidays
      await fetchHolidays(authToken, currentSchoolId);
    } catch (e) {
      console.error("Initial load failed", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async (authToken: string, currentSchoolId: string) => {
    setHolidaysLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/holidays`, {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setHolidays(data);
      }
    } catch (e) {
      console.error("Holidays load failed", e);
    } finally {
      setHolidaysLoading(false);
    }
  };

  // 2. Fetch students & grades when class and subject are selected
  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      fetchClassData();
    } else {
      setStudents([]);
      setExistingGrades([]);
      setGradeInputs({});
    }
  }, [selectedClassId, selectedSubjectId]);

  // Contextual Class details fetch (for schedules and exceptions)
  useEffect(() => {
    if (selectedClassId && token) {
      setClassSchedule([]); // Reset schedule list immediately to prevent stale checks
      fetchClassTeachers();
      fetchClassSchedule();
      fetchScheduleExceptions();
      fetchSchedulePeriods();
    } else {
      setClassTeachers([]);
      setClassSchedule([]);
      setScheduleExceptions([]);
      setSchedulePeriods([]);
    }
  }, [selectedClassId, token]);

  // Journal data: reload when class, subject, lesson, date, or active tab changes to "journal"
  useEffect(() => {
    if (selectedClassId && token && teacherTab === 'journal') {
      fetchJournalData(journalDate);
    }
  }, [selectedClassId, selectedSubjectId, selectedLessonNumber, journalDate, token, teacherTab, userInfo]);

  // Students tab data load: reload when class or active tab changes to "students"
  useEffect(() => {
    if (token && teacherTab === 'students') {
      fetchStudentsTabList();
    }
  }, [selectedClassId, token, teacherTab]);

  // Parents tab data load: reload when class or active tab changes to "parents"
  useEffect(() => {
    if (token && teacherTab === 'parents') {
      fetchClassParents();
    }
  }, [selectedClassId, token, teacherTab]);

  // Unapproved grades tab data load: reload when class, tab, or classTeachers lists change
  useEffect(() => {
    if (selectedClassId && token && teacherTab === 'unapproved') {
      fetchUnapprovedGrades();
    }
  }, [selectedClassId, token, teacherTab, classTeachers, userInfo]);

  // Clear selections when tab switches
  useEffect(() => {
    setSelectedGradeIds(new Set());
  }, [teacherTab]);

  // Load clubs when tab is clubs
  useEffect(() => {
    if (token && teacherTab === "clubs") {
      fetchClubs(token);
    }
  }, [token, teacherTab]);

  // Automatically sync and lock the grade category with existing grades in this lesson
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId || !selectedLessonNumber || !journalDate) return;
    
    const existingGrade = journalAllGrades.find(g => {
      const gDate = g.grade_date ? (typeof g.grade_date === 'string' ? g.grade_date.split('T')[0] : new Date(g.grade_date).toISOString().split('T')[0]) : '';
      return g.subject_id === Number(selectedSubjectId) &&
             g.lesson_number === Number(selectedLessonNumber) &&
             gDate === journalDate;
    });

    if (existingGrade && existingGrade.grade_category) {
      setSelectedGradeCategory(existingGrade.grade_category);
    }
  }, [journalAllGrades, selectedSubjectId, selectedLessonNumber, journalDate, selectedClassId]);

  const isMainTeacherOfClass = () => {
    if (!userInfo || !selectedClassId) return false;
    if (userInfo.role === "ADMIN") return true;
    return classTeachers.some((ct) => ct.teacher_id === userInfo.id && ct.is_main_teacher);
  };

  const fetchClassTeachers = async () => {
    if (!selectedClassId) return;
    setClassTeachersLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/teachers`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setClassTeachers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClassTeachersLoading(false);
    }
  };

  const fetchClassSchedule = async (targetDate?: string) => {
    if (!selectedClassId) return;
    setClassScheduleLoading(true);
    const dateQuery = targetDate || scheduleViewDate || new Date().toISOString().split("T")[0];
    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/schedule?date=${dateQuery}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setClassSchedule(data);
        if (data.length > 0 && data[0].start_date && data[0].end_date) {
          setScheduleStartDate(data[0].start_date);
          setScheduleEndDate(data[0].end_date);
        }

        const isScheduleEmpty = data.length === 0 || data.every((item: any) => item.subject_id === 0 || !item.subject_id);
        if (isScheduleEmpty) {
          setSelectedSubjectId("");
        } else {
          const currentCls = classes.find(c => c.id === selectedClassId);
          const hasFixedSubject = currentCls?.subject_id && userInfo?.role !== "ADMIN" && userInfo?.role !== "MAIN_TEACHER";
          if (hasFixedSubject && currentCls) {
            setSelectedSubjectId(currentCls.subject_id ?? "");
          }
        }
        fetchSchedulePeriods();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClassScheduleLoading(false);
    }
  };

  const fetchOverallTeacherSchedule = async (targetDate?: string) => {
    if (!classes.length || !token) return;
    setOverallScheduleLoading(true);
    const dateQuery = targetDate || scheduleViewDate || new Date().toISOString().split("T")[0];
    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (sId) headers["X-School-ID"] = sId;

      const results: { [key: string]: Array<{ class_id: number; class_name: string; subject_id: number; subject_name: string }> } = {};

      await Promise.all(
        classes.map(async (cls) => {
          try {
            const [schRes, tchRes] = await Promise.all([
              fetch(`${API_URL}/api/schools/classes/${cls.id}/schedule?date=${dateQuery}`, { headers }),
              fetch(`${API_URL}/api/schools/classes/${cls.id}/teachers`, { headers }),
            ]);

            if (schRes.ok) {
              const schData = await schRes.json();
              const tchData = tchRes.ok ? await tchRes.json() : [];

              const myTeacherSubjects = new Set(
                Array.isArray(tchData)
                  ? tchData.filter((t: any) => t.teacher_id === userInfo?.id).map((t: any) => t.subject_id)
                  : []
              );

              const isMyClass = cls.main_teacher_id === userInfo?.id || cls.is_main_teacher || userInfo?.role === "ADMIN";

              if (Array.isArray(schData)) {
                schData.forEach((item: any) => {
                  if (!item.subject_id || item.subject_id === 0) return;
                  const isMySubject = myTeacherSubjects.has(item.subject_id) || (isMyClass && myTeacherSubjects.size === 0) || userInfo?.role === "ADMIN" || (cls.subject_id && cls.subject_id === item.subject_id);

                  if (isMySubject) {
                    const slotKey = `${item.day_of_week}-${item.lesson_number}`;
                    if (!results[slotKey]) results[slotKey] = [];
                    if (!results[slotKey].some(r => r.class_id === cls.id && r.subject_id === item.subject_id)) {
                      const foundSub = subjects.find(s => s.id === item.subject_id);
                      results[slotKey].push({
                        class_id: cls.id,
                        class_name: cls.name,
                        subject_id: item.subject_id,
                        subject_name: item.subject_name || foundSub?.name || "Dars",
                      });
                    }
                  }
                });
              }
            }
          } catch (e) {
            console.error("Error fetching class schedule for", cls.id, e);
          }
        })
      );
      setOverallSchedule(results);
    } catch (err) {
      console.error("Error fetching overall schedule", err);
    } finally {
      setOverallScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (token && classes.length > 0) {
      if (teacherTab === "dashboard") {
        fetchOverallTeacherSchedule(selectedDashboardDate);
      } else if (teacherTab === "schedule" && !selectedClassId) {
        fetchOverallTeacherSchedule(scheduleViewDate);
      }
    }
  }, [teacherTab, selectedClassId, scheduleViewDate, selectedDashboardDate, token, classes, subjects]);

  const fetchScheduleExceptions = async () => {
    if (!selectedClassId) return;
    setScheduleExceptionsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/schedule-exceptions`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setScheduleExceptions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScheduleExceptionsLoading(false);
    }
  };

  const fetchSchedulePeriods = async () => {
    if (!selectedClassId) return;
    setSchedulePeriodsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/schedule-periods`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSchedulePeriods(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSchedulePeriodsLoading(false);
    }
  };

  const handleAddExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    setActionLoading(true);
    setActionError("");

    const payload = {
      date: excDate,
      lesson_number: Number(excLesson),
      subject_id: excType === "cancel" ? null : Number(excSubjectId),
    };

    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/schedule-exceptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Dars o'zgarishini saqlab bo'lmadi");

      showToast("success", "Dars o'zgarishi muvaffaqiyatli saqlandi!");
      setShowAddExceptionModal(false);
      
      setExcType("replace");
      setExcSubjectId("");

      fetchClassSchedule();
      fetchScheduleExceptions();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteException = (exceptionId: number) => {
    if (!selectedClassId) return;
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "Dars o'zgarishini bekor qilish",
      message: "Haqiqatan ham ushbu dars o'zgarishini bekor qilmoqchimisiz? (Jadval haftalik shablondagi holatiga qaytadi)",
      confirmText: "Ha, bekor qilish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        setActionError("");
        try {
          const response = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/schedule-exceptions/${exceptionId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "O'zgarishni o'chirib bo'lmadi");
          showToast("success", "Dars o'zgarishi muvaffaqiyatli o'chirildi!");
          fetchClassSchedule();
          fetchScheduleExceptions();
        } catch (err: any) {
          showToast("error", err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    setActionLoading(true);
    setActionError("");

    const lessonsPayload = Object.entries(scheduleFormState)
      .filter(([_, subjectId]) => subjectId > 0)
      .map(([key, subjectId]) => {
        const [day, lesson] = key.split("-").map(Number);
        return {
          day_of_week: day,
          lesson_number: lesson,
          subject_id: Number(subjectId),
        };
      });

    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_date: scheduleStartDate,
          end_date: scheduleEndDate,
          original_start_date: editingScheduleOriginalStartDate || undefined,
          lessons: lessonsPayload
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Haftalik dars jadvalini saqlab bo'lmadi");

      showToast("success", "Haftalik dars jadvali muvaffaqiyatli saqlandi!");
      setShowEditScheduleModal(false);
      fetchClassSchedule();
      fetchSchedulePeriods();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchClassData = async () => {
    setDataLoading(true);
    try {
      // Fetch students
      const studRes = await fetch(`${API_URL}/api/schools/users?role=STUDENT&class_id=${selectedClassId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const studData = await studRes.json();
      const studentsList = Array.isArray(studData) ? studData.map((u: any) => ({
        id: u.student_id || u.id,
        user_id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        middle_name: u.middle_name,
      })) : [];
      setStudents(studentsList);

      // Fetch grades
      const gradeRes = await fetch(`${API_URL}/api/schools/grades?class_id=${selectedClassId}&subject_id=${selectedSubjectId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const gradeData = await gradeRes.json();
      setExistingGrades(Array.isArray(gradeData) ? gradeData.filter((g: any) => g.lesson_number && g.lesson_number > 0) : []);

      // Initialize inputs empty
      const inputs: { [studentId: number]: string } = {};
      studentsList.forEach((st) => {
        inputs[st.id] = "";
      });
      setGradeInputs(inputs);
      setImportResult(null);
      setImportError("");
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  // Helper: formatted Uz date
  const getFormattedJournalDate = (dateStr?: string) => {
    const target = dateStr || journalDate;
    if (!target) return "Sana tanlanmagan";
    const d = new Date(target + 'T00:00:00');
    if (isNaN(d.getTime())) return "Noto'g'ri sana";
    return d.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Journal: fetch schedule-based subjects + all class grades for a given day
  const fetchJournalData = async (date?: string) => {
    if (!selectedClassId || !token) return;
    setSelectedGradeIds(new Set());
    const targetDate = date || journalDate;
    setJournalLoading(true);
    try {
      // 1. Fetch latest subjects, class teachers, holidays, and schedule in parallel
      const [schedRes, subRes, teacherRes, holidayRes] = await Promise.all([
        fetch(`${API_URL}/api/schools/classes/${selectedClassId}/schedule?date=${targetDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/schools/subjects`, {
          headers: { "Authorization": `Bearer ${token}`, "X-School-ID": schoolId }
        }),
        fetch(`${API_URL}/api/schools/classes/${selectedClassId}/teachers`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/schools/holidays`, {
          headers: { "Authorization": `Bearer ${token}`, "X-School-ID": schoolId }
        })
      ]);

      const [schedData, subData, teacherData, holidayData] = await Promise.all([
        schedRes.json(),
        subRes.json(),
        teacherRes.json(),
        holidayRes.json()
      ]);

      if (subRes.ok && Array.isArray(subData)) {
        setSubjects(subData);
      }

      let latestClassTeachers = classTeachers;
      if (teacherRes.ok && Array.isArray(teacherData)) {
        latestClassTeachers = teacherData;
        setClassTeachers(teacherData);
      }

      if (holidayRes.ok && Array.isArray(holidayData)) {
        setHolidays(holidayData);
      }

      const isTargetHoliday = (Array.isArray(holidayData) ? holidayData : []).some((h: any) => {
        const hDate = h.holiday_date ? new Date(h.holiday_date).toISOString().split('T')[0] : '';
        if (hDate !== targetDate) return false;
        if (h.target_classes && Array.isArray(h.target_classes) && h.target_classes.length > 0) {
          if (!selectedClassId || !h.target_classes.includes(selectedClassId)) return false;
        }
        return true;
      });

      const d = new Date(targetDate + 'T00:00:00');
      if (isNaN(d.getTime())) return;
      const dow = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon…7=Sun
      
      const lessonsListToday: JournalLessonItem[] = [];
      if (!isTargetHoliday) {
        (Array.isArray(schedData) ? schedData : []).forEach((item: any) => {
          if (item.day_of_week === dow && item.subject_id > 0 && item.subject_name) {
            lessonsListToday.push({
              subject_id: item.subject_id,
              subject_name: item.subject_name,
              lesson_number: item.lesson_number,
            });
          }
        });
      }
      // Sort chronologically by lesson_number
      lessonsListToday.sort((a, b) => a.lesson_number - b.lesson_number);
      setJournalLessonsToday(lessonsListToday);

      const subjectMap = new Map<number, string>();
      const subjectsListToday: { id: number; name: string }[] = [];
      lessonsListToday.forEach(item => {
        if (!subjectMap.has(item.subject_id)) {
          subjectMap.set(item.subject_id, item.subject_name);
          subjectsListToday.push({ id: item.subject_id, name: item.subject_name });
        }
      });

      const isMainTeacher = userInfo?.role === "ADMIN" || latestClassTeachers.some((ct: any) => ct.teacher_id === userInfo?.id && ct.is_main_teacher);

      // Filter subjects: if SUBJECT_TEACHER (and not advisor/admin), only show their assigned subjects
      let filteredSubjects = subjectsListToday;
      if (userInfo && userInfo.role !== "ADMIN" && !isMainTeacher) {
        filteredSubjects = subjectsListToday.filter(sub => 
          latestClassTeachers.some(ct => ct.teacher_id === userInfo.id && ct.subject_id === sub.id)
        );
      }
      setJournalSubjectsToday(filteredSubjects);

      // Pre-select first lesson of the day if current selection is invalid
      let activeLesson = lessonsListToday.find(
        l => l.subject_id === selectedSubjectId && l.lesson_number === selectedLessonNumber
      );
      if (!activeLesson) {
        if (lessonsListToday.length > 0) {
          activeLesson = lessonsListToday[0];
          if (selectedSubjectId !== activeLesson.subject_id || selectedLessonNumber !== activeLesson.lesson_number) {
            setSelectedSubjectId(activeLesson.subject_id);
            setSelectedLessonNumber(activeLesson.lesson_number);
          }
        } else {
          if (selectedSubjectId !== "" || selectedLessonNumber !== "") {
            setSelectedSubjectId("");
            setSelectedLessonNumber("");
          }
        }
      }

      // 2. Students for this class
      const studRes = await fetch(
        `${API_URL}/api/schools/users?role=STUDENT&class_id=${selectedClassId}&date=${targetDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const studData = await studRes.json();
      const studentsList = Array.isArray(studData) ? studData.map((u: any) => ({
        id: u.student_id || u.id,
        user_id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        middle_name: u.middle_name,
      })) : [];
      setStudents(studentsList);

      // 3. All grades for this class
      const gradesRes = await fetch(
        `${API_URL}/api/schools/grades?class_id=${selectedClassId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const gradesData = await gradesRes.json();
      const gradesList = Array.isArray(gradesData) ? gradesData.filter((g: any) => g.lesson_number && g.lesson_number > 0) : [];
      setJournalAllGrades(gradesList);

      // Load active columns
      const cols = getActiveColumnsForSubject(selectedClassId, selectedSubjectId);
      setJournalColumns(cols);

      // Initialize grading systems mapping for each column
      const colSysMap: { [colId: string]: number } = {};
      cols.forEach(col => {
        const savedGS = localStorage.getItem(`col_gs_${selectedClassId}_${selectedSubjectId}_${col.id}`);
        if (savedGS) {
          colSysMap[col.id] = Number(savedGS);
        } else {
          const existingGradeWithGS = gradesList.find(g => g.grade_type === col.id && g.grading_system_id);
          if (existingGradeWithGS) {
            colSysMap[col.id] = existingGradeWithGS.grading_system_id;
          } else if (col.id === "MASTERY" && activeGS) {
            colSysMap[col.id] = activeGS.id;
          }
        }
      });
      setColumnGradingSystems(colSysMap);

      // 4. Initialize cell inputs from existing grades and defaults
      const inputs: { [key: string]: string } = {};
      const sortedLessons = [...lessonsListToday].sort((a, b) => a.lesson_number - b.lesson_number);
      
      studentsList.forEach((st) => {
        sortedLessons.forEach((lesson) => {
          cols.forEach((col) => {
            const key = `${st.id}_${lesson.subject_id}_${lesson.lesson_number}_${col.id}`;
            const grade = gradesList.find((g: any) => {
              const gDate = g.grade_date ? (typeof g.grade_date === 'string' ? g.grade_date.split('T')[0] : new Date(g.grade_date).toISOString().split('T')[0]) : '';
              return g.student_id === st.id && 
                     g.subject_id === lesson.subject_id && 
                     g.lesson_number === lesson.lesson_number && 
                     g.grade_type === col.id &&
                     gDate === targetDate;
            });
            
            if (grade) {
              inputs[key] = grade.value;
            } else {
              // Calculate default value
              if (col.id === "ATTENDANCE") {
                let defaultAtt = "+";
                for (let prevL = lesson.lesson_number - 1; prevL >= 1; prevL--) {
                  const prevGrade = gradesList.find((g: any) => {
                    const gDate = g.grade_date ? (typeof g.grade_date === 'string' ? g.grade_date.split('T')[0] : new Date(g.grade_date).toISOString().split('T')[0]) : '';
                    return g.student_id === st.id && 
                           g.lesson_number === prevL && 
                           g.grade_type === "ATTENDANCE" &&
                           gDate === targetDate;
                  });
                  if (prevGrade) {
                    if (prevGrade.value === "-") {
                      defaultAtt = "-";
                    } else if (prevGrade.value === "+" || prevGrade.value === "k") {
                      defaultAtt = "+";
                    }
                    break;
                  }
                }
                inputs[key] = defaultAtt;
              } else if (col.id === "BEHAVIOR") {
                inputs[key] = "0";
              } else {
                inputs[key] = "";
              }
            }
          });
        });
      });
      setCellInputs(inputs);
    } catch (e) {
      console.error(e);
    } finally {
      setJournalLoading(false);
    }
  };

  const findGradeForDayAndType = (studentId: number, subjectId: number, lessonNumber: number, gradeType: string): GradeItem | undefined => {
    return journalAllGrades.find(g => {
      const gDate = g.grade_date ? (typeof g.grade_date === 'string' ? g.grade_date.split('T')[0] : new Date(g.grade_date).toISOString().split('T')[0]) : '';
      return g.student_id === studentId && 
             g.subject_id === subjectId && 
             gDate === journalDate && 
             g.lesson_number === lessonNumber &&
             g.grade_type === gradeType;
    });
  };

  // Inline cell save: handles POST (create), PUT (update), or DELETE (delete)
  const handleCellSave = async (studentId: number, subjectId: number, lessonNumber: number, gradeType: string, customValue?: string) => {
    const key = `${studentId}_${subjectId}_${lessonNumber}_${gradeType}`;
    const value = customValue !== undefined ? customValue.trim() : (cellInputs[key] || '').trim();
    
    // Find if there is an existing grade for this cell on the selected day
    const existingGrade = journalAllGrades.find(g => {
      const gDate = g.grade_date ? (typeof g.grade_date === 'string' ? g.grade_date.split('T')[0] : new Date(g.grade_date).toISOString().split('T')[0]) : '';
      return g.student_id === studentId && 
             g.subject_id === subjectId && 
             g.lesson_number === lessonNumber && 
             g.grade_type === gradeType &&
             gDate === journalDate;
    });

    const oldValue = existingGrade ? existingGrade.value : '';
    if (value === oldValue) return; // No change

    if (existingGrade && existingGrade.status === 'approved') {
      showToast('error', 'Tasdiqlangan bahoni o\'zgartirib bo\'lmaydi');
      setCellInputs(prev => ({ ...prev, [key]: oldValue }));
      return;
    }

    setCellSaving(key);
    try {
      if (value === '') {
        // DELETE existing grade
        if (!existingGrade) return;
        const res = await fetch(`${API_URL}/api/schools/grades/${existingGrade.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Bahoni o\'chirib bo\'lmadi');
        }
        // Update local state
        setJournalAllGrades(prev => prev.filter(g => g.id !== existingGrade.id));
        setCellInputs(prev => ({ ...prev, [key]: '' }));
        showToast('success', 'Baho o\'chirildi');
      } else {
        // Create or Update
        let res;
        const gradePayload = {
          student_id: studentId,
          subject_id: subjectId,
          value: value,
          grade_date: journalDate,
          grading_system_id: columnGradingSystems[gradeType] || undefined,
          grade_type: gradeType,
          grade_category: selectedGradeCategory,
          lesson_number: lessonNumber,
        };

        if (existingGrade) {
          // PUT update
          res = await fetch(`${API_URL}/api/schools/grades/${existingGrade.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(gradePayload)
          });
        } else {
          // POST create
          res = await fetch(`${API_URL}/api/schools/grades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(gradePayload)
          });
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Bahoni saqlab bo\'lmadi');

        // Update local state
        if (existingGrade) {
          setJournalAllGrades(prev => prev.map(g => g.id === existingGrade.id ? data : g));
        } else {
          setJournalAllGrades(prev => [...prev, data]);
        }
        setCellInputs(prev => ({ ...prev, [key]: data.value }));
        showToast('success', `${data.value} — saqlandi`);

        // If the teacher marked the student absent (-), delete all other marks (behavior, mastery, custom columns)
        if (gradeType === "ATTENDANCE" && value === "-") {
          const otherGrades = journalAllGrades.filter(g => {
            const gDate = g.grade_date ? (typeof g.grade_date === 'string' ? g.grade_date.split('T')[0] : new Date(g.grade_date).toISOString().split('T')[0]) : '';
            return g.student_id === studentId &&
                   g.subject_id === subjectId &&
                   g.lesson_number === lessonNumber &&
                   g.grade_type !== "ATTENDANCE" &&
                   gDate === journalDate &&
                   g.status !== 'approved';
          });
          for (const og of otherGrades) {
            try {
              await fetch(`${API_URL}/api/schools/grades/${og.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              setJournalAllGrades(prev => prev.filter(g => g.id !== og.id));
              const colKey = `${studentId}_${subjectId}_${lessonNumber}_${og.grade_type}`;
              setCellInputs(prev => ({ ...prev, [colKey]: '' }));
            } catch (err) {
              console.error("Failed to delete stale grade", err);
            }
          }
        }
      }
    } catch (e: any) {
      showToast('error', e.message);
      setCellInputs(prev => ({ ...prev, [key]: oldValue }));
    } finally {
      setCellSaving(null);
    }
  };

  // Fetch unapproved (marked) grades for the selected class
  const fetchUnapprovedGrades = async () => {
    if (!selectedClassId || !token) return;
    setUnapprovedLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/grades?class_id=${selectedClassId}&status=marked`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const gradesList = Array.isArray(data) ? data.filter((g: any) => g.lesson_number && g.lesson_number > 0) : [];

      // Filter by role/subject assignment:
      // If SUBJECT_TEACHER (and not advisor/admin), only show their assigned subjects in this class
      let filteredGrades = gradesList;
      if (userInfo && userInfo.role !== "ADMIN" && !isMainTeacherOfClass()) {
        filteredGrades = gradesList.filter((g: any) => 
          classTeachers.some((ct: any) => ct.teacher_id === userInfo.id && ct.subject_id === g.subject_id)
        );
      }
      setUnapprovedGrades(filteredGrades);
    } catch (e) {
      console.error(e);
    } finally {
      setUnapprovedLoading(false);
    }
  };

  // Students list for CRUD operations
  const fetchStudentsTabList = async () => {
    if (!token) return;
    setStudentsTabLoading(true);
    try {
      const url = selectedClassId
        ? `${API_URL}/api/schools/users?role=STUDENT&class_id=${selectedClassId}`
        : `${API_URL}/api/schools/users?role=STUDENT`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStudentsTabList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setStudentsTabLoading(false);
    }
  };

  // Student form submission handler
  const handleStudentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !token) return;
    
    const body: any = {
      first_name: studentForm.first_name.trim(),
      last_name: studentForm.last_name.trim(),
      middle_name: studentForm.middle_name.trim() || undefined,
      phone: studentForm.phone.trim() ? studentForm.phone.trim() : undefined,
      address: studentForm.address.trim() || undefined,
      birthdate: studentForm.birthdate || undefined,
      ina: studentForm.ina.trim() || undefined,
    };

    try {
      let res;
      if (studentModalMode === "create") {
        body.password = studentForm.password.trim() || "123456";
        res = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
      } else {
        if (studentForm.password.trim()) {
          body.password = studentForm.password.trim();
        }
        res = await fetch(`${API_URL}/api/schools/students/${editingStudent.student_id || editingStudent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Saqlashda xatolik");

      showToast("success", studentModalMode === "create" ? "O'quvchi muvaffaqiyatli qo'shildi" : "O'quvchi ma'lumotlari yangilandi");
      setShowStudentModal(false);
      fetchStudentsTabList();
      fetchJournalData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Student soft delete handler
  const handleDeleteStudent = (studentId: number) => {
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "O'quvchini o'chirish",
      message: "Haqiqatan ham bu o'quvchini o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/api/schools/students/${studentId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "O'chirishda xatolik");
          showToast("success", "O'quvchi muvaffaqiyatli o'chirildi");
          fetchStudentsTabList();
          fetchJournalData();
        } catch (err: any) {
          showToast("error", err.message);
        }
      },
    });
  };

  // Parent Management API Calls
  const fetchLinkedParents = async (studentId: number) => {
    setLinkedParentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/students/${studentId}/parents`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setLinkedParents(Array.isArray(data) ? data : []);
      } else {
        setLinkedParents([]);
      }
    } catch (e) {
      console.error(e);
      setLinkedParents([]);
    } finally {
      setLinkedParentsLoading(false);
    }
  };

  const fetchClassParents = async () => {
    if (!token) return;
    setClassParentsLoading(true);
    try {
      if (studentsTabList.length === 0) {
        fetchStudentsTabList();
      }
      const url = selectedClassId
        ? `${API_URL}/api/schools/users?role=PARENT&class_id=${selectedClassId}`
        : `${API_URL}/api/schools/users?role=PARENT`;
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setClassParents(Array.isArray(data) ? data : []);
      } else {
        setClassParents([]);
      }
    } catch (e) {
      console.error(e);
      setClassParents([]);
    } finally {
      setClassParentsLoading(false);
    }
  };

  const handleCreateAndLinkParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentIdForAdd) {
      showToast("error", "O'quvchini tanlang");
      return;
    }
    if (!parentFirstName.trim() || !parentLastName.trim() || !parentPhone.trim() || !parentPassword.trim()) {
      showToast("error", "Majburiy maydonlarni to'ldiring");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/students/${selectedStudentIdForAdd}/parents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: parentFirstName.trim(),
          last_name: parentLastName.trim(),
          middle_name: parentMiddleName.trim() || undefined,
          phone: parentPhone.trim(),
          passport: parentPassport.trim() || undefined,
          password: parentPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ota-onani yaratib bo'lmadi");

      setParentFirstName("");
      setParentLastName("");
      setParentMiddleName("");
      setParentPhone("");
      setParentPassport("");
      setParentPassword("password123");
      setSelectedStudentIdForAdd("");
      setShowAddParentModal(false);
      showToast("success", "Ota-ona yaratildi va o'quvchiga bog'landi");
      fetchClassParents();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkParentFromStudent = (studentId: number, parentId: number) => {
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "Ota-onani ajratish",
      message: "Haqiqatan ham ushbu ota-onani o'quvchidan ajratmoqchisiz?",
      confirmText: "Ha, ajratish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/schools/students/${studentId}/parents/${parentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Ajratishda xatolik yuz berdi");
          showToast("success", "Ota-ona muvaffaqiyatli ajratildi");
          fetchClassParents();
        } catch (err: any) {
          showToast("error", err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForParents) return;
    if (!parentFirstName.trim() || !parentLastName.trim() || !parentPhone.trim() || !parentPassword.trim()) {
      showToast("error", "Majburiy maydonlarni to'ldiring");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/students/${selectedStudentForParents.id || selectedStudentForParents.user_id}/parents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: parentFirstName.trim(),
          last_name: parentLastName.trim(),
          middle_name: parentMiddleName.trim() || undefined,
          phone: parentPhone.trim(),
          passport: parentPassport.trim() || undefined,
          password: parentPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ota-onani bog'lab bo'lmadi");
      }

      setParentFirstName("");
      setParentLastName("");
      setParentMiddleName("");
      setParentPhone("");
      setParentPassport("");
      setParentPassword("password123");

      fetchLinkedParents(selectedStudentForParents.id || selectedStudentForParents.user_id);
      showToast("success", "Ota-ona muvaffaqiyatli bog'landi");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkParent = (parentId: number) => {
    if (!selectedStudentForParents) return;
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "Ota-onani ajratish",
      message: "Haqiqatan ham ushbu ota-onani o'quvchidan ajratmoqchisiz?",
      confirmText: "Ha, ajratish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/schools/students/${selectedStudentForParents.id || selectedStudentForParents.user_id}/parents/${parentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "O'chirishda xatolik yuz berdi");
          }
          fetchLinkedParents(selectedStudentForParents.id || selectedStudentForParents.user_id);
          showToast("success", "Bog'liqlik muvaffaqiyatli o'chirildi");
        } catch (err: any) {
          showToast("error", err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleParentsExcelImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/schools/import/parents`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Faylni yuklashda xatolik yuz berdi");

      setImportResult(data);
      setSelectedFile(null);
      showToast("success", `Excel orqali ${data.imported_count} ta ota-ona yuklandi!`);
      fetchStudentsTabList(); // Reload student list
    } catch (err: any) {
      setImportError(err.message || "Yuklashda xatolik");
    } finally {
      setImportLoading(false);
    }
  };

  const downloadParentsTemplate = async () => {
    if (!selectedClassId) return;
    try {
      const url = `${API_URL}/api/schools/import/template/parents?class_id=${selectedClassId}`;
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Shablonni yuklab bo'lmadi");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "ota_ona_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleStudentsExcelImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedClassId) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/schools/import/students?class_id=${selectedClassId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Faylni yuklashda xatolik yuz berdi");

      setImportResult(data);
      setSelectedFile(null);
      showToast("success", `Excel orqali ${data.imported_count} ta o'quvchi yuklandi!`);
      fetchStudentsTabList(); // Reload student list
      fetchJournalData(); // Reload journal data
    } catch (err: any) {
      setImportError(err.message || "Yuklashda xatolik");
    } finally {
      setImportLoading(false);
    }
  };

  const downloadStudentsTemplate = async () => {
    if (!selectedClassId) return;
    try {
      const url = `${API_URL}/api/schools/import/template/students?class_id=${selectedClassId}`;
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Shablonni yuklab bo'lmadi");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "oquvchi_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // 3. Batch save grades
  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    setSaveSuccess(false);

    const gradesToSubmit = Object.entries(gradeInputs)
      .filter(([_, value]) => value.trim() !== "")
      .map(([studentId, value]) => ({
        student_id: Number(studentId),
        subject_id: Number(selectedSubjectId),
        value: value.trim(),
      }));

    if (gradesToSubmit.length === 0) {
      showToast("error", "Hech qanday yangi baho kiritilmagan");
      setActionLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/schools/grades/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ grades: gradesToSubmit }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Baholarni saqlashda xatolik yuz berdi");

      showToast("success", "Barcha kiritilgan baholar muvaffaqiyatli saqlandi!");
      fetchClassData(); // Reload list
      setSelectedGradeIds(new Set()); // Clear selection after save
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 3b. Bulk approve selected grades
  const handleBulkApprove = async () => {
    if (selectedGradeIds.size === 0) {
      showToast("error", "Tasdiqlash uchun kamida bitta baho tanlang");
      return;
    }
    setApproveLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/grades/change-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          mark_uids: Array.from(selectedGradeIds),
          status: "approved",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tasdiqlashda xatolik yuz berdi");

      showToast("success", `${data.updated_count} ta baho muvaffaqiyatli tasdiqlandi!`);
      setSelectedGradeIds(new Set());
      fetchJournalData(journalDate);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setApproveLoading(false);
    }
  };

  // Approve all grades of the selected journal date
  const handleApproveAllToday = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedLessonNumber) {
      showToast("error", "Sinf, fan va dars soatini tanlang");
      return;
    }

    const gradesToCreate: any[] = [];
    const gradesToApprove: number[] = [];

    students.forEach((st) => {
      const attKey = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_ATTENDANCE`;
      const attendanceVal = cellInputs[attKey] || "+";

      journalColumns.forEach((col) => {
        if (attendanceVal === "-" && col.id !== "ATTENDANCE") {
          return;
        }

        const key = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_${col.id}`;
        const cellVal = (cellInputs[key] || "").trim();

        if (cellVal !== "") {
          const existingGrade = findGradeForDayAndType(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), col.id);
          if (existingGrade) {
            if (existingGrade.status !== "approved") {
              gradesToApprove.push(existingGrade.id);
            }
          } else {
            gradesToCreate.push({
              student_id: st.id,
              subject_id: Number(selectedSubjectId),
              value: cellVal,
              grade_date: journalDate,
              grading_system_id: columnGradingSystems[col.id] || undefined,
              grade_type: col.id,
              grade_category: selectedGradeCategory,
              lesson_number: Number(selectedLessonNumber),
            });
          }
        }
      });
    });

    const totalToSave = gradesToCreate.length + gradesToApprove.length;
    if (totalToSave === 0) {
      showToast("error", "Saqlanmagan baholar mavjud emas");
      return;
    }

    setTeacherDialog({
      isOpen: true,
      type: "confirm",
      title: "Baholarni saqlash va tasdiqlash",
      message: `Haqiqatan ham darsdagi barcha ${totalToSave} ta bahoni saqlamoqchimisiz? Saqlangandan so'ng ularni o'zgartirib bo'lmaydi.`,
      confirmText: "Ha, saqlash",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        setApproveLoading(true);
        try {
          if (gradesToCreate.length > 0) {
            const createRes = await fetch(`${API_URL}/api/schools/grades/batch`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({ grades: gradesToCreate }),
            });
            const createdData = await createRes.json();
            if (!createRes.ok) {
              throw new Error(createdData.error || "Yangi baholarni saqlashda xatolik yuz berdi");
            }
            if (Array.isArray(createdData)) {
              createdData.forEach((g: any) => {
                gradesToApprove.push(g.id);
              });
            }
          }

          if (gradesToApprove.length > 0) {
            const approveRes = await fetch(`${API_URL}/api/schools/grades/change-status`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                mark_uids: gradesToApprove,
                status: "approved",
              }),
            });
            const approveData = await approveRes.json();
            if (!approveRes.ok) {
              throw new Error(approveData.error || "Baholarni tasdiqlashda xatolik yuz berdi");
            }
          }

          showToast("success", `Barcha ${totalToSave} ta baho muvaffaqiyatli saqlandi va tasdiqlandi (🔒 qulflab saqlandi)!`);
          fetchJournalData(journalDate);
        } catch (err: any) {
          showToast("error", err.message);
        } finally {
          setApproveLoading(false);
        }
      },
    });
  };

  // 4. Download Excel Template
  const handleDownloadTemplate = () => {
    if (!selectedClassId || !selectedSubjectId) return;
    window.open(`${API_URL}/api/schools/import/template/grades?class_id=${selectedClassId}&subject_id=${selectedSubjectId}&token=${token}`);
  };

  // 5. Excel Import Handler
  const handleExcelImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/schools/import/grades`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Excel yuklashda xatolik");

      setImportResult(data);
      setSelectedFile(null);
      showToast("success", `Excel orqali ${data.imported_count} ta baho yuklandi!`);
      fetchClassData(); // Reload table
    } catch (err: any) {
      showToast("error", err.message || "Xatolik yuz berdi");
    } finally {
      setImportLoading(false);
    }
  };

  const renderEditWeeklyScheduleModal = () => {
    if (!showEditScheduleModal) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowEditScheduleModal(false);
            setScheduleFormState({});
            setActionError("");
          }
        }}
        className="fixed inset-0 z-50 flex justify-center items-start bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
      >
        <div className="w-full max-w-5xl bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative text-zinc-900 animate-fadeIn space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">
                {editingScheduleOriginalStartDate ? "Haftalik dars jadvalini tahrirlash" : "Yangi Davr Dars Jadvalini Qo'shish"}
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {editingScheduleOriginalStartDate 
                  ? "Mavjud davr dars jadvalini o'zgartirish. Har bir kun va dars soati uchun fanni tanlang." 
                  : "Yangi chorak yoki vaqt oralig'i uchun dars jadvali yaratish. Sana mavjud davrlar bilan ustma-ust tushmasligi kerak."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowEditScheduleModal(false);
                setScheduleFormState({});
                setActionError("");
              }}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl font-bold">{actionError}</div>
          )}

          <form onSubmit={handleSaveSchedule} className="space-y-6">
            <DateRangePresets
              startDate={scheduleStartDate}
              endDate={scheduleEndDate}
              onStartDateChange={setScheduleStartDate}
              onEndDateChange={setScheduleEndDate}
              token={token}
              apiUrl={API_URL}
              category="schedule"
              theme="indigo"
            />

            <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white shadow-xs">
              <table className="min-w-full divide-y divide-zinc-200/70 text-center table-fixed">
                <thead className="bg-[#fafafa] text-[10px] sm:text-xs font-extrabold text-[#16193E] uppercase tracking-wider">
                  <tr>
                    <th className="px-2 py-3 w-16 bg-[#fafafa]">Soat</th>
                    <th className="px-2 py-3">Dushanba</th>
                    <th className="px-2 py-3">Seshanba</th>
                    <th className="px-2 py-3">Chorshanba</th>
                    <th className="px-2 py-3">Payshanba</th>
                    <th className="px-2 py-3">Juma</th>
                    <th className="px-2 py-3">Shanba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <tr key={period} className="hover:bg-indigo-50/20 transition">
                      <td className="px-2 py-2 font-mono font-bold text-zinc-400 bg-[#fafafa]">
                        {period}-dars
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((day) => {
                        const slotKey = `${day}-${period}`;
                        const selectedVal = scheduleFormState[slotKey] || 0;
                        return (
                          <td key={day} className="px-1.5 py-2 border-l border-zinc-100">
                            <select
                              value={selectedVal}
                              onChange={(e) => {
                                setScheduleFormState((prev) => ({
                                  ...prev,
                                  [slotKey]: Number(e.target.value),
                                }));
                              }}
                              className="w-full bg-white border border-zinc-200 focus:ring-2 focus:ring-indigo-500 text-zinc-800 rounded-xl px-2 py-1.5 text-xs outline-none cursor-pointer font-bold transition"
                            >
                              <option value="0">Bo'sh</option>
                              {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setShowEditScheduleModal(false);
                  setScheduleFormState({});
                  setActionError("");
                }}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="text-xs bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-extrabold py-2.5 px-6 rounded-xl transition cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderAddExceptionModal = () => {
    if (!showAddExceptionModal) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddExceptionModal(false);
            setActionError("");
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto text-zinc-900"
      >
        <div className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Kunlik Dars Jadvali O'zgarishi Kiritish</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Tanlangan kun va dars soati uchun bir martalik o'zgarish yoki darsni bekor qilish.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddExceptionModal(false);
                setActionError("");
              }}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl font-bold">{actionError}</div>
          )}

          <form onSubmit={handleAddExceptionSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">Sinf *</label>
              <select
                required
                value={selectedClassId || ""}
                onChange={(e) => {
                  const clsId = e.target.value === "" ? "" : Number(e.target.value);
                  setSelectedClassId(clsId);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-indigo-500 text-zinc-800 font-bold rounded-xl px-3.5 py-2.5 text-xs outline-none transition cursor-pointer"
              >
                <option value="">Sinfni tanlang</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">Kun (Sana) *</label>
              <button
                type="button"
                onClick={() => {
                  setTeacherCalendarTarget("exception");
                  setIsTeacherCalendarOpen(true);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 text-zinc-800 font-bold rounded-xl px-3.5 py-2.5 text-xs outline-none transition flex items-center justify-between cursor-pointer"
              >
                <span className="font-mono text-xs">
                  {excDate ? (() => {
                    const parts = excDate.split("-");
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : excDate;
                  })() : "Sana tanlang"}
                </span>
                <Calendar className="w-4 h-4 text-[#5B50EC]" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">Dars soati</label>
              <select
                value={excLesson}
                onChange={(e) => setExcLesson(Number(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-indigo-500 text-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none transition cursor-pointer font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <option key={period} value={period}>{period}-dars</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">O'zgarish turi</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-xs font-bold text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="excType"
                    checked={excType === "replace"}
                    onChange={() => setExcType("replace")}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <span>O'zgartirish / Qo'shimcha fan</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-bold text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="excType"
                    checked={excType === "cancel"}
                    onChange={() => setExcType("cancel")}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <span>Darsni bekor qilish (Cancel)</span>
                </label>
              </div>
            </div>

            {excType === "replace" && (
              <div>
                <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">Fan</label>
                <select
                  required={excType === "replace"}
                  value={excSubjectId}
                  onChange={(e) => setExcSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-indigo-500 text-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none transition cursor-pointer font-bold"
                >
                  <option value="">Fanni tanlang</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddExceptionModal(false);
                  setActionError("");
                }}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="text-xs bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-extrabold py-2.5 px-6 rounded-xl transition cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                {actionLoading ? "Kiritilmoqda..." : "Kiritish"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderPeriodsModal = () => {
    if (!showPeriodsModal) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowPeriodsModal(false);
          }
        }}
        className="fixed inset-0 z-50 flex justify-center items-start bg-black/60 backdrop-blur-md p-4 overflow-y-auto text-zinc-900"
      >
        <div className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Mavjud Dars Jadvallari</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Ushbu sinf uchun kiritilgan barcha haftalik dars jadvali davrlari.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPeriodsModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {schedulePeriodsLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : schedulePeriods.length === 0 ? (
            <p className="text-zinc-400 text-xs font-mono py-6 text-center">Ushbu sinf uchun hech qanday haftalik dars jadvali topilmadi.</p>
          ) : (
            <div className="space-y-3">
              {schedulePeriods.map((period, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200/70 rounded-2xl hover:bg-indigo-50/20 transition">
                  <div className="space-y-1">
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide">
                      Jadval #{schedulePeriods.length - idx}
                    </span>
                    <p className="text-xs text-zinc-800 font-bold mt-1">
                      <span className="font-mono">{period.start_date}</span> dan <span className="font-mono">{period.end_date}</span> gacha
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleViewDate(period.start_date);
                      fetchClassSchedule(period.start_date);
                      setShowPeriodsModal(false);
                      showToast("success", `Dars jadvali ${period.start_date} davriga o'tkazildi!`);
                    }}
                    className="text-xs bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold py-2 px-3.5 rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Tanlash (Ko'rish)
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-zinc-100 mt-4">
            <button
              type="button"
              onClick={() => setShowPeriodsModal(false)}
              className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentModal = () => {
    if (!showStudentModal) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowStudentModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white border border-zinc-200/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-zinc-900 animate-fadeIn relative overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">
                {studentModalMode === "create" ? "Yangi o'quvchi qo'shish" : "O'quvchi ma'lumotlarini tahrirlash"}
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Barcha kerakli maydonlarni to'ldiring
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowStudentModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleStudentFormSubmit} className="space-y-3.5 overflow-y-auto">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Familiya *</label>
              <input
                type="text"
                required
                value={studentForm.last_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                placeholder="Familiyani kiriting"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Ism *</label>
              <input
                type="text"
                required
                value={studentForm.first_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                placeholder="Ismni kiriting"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Otasining ismi (sharif)</label>
              <input
                type="text"
                value={studentForm.middle_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, middle_name: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                placeholder="Otasining ismini kiriting"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Telefon raqam (Ixtiyoriy)</label>
              <input
                type="text"
                value={studentForm.phone}
                onChange={(e) => setStudentForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                placeholder="+998901234567"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Manzil</label>
              <input
                type="text"
                value={studentForm.address}
                onChange={(e) => setStudentForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                placeholder="Masalan: Toshkent sh., Chilonzor"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Tug'ilgan sana</label>
                <input
                  type="date"
                  value={studentForm.birthdate}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, birthdate: e.target.value }))}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Guvohnoma (INA)</label>
                <input
                  type="text"
                  value={studentForm.ina}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, ina: e.target.value }))}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                  placeholder="I-TV No 123456"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                {studentModalMode === "create" ? "Parol *" : "Yangi Parol (Ixtiyoriy)"}
              </label>
              <input
                type="password"
                required={studentModalMode === "create"}
                value={studentForm.password}
                onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                placeholder={studentModalMode === "create" ? "Tizimga kirish paroli (Kamida 6 ta belgi)" : "O'zgartirmaslik uchun bo'sh qoldiring"}
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTodayLessonsModal, setShowTodayLessonsModal] = useState(false);

  // ESC key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowTodayLessonsModal(false);
        setShowAddClubModal(false);
        setShowEditClubModal(false);
        setShowAddScheduleModal(false);
        setShowEditScheduleModal(false);
        setShowAddExceptionModal(false);
        setShowStudentModal(false);
        setShowParentsModal(false);
        setShowAddParentModal(false);
        setShowImportStudentsModal(false);
        setShowImportParentsModal(false);
        setShowGradeCommentModal(false);
        setShowLogoutModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_refresh_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };

  // Dynamic Dashboard computations
  const monthNamesUz = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];
  const currentMonthName = monthNamesUz[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const currentDayNumber = new Date().getDate();

  const getCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const startOffset = (firstDayOfMonth === 0 ? 7 : firstDayOfMonth) - 1;
    const days: { day: number; isCurrentMonth: boolean; isCurrentDay: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isCurrentDay: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        isCurrentDay: i === now.getDate(),
      });
    }

    const remaining = 35 - days.length;
    for (let i = 1; i <= (remaining < 0 ? remaining + 7 : remaining); i++) {
      days.push({ day: i, isCurrentMonth: false, isCurrentDay: false });
    }

    return days;
  };

  const formatLessonTime = (lessonNumber: number) => {
    const startHour = 7 + lessonNumber;
    const endHour = 8 + lessonNumber;
    const startStr = `${startHour < 10 ? '0' : ''}${startHour}:30`;
    const endStr = `${endHour < 10 ? '0' : ''}${endHour}:15`;
    return `${startStr} - ${endStr}`;
  };

  const getTodayLessons = () => {
    const targetDate = selectedDashboardDate ? new Date(selectedDashboardDate + "T00:00:00") : new Date();
    const dayOfWeek = targetDate.getDay();
    const currentDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    if (currentDay === 7) return [];

    const list: Array<{
      subject_id: number;
      subject_name: string;
      class_id: number;
      class_name: string;
      time: string;
      lesson_number: number;
      date?: string;
    }> = [];

    for (let lessonNum = 1; lessonNum <= 10; lessonNum++) {
      const slotKey = `${currentDay}-${lessonNum}`;
      const items = overallSchedule[slotKey];
      if (items && items.length > 0) {
        items.forEach((it) => {
          list.push({
            subject_id: it.subject_id,
            subject_name: it.subject_name || subjects.find(s => s.id === it.subject_id)?.name || "Dars",
            class_id: it.class_id,
            class_name: it.class_name,
            time: formatLessonTime(lessonNum),
            lesson_number: lessonNum,
            date: selectedDashboardDate,
          });
        });
      }
    }

    if (list.length > 0) return list;

    const classSchList = classSchedule.filter((s) => s.day_of_week === currentDay && s.subject_id > 0);
    if (classSchList.length > 0) {
      return classSchList.map((item) => {
        const cls = classes.find((c) => c.id === item.class_id) || classes.find((c) => c.id === selectedClassId);
        const sub = subjects.find((s) => s.id === item.subject_id);
        return {
          subject_id: item.subject_id,
          subject_name: sub?.name || item.subject_name || "Dars",
          class_id: item.class_id || (selectedClassId ? Number(selectedClassId) : 0),
          class_name: cls?.name || `Sinf ${item.class_id}`,
          time: formatLessonTime(item.lesson_number),
          lesson_number: item.lesson_number,
          date: selectedDashboardDate,
        };
      });
    }

    return [];
  };

  const todayLessons = getTodayLessons();

  const handleSelectLessonAndGoToJournal = (lesson: {
    class_id: number;
    subject_id: number;
    lesson_number?: number;
    date?: string;
  }) => {
    const targetDate = lesson.date || selectedDashboardDate || new Date().toISOString().split("T")[0];
    if (lesson.class_id) {
      setSelectedClassId(lesson.class_id);
    }
    if (lesson.subject_id) {
      setSelectedSubjectId(lesson.subject_id);
    }
    if (lesson.lesson_number) {
      setSelectedLessonNumber(lesson.lesson_number);
    }
    setJournalDate(targetDate);
    setTeacherTab("journal");
    setShowTodayLessonsModal(false);
    fetchJournalData(targetDate);
  };

  // Helper to convert grade value into a numeric percentage score (0 to 100)
  const parseGradeValueToScore = (val: string): number | null => {
    if (!val) return null;
    const trimmed = val.trim();
    if (trimmed === "5" || trimmed.toLowerCase() === "a'lo" || trimmed === "+") return 100;
    if (trimmed === "4" || trimmed.toLowerCase() === "yaxshi" || trimmed === "k") return 80;
    if (trimmed === "3" || trimmed.toLowerCase() === "qoniqarli") return 60;
    if (trimmed === "2" || trimmed.toLowerCase() === "yomon" || trimmed === "-") return 40;
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
      if (num <= 5) return Math.round((num / 5) * 100);
      return Math.min(100, Math.max(0, Math.round(num)));
    }
    return null;
  };

  const getTopStudentsList = () => {
    if (dashboardStudents.length === 0) return [];

    const studentScores = dashboardStudents.map((s) => {
      const sId = s.student_id || s.id;
      const studentGrades = dashboardGrades.filter((g) => g.student_id === sId || g.student_id === s.id);
      let validScores: number[] = [];
      studentGrades.forEach((g) => {
        const score = parseGradeValueToScore(g.value);
        if (score !== null) validScores.push(score);
      });

      let avgScore = 0;
      if (validScores.length > 0) {
        avgScore = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
      } else {
        avgScore = 85;
      }

      return {
        id: sId,
        first_name: s.first_name,
        last_name: s.last_name,
        score: avgScore,
      };
    });

    studentScores.sort((a, b) => b.score - a.score);
    return studentScores.slice(0, 4);
  };

  const topStudentsList = getTopStudentsList();

  const getComputedCompletionRate = (): number => {
    if (dashboardGrades.length === 0) {
      if (classes.length > 0) return Math.min(98, Math.max(70, 84 + (classes.length * 2)));
      return 0;
    }
    let validScores: number[] = [];
    dashboardGrades.forEach((g) => {
      const score = parseGradeValueToScore(g.value);
      if (score !== null) validScores.push(score);
    });

    if (validScores.length === 0) return 85;
    const avg = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
    return Math.min(100, Math.max(0, avg));
  };

  const computedCompletionRate = getComputedCompletionRate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F4F5FB] text-zinc-900 flex font-sans relative">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Left Fixed Vertical Sidebar (Collapsible on Desktop, Full-width Drawer on Mobile) */}
      {(() => {
        const isCollapsedDesktop = sidebarCollapsed && !sidebarOpen;

        return (
          <aside className={`fixed md:sticky top-0 left-0 h-screen bg-[#16193E] text-white flex flex-col justify-between shrink-0 z-50 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0 w-64' : `-translate-x-full md:translate-x-0 ${isCollapsedDesktop ? 'w-20' : 'w-64'}`
          }`}>
            {/* Brand logo & collapse toggle header */}
            <div>
              <div className={`h-20 flex items-center border-b border-white/10 ${isCollapsedDesktop ? 'justify-center px-2' : 'justify-between px-6'}`}>
                {isCollapsedDesktop ? (
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(false)}
                    title="Yonga kengaytirish"
                    className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <GraduationCap className="w-6 h-6" />
                  </button>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h1 className="text-base font-black tracking-wider text-white uppercase">FARZANDIM</h1>
                        <p className="text-[9px] text-indigo-200/70 uppercase tracking-widest font-mono font-bold">O'qituvchi Portali</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (sidebarOpen) {
                          setSidebarOpen(false);
                        } else {
                          setSidebarCollapsed(true);
                        }
                      }}
                      className="flex items-center justify-center w-8 h-8 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
                      title={sidebarOpen ? "Yopish" : "Yonga qisqartirish"}
                    >
                      {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <PanelLeftClose className="w-4 h-4 hidden md:block" />}
                    </button>
                  </>
                )}
              </div>

              {/* Sidebar Nav Items */}
              <nav className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-160px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { id: "journal", label: "Sinf Jurnali", icon: BookOpen },
                  { id: "schedule", label: "Dars Jadvali", icon: Calendar },
                  { id: "lesson-plans", label: "Dars Ish Rejasi", icon: FileText },
                  { id: "students", label: "O'quvchilar", icon: Users },
                  { id: "parents", label: "Ota-onalar", icon: UserCheck },
                  { id: "social-passport", label: "Ijtimoiy pasport", icon: FileSpreadsheet },
                  { id: "unapproved", label: "Tasdiqlanmagan", icon: CheckSquare, badge: unapprovedGrades.length },
                  { id: "feedback", label: "Izoh va Fikrlar", icon: MessageSquare },
                  { id: "announcements", label: "E'lonlar", icon: Megaphone },
                  { id: "clubs", label: "To'garaklar", icon: Sparkles },
                  { id: "books", label: "Kitobxonlik", icon: BookMarked },
                  { id: "settings", label: "Sozlamalar", icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = teacherTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={isCollapsedDesktop ? item.label : undefined}
                      onClick={() => {
                        setTeacherTab(item.id as any);
                        if (item.id === "feedback") fetchFeedbackFeed(token);
                        if (item.id === "announcements") fetchAllStudents(token);
                        if (item.id === "clubs") fetchClubs(token);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all relative cursor-pointer group ${
                        isCollapsedDesktop ? "justify-center p-3" : "space-x-3.5 px-4 py-3"
                      } ${
                        isActive
                          ? "text-white font-bold bg-white/10"
                          : "text-indigo-200/60 hover:text-white hover:bg-white/5 font-medium"
                      }`}
                    >
                      {/* Left Pill Notch */}
                      {isActive && (
                        <span className={`absolute top-1/2 -translate-y-1/2 w-2 h-7 bg-white rounded-r-full shadow-sm ${
                          isCollapsedDesktop ? "-left-3" : "-left-4"
                        }`} />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "text-white scale-110" : "text-indigo-300/60 group-hover:text-white"}`} />
                      {!isCollapsedDesktop && <span className="truncate">{item.label}</span>}
                      
                      {item.badge && item.badge > 0 ? (
                        isCollapsedDesktop ? (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#16193E]" />
                        ) : (
                          <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User Profile & Logout Footer */}
            <div className="p-3 border-t border-white/10">
              {isCollapsedDesktop ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(false)}
                    title={`${userInfo?.first_name} ${userInfo?.last_name} (${userInfo?.role === "MAIN_TEACHER" ? "Sinf Rahbari" : "O'qituvchi"}) - Bosib yonga kengaytirish`}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-indigo-400/40 text-white font-black text-sm flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer shrink-0"
                  >
                    {userInfo?.first_name ? userInfo.first_name[0] : "T"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    title="Tizimdan chiqish"
                    className="w-8 h-8 flex items-center justify-center text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {userInfo?.first_name ? userInfo.first_name[0] : "T"}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{userInfo?.first_name} {userInfo?.last_name}</p>
                      <p className="text-[10px] text-indigo-300/80 truncate">{userInfo?.role === "MAIN_TEACHER" ? "Sinf Rahbari" : "O'qituvchi"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    title="Chiqish"
                    className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </aside>
        );
      })()}

      {/* Main Workspace (Scrollable) */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Menu Button (Visible on mobile screens only) */}
        <div className="md:hidden pt-4 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white text-zinc-700 hover:text-zinc-900 rounded-xl shadow-xs border border-zinc-200/80 transition cursor-pointer flex items-center space-x-2 text-xs font-bold"
          >
            <Menu className="w-4 h-4" />
            <span>Menyu</span>
          </button>
          <span className="text-xs font-black text-indigo-900 tracking-wider">FARZANDIM</span>
        </div>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-36">
          {/* TAB CONTENT: Dynamic Dashboard */}
          {teacherTab === "dashboard" && (
            <div className="space-y-6">
              {/* Top Hero Banner (Hidden on mobile so critical panels are immediately visible) */}
              <div className="hidden md:flex bg-white border border-zinc-200/70 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden items-center justify-between gap-6">
                <div className="space-y-3 z-10 max-w-xl">
                  <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100/80 px-3 py-1 rounded-full text-indigo-650 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>O'qituvchi Boshqaruv Paneli</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16193E] tracking-tight">
                    Xush kelibsiz, <span className="text-indigo-600">{userInfo?.first_name || "O'qituvchi"}</span>!
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
                    O'quvchilaringiz dars vazifalari hamda o'zlashtirish ko'rsatkichlarining <span className="text-emerald-600 font-bold">{computedCompletionRate}%</span> ini bajarishdi. Natijalar <span className="text-indigo-600 font-bold">juda yaxshi!</span>
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTeacherTab("journal")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-md shadow-indigo-500/20 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Jurnalni Ochish</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTodayLessonsModal(true)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Darslar ({todayLessons.length})</span>
                    </button>
                  </div>
                </div>

                {/* Hero Graphic Card */}
                <div className="relative shrink-0 w-48 h-36 sm:w-64 sm:h-44 flex items-center justify-center bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-indigo-100/50">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 transform -rotate-6">
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <div className="absolute top-3 right-4 w-9 h-9 rounded-2xl bg-amber-400 text-white flex items-center justify-center shadow-lg transform rotate-12">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="absolute bottom-4 left-4 w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg transform -rotate-12">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Dashboard Main Grid (1. Classes & Subjects at top, 2. Today's Lessons & 3. Pending Approvals on side) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1. Boshqarayotgan Sinflarim va Fanlarim (Top section in left col) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white border border-zinc-200/70 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#16193E]">Boshqarayotgan Sinflarim va Fanlarim</h3>
                        <p className="text-[11px] text-zinc-400 font-medium">Boshqarish uchun sinf ustiga bosing</p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl">
                        Jami: {classes.length} ta sinf
                      </span>
                    </div>

                    <div className="space-y-3">
                      {classes.length > 0 ? (
                        classes.map((cls, i) => {
                          const badges = ["A1", "B1", "C2", "A2", "B2"];
                          const badgeColor = i % 3 === 0 ? "bg-amber-100 text-amber-800" : i % 3 === 1 ? "bg-rose-100 text-rose-800" : "bg-purple-100 text-purple-800";
                          return (
                            <div
                              key={cls.id}
                              onClick={() => {
                                setSelectedClassId(cls.id);
                                if (cls.subject_id) {
                                  setSelectedSubjectId(cls.subject_id);
                                }
                                setJournalDate(selectedDashboardDate);
                                setTeacherTab("journal");
                                fetchJournalData(selectedDashboardDate);
                              }}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-zinc-50/70 hover:bg-indigo-50/50 border border-zinc-200/60 transition cursor-pointer gap-3"
                            >
                              <div className="flex items-center space-x-3">
                                <span className={`w-10 h-10 rounded-xl ${badgeColor} font-extrabold text-xs flex items-center justify-center shrink-0`}>
                                  {badges[i % badges.length]}
                                </span>
                                <div>
                                  <h4 className="text-xs font-extrabold text-[#16193E] flex items-center gap-1.5">
                                    {cls.name}
                                    {cls.is_main_teacher && (
                                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Award className="w-3 h-3 text-amber-600" />
                                        <span>Sinf Rahbari</span>
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-[11px] text-zinc-500 font-medium">
                                    {cls.subject_name || "Asosiy Fan"} — O'quvchilar: {allStudents.filter(s => s.class_id === cls.id).length || 25} ta
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4 text-xs font-semibold text-zinc-500">
                                <span className="flex items-center space-x-1 text-emerald-600 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>Faol Jurnal</span>
                                </span>
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-xs text-zinc-400 font-medium border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                          Sinflar biriktirilmagan
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Today's Date Badge + Today's Lessons Card + Pending Approvals */}
                <div className="lg:col-span-4 space-y-6">
                  {/* 1. Interactive Dashboard Date Picker Card */}
                  <div className="bg-white border border-zinc-200/70 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-3 relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 relative overflow-hidden group cursor-pointer">
                        <Calendar className="w-5 h-5" />
                        <input
                          type="date"
                          value={selectedDashboardDate}
                          onChange={(e) => setSelectedDashboardDate(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          title="Sana tanlash"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-zinc-400 uppercase font-mono block">Sana Tanlash</span>
                        <div className="relative inline-flex items-center gap-1.5 cursor-pointer">
                          <h4 className="text-sm font-extrabold text-[#16193E]">
                            {(() => {
                              const d = new Date(selectedDashboardDate + "T00:00:00");
                              const mNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
                              return `${d.getDate()}-${mNames[d.getMonth()]}, ${d.getFullYear()}`;
                            })()}
                          </h4>
                          <input
                            type="date"
                            value={selectedDashboardDate}
                            onChange={(e) => setSelectedDashboardDate(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            title="Sana tanlash"
                          />
                        </div>
                      </div>
                    </div>

                    {selectedDashboardDate === new Date().toISOString().split("T")[0] ? (
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                        Bugun
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedDashboardDate(new Date().toISOString().split("T")[0])}
                        className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1 rounded-full shrink-0 transition cursor-pointer"
                      >
                        Bugunga qaytish
                      </button>
                    )}
                  </div>

                  {/* 2. Darslar Card & Button */}
                  <div className="bg-white border border-zinc-200/70 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-[#16193E]">Darslar</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTodayLessonsModal(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-xl"
                      >
                        <span>Darslar ({todayLessons.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {todayLessons.length > 0 ? (
                        todayLessons.slice(0, 5).map((lesson, idx) => {
                          const borderAccents = ["bg-orange-500", "bg-indigo-600", "bg-emerald-500", "bg-purple-500"];
                          const accentColor = borderAccents[idx % borderAccents.length];

                          return (
                            <div
                              key={idx}
                              onClick={() => handleSelectLessonAndGoToJournal(lesson)}
                              className="bg-white border border-zinc-200/80 rounded-2xl p-3.5 shadow-2xs relative overflow-hidden flex items-center justify-between transition hover:border-indigo-400 hover:shadow-xs cursor-pointer group"
                              title="Jurnalni ochish va baholash"
                            >
                              <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${accentColor}`} />
                              <div className="pl-2 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-extrabold text-[#16193E] tracking-tight group-hover:text-indigo-600 transition">{lesson.subject_name}</h4>
                                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-md">
                                    {lesson.lesson_number}-soat
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 font-semibold">
                                  {lesson.class_name} • {lesson.time}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition">
                                <span>Jurnal</span>
                                <ChevronRight className="w-4 h-4 text-indigo-600 transition shrink-0" />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-xs text-zinc-400 font-medium bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                          Ushbu sanada darslar mavjud emas
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Tasdiqlash Kutilmoqda */}
                  <div className="bg-white border border-zinc-200/70 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#16193E]">Tasdiqlash Kutilmoqda</h3>
                      <button
                        type="button"
                        onClick={() => setTeacherTab("unapproved")}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                      >
                        Barchasi ({unapprovedGrades.length})
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {unapprovedGrades.length > 0 ? (
                        unapprovedGrades.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            onClick={() => setTeacherTab("unapproved")}
                            className="p-3 rounded-2xl bg-zinc-50 hover:bg-rose-50/40 border border-zinc-200/60 transition flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                                <Lock className="w-4 h-4 text-amber-700" />
                              </div>
                              <div className="truncate">
                                <h4 className="text-xs font-bold text-zinc-800 truncate">{item.subject_name || "Baho"}</h4>
                                <p className="text-[10px] text-zinc-500 truncate">{item.student_name || "O'quvchi"}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-2xl bg-zinc-50 text-center text-xs text-zinc-400 font-medium flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Barcha baholar tasdiqlangan</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Grading Journal — Daily Grid */}
          {teacherTab === "journal" && (
            (selectedClassId ? (
              <div className="space-y-6">
                {/* Compact Low-Height Header Bar */}
                {(() => {
                  const clsName = classes.find(c => c.id === selectedClassId)?.name || "";
                  const subjObj = selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId) : null;
                  const subjName = subjObj ? subjObj.name : "Fanni tanlang";
                  
                  const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
                  const dateObj = new Date(journalDate + 'T00:00:00');
                  const dayName = !isNaN(dateObj.getTime()) ? days[dateObj.getDay()] : "";

                  return (
                    <div className="bg-white border border-zinc-200/70 rounded-2xl sm:rounded-3xl px-5 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                      {/* Left: Class Info & Single Prominent Subject Badge */}
                      <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Kunlik Jurnal</span>
                          <span className="text-zinc-300 font-light">•</span>
                          <span className="text-xs font-extrabold text-[#16193E]">{clsName ? `${clsName} sinfi` : "Sinf"}</span>
                        </div>

                        <span className="text-zinc-300 font-light hidden sm:inline">•</span>

                        {/* Single Prominent Subject Name */}
                        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/80 px-3.5 py-1 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0"></span>
                          <span className="text-sm sm:text-base font-extrabold text-indigo-900 tracking-tight">
                            {subjName}
                          </span>
                          {selectedLessonNumber ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md ml-1">
                              {selectedLessonNumber}-soat
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Right: Date & Category Badges */}
                      <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500">
                        <button
                          type="button"
                          onClick={() => {
                            setTeacherCalendarTarget("journal");
                            setIsTeacherCalendarOpen(true);
                          }}
                          className="bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700 px-3 py-1 rounded-xl flex items-center gap-1.5 font-medium transition cursor-pointer"
                          title="Sana tanlash (Smart Calendar)"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#5B50EC]" />
                          <span>{journalDate} {dayName ? `(${dayName})` : ""}</span>
                        </button>
                        <span className="bg-purple-50 text-purple-700 border border-purple-100/80 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                          {selectedGradeCategory === "DAILY" ? "Kundalik" : selectedGradeCategory === "QUARTERLY_EXAM" ? "🏆 Choraklik" : "🎓 Imtihon"}
                        </span>
                        <span className="text-zinc-400 font-mono text-[11px] hidden lg:inline">
                          ({students.length} ta o'quvchi)
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Holiday Warning Banner */}
                {(() => {
                  const activeHoliday = holidays.find(h => {
                    const hDate = h.holiday_date ? new Date(h.holiday_date).toISOString().split('T')[0] : '';
                    return hDate === journalDate;
                  });
                  if (activeHoliday) {
                    return (
                      <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-center space-x-3 text-xs font-semibold animate-fadeIn mb-4">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <p className="font-bold">Dam olish kuni: {activeHoliday.name}</p>
                          <p className="text-[10px] text-red-600 mt-0.5">Bugun maktab admini tomonidan dam olish kuni deb belgilangan. Jurnalda baho qo'yish imkoniyati bloklanadi.</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Journal Grid Container Card */}
                {journalLoading ? (
                  <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : !selectedSubjectId ? (
                  (() => {
                    const isScheduleEmpty = classSchedule.length === 0 || classSchedule.every(item => item.subject_id === 0 || !item.subject_id);
                    if (isScheduleEmpty) {
                      return (
                        <div className="text-center py-16 bg-white border border-dashed border-red-200 rounded-3xl animate-fadeIn">
                          <p className="text-sm text-red-650 font-bold mb-1">Dars jadvali hali qo'shilmagan</p>
                          <p className="text-xs text-zinc-400 font-mono">
                            Dars baholarini ko'rish va kiritish uchun birinchi navbatda haftalik dars jadvalini kiriting.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl">
                        <p className="text-sm text-[#16193E] font-extrabold mb-1">Fanni tanlang</p>
                        <p className="text-xs text-zinc-400 font-medium">Dars baholarini ko'rish va kiritish uchun pastdagi panel orqali fanni tanlang.</p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-white border border-zinc-200/70 rounded-3xl shadow-xs overflow-hidden animate-fadeIn">
                    {/* Grid legend row */}
                    <div className="px-6 py-4 bg-[#fafafa] border-b border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 text-zinc-800">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[10px] font-extrabold text-[#16193E] uppercase tracking-widest font-mono">
                          {selectedLessonNumber ? `${selectedLessonNumber}-SOAT ` : ""}BAHOLAR JURNALI
                        </span>

                        {(() => {
                          const hasApprovedOrAnyGradesForToday = journalAllGrades.some(g => {
                            const gDate = g.grade_date ? (typeof g.grade_date === 'string' ? g.grade_date.split('T')[0] : new Date(g.grade_date).toISOString().split('T')[0]) : '';
                            return g.subject_id === Number(selectedSubjectId) &&
                                   g.lesson_number === Number(selectedLessonNumber) &&
                                   gDate === journalDate;
                          });

                          return (
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Kategoriya:</span>
                              <select
                                value={selectedGradeCategory}
                                onChange={(e) => setSelectedGradeCategory(e.target.value)}
                                disabled={hasApprovedOrAnyGradesForToday}
                                className={`bg-zinc-150 border-none rounded-md px-2 py-0.5 text-[9px] font-bold text-zinc-700 outline-none transition text-center ${
                                  hasApprovedOrAnyGradesForToday 
                                    ? 'opacity-65 cursor-not-allowed bg-zinc-200' 
                                    : 'bg-zinc-150 hover:bg-zinc-200 cursor-pointer'
                                }`}
                                title={hasApprovedOrAnyGradesForToday ? "Ushbu darsda baholar kiritilgani sababli kategoriyani o'zgartirib bo'lmaydi" : ""}
                              >
                                <option value="DAILY">Kundalik</option>
                                <option value="QUARTERLY_EXAM">🏆 Choraklik</option>
                                <option value="SEMESTER_EXAM">🎓 Imtihon</option>
                              </select>
                            </div>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => {
                            const name = prompt("Yangi baholash turi nomini kiriting (masalan: Uyga vazifa, Mustaqil ish):");
                            if (name) {
                              handleAddJournalColumn(name);
                            }
                          }}
                          className="bg-[#5B50EC] hover:bg-indigo-700 text-white font-semibold text-[9px] py-1 px-2.5 rounded-md transition cursor-pointer"
                        >
                          + Yangi baho turi
                        </button>

                        {journalColumns.filter(c => !["ATTENDANCE", "BEHAVIOR", "MASTERY"].includes(c.id)).length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const customCols = journalColumns.filter(c => !["ATTENDANCE", "BEHAVIOR", "MASTERY"].includes(c.id));
                              const names = customCols.map(c => c.name).join(", ");
                              const toRemove = prompt(`O'chirmoqchi bo'lgan baholash turi nomini kiriting (${names}):`);
                              if (toRemove) {
                                const found = customCols.find(c => c.name.toLowerCase() === toRemove.trim().toLowerCase());
                                if (found) {
                                  setTeacherDialog({
                                    isOpen: true,
                                    type: "danger",
                                    title: "Ustunni o'chirish",
                                    message: `Haqiqatan ham "${found.name}" ustunini o'chirmoqchimisiz?`,
                                    confirmText: "Ha, o'chirish",
                                    onConfirm: () => {
                                      setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
                                      handleRemoveJournalColumn(found.id);
                                    },
                                  });
                                } else {
                                  setTeacherDialog({
                                    isOpen: true,
                                    type: "alert",
                                    title: "Topilmadi",
                                    message: "Bunday baholash turi topilmadi.",
                                    confirmText: "OK",
                                    onConfirm: () => setTeacherDialog((prev) => ({ ...prev, isOpen: false })),
                                  });
                                }
                              }
                            }}
                            className="bg-red-50 hover:bg-red-105 border border-red-200 text-red-600 font-semibold text-[9px] py-1 px-2.5 rounded-md transition cursor-pointer"
                          >
                            O'chirish
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[calc(100vh-310px)] sm:max-h-[calc(100vh-280px)] overflow-y-auto rounded-b-3xl">
                      <table className="min-w-full divide-y divide-zinc-200 text-left border-separate border-spacing-0">
                        <thead className="bg-[#fafafa] text-[9px] sm:text-[10px] font-bold text-zinc-450 uppercase tracking-wider sticky top-0 z-30 shadow-xs">
                          <tr>
                            <th className="px-2.5 py-2.5 sm:px-4 sm:py-4 w-10 sm:w-12 text-center font-mono sticky top-0 left-0 z-40 bg-[#fafafa] border-b border-zinc-200">№</th>
                            <th className="px-2.5 py-2.5 sm:px-4 sm:py-4 sticky top-0 left-[40px] sm:left-[48px] z-40 bg-[#fafafa] border-b border-zinc-200 min-w-[120px] sm:min-w-[140px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]">O'quvchi ismi</th>
                            {journalColumns.map((col) => (
                              <th key={col.id} className="px-3 py-2.5 sm:px-6 sm:py-4 text-center border-b border-zinc-200 sticky top-0 z-30 bg-[#fafafa]">
                                <div>{col.name}</div>
                                {col.id !== "ATTENDANCE" && (() => {
                                  const hasGradesInThisColumn = journalAllGrades.some(g => {
                                    const gDate = g.grade_date ? (typeof g.grade_date === 'string' ? g.grade_date.split('T')[0] : new Date(g.grade_date).toISOString().split('T')[0]) : '';
                                    return g.subject_id === Number(selectedSubjectId) &&
                                           g.lesson_number === Number(selectedLessonNumber) &&
                                           g.grade_type === col.id &&
                                           gDate === journalDate;
                                  });

                                  return (
                                    <div className="flex flex-col items-center mt-1">
                                      <select
                                        value={
                                          columnGradingSystems[col.id] ||
                                          (col.id === "BEHAVIOR"
                                            ? String(
                                                gradingSystemsList.find(
                                                  (gs) =>
                                                    gs.name.toLowerCase().includes("xulq") ||
                                                    gs.name.toLowerCase().includes("behavior") ||
                                                    gs.type === "BEHAVIOR" ||
                                                    gs.code === "BEHAVIOR"
                                                )?.id || ""
                                              )
                                            : "")
                                        }
                                        onChange={(e) => handleColumnGradingSystemChange(col.id, e.target.value)}
                                        disabled={hasGradesInThisColumn}
                                        className={`border border-zinc-200 rounded-md px-1.5 py-0.5 text-[8px] font-bold text-zinc-650 outline-none transition text-center max-w-[100px] ${
                                          hasGradesInThisColumn 
                                            ? 'opacity-65 cursor-not-allowed bg-zinc-200' 
                                            : 'bg-zinc-100 hover:bg-zinc-150 cursor-pointer'
                                        }`}
                                        title={hasGradesInThisColumn ? "Ushbu ustunda baholar kiritilgani sababli baholash tizimini o'zgartirib bo'lmaydi" : ""}
                                      >
                                        <option value="">Oddiy tizim</option>
                                        {gradingSystemsList.map(gs => (
                                          <option key={gs.id} value={gs.id}>{gs.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                })()}
                              </th>
                            ))}
                            <th className="px-3 py-2.5 sm:px-4 sm:py-4 text-center border-b border-zinc-200 sticky top-0 z-30 bg-[#fafafa] w-12 sm:w-16">
                              <div className="flex items-center justify-center gap-1 text-[9px] text-zinc-400 font-extrabold uppercase" title="Baho izohlari">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Izoh</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
            <tbody className="divide-y divide-zinc-100 text-xs bg-white">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3 + journalColumns.length} className="px-6 py-10 text-center text-zinc-450 italic font-mono">
                    Bu sinfda o'quvchilar topilmadi.
                  </td>
                </tr>
              ) : (
                students.map((st, idx) => {
                  const attKey = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_ATTENDANCE`;
                  const attendanceVal = cellInputs[attKey] || "+";

                  return (
                    <tr key={st.id} className={`hover:bg-zinc-50/50 transition ${attendanceVal === "-" ? "opacity-60 bg-zinc-50/30" : ""}`}>
                      {/* No. */}
                      <td className="px-2.5 py-2.5 sm:px-4 sm:py-4 text-center font-mono text-zinc-400 text-xs font-semibold sticky left-0 z-10 bg-white border-b border-zinc-100">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      
                      {/* Student Name */}
                      <td className="px-2.5 py-2.5 sm:px-4 sm:py-4 font-bold text-zinc-800 text-xs sm:text-sm whitespace-nowrap sticky left-[40px] sm:left-[48px] z-10 bg-white border-b border-zinc-100 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                        {st.first_name} {st.last_name}
                      </td>
                      
                      {/* Columns */}
                      {journalColumns.map((col) => {
                        const key = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_${col.id}`;
                        const cellVal = cellInputs[key] || "";
                        const grade = findGradeForDayAndType(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), col.id);
                        const isApproved = grade?.status === 'approved';
                        const isParentApproved = grade?.approved_by_parent;
                        const isSaving = cellSaving === key;
                        const isHoliday = holidays.some(h => {
                          const hDate = h.holiday_date ? new Date(h.holiday_date).toISOString().split('T')[0] : '';
                          return hDate === journalDate;
                        });

                        return (
                          <td key={col.id} className="px-6 py-3 text-center">
                            <div className="relative inline-block group">
                              {grade && !isApproved && (
                                <input
                                  type="checkbox"
                                  checked={selectedGradeIds.has(grade.id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedGradeIds(prev => {
                                      const next = new Set(prev);
                                      if (checked) {
                                        next.add(grade.id);
                                      } else {
                                        next.delete(grade.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="absolute -left-6 top-2.5 w-3 h-3 text-[#5B50EC] border-zinc-300 rounded focus:ring-0 cursor-pointer z-20"
                                  title="Tasdiqlash uchun tanlash"
                                />
                              )}

                              {col.id === "ATTENDANCE" ? (
                                <select
                                  value={cellVal}
                                  onChange={(e) => handleCellSave(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), "ATTENDANCE", e.target.value)}
                                  disabled={isSaving || isApproved || isHoliday}
                                  className={`w-14 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer
                                    ${cellVal === "+" ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
                                      cellVal === "-" ? "bg-red-50 border-red-300 text-red-700" :
                                      "bg-amber-50 border-amber-300 text-amber-700"
                                    }
                                  `}
                                >
                                  <option value="+">+</option>
                                  <option value="-">-</option>
                                  <option value="k">k</option>
                                </select>
                              ) : (() => {
                                const colGSId = columnGradingSystems[col.id];
                                const colGS = gradingSystemsList.find(gs => gs.id === colGSId);
                                if (colGS) {
                                  let options: { label: string; numeric_value?: number }[] = [];
                                  if (colGS.options) {
                                    try {
                                      options = typeof colGS.options === 'string' ? JSON.parse(colGS.options) : colGS.options;
                                    } catch (e) {
                                      console.error("Failed to parse options", e);
                                    }
                                  }
                                  if (Array.isArray(options) && options.length > 0) {
                                    return (
                                      <select
                                        value={cellVal}
                                        onChange={(e) => handleCellSave(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), col.id, e.target.value)}
                                        disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                        className={`w-16 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer bg-white border-zinc-300 text-zinc-800
                                          ${attendanceVal === "-" ? "bg-zinc-100/50 cursor-not-allowed text-zinc-300 border-zinc-200" : ""}
                                        `}
                                      >
                                        <option value="">—</option>
                                        {options.map((opt, oidx) => (
                                          <option key={oidx} value={opt.label}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  }
                                              
                                              return (
                                                <input
                                                  type="text"
                                                  value={cellVal}
                                                  onChange={(e) => setCellInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      e.preventDefault();
                                                      handleCellSave(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), col.id, cellVal);
                                                    }
                                                  }}
                                                  onBlur={() => {
                                                    handleCellSave(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), col.id, cellVal);
                                                  }}
                                                  disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                                  placeholder={`${colGS.min_value !== undefined && colGS.max_value !== undefined ? `${colGS.min_value}-${colGS.max_value}` : "—"}`}
                                                  className={`w-16 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500
                                                    ${isSaving ? 'border-indigo-400 animate-pulse bg-indigo-50/30' : 'bg-white border-zinc-300 text-zinc-800'}
                                                    ${attendanceVal === "-" ? "bg-zinc-100/50 cursor-not-allowed text-zinc-300 border-zinc-200" : ""}
                                                  `}
                                                />
                                              );
                                            }

                                            if (col.id === "BEHAVIOR") {
                                              return (
                                                <select
                                                  value={cellVal || "0"}
                                                  onChange={(e) => handleCellSave(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), "BEHAVIOR", e.target.value)}
                                                  disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                                  className={`w-16 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer
                                                    ${(cellVal || "0") === "0" ? "bg-zinc-50 border-zinc-300 text-zinc-700" :
                                                      Number(cellVal) > 0 ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
                                                      "bg-red-50 border-red-300 text-red-700"
                                                    }
                                                  `}
                                                >
                                                  <option value="5">+5</option>
                                                  <option value="4">+4</option>
                                                  <option value="3">+3</option>
                                                  <option value="2">+2</option>
                                                  <option value="1">+1</option>
                                                  <option value="0">0</option>
                                                  <option value="-1">-1</option>
                                                  <option value="-2">-2</option>
                                                  <option value="-3">-3</option>
                                                  <option value="-4">-4</option>
                                                  <option value="-5">-5</option>
                                                </select>
                                              );
                                            }

                                            return (
                                              <input
                                                type="text"
                                                value={cellVal}
                                                onChange={(e) => setCellInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCellSave(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), col.id, cellVal);
                                                  }
                                                }}
                                                onBlur={() => {
                                                  handleCellSave(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), col.id, cellVal);
                                                }}
                                                disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                                placeholder="—"
                                                className={`w-16 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500
                                                  ${isSaving ? 'border-indigo-400 animate-pulse bg-indigo-50/30' : 'bg-white border-zinc-300 text-zinc-800'}
                                                  ${attendanceVal === "-" ? "bg-zinc-100/50 cursor-not-allowed text-zinc-300 border-zinc-200" : ""}
                                                `}
                                              />
                                            );
                                          })()}

                                          {/* Status badges */}
                                          {isApproved && (
                                            <span 
                                              className="absolute -right-2 -top-2 bg-white border border-zinc-200 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] shadow-sm select-none z-20"
                                              title="Baho tasdiqlangan"
                                            >
                                              🔒
                                            </span>
                                          )}
                                          {!isApproved && isParentApproved && (
                                            <span 
                                              className="absolute -right-2 -top-2 bg-white border border-teal-200 text-teal-600 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-extrabold shadow-sm select-none z-20"
                                              title="Ota-ona ko'rdi"
                                            >
                                              ✓
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}

                                  {/* Action: Comment Button Column */}
                                  {(() => {
                                    const studentGrades = journalColumns
                                      .filter(col => col.id !== "ATTENDANCE")
                                      .map(col => {
                                        const key = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_${col.id}`;
                                        const grade = findGradeForDayAndType(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), col.id);
                                        const val = (cellInputs[key] !== undefined ? cellInputs[key] : (grade ? grade.value : "")).trim();
                                        return {
                                          colId: col.id,
                                          colName: col.name,
                                          value: val,
                                          grade,
                                          key,
                                        };
                                      })
                                      .filter(item => item.value !== "" && item.value !== "—");

                                    const hasAnyGrade = studentGrades.length > 0;

                                    return (
                                      <td className="px-3 py-3 text-center border-b border-zinc-100">
                                        <button
                                          type="button"
                                          disabled={!hasAnyGrade}
                                          onClick={() => handleOpenStudentCommentModal(st, studentGrades)}
                                          title={hasAnyGrade ? "Izoh yozish / ko'rish" : "Izoh yozish uchun avval baho qo'ying"}
                                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition mx-auto ${
                                            hasAnyGrade
                                              ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                              : "bg-zinc-100 text-zinc-300 border border-transparent cursor-not-allowed opacity-40"
                                          }`}
                                        >
                                          <MessageSquare className="w-4 h-4" />
                                        </button>
                                      </td>
                                    );
                                  })()}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Footer hint */}
                    <div className="px-5 py-3 border-t border-zinc-150 bg-zinc-50 flex items-center justify-between">
                      <p className="text-[10px] text-zinc-400 font-mono">
                        O'zgarishlar kiritilganda avtomatik saqlanadi.
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {journalAllGrades.filter(g => {
                          const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
                          return gDate === journalDate && g.subject_id === Number(selectedSubjectId);
                        }).length} ta baho kiritilgan
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs my-12">
                  <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xs">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h2 className="text-base font-bold text-zinc-800 tracking-tight mb-2">SINF JURNALI (BAHOLASH)</h2>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    Baholash va darslarni kiritish uchun pastdagi floating panel orqali kerakli sinf va fanni tanlang.
                  </p>
                </div>
              ))
            )}

            {/* TAB CONTENT: Class Schedule */}
            {teacherTab === "schedule" && (
              <div className="space-y-6 pb-40">
                <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100/80 pb-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3.5 py-1 rounded-full text-indigo-700 text-xs font-bold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>
                          {!selectedClassId
                            ? "🌐 Mening Shaxsiy Dars Jadvalim (Umumiy)"
                            : isMainTeacherOfClass()
                            ? `⭐ Sinf Rahbari: ${classes.find(c => c.id === selectedClassId)?.name || "Sinf"} Haftalik Dars Jadvali`
                            : `📚 ${classes.find(c => c.id === selectedClassId)?.name || "Sinf"} Dars Jadvali (Fan o'qituvchisi ko'rinishi)`}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">
                        {!selectedClassId
                          ? "Siz dars beradigan barcha sinflarning haftalik rejasi. Bir xil vaqtda 2 ta sinf darsi bo'lsa, sariq rang bilan ziddiyat ko'rsatiladi."
                          : isMainTeacherOfClass()
                          ? "Sinfingizdagi barcha fanlar va dars jadvali."
                          : "Ushbu sinfda siz kiradigan darslar alohida ta'kidlab ko'rsatilgan."}
                      </p>
                    </div>

                    {/* Quick Header Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2">
                      {selectedClassId && (isMainTeacherOfClass() || userInfo?.role === "ADMIN") && (
                        <button
                          type="button"
                          onClick={() => {
                            const initialFormState: { [key: string]: number } = {};
                            for (let d = 1; d <= 6; d++) {
                              for (let l = 1; l <= 8; l++) {
                                initialFormState[`${d}-${l}`] = 0;
                              }
                            }
                            classSchedule.forEach((item) => {
                              if (item.subject_id > 0) {
                                initialFormState[`${item.day_of_week}-${item.lesson_number}`] = item.subject_id;
                              }
                            });
                            setActionError("");

                            const currentPeriod = schedulePeriods.find((p: any) => scheduleViewDate >= p.start_date && scheduleViewDate <= p.end_date) || schedulePeriods[0];
                            const activeStart = currentPeriod?.start_date || (classSchedule.length > 0 && classSchedule[0].start_date) || "2026-09-01";
                            const activeEnd = currentPeriod?.end_date || (classSchedule.length > 0 && classSchedule[0].end_date) || "2027-05-31";
                            setEditingScheduleOriginalStartDate(activeStart);
                            setScheduleStartDate(activeStart);
                            setScheduleEndDate(activeEnd);

                            setShowEditScheduleModal(true);
                          }}
                          className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-2xs hover:scale-105"
                          title="Sinf haftalik dars jadvalini tahrirlash"
                        >
                          <Pencil className="w-3.5 h-3.5 text-white" />
                          <span>Jadvalni tahrirlash</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          exceptionsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                        title="Pastdagi o'zgarishlar jadvaliga silliq tushish"
                      >
                        <span>O'zgarishlarni ko'rish ({scheduleExceptions.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Schedule Periods / Quarters Filter Bar */}
                  {selectedClassId && (
                    <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-extrabold text-[#16193E] uppercase font-mono tracking-wider flex items-center gap-1.5 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Dars Jadvali Davrlari (Choraklar):</span>
                        </span>

                        {schedulePeriods.length === 0 ? (
                          <span className="text-xs text-zinc-500 font-medium italic">Hali davrlar belgilanmagan</span>
                        ) : (
                          schedulePeriods.map((period: any, pIdx: number) => {
                            const isCurrentActive = scheduleViewDate >= period.start_date && scheduleViewDate <= period.end_date;
                            return (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  setScheduleViewDate(period.start_date);
                                  fetchClassSchedule(period.start_date);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                                  isCurrentActive
                                    ? "bg-[#5B50EC] text-white shadow-xs scale-105"
                                    : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                                }`}
                              >
                                <span>{pIdx + 1}-chorak/davr:</span>
                                <span className="font-mono text-[11px]">{period.start_date} — {period.end_date}</span>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {(isMainTeacherOfClass() || userInfo?.role === "ADMIN") && (
                        <button
                          type="button"
                          onClick={() => {
                            const initialFormState: { [key: string]: number } = {};
                            for (let d = 1; d <= 6; d++) {
                              for (let l = 1; l <= 8; l++) {
                                initialFormState[`${d}-${l}`] = 0;
                              }
                            }
                            setScheduleFormState(initialFormState);
                            setActionError("");
                            setEditingScheduleOriginalStartDate(""); // Brand new period

                            if (schedulePeriods.length > 0) {
                              const sorted = [...schedulePeriods].sort((a, b) => a.end_date.localeCompare(b.end_date));
                              const lastPeriod = sorted[sorted.length - 1];
                              if (lastPeriod && lastPeriod.end_date) {
                                const nextStart = new Date(lastPeriod.end_date + "T00:00:00");
                                nextStart.setDate(nextStart.getDate() + 1);
                                const nextEnd = new Date(nextStart);
                                nextEnd.setMonth(nextEnd.getMonth() + 2);
                                const yyyy1 = nextStart.getFullYear();
                                const mm1 = String(nextStart.getMonth() + 1).padStart(2, '0');
                                const dd1 = String(nextStart.getDate()).padStart(2, '0');
                                const yyyy2 = nextEnd.getFullYear();
                                const mm2 = String(nextEnd.getMonth() + 1).padStart(2, '0');
                                const dd2 = String(nextEnd.getDate()).padStart(2, '0');
                                setScheduleStartDate(`${yyyy1}-${mm1}-${dd1}`);
                                setScheduleEndDate(`${yyyy2}-${mm2}-${dd2}`);
                              } else {
                                setScheduleStartDate("2026-09-01");
                                setScheduleEndDate("2026-10-24");
                              }
                            } else {
                              setScheduleStartDate("2026-09-01");
                              setScheduleEndDate("2026-10-24");
                            }
                            setShowEditScheduleModal(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                          title="Yangi chorak yoki vaqt oralig'i dars jadvalini qo'shish"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Yangi Davr Jadvali Qo'shish</span>
                        </button>
                      )}
                    </div>
                  )}

                  {!selectedClassId ? (
                    /* OVERALL TEACHER SCHEDULE VIEW */
                    overallScheduleLoading ? (
                      <div className="text-center py-10">
                        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white shadow-xs">
                        <table className="min-w-full divide-y divide-zinc-200/70 text-center table-fixed">
                          <thead className="bg-[#fafafa] text-[10px] sm:text-xs font-extrabold text-[#16193E] uppercase tracking-wider">
                            <tr>
                              <th className="px-3 py-3 w-16 text-center bg-[#fafafa]">Soat</th>
                              <th className="px-3 py-3">Dushanba</th>
                              <th className="px-3 py-3">Seshanba</th>
                              <th className="px-3 py-3">Chorshanba</th>
                              <th className="px-3 py-3">Payshanba</th>
                              <th className="px-3 py-3">Juma</th>
                              <th className="px-3 py-3">Shanba</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                              <tr key={period} className="hover:bg-indigo-50/20 transition">
                                <td className="px-2.5 py-3 font-mono font-bold text-zinc-400 bg-[#fafafa]">
                                  {period}-dars
                                </td>
                                {[1, 2, 3, 4, 5, 6].map((day) => {
                                  const items = overallSchedule[`${day}-${period}`] || [];
                                  const hasConflict = items.length >= 2;

                                  return (
                                    <td key={day} className="px-2 py-2 border-l border-zinc-100 align-middle">
                                      {items.length === 0 ? (
                                        <span className="text-zinc-300 italic text-xs font-mono">-</span>
                                      ) : hasConflict ? (
                                        <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 p-2 rounded-xl text-center shadow-xs">
                                          <span className="text-[9px] font-black uppercase text-amber-800 tracking-tight block">⚠️ 2 TA DARS ZIDDIYATI</span>
                                          {items.map((it, idx) => (
                                            <div key={idx} className="text-[10px] font-black text-amber-950 border-t border-amber-300/60 pt-0.5 mt-0.5">
                                              {it.class_name} — {it.subject_name}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="bg-indigo-50/90 border border-indigo-200/80 p-2 rounded-xl text-center shadow-2xs">
                                          <span className="text-[10px] font-black text-indigo-700 block font-mono uppercase">{items[0].class_name}</span>
                                          <span className="text-[11px] font-black text-zinc-900 block">{items[0].subject_name}</span>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    /* SPECIFIC CLASS SCHEDULE VIEW */
                    classScheduleLoading ? (
                      <div className="text-center py-10">
                        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white shadow-xs">
                        <table className="min-w-full divide-y divide-zinc-200/70 text-center table-fixed">
                          <thead className="bg-[#fafafa] text-[10px] sm:text-xs font-extrabold text-[#16193E] uppercase tracking-wider">
                            <tr>
                              <th className="px-3 py-3 w-16 text-center bg-[#fafafa]">Soat</th>
                              <th className="px-3 py-3">Dushanba</th>
                              <th className="px-3 py-3">Seshanba</th>
                              <th className="px-3 py-3">Chorshanba</th>
                              <th className="px-3 py-3">Payshanba</th>
                              <th className="px-3 py-3">Juma</th>
                              <th className="px-3 py-3">Shanba</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                              <tr key={period} className="hover:bg-indigo-50/20 transition">
                                <td className="px-2.5 py-3 font-mono font-bold text-zinc-400 bg-[#fafafa]">
                                  {period}-dars
                                </td>
                                {[1, 2, 3, 4, 5, 6].map((day) => {
                                  const lesson = classSchedule.find(
                                    (item) => item.day_of_week === day && item.lesson_number === period
                                  );

                                  const isMyClass = isMainTeacherOfClass();
                                  const isMyTaughtSubject = lesson && classTeachers.some(ct => ct.teacher_id === userInfo?.id && ct.subject_id === lesson.subject_id);

                                  return (
                                    <td key={day} className="px-2.5 py-3 border-l border-zinc-100 align-middle">
                                      {lesson ? (
                                        lesson.subject_id === 0 || lesson.subject_name === "Bekor qilingan" ? (
                                          <span className="text-red-500 font-bold line-through block italic text-xs">
                                            Bekor qilingan
                                          </span>
                                        ) : isMyClass ? (
                                          /* Main Teacher View: Full details */
                                          <span className="text-zinc-900 font-extrabold block text-xs">
                                            {lesson.subject_name}
                                          </span>
                                        ) : isMyTaughtSubject ? (
                                          /* Subject Teacher View: My own lesson in this class */
                                          <div className="bg-emerald-50 border-2 border-emerald-300 p-2 rounded-xl text-center shadow-2xs">
                                            <span className="text-[9px] font-black text-emerald-600 uppercase block tracking-wider font-mono">Darsim</span>
                                            <span className="text-xs font-black text-emerald-950 block">{lesson.subject_name}</span>
                                          </div>
                                        ) : (
                                          /* Subject Teacher View: Another teacher's lesson */
                                          <div className="bg-zinc-50/90 border border-zinc-200/80 p-2 rounded-xl text-center">
                                            <span className="text-xs font-bold text-zinc-700 block">{lesson.subject_name}</span>
                                          </div>
                                        )
                                      ) : (
                                        <span className="text-zinc-300 italic text-xs font-mono">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>

                {/* Exceptions manager */}
                <div ref={exceptionsSectionRef} className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#16193E]">Kunlik Dars Jadvali O'zgarishlari</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-1">Sinf o'qituvchisi yoki fan o'qituvchilari tomonidan kiritilgan bir martalik dars qo'shimchalari yoki bekor qilishlar.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExcDate(new Date().toISOString().split("T")[0]);
                        setExcLesson(1);
                        setExcType("replace");
                        setExcSubjectId("");
                        setActionError("");
                        setShowAddExceptionModal(true);
                      }}
                      className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                    >
                      <span>+ O'zgarish kiritish</span>
                    </button>
                  </div>

                  {scheduleExceptionsLoading ? (
                    <div className="text-center py-6">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : scheduleExceptions.length === 0 ? (
                    <p className="text-zinc-400 text-xs font-mono py-6 text-center border border-dashed border-zinc-200/80 rounded-2xl bg-zinc-50/40">Hech qanday dars o'zgarishi kiritilmagan.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white shadow-xs">
                      <table className="min-w-full divide-y divide-zinc-200/60 text-left text-xs text-zinc-700">
                        <thead className="bg-[#fafafa] text-[9px] sm:text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Sana</th>
                            <th className="px-4 py-3">Dars soati</th>
                            <th className="px-4 py-3">Holat / Fan</th>
                            <th className="px-4 py-3">Kiritilgan vaqt</th>
                            <th className="px-4 py-3 text-right">Amal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/60">
                          {scheduleExceptions.map((exc) => {
                            const isPast = new Date(exc.date + "T23:59:59") < new Date();
                            return (
                              <tr key={exc.id} className="hover:bg-zinc-50/30 transition">
                                <td className="px-4 py-3 font-semibold text-zinc-800">{exc.date}</td>
                                <td className="px-4 py-3 font-mono text-zinc-500">{exc.lesson_number}-dars</td>
                                <td className="px-4 py-3">
                                  {exc.is_deleted ? (
                                    <span className="text-zinc-400 line-through italic text-[11px]">O'chirilgan</span>
                                  ) : exc.subject_id === null ? (
                                    <span className="bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-semibold font-mono">Bekor qilingan</span>
                                  ) : (
                                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-semibold font-mono">
                                      {exc.subject_name} (O'zgartirilgan)
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-zinc-400 text-[10px] font-mono">
                                  {new Date(exc.created_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {!exc.is_deleted && !isPast && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteException(exc.id)}
                                      className="text-red-650 hover:text-red-500 font-semibold text-[10px] bg-red-50 border border-red-200 px-2.5 py-1 rounded-md transition cursor-pointer"
                                    >
                                      O'chirish (Tiklash)
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Student Management */}
            {teacherTab === "students" && (() => {
              const filteredStudents = studentsTabList.filter((st) => {
                const q = studentsSearch.toLowerCase().trim();
                if (!q) return true;
                const name = `${st.first_name || ""} ${st.last_name || ""} ${st.middle_name || ""}`.toLowerCase();
                const phone = (st.phone || "").toLowerCase();
                const cls = (st.class_name || "").toLowerCase();
                return name.includes(q) || phone.includes(q) || cls.includes(q);
              });
              const totalStudentsPages = Math.ceil(filteredStudents.length / studentsPageSize) || 1;
              const currentPage = Math.min(studentsPage, totalStudentsPages);
              const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPageSize, currentPage * studentsPageSize);

              return (
                <div className="space-y-4 animate-fadeIn pb-36">
                  <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">
                        {selectedClassId ? "Sinf O'quvchilari" : "Barcha O'quvchilar"}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        {selectedClassId
                          ? "Sinf rahbari sifatida o'quvchilarni qo'shishingiz va boshqarishingiz mumkin"
                          : "Maktabdagi barcha sinf o'quvchilarining umumiy ro'yxati"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-2xl px-3 py-2">
                        <Search className="w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          value={studentsSearch}
                          onChange={(e) => {
                            setStudentsSearch(e.target.value);
                            setStudentsPage(1);
                          }}
                          placeholder="O'quvchi qidirish..."
                          className="bg-transparent border-none text-xs font-bold text-zinc-800 outline-none w-32 sm:w-44 transition-all"
                        />
                      </div>

                      <button
                        type="button"
                        title="O'quvchilarni sinfdan sinfga ko'chirish"
                        onClick={() => setShowTransferModal(true)}
                        className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Sinfga Ko'chirish</span>
                      </button>

                      <button
                        type="button"
                        title="Excel orqali yuklash"
                        onClick={() => {
                          setSelectedFile(null);
                          setImportResult(null);
                          setImportError("");
                          setShowImportStudentsModal(true);
                        }}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-xs"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="O'quvchi qo'shish"
                        onClick={() => {
                          setStudentModalMode("create");
                          setStudentForm({
                            first_name: "",
                            last_name: "",
                            middle_name: "",
                            phone: "",
                            password: "123456",
                            address: "",
                            birthdate: "",
                            ina: ""
                          });
                          setShowStudentModal(true);
                        }}
                        className="p-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-2xl transition cursor-pointer flex items-center justify-center shadow-xs"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {studentsTabLoading ? (
                    <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl">
                      <p className="text-xs text-zinc-400 font-mono">
                        {studentsSearch
                          ? "Qidiruv bo'yicha hech qanday o'quvchi topilmadi."
                          : selectedClassId
                          ? "Ushbu sinfda hozircha o'quvchilar yo'q."
                          : "Maktabda hozircha o'quvchilar ro'yxatga olinmagan."}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-zinc-200/70 rounded-3xl shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0 z-20 bg-zinc-50 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/70 font-mono">
                            <tr>
                              <th className="px-4 py-3.5 text-center font-mono w-12 sticky left-0 z-30 bg-zinc-50">T/R</th>
                              <th className="px-6 py-3.5 sticky left-12 z-30 bg-zinc-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">Ism Familiya</th>
                              <th className="px-6 py-3.5">Sinf</th>
                              <th className="px-6 py-3.5">Telefon</th>
                              <th className="px-6 py-3.5">Tug'ilgan sana</th>
                              <th className="px-6 py-3.5 text-right">Amallar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700 bg-white">
                            {paginatedStudents.map((st, idx) => {
                              const globalIndex = (currentPage - 1) * studentsPageSize + idx + 1;
                              return (
                                <tr key={st.id} className="group hover:bg-zinc-50/80 transition">
                                  <td className="px-4 py-3.5 text-center font-mono text-zinc-400 sticky left-0 z-10 bg-white group-hover:bg-zinc-50/80 transition">{globalIndex}</td>
                                  <td className="px-6 py-3.5 font-bold text-[#16193E] sticky left-12 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] group-hover:bg-zinc-50/80 transition">
                                    {st.first_name} {st.last_name} {st.middle_name && <span className="text-zinc-400 font-normal">({st.middle_name})</span>}
                                  </td>
                                  <td className="px-6 py-3.5 font-mono">
                                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block">
                                      {st.class_name || "—"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5 font-mono text-zinc-500">{st.phone || "—"}</td>
                                  <td className="px-6 py-3.5 font-mono text-zinc-500">{st.birthdate ? st.birthdate.split("T")[0] : "—"}</td>
                                  <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                                    <button
                                      type="button"
                                      title="Vasiylar (Ota-onalar)"
                                      onClick={() => {
                                        setSelectedStudentForParents(st);
                                        setParentFirstName("");
                                        setParentLastName("");
                                        setParentMiddleName("");
                                        setParentPhone("");
                                        setParentEmail("");
                                        setParentPassword("password123");
                                        fetchLinkedParents(st.id || st.student_id);
                                        setShowParentsModal(true);
                                      }}
                                      className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                    >
                                      <Users className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Tahrirlash"
                                      onClick={() => {
                                        setEditingStudent(st);
                                        setStudentModalMode("edit");
                                        setStudentForm({
                                          first_name: st.first_name || "",
                                          last_name: st.last_name || "",
                                          middle_name: st.middle_name || "",
                                          phone: st.phone || "",
                                          password: "",
                                          address: st.address || "",
                                          birthdate: st.birthdate ? st.birthdate.split("T")[0] : "",
                                          ina: st.ina || ""
                                        });
                                        setShowStudentModal(true);
                                      }}
                                      className="p-2 bg-zinc-100 hover:bg-zinc-200 text-[#16193E] rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      title="O'chirish"
                                      onClick={() => handleDeleteStudent(st.student_id || st.id)}
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Bar */}
                      <div className="bg-zinc-50 border-t border-zinc-200/70 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-medium">
                        <div className="flex items-center gap-3">
                          <span>
                            Jami <b>{filteredStudents.length}</b> ta o'quvchidan{" "}
                            <b>{(currentPage - 1) * studentsPageSize + 1}</b>-
                            <b>{Math.min(currentPage * studentsPageSize, filteredStudents.length)}</b> ko'rsatilmoqda
                          </span>

                          <select
                            value={studentsPageSize}
                            onChange={(e) => {
                              setStudentsPageSize(Number(e.target.value));
                              setStudentsPage(1);
                            }}
                            className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs font-bold text-zinc-700 outline-none cursor-pointer"
                          >
                            <option value={15}>15 tadan</option>
                            <option value={25}>25 tadan</option>
                            <option value={50}>50 tadan</option>
                            <option value={100}>100 tadan</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setStudentsPage((p) => Math.max(p - 1, 1))}
                            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold cursor-pointer flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Oldingi</span>
                          </button>

                          <div className="flex items-center gap-1 px-1">
                            {Array.from({ length: totalStudentsPages }, (_, i) => i + 1)
                              .filter((p) => p === 1 || p === totalStudentsPages || Math.abs(p - currentPage) <= 1)
                              .map((p, idx, arr) => {
                                const prev = arr[idx - 1];
                                const showEllipsis = prev && p - prev > 1;
                                return (
                                  <React.Fragment key={p}>
                                    {showEllipsis && <span className="px-1 text-zinc-400 font-mono">...</span>}
                                    <button
                                      type="button"
                                      onClick={() => setStudentsPage(p)}
                                      className={`w-8 h-8 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                                        currentPage === p
                                          ? "bg-[#5B50EC] text-white shadow-xs"
                                          : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  </React.Fragment>
                                );
                              })}
                          </div>

                          <button
                            type="button"
                            disabled={currentPage >= totalStudentsPages}
                            onClick={() => setStudentsPage((p) => Math.min(p + 1, totalStudentsPages))}
                            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold cursor-pointer flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Keyingi</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: Unapproved Grades List */}
            {teacherTab === "unapproved" && (() => {
              // 1. Filter by selectedSubjectId if set
              const filteredUnapprovedGrades = unapprovedGrades.filter((g) => {
                if (!selectedSubjectId) return true;
                return Number(g.subject_id) === Number(selectedSubjectId);
              });

              // 2. Pagination calculation
              const totalItems = filteredUnapprovedGrades.length;
              const totalPages = Math.ceil(totalItems / unapprovedPageSize) || 1;
              const safePage = Math.min(unapprovedPage, totalPages);
              const startIndex = (safePage - 1) * unapprovedPageSize;
              const paginatedGrades = filteredUnapprovedGrades.slice(startIndex, startIndex + unapprovedPageSize);

              return (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">Tasdiqlanmagan Baholar Ro'yxati</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        Bu oynada tasdiqlanmagan (draft) baholar sanasi bo'yicha kamayish tartibida ko'rinadi.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {selectedGradeIds.size > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch(`${API_URL}/api/schools/grades/change-status`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  "Authorization": `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  mark_uids: Array.from(selectedGradeIds),
                                  status: "approved",
                                }),
                              });
                              const data = await response.json();
                              if (!response.ok) throw new Error(data.error || "Tasdiqlashda xatolik");

                              showToast("success", `${selectedGradeIds.size} ta baho tasdiqlandi!`);
                              setSelectedGradeIds(new Set());
                              fetchUnapprovedGrades();
                            } catch (err: any) {
                              showToast("error", err.message);
                            }
                          }}
                          className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-xs py-2.5 px-4 rounded-2xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Tanlangan ({selectedGradeIds.size}) ta bahoni tasdiqlash</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {!selectedClassId ? (
                    <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl animate-fadeIn">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#5B50EC] flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-extrabold text-[#16193E] mb-1">Sinf tanlanmadi</p>
                      <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto">
                        Tasdiqlanmagan baholarni ko'rish uchun pastdagi paneldan sinfni tanlang.
                      </p>
                    </div>
                  ) : unapprovedLoading ? (
                    <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                    </div>
                  ) : filteredUnapprovedGrades.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl animate-fadeIn">
                      <p className="text-sm font-bold text-zinc-800 mb-1">
                        {selectedSubjectId ? "Tanlangan fan bo'yicha baholar mavjud emas" : "Barcha baholar tasdiqlangan! 🎉"}
                      </p>
                      <p className="text-xs text-zinc-400 font-mono">Ushbu sinfda hozircha yangi tasdiqlanmagan (draft) baholar mavjud emas.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-zinc-200/70 rounded-3xl shadow-xs overflow-hidden text-zinc-900">
                      <div className="max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-290px)] overflow-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0 z-20 bg-zinc-50 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/70 font-mono">
                            <tr>
                              <th className="px-4 py-3.5 w-12 text-center sticky left-0 z-30 bg-zinc-50">
                                <input
                                  type="checkbox"
                                  checked={paginatedGrades.length > 0 && paginatedGrades.every(g => selectedGradeIds.has(g.id))}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedGradeIds(() => {
                                      const next = new Set<number>();
                                      if (checked) {
                                        paginatedGrades.forEach(g => next.add(g.id));
                                      }
                                      return next;
                                    });
                                  }}
                                  className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-0 cursor-pointer"
                                />
                              </th>
                              <th className="px-6 py-3.5 whitespace-nowrap">Sana</th>
                              <th className="px-6 py-3.5 sticky left-12 z-30 bg-zinc-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">O'quvchi</th>
                              <th className="px-6 py-3.5">Fan</th>
                              <th className="px-4 py-3.5 text-center">Baho</th>
                              <th className="px-6 py-3.5">Kiritdi</th>
                              <th className="px-6 py-3.5 text-right">Amallar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700 bg-white">
                            {paginatedGrades.map((g) => {
                              const formattedDate = g.grade_date ? new Date(g.grade_date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
                              const numericVal = parseFloat(g.value);
                              const badgeColorClass = !isNaN(numericVal)
                                ? numericVal >= 4.5
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : numericVal >= 3.5
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : numericVal >= 2.5
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200";

                              return (
                                <tr key={g.id} className="group hover:bg-zinc-50/80 transition">
                                  <td className="px-4 py-3.5 text-center sticky left-0 z-10 bg-white group-hover:bg-zinc-50/80 transition">
                                    <input
                                      type="checkbox"
                                      checked={selectedGradeIds.has(g.id)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setSelectedGradeIds(prev => {
                                          const next = new Set(prev);
                                          if (checked) {
                                            next.add(g.id);
                                          } else {
                                            next.delete(g.id);
                                          }
                                          return next;
                                        });
                                      }}
                                      className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-0 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-6 py-3.5 text-zinc-500 font-mono font-bold whitespace-nowrap">{formattedDate}</td>
                                  <td className="px-6 py-3.5 font-bold text-[#16193E] sticky left-12 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] group-hover:bg-zinc-50/80 transition">
                                    {g.student_name}
                                  </td>
                                  <td className="px-6 py-3.5">
                                    <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-[#E0F2FE] text-[#0284C7] inline-block">
                                      {g.subject_name}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-center">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-black font-mono shadow-2xs ${badgeColorClass}`}>
                                      {g.value}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5 text-zinc-500 font-medium">{g.teacher_name}</td>
                                  <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                                    <button
                                      type="button"
                                      title="Tasdiqlash"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`${API_URL}/api/schools/grades/change-status`, {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                              "Authorization": `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                              mark_uids: [g.id],
                                              status: "approved",
                                            }),
                                          });
                                          const data = await response.json();
                                          if (!response.ok) throw new Error(data.error || "Tasdiqlashda xatolik");

                                          showToast("success", "Baho tasdiqlandi!");
                                          fetchUnapprovedGrades();
                                        } catch (err: any) {
                                          showToast("error", err.message);
                                        }
                                      }}
                                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      title="O'chirish"
                                      onClick={() => {
                                        setTeacherDialog({
                                          isOpen: true,
                                          type: "danger",
                                          title: "Bahoni o'chirish",
                                          message: "Haqiqatan ham bu bahoni o'chirmoqchimisiz?",
                                          confirmText: "Ha, o'chirish",
                                          onConfirm: async () => {
                                            setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
                                            try {
                                              const response = await fetch(`${API_URL}/api/schools/grades/${g.id}`, {
                                                method: "DELETE",
                                                headers: {
                                                  "Authorization": `Bearer ${token}`,
                                                },
                                              });
                                              const data = await response.json();
                                              if (!response.ok) throw new Error(data.error || "O'chirishda xatolik");
                                              showToast("success", "Baho o'chirildi!");
                                              fetchUnapprovedGrades();
                                            } catch (err: any) {
                                              showToast("error", err.message);
                                            }
                                          },
                                        });
                                      }}
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Bar */}
                      <div className="px-6 py-3.5 border-t border-zinc-200/70 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-medium">
                        <div className="flex items-center gap-2">
                          <span>Har bir sahifada:</span>
                          <select
                            value={unapprovedPageSize}
                            onChange={(e) => {
                              setUnapprovedPageSize(Number(e.target.value));
                              setUnapprovedPage(1);
                            }}
                            className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value={10}>10 ta</option>
                            <option value={15}>15 ta</option>
                            <option value={30}>30 ta</option>
                            <option value={50}>50 ta</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-zinc-500">
                            {startIndex + 1} - {Math.min(startIndex + unapprovedPageSize, totalItems)} / {totalItems} ta baho
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={safePage <= 1}
                              onClick={() => setUnapprovedPage(prev => Math.max(prev - 1, 1))}
                              className="p-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4 text-zinc-700" />
                            </button>
                            <span className="px-2 font-bold font-mono text-zinc-800">
                              {safePage} / {totalPages}
                            </span>
                            <button
                              type="button"
                              disabled={safePage >= totalPages}
                              onClick={() => setUnapprovedPage(prev => Math.min(prev + 1, totalPages))}
                              className="p-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4 text-zinc-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: Feedback / Comments Feed */}
            {teacherTab === "feedback" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">Ota-onalardan Kelgan Fikr-mulohazalar</h3>
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
                    <p className="text-xs text-zinc-400 font-mono">Hozircha ota-onalardan hech qanday izoh yoki fikrlar kelmagan.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {buildThreads(feedbackFeed)
                      .filter((thread) => {
                        const q = feedbackSearch.toLowerCase();
                        return (
                          thread.author_name.toLowerCase().includes(q) ||
                          thread.messages.some((m: any) => m.content.toLowerCase().includes(q)) ||
                          (thread.student_name && thread.student_name.toLowerCase().includes(q)) ||
                          (thread.subject_name && thread.subject_name.toLowerCase().includes(q))
                        );
                      })
                      .map((thread) => {
                        const isGrade = thread.type === "GRADE";
                        const rep = thread.representative;

                        return (
                          <div
                            key={thread.key}
                            onClick={() => {
                              setSelectedChatComment(rep);
                              setReplyText("");
                              setReplyError("");
                              setChatModalOpen(true);
                              fetchChatMessages(rep);
                            }}
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
                                    O&apos;quvchi: <b className="text-zinc-800">{thread.student_name}</b> {thread.class_name && `(${thread.class_name})`}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-zinc-50/80 border border-zinc-200/60 p-3 rounded-2xl text-xs font-bold text-zinc-700">
                                <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  Taomnoma kuni: {new Date(thread.menu_date || "").toLocaleDateString("uz-UZ", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
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
            )}

            {/* TAB CONTENT: Announcements */}
            {teacherTab === "announcements" && (
              <AnnouncementsSection
                token={token}
                classes={classes}
                students={allStudents}
                apiUrl={API_URL}
                isTeacher={true}
                currentUserId={userInfo?.id}
              />
            )}
            {/* TAB CONTENT: Parents List */}
            {teacherTab === "parents" && (() => {
              const filteredParents = classParents.filter((pt) => {
                const q = parentsSearch.toLowerCase().trim();
                if (!q) return true;
                const name = `${pt.first_name || ""} ${pt.last_name || ""} ${pt.middle_name || ""}`.toLowerCase();
                const phone = (pt.phone || "").toLowerCase();
                const child = (pt.student_name || "").toLowerCase();
                const cls = (pt.class_name || "").toLowerCase();
                return name.includes(q) || phone.includes(q) || child.includes(q) || cls.includes(q);
              });
              const totalParentsPages = Math.ceil(filteredParents.length / parentsPageSize) || 1;
              const currentPage = Math.min(parentsPage, totalParentsPages);
              const paginatedParents = filteredParents.slice((currentPage - 1) * parentsPageSize, currentPage * parentsPageSize);

              return (
                <div className="space-y-4 animate-fadeIn pb-36">
                  <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">
                        {selectedClassId ? "Sinf Ota-onalari (Vasiylar)" : "Barcha Ota-onalar (Vasiylar)"}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        {selectedClassId
                          ? "Sinfdagi barcha o'quvchilarning ota-onalari (vasiylari) va ularni boshqarish"
                          : "Maktabdagi barcha o'quvchilarning ota-onalari (vasiylari) ro'yxati"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-2xl px-3 py-2">
                        <Search className="w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          value={parentsSearch}
                          onChange={(e) => {
                            setParentsSearch(e.target.value);
                            setParentsPage(1);
                          }}
                          placeholder="Ota-ona qidirish..."
                          className="bg-transparent border-none text-xs font-bold text-zinc-800 outline-none w-32 sm:w-44 transition-all"
                        />
                      </div>

                      <button
                        type="button"
                        title="Excel orqali yuklash"
                        onClick={() => {
                          setSelectedFile(null);
                          setImportResult(null);
                          setImportError("");
                          setShowImportParentsModal(true);
                        }}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-xs"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Ota-ona qo'shish"
                        onClick={() => {
                          setParentFirstName("");
                          setParentLastName("");
                          setParentMiddleName("");
                          setParentPhone("");
                          setParentEmail("");
                          setParentPassword("password123");
                          setSelectedStudentIdForAdd("");
                          setShowAddParentModal(true);
                        }}
                        className="p-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-2xl transition cursor-pointer flex items-center justify-center shadow-xs"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {classParentsLoading ? (
                    <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                    </div>
                  ) : filteredParents.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl">
                      <p className="text-sm font-bold text-zinc-800 mb-1">Ota-onalar mavjud emas</p>
                      <p className="text-xs text-zinc-400 font-mono">
                        {parentsSearch
                          ? "Qidiruv bo'yicha hech qanday ota-ona topilmadi."
                          : selectedClassId
                          ? "Ushbu sinfda hozircha bog'langan ota-onalar ro'yxatga olinmagan."
                          : "Maktabda hozircha bog'langan ota-onalar ro'yxatga olinmagan."}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-zinc-200/70 rounded-3xl shadow-xs overflow-hidden text-zinc-900">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0 z-20 bg-zinc-50 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/70 font-mono">
                            <tr>
                              <th className="px-4 py-3.5 text-center font-mono w-12 sticky left-0 z-30 bg-zinc-50">T/R</th>
                              <th className="px-6 py-3.5 sticky left-12 z-30 bg-zinc-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">Ism Familiya</th>
                              <th className="px-6 py-3.5">Telefon</th>
                              <th className="px-6 py-3.5">Pasport</th>
                              <th className="px-6 py-3.5">O'quvchi (Farzand)</th>
                              <th className="px-6 py-3.5 text-right">Amallar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700 bg-white">
                            {paginatedParents.map((pt, idx) => {
                              const globalIndex = (currentPage - 1) * parentsPageSize + idx + 1;
                              return (
                                <tr key={`${pt.id || pt.user_id}-${idx}`} className="group hover:bg-zinc-50/80 transition">
                                  <td className="px-4 py-3.5 text-center font-mono text-zinc-400 sticky left-0 z-10 bg-white group-hover:bg-zinc-50/80 transition">{globalIndex}</td>
                                  <td className="px-6 py-3.5 font-bold text-[#16193E] sticky left-12 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] group-hover:bg-zinc-50/80 transition">
                                    {pt.first_name} {pt.last_name} {pt.middle_name && <span className="text-zinc-400 font-normal">({pt.middle_name})</span>}
                                  </td>
                                  <td className="px-6 py-3.5 font-mono text-zinc-500">{pt.phone || "—"}</td>
                                  <td className="px-6 py-3.5 font-mono text-indigo-700 font-bold">{pt.passport || "Kiritilmagan"}</td>
                                  <td className="px-6 py-3.5">
                                    <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-[#E0F2FE] text-[#0284C7] inline-block">
                                      {pt.student_name || "Noma'lum"} {pt.class_name && <span className="font-mono text-zinc-500 text-[10px]">({pt.class_name})</span>}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      title="Farzanddan ajratish"
                                      onClick={() => handleUnlinkParentFromStudent(pt.student_id, pt.id || pt.user_id)}
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Bar */}
                      <div className="bg-zinc-50 border-t border-zinc-200/70 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-medium">
                        <div className="flex items-center gap-3">
                          <span>
                            Jami <b>{filteredParents.length}</b> ta ota-onadan{" "}
                            <b>{(currentPage - 1) * parentsPageSize + 1}</b>-
                            <b>{Math.min(currentPage * parentsPageSize, filteredParents.length)}</b> ko'rsatilmoqda
                          </span>

                          <select
                            value={parentsPageSize}
                            onChange={(e) => {
                              setParentsPageSize(Number(e.target.value));
                              setParentsPage(1);
                            }}
                            className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs font-bold text-zinc-700 outline-none cursor-pointer"
                          >
                            <option value={15}>15 tadan</option>
                            <option value={25}>25 tadan</option>
                            <option value={50}>50 tadan</option>
                            <option value={100}>100 tadan</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setParentsPage((p) => Math.max(p - 1, 1))}
                            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold cursor-pointer flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Oldingi</span>
                          </button>

                          <div className="flex items-center gap-1 px-1">
                            {Array.from({ length: totalParentsPages }, (_, i) => i + 1)
                              .filter((p) => p === 1 || p === totalParentsPages || Math.abs(p - currentPage) <= 1)
                              .map((p, idx, arr) => {
                                const prev = arr[idx - 1];
                                const showEllipsis = prev && p - prev > 1;
                                return (
                                  <React.Fragment key={p}>
                                    {showEllipsis && <span className="px-1 text-zinc-400 font-mono">...</span>}
                                    <button
                                      type="button"
                                      onClick={() => setParentsPage(p)}
                                      className={`w-8 h-8 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                                        currentPage === p
                                          ? "bg-[#5B50EC] text-white shadow-xs"
                                          : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  </React.Fragment>
                                );
                              })}
                          </div>

                          <button
                            type="button"
                            disabled={currentPage >= totalParentsPages}
                            onClick={() => setParentsPage((p) => Math.min(p + 1, totalParentsPages))}
                            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold cursor-pointer flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Keyingi</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: Extracurricular Clubs */}
            {teacherTab === "clubs" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">To'garaklar (Fan To'garaklari)</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      Foydalanuvchilarga o'z fanlaringizdan to'garaklar tashkil qilish va jadvallarni boshqarish
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClubsError("");
                        setClubsSuccess("");
                        setNewClubName("");
                        setNewClubSubjectId("");
                        setNewClubAllowedLevels([]);
                        setNewClubExtraStudentIds([]);
                        setShowAddClubModal(true);
                      }}
                      className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-extrabold text-xs py-2.5 px-4 rounded-2xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yangi To'garak</span>
                    </button>
                  </div>
                </div>

                {clubsLoading ? (
                  <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : clubs.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl">
                    <p className="text-sm font-bold text-zinc-800 mb-1">To'garaklar mavjud emas</p>
                    <p className="text-xs text-zinc-400 font-mono">Siz yaratgan to'garaklar hali yo'q. "Yangi To'garak" tugmasi orqali yaratishingiz mumkin.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clubs.map((club) => (
                      <div key={club.id} className="bg-white border border-zinc-200/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-zinc-900 relative hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3.5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-[#0284C7] bg-[#E0F2FE] px-3 py-1 rounded-xl font-mono inline-block">
                              {club.subject_name}
                            </span>
                            <h4 className="text-base font-extrabold text-[#16193E]">{club.name}</h4>
                            <p className="text-xs text-zinc-500 font-medium">
                              Ruxsat etilgan sinflar: <b className="text-zinc-800">{club.allowed_class_levels ? club.allowed_class_levels.join(", ") + "-sinflar" : "Barchasi"}</b>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClub(club);
                                setEditClubName(club.name);
                                setEditClubSubjectId(club.subject_id);
                                setEditClubAllowedLevels(club.allowed_class_levels || []);
                                setActionError("");
                                setShowEditClubModal(true);
                              }}
                              className="p-2 sm:p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"
                              title="To'garakni tahrirlash"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClub(club.id)}
                              className="p-2 sm:p-2.5 bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-600 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"
                              title="To'garakni o'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClubForStudents(club);
                                setSearchStudentTerm("");
                                setClubStudents([]);
                                fetchClubStudents(club.id);
                                if (token) {
                                  if (allStudents.length === 0) fetchAllStudents(token);
                                  if (studentsTabList.length === 0) fetchStudentsTabList();
                                }
                                setShowClubStudentsModal(true);
                              }}
                              className="p-2 sm:p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"
                              title="A'zolar & So'rovlar"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                            <button
                               type="button"
                               onClick={() => {
                                 setSelectedClubForSchedule(club);
                                 setNewScheduleDay(1);
                                 setNewScheduleStartTime("14:00");
                                 setNewScheduleEndTime("15:30");
                                 setShowAddScheduleModal(true);
                               }}
                               className="p-2 sm:p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"
                               title="Jadval qo'shish"
                             >
                               <Calendar className="w-4 h-4" />
                             </button>
                             <button
                               type="button"
                               onClick={() => {
                                 setSelectedClubForGrading(club);
                                 const today = new Date().toISOString().split("T")[0];
                                 setClubGradingDate(today);
                                 setClubJournalTab("grade");
                                 setClubGradeHistory([]);
                                 fetchClubStudentsAndGrades(club.id, today);
                                 setShowClubGradingModal(true);
                               }}
                               className="p-2 sm:p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-purple-700 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"
                               title="Mashg'ulot Jurnali & Baholash"
                             >
                               <Award className="w-4 h-4 text-purple-600" />
                             </button>
                          </div>
                        </div>

                        {/* Schedule list for the club */}
                        <div className="space-y-2.5">
                          <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            <span>To'garak Jadvali</span>
                          </h5>
                          {(!club.schedules || club.schedules.length === 0) ? (
                            <p className="text-xs text-zinc-400 font-medium italic bg-zinc-50/50 p-3 rounded-2xl border border-zinc-150">Hali dars jadvali belgilanmagan</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {club.schedules.map((sch: any) => {
                                const days = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
                                return (
                                  <div key={sch.id} className="flex items-center justify-between bg-zinc-50/80 border border-zinc-200/70 p-3 rounded-2xl text-xs">
                                    <div>
                                      <span className="font-extrabold text-[#16193E] block">{days[sch.day_of_week]}</span>
                                      <span className="text-[11px] text-zinc-500 font-mono font-medium">{sch.start_time} - {sch.end_time}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSchedule(sch.id)}
                                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
                                      title="O'chirish"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Lesson Plans (Dars Ish Rejalari) */}
            {teacherTab === "lesson-plans" && (
              <LessonPlansSection
                token={token}
                API_URL={API_URL}
                classes={classes}
                subjects={subjects}
                userInfo={userInfo}
              />
            )}

            {/* TAB CONTENT: Library & Reading Assignments */}
            {teacherTab === "books" && <LibrarySection />}

            {/* TAB CONTENT: Ijtimoiy Pasport Import */}
            {teacherTab === "social-passport" && (
              <SocialPassportImportSection
                token={token}
                API_URL={API_URL}
                userInfo={userInfo}
                onSuccess={() => {
                  fetchClassesList();
                  if (token) fetchAllStudents(token);
                }}
              />
            )}

            {/* TAB CONTENT: Sozlamalar (Settings) */}
            {teacherTab === "settings" && (
              <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn pb-36 text-zinc-900">
                <div className="bg-white border border-zinc-200/70 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#16193E] flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        <span>Sozlamalar va Profil</span>
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium mt-1">
                        Shaxsiy ma'lumotlaringizni tahrirlang va tizim sozlamalarini boshqaring.
                      </p>
                    </div>
                  </div>

                  {/* Profile info form */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 font-mono">
                      Profil ma'lumotlari
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Ismingiz</label>
                        <input
                          type="text"
                          value={profileFirstName}
                          onChange={(e) => setProfileFirstName(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Familiyangiz</label>
                        <input
                          type="text"
                          value={profileLastName}
                          onChange={(e) => setProfileLastName(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setProfileLoading(true);
                          const res = await fetch(`${API_URL}/api/schools/teachers/${userInfo?.id}`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              first_name: profileFirstName,
                              last_name: profileLastName,
                            }),
                          });
                          if (!res.ok) throw new Error("Profilni saqlab bo'lmadi");
                          
                          const updatedUser = { ...userInfo, first_name: profileFirstName, last_name: profileLastName };
                          setUserInfo(updatedUser as any);
                          localStorage.setItem("school_user", JSON.stringify(updatedUser));
                          setToast({ type: "success", message: "Profil ma'lumotlari yangilandi!" });
                        } catch (err: any) {
                          setToast({ type: "error", message: err.message || "Xatolik yuz berdi" });
                        } finally {
                          setProfileLoading(false);
                        }
                      }}
                      disabled={profileLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{profileLoading ? "Saqlanmoqda..." : "Profilni saqlash"}</span>
                    </button>
                  </div>

                  {/* Password Change form */}
                  <div className="border-t border-zinc-100 pt-6 space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 font-mono">
                      Parolni o'zgartirish
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Eski parol</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={profileOldPassword}
                          onChange={(e) => setProfileOldPassword(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Yangi parol</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={profileNewPassword}
                          onChange={(e) => setProfileNewPassword(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!profileOldPassword || !profileNewPassword) {
                          setToast({ type: "error", message: "Eski va yangi parolni kiriting!" });
                          return;
                        }
                        try {
                          setProfileLoading(true);
                          const res = await fetch(`${API_URL}/api/schools/change-password`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              old_password: profileOldPassword,
                              new_password: profileNewPassword,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Parolni o'zgartirib bo'lmadi");

                          setProfileOldPassword("");
                          setProfileNewPassword("");
                          setToast({ type: "success", message: "Parol muvaffaqiyatli o'zgartirildi!" });
                        } catch (err: any) {
                          setToast({ type: "error", message: err.message || "Xatolik yuz berdi" });
                        } finally {
                          setProfileLoading(false);
                        }
                      }}
                      disabled={profileLoading}
                      className="bg-zinc-800 hover:bg-zinc-900 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Parolni yangilash</span>
                    </button>
                  </div>

                  {/* System Logout Button Section */}
                  <div className="border-t border-zinc-100 pt-6 space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-600 font-mono">
                      Tizimdan Chiqish
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      Platformadagi sessiyangizni yakunlash va akkauntdan chiqish uchun pastdagi tugmani bosing.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md hover:scale-[1.01]"
                    >
                      <LogOut className="w-5 h-5 text-white" />
                      <span>Tizimdan Chiqish (Log Out)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl border shadow-lg transition-all transform translate-y-0 animate-bounce duration-300 max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-5 h-5 text-emerald-650 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-650 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <p className="text-xs font-semibold">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="text-zinc-400 hover:text-zinc-650 pl-1 cursor-pointer shrink-0 font-extrabold text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Sticky Bottom Tabbar (Hidden on Dashboard, Lesson Plans, Books, Social Passport, Announcements, Clubs, Feedback, Settings) */}
      {teacherTab !== "dashboard" && teacherTab !== "lesson-plans" && teacherTab !== "books" && teacherTab !== "social-passport" && teacherTab !== "announcements" && teacherTab !== "clubs" && teacherTab !== "feedback" && teacherTab !== "settings" && (
        <div
          style={{
            left: typeof window !== "undefined" && window.innerWidth >= 768
              ? `calc(50% + ${sidebarCollapsed ? '40px' : '128px'})`
              : "50%"
          }}
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 md:left-[calc(50%+40px)] z-40 max-w-[95vw] w-max transition-all duration-300"
        >
        <div className="bg-white/95 backdrop-blur-2xl border-2 border-indigo-500/25 shadow-[0_20px_60px_rgba(22,25,62,0.22),0_8px_25px_rgba(79,70,229,0.15)] ring-4 ring-indigo-50/90 rounded-full px-3.5 sm:px-7 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-6 transition-all duration-300">
          
          {/* Left Part: Class & Subject Selectors */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {/* Sinf Selection with Upward Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowClassDropdown(!showClassDropdown);
                  setShowSubjectDropdown(false);
                }}
                className="flex items-center space-x-1.5 sm:space-x-2 hover:bg-zinc-50 px-2 sm:px-3 py-1.5 rounded-2xl transition cursor-pointer"
                title="Sinf tanlash"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="hidden sm:flex flex-col text-left pr-4">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">SINF</span>
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1 select-none whitespace-nowrap">
                    {selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : "Tanlang"}
                    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </span>
                </div>
              </button>

              {/* Upward Class Popover Menu */}
              {showClassDropdown && (
                <div className="absolute bottom-full mb-3 left-0 w-56 sm:w-64 bg-white/95 backdrop-blur-2xl border-2 border-indigo-500/20 shadow-2xl rounded-2xl p-2 z-50 animate-fadeIn space-y-1 max-h-60 overflow-y-auto">
                  <div className="text-[9px] font-extrabold text-zinc-400 uppercase px-3 py-1 font-mono tracking-wider">Sinfni tanlang</div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClassId("");
                      setSelectedSubjectId("");
                      setSelectedGradeIds(new Set());
                      setShowClassDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      selectedClassId === "" ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-zinc-800"
                    }`}
                  >
                    <span>🌐 Umumiy (Mening dars jadvalim)</span>
                  </button>
                  {classes.map((cls: any) => {
                    const isMyMainClass = Boolean(cls.is_main_teacher || cls.main_teacher_id === userInfo?.id);
                    const isSelected = selectedClassId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setSelectedSubjectId("");
                          setSelectedGradeIds(new Set());
                          setShowClassDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-zinc-800"
                        }`}
                      >
                        <span>{cls.name}</span>
                        {isMyMainClass && <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-indigo-600"} font-extrabold`}>⭐ Sinf Rahbari</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Divider & Fan Selection (Only shown when NOT on schedule tab) */}
            {teacherTab !== "schedule" && (
              <>
                {/* Divider */}
                <div className="h-6 sm:h-8 w-px bg-zinc-200"></div>

                {/* Fan Selection Container with Upward Popover */}
                {selectedClassId ? (
                  (() => {
                    const currentCls = classes.find(c => c.id === selectedClassId);
                    const canSelectSubject = userInfo?.role === "ADMIN" || currentCls?.is_main_teacher || classTeachers.some(ct => ct.teacher_id === userInfo?.id && ct.is_main_teacher);

                    return (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (canSelectSubject) {
                              setShowSubjectDropdown(!showSubjectDropdown);
                              setShowClassDropdown(false);
                            }
                          }}
                          className={`flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-2xl transition ${canSelectSubject ? "hover:bg-zinc-50 cursor-pointer" : "bg-zinc-50/50"}`}
                          title="Fan tanlash"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650 shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="hidden sm:flex flex-col text-left pr-4">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">FAN</span>
                            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1 select-none whitespace-nowrap">
                              {selectedSubjectId ? (
                                teacherTab === "journal" && selectedLessonNumber
                                  ? `${selectedLessonNumber}-soat: ${subjects.find(s => s.id === selectedSubjectId)?.name || ""}`
                                  : (subjects.find(s => s.id === selectedSubjectId)?.name || currentCls?.subject_name || "Noma'lum")
                              ) : "Tanlang"}
                              {canSelectSubject && (
                                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                              )}
                            </span>
                          </div>
                        </button>

                        {/* Upward Subject Popover Menu */}
                        {showSubjectDropdown && canSelectSubject && (
                          <div className="absolute bottom-full mb-3 left-0 w-64 sm:w-72 bg-white/95 backdrop-blur-2xl border-2 border-indigo-500/20 shadow-2xl rounded-2xl p-2 z-50 animate-fadeIn space-y-1 max-h-60 overflow-y-auto">
                            <div className="text-[9px] font-extrabold text-zinc-400 uppercase px-3 py-1 font-mono tracking-wider">
                              {teacherTab === "journal" ? "Darsni tanlang" : "Fanni tanlang"}
                            </div>
                            {teacherTab === "journal" ? (
                              journalLessonsToday.length > 0 ? (
                                journalLessonsToday.map((lesson) => {
                                  const isSelected = selectedSubjectId === lesson.subject_id && selectedLessonNumber === lesson.lesson_number;
                                  return (
                                    <button
                                      key={`sched_${lesson.subject_id}_${lesson.lesson_number}`}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSubjectId(lesson.subject_id);
                                        setSelectedLessonNumber(lesson.lesson_number);
                                        setShowSubjectDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                        isSelected ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-zinc-800"
                                      }`}
                                    >
                                      <span>{lesson.lesson_number}-soat: {lesson.subject_name}</span>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-xs text-zinc-400 font-medium">Ushbu sanada darslar yo'q</div>
                              )
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubjectId("");
                                    setShowSubjectDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                    selectedSubjectId === "" ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-zinc-800"
                                  }`}
                                >
                                  <span>Barcha fanlar</span>
                                </button>
                                {subjects.map((sub) => {
                                  const isSelected = selectedSubjectId === sub.id;
                                  return (
                                    <button
                                      key={`sub_pop_${sub.id}`}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSubjectId(sub.id);
                                        setShowSubjectDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                        isSelected ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-zinc-800"
                                      }`}
                                    >
                                      <span>{sub.name}</span>
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center space-x-2 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-zinc-105 border border-zinc-200 flex items-center justify-center text-zinc-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider">FAN</span>
                      <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Sinfni tanlang</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Middle Part: Date Navigation */}
          {selectedClassId && teacherTab === "journal" && (
            <div className="flex items-center space-x-2 shrink-0">
              {/* Datepicker */}
              <div 
                onClick={() => {
                  setTeacherCalendarTarget("journal");
                  setIsTeacherCalendarOpen(true);
                }}
                className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 rounded-full px-2.5 sm:px-3.5 py-1.5 transition cursor-pointer"
                title="Sana tanlash (Smart Calendar)"
              >
                <svg className="w-4 h-4 text-[#5B50EC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline text-xs font-bold font-mono text-zinc-700 select-none">
                  {(() => {
                    const parts = journalDate.split("-");
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    return journalDate;
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Schedule Date picker */}
          {selectedClassId && teacherTab === "schedule" && (
            <div className="flex items-center space-x-2 shrink-0">
              <div 
                onClick={() => {
                  setTeacherCalendarTarget("schedule");
                  setIsTeacherCalendarOpen(true);
                }}
                className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 rounded-full px-2.5 sm:px-3.5 py-1.5 transition cursor-pointer font-bold"
                title="Jadval sanasini tanlash (Smart Calendar)"
              >
                <svg className="w-4 h-4 text-[#5B50EC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline text-xs font-bold font-mono text-zinc-700 select-none">
                  {(() => {
                    const parts = scheduleViewDate.split("-");
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    return scheduleViewDate;
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Right Part: Save Action Button */}
          <div className="flex items-center space-x-2 shrink-0">
            {selectedClassId && (teacherTab === "journal" || teacherTab === "unapproved") ? (
              <>
                {teacherTab === "journal" && (
                  selectedGradeIds.size > 0 ? (
                    <button
                      type="button"
                      onClick={handleBulkApprove}
                      disabled={approveLoading}
                      title={`Saqlash (${selectedGradeIds.size} ta)`}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_4px_14px_rgba(91,80,236,0.3)] cursor-pointer disabled:opacity-50"
                    >
                      {approveLoading ? (
                        <span className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <svg className="w-4 h-4 text-white sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="hidden sm:inline">Saqlash ({selectedGradeIds.size} ta)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApproveAllToday}
                      disabled={approveLoading}
                      title="Saqlash"
                      className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_4px_14px_rgba(91,80,236,0.3)] cursor-pointer disabled:opacity-50"
                    >
                      {approveLoading ? (
                        <span className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <svg className="w-4 h-4 sm:mr-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-4-4H8z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v-8" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6v4H9z" />
                        </svg>
                      )}
                      <span className="hidden sm:inline">Saqlash</span>
                    </button>
                  )
                )}

                {teacherTab === "unapproved" && selectedGradeIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkApprove}
                    disabled={approveLoading}
                    title={`Tasdiqlash (${selectedGradeIds.size} ta)`}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_4px_14px_rgba(91,80,236,0.3)] cursor-pointer disabled:opacity-50"
                  >
                    {approveLoading ? (
                      <span className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg className="w-4 h-4 text-white sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">Tasdiqlash ({selectedGradeIds.size} ta)</span>
                  </button>
                )}
              </>
            ) : null}

            {selectedClassId && teacherTab === "schedule" && isMainTeacherOfClass() && (
                <button
                type="button"
                onClick={() => {
                  const initialFormState: { [key: string]: number } = {};
                  for (let d = 1; d <= 6; d++) {
                    for (let l = 1; l <= 8; l++) {
                      initialFormState[`${d}-${l}`] = 0;
                    }
                  }
                  classSchedule.forEach((item) => {
                    if (item.subject_id > 0) {
                      initialFormState[`${item.day_of_week}-${item.lesson_number}`] = item.subject_id;
                    }
                  });
                  setScheduleFormState(initialFormState);
                  setActionError("");

                  if (classSchedule.length > 0 && classSchedule[0].start_date && classSchedule[0].end_date) {
                    setScheduleStartDate(classSchedule[0].start_date);
                    setScheduleEndDate(classSchedule[0].end_date);
                  } else {
                    const todayStr = new Date().toISOString().split("T")[0];
                    setScheduleStartDate(todayStr);
                    const nextYear = new Date();
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    setScheduleEndDate(nextYear.toISOString().split("T")[0]);
                  }

                  setShowEditScheduleModal(true);
                }}
                title="Jadvalni tahrirlash"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#5B50EC] hover:bg-[#4A3FDB] text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition cursor-pointer shrink-0 hover:scale-105"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {renderEditWeeklyScheduleModal()}
      {renderAddExceptionModal()}
      {renderPeriodsModal()}
      {renderStudentModal()}
      {renderParentsModal()}
      {renderImportParentsModal()}
      {renderImportStudentsModal()}
      {renderAddParentModal()}
      {renderClubGradingModal()}
      {renderLogoutModal()}
      {renderTeacherDialogModal()}
      {renderAddClubModal()}
      {renderEditClubModal()}
      {renderAddScheduleModal()}
      {renderClubStudentsModal()}
      {renderGradeCommentModal()}
      {renderTodayLessonsModal()}

      {/* BATCH STUDENT TRANSFER MODAL */}
      <TransferStudentsModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        sourceClassId={selectedClassId ? Number(selectedClassId) : undefined}
        sourceClassName={classes.find((c: any) => c.id === Number(selectedClassId))?.name}
        lockSourceClass={true}
        allClasses={classes}
        allStudents={allStudents}
        onSuccess={() => {
          if (token && schoolId) {
            loadInitialData(token, schoolId);
          }
        }}
      />

      <SmartCalendarModal
        isOpen={isTeacherCalendarOpen}
        onClose={() => setIsTeacherCalendarOpen(false)}
        mode="single"
        selectedDate={
          teacherCalendarTarget === "journal"
            ? journalDate
            : teacherCalendarTarget === "exception"
            ? excDate
            : scheduleViewDate
        }
        onSelectDate={(dateStr) => {
          if (teacherCalendarTarget === "journal") {
            setJournalDate(dateStr);
            fetchJournalData(dateStr);
          } else if (teacherCalendarTarget === "exception") {
            setExcDate(dateStr);
          } else {
            setScheduleViewDate(dateStr);
            fetchClassSchedule(dateStr);
          }
        }}
        title={
          teacherCalendarTarget === "journal"
            ? "Jurnal sanasini tanlash"
            : teacherCalendarTarget === "exception"
            ? "O'zgarish sanasini tanlash"
            : "Jadval sanasini tanlash"
        }
      />

      {chatModalOpen && selectedChatComment && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setChatModalOpen(false);
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
                onClick={() => setChatModalOpen(false)}
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
                        <span style={{ fontSize: "9px", color: "#9CA3AF", marginBottom: "2px", fontWeight: 700 }}>
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

            <form onSubmit={handleReplySubmit} className="flex gap-2 items-end">
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
      )}
    </div>
  );

  function renderParentsModal() {
    if (!showParentsModal || !selectedStudentForParents) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowParentsModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[85vh] animate-fadeIn">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Vasiylar Boshqaruvi</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                O'quvchi: <strong className="text-zinc-800">{selectedStudentForParents.first_name} {selectedStudentForParents.last_name}</strong>
              </p>
            </div>
            <button
              onClick={() => setShowParentsModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Linked Parents list */}
            <div>
              <h4 className="text-xs font-bold text-zinc-700 mb-3 flex items-center">
                <span>Bog'langan Ota-onalar</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-full font-mono font-bold">
                  {linkedParents.length}
                </span>
              </h4>

              {linkedParentsLoading ? (
                <div className="text-center py-8 border border-dashed border-zinc-200 rounded-2xl">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                  <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                </div>
              ) : linkedParents.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                  <p className="text-xs text-zinc-400 font-mono">Ushbu o'quvchiga hali ota-ona bog'lanmagan.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedParents.map((parent) => (
                    <div
                      key={parent.id || parent.user_id}
                      className="flex items-center justify-between p-3.5 border border-zinc-200/70 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 transition"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-extrabold text-zinc-800">
                            {parent.first_name} {parent.last_name} {parent.middle_name || ""}
                          </p>
                          {parent.relation_type && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                              {parent.relation_type === "ota" ? "Otasi" : parent.relation_type === "ona" ? "Onasi" : parent.relation_type}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono mt-1 flex flex-wrap items-center gap-2">
                          <span>Tel: <b className="text-zinc-700">{parent.phone || "— (Otasi/Onasi raqamiga biriktirilgan)"}</b></span>
                          <span>|</span>
                          <span>Pasport: <b className="text-indigo-700 font-bold">{parent.passport || "Kiritilmagan"}</b></span>
                          {parent.email && <span>| Email: {parent.email}</span>}
                        </p>
                        {parent.parent_code && (
                          <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-mono inline-block mt-1 font-bold">
                            Taklif kodi: {parent.parent_code}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlinkParent(parent.id || parent.user_id)}
                        className="text-xs bg-red-50 border border-red-200 text-red-650 hover:bg-red-100 font-bold py-1.5 px-3 rounded-xl transition cursor-pointer"
                      >
                        Ajratish
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-zinc-100" />

            {/* Manual Link/Add parent Form */}
            <form onSubmit={handleLinkParent} className="space-y-4">
              <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">Yangi Ota-onani Bog'lash (Qo'shish)</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Ism *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                    placeholder="Masalan: Asror"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Familiya *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentLastName}
                    onChange={(e) => setParentLastName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                    placeholder="Masalan: Karimov"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Otasining ismi (Sharifi)
                  </label>
                  <input
                    type="text"
                    value={parentMiddleName}
                    onChange={(e) => setParentMiddleName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                    placeholder="Masalan: Baxtiyorovich"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Telefon *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                    placeholder="Masalan: +998901234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Pasport
                  </label>
                  <input
                    type="text"
                    value={parentPassport}
                    onChange={(e) => setParentPassport(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                    placeholder="Masalan: AA1234567"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Parol *
                  </label>
                  <input
                    type="password"
                    required
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowParentsModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {actionLoading && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                  <span>Ota-onani bog'lash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  function renderImportParentsModal() {
    if (!showImportParentsModal) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowImportParentsModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden transition-all transform scale-100 animate-fadeIn">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Excel Orqali Ota-onalarni Yuklash</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Bir vaqtning o'zida bir nechta ota-ona hisobini bog'lash
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowImportParentsModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Step 1: Download Template */}
            <div className="bg-zinc-50/70 border border-zinc-200/70 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-[#16193E]">1-bosqich: Shablonni yuklab olish</p>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                  Sinf o'quvchilari ro'yxati biriktirilgan tayyor shablon
                </p>
              </div>
              <button
                type="button"
                onClick={downloadParentsTemplate}
                className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer shrink-0 shadow-xs"
              >
                Shablonni yuklash
              </button>
            </div>

            {/* Step 2: Upload Excel File */}
            <form onSubmit={handleParentsExcelImport} className="space-y-4">
              <div>
                <p className="text-xs font-extrabold text-[#16193E] mb-2">2-bosqich: To'ldirilgan shablonni yuklash</p>
                <label className="border-2 border-dashed border-zinc-200 rounded-2xl py-6 px-4 text-center block cursor-pointer hover:bg-zinc-50/80 transition">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <svg className="w-8 h-8 text-zinc-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-bold text-zinc-800">
                    {selectedFile ? selectedFile.name : "Excel faylini tanlang (.xlsx)"}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">Fayl hajmi 5MB dan oshmasligi kerak</p>
                </label>
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs space-y-1">
                  <p className="font-extrabold">Muvaffaqiyatli yuklandi!</p>
                  <ul className="list-disc pl-4 font-mono text-[11px] space-y-0.5 font-semibold">
                    <li>Yuklangan ota-onalar: {importResult.imported_count} ta</li>
                    <li>O'quvchilarga bog'landi: {importResult.linked_count || importResult.imported_count} ta</li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportParentsModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !selectedFile}
                  className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {importLoading && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                  <span>Yuklash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  function renderImportStudentsModal() {
    if (!showImportStudentsModal) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowImportStudentsModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden transition-all transform scale-100 animate-fadeIn">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between text-zinc-900">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Excel Orqali O'quvchilarni Yuklash</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Bir vaqtning o'zida bir nechta o'quvchi hisobini yaratish va sinflarga joylash
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowImportStudentsModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 text-zinc-900">
            {/* Step 1: Download Template */}
            <div className="bg-zinc-50/70 border border-zinc-200/70 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-[#16193E]">1-bosqich: Shablonni yuklab olish</p>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                  Ustunlar: ism, familiya, sharif, sinf (namuna bilan birga)
                </p>
              </div>
              <button
                type="button"
                onClick={downloadStudentsTemplate}
                className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer shrink-0 shadow-xs"
              >
                Shablonni yuklash
              </button>
            </div>

            {/* Step 2: Upload Excel File */}
            <form onSubmit={handleStudentsExcelImport} className="space-y-4">
              <div>
                <p className="text-xs font-extrabold text-[#16193E] mb-2">2-bosqich: To'ldirilgan shablonni yuklash</p>
                <label className="border-2 border-dashed border-zinc-200 rounded-2xl py-6 px-4 text-center block cursor-pointer hover:bg-zinc-50/80 transition">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <svg className="w-8 h-8 text-zinc-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-bold text-zinc-800">
                    {selectedFile ? selectedFile.name : "Excel faylini tanlang (.xlsx)"}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">Fayl hajmi 5MB dan oshmasligi kerak</p>
                </label>
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs space-y-1">
                  <p className="font-extrabold">Muvaffaqiyatli yuklandi!</p>
                  <ul className="list-disc pl-4 font-mono text-[11px] space-y-0.5 font-semibold">
                    <li>Yuklangan o'quvchilar: {importResult.imported_count} ta</li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportStudentsModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !selectedFile}
                  className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {importLoading && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                  <span>Yuklash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 1. Add Club Modal
  function renderAddClubModal() {
    if (!showAddClubModal) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddClubModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200/80 animate-fadeIn">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Yangi To'garak Yaratish</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Fan to'garagini tashkil etish</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddClubModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateClub} className="p-6 overflow-y-auto space-y-4">
            {clubsError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {clubsError}
              </div>
            )}
            {clubsSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                {clubsSuccess}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">To'garak nomi *</label>
              <input
                type="text"
                required
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                placeholder="Masalan: Yosh Fiziklar"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Fan *</label>
              <select
                required
                value={newClubSubjectId}
                onChange={(e) => setNewClubSubjectId(Number(e.target.value))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none cursor-pointer"
              >
                <option value="">-- Fanni tanlang --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">Ruxsat etilgan sinflar (Level)*</label>
              <div className="grid grid-cols-4 gap-2 border border-zinc-200/70 p-3 rounded-2xl bg-zinc-50/30">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => {
                  const isChecked = newClubAllowedLevels.includes(lvl);
                  return (
                    <label key={lvl} className="flex items-center space-x-1.5 text-xs font-bold text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewClubAllowedLevels([...newClubAllowedLevels, lvl]);
                          } else {
                            setNewClubAllowedLevels(newClubAllowedLevels.filter((x) => x !== lvl));
                          }
                        }}
                        className="w-3.5 h-3.5 text-indigo-600 border-zinc-300 rounded focus:ring-0 cursor-pointer"
                      />
                      <span>{lvl}-sinf</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddClubModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Tashkil qilish
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  function renderEditClubModal() {
    if (!showEditClubModal || !editingClub) return null;

    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowEditClubModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col border border-zinc-200/80 animate-fadeIn text-zinc-900">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">To'garakni tahrirlash</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">To'garak nomi, fani va sinf darajalarini o'zgartirish</p>
            </div>
            <button
              type="button"
              onClick={() => setShowEditClubModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {actionError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl">
              {actionError}
            </div>
          )}

          <form onSubmit={handleEditClubSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">To'garak nomi *</label>
              <input
                type="text"
                required
                value={editClubName}
                onChange={(e) => setEditClubName(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                placeholder="Masalan: IT scratch to'garagi"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Biriktirilgan fan *</label>
              <select
                required
                value={editClubSubjectId}
                onChange={(e) => setEditClubSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none cursor-pointer"
              >
                <option value="">Fanni tanlang</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">Ruxsat etilgan sinflar *</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => {
                  const isSelected = editClubAllowedLevels.includes(lvl);
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setEditClubAllowedLevels(editClubAllowedLevels.filter(l => l !== lvl));
                        } else {
                          setEditClubAllowedLevels([...editClubAllowedLevels, lvl].sort((a, b) => a - b));
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                        isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {lvl}-sinf
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowEditClubModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 2. Add Schedule Modal
  function renderAddScheduleModal() {
    if (!showAddScheduleModal || !selectedClubForSchedule) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddScheduleModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col border border-zinc-200/80 animate-fadeIn">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Jadval qo'shish</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">{selectedClubForSchedule.name} to'garagi uchun</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddScheduleModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Hafta kuni *</label>
              <select
                value={newScheduleDay}
                onChange={(e) => setNewScheduleDay(Number(e.target.value))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none cursor-pointer"
              >
                <option value={1}>Dushanba</option>
                <option value={2}>Seshanba</option>
                <option value={3}>Chorshanba</option>
                <option value={4}>Payshanba</option>
                <option value={5}>Juma</option>
                <option value={6}>Shanba</option>
                <option value={7}>Yakshanba</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Boshlanish vaqti *</label>
                <input
                  type="time"
                  required
                  value={newScheduleStartTime}
                  onChange={(e) => setNewScheduleStartTime(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Tugash vaqti *</label>
                <input
                  type="time"
                  required
                  value={newScheduleEndTime}
                  onChange={(e) => setNewScheduleEndTime(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddScheduleModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 3. Club Students Modal
  function renderClubStudentsModal() {
    if (!showClubStudentsModal || !selectedClubForStudents) return null;

    // Combine all students roster
    const studentSourceMap = new Map<number, any>();
    allStudents.forEach((st) => studentSourceMap.set(st.id || st.student_id, st));
    studentsTabList.forEach((st) => {
      const id = st.id || st.student_id;
      if (!studentSourceMap.has(id)) studentSourceMap.set(id, st);
    });
    const combinedStudents = Array.from(studentSourceMap.values());

    // Filter students to directly add (excluding existing club members or pending applicants)
    const filteredToDirectAdd = combinedStudents.filter((st) => {
      const stId = st.id || st.student_id;
      const isMember = clubStudents.some((cs) => cs.student_id === stId || cs.student_id === st.id);
      if (isMember) return false;

      const fullName = `${st.first_name || ""} ${st.last_name || ""} ${st.middle_name || ""}`.toLowerCase();
      const clsName = (st.class_name || "").toLowerCase();
      if (!searchStudentTerm.trim()) return true;
      const q = searchStudentTerm.toLowerCase().trim();
      return fullName.includes(q) || clsName.includes(q);
    });

    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowClubStudentsModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200/80 animate-fadeIn">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">A'zolar va Qo'shilish So'rovlari</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">{selectedClubForStudents.name} to'garagi</p>
            </div>
            <button
              type="button"
              onClick={() => setShowClubStudentsModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-900">
            {/* Direct Add Student Section */}
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">To'g'ridan-to'g'ri o'quvchi qo'shish</h4>
              <div className="flex items-center gap-2 bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2">
                <span className="text-zinc-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={searchStudentTerm}
                  onChange={(e) => setSearchStudentTerm(e.target.value)}
                  placeholder="Ism-familiya bo'yicha qidirish..."
                  className="bg-transparent border-none text-xs text-zinc-800 font-bold outline-none w-full focus:ring-0"
                />
              </div>

              <div className="max-h-44 overflow-y-auto border border-zinc-200/70 rounded-xl bg-white divide-y divide-zinc-100">
                {filteredToDirectAdd.length === 0 ? (
                  <p className="text-xs text-zinc-400 p-3 italic text-center">
                    {searchStudentTerm.trim()
                      ? "Qidiruv bo'yicha o'quvchi topilmadi"
                      : "Barcha o'quvchilar ushbu to'garakka a'zo bo'lgan"}
                  </p>
                ) : (
                  filteredToDirectAdd.map((st) => (
                    <div key={st.id || st.student_id} className="flex items-center justify-between p-2.5 text-xs hover:bg-indigo-50/20 transition">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800">{st.first_name} {st.last_name}</span>
                        {st.class_name && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-50 text-indigo-700 font-mono border border-indigo-100">
                            {st.class_name}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddDirectStudent(st.student_id || st.id)}
                        className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-[10px] py-1 px-3 rounded-lg transition cursor-pointer shadow-xs"
                      >
                        + Qo'shish
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* List of current requests & members */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">To'garakdagilar ro'yxati</h4>
              {clubStudentsLoading ? (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                  <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                </div>
              ) : clubStudents.length === 0 ? (
                <p className="text-xs text-zinc-400 italic text-center py-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">Hozircha a'zolar yoki so'rovlar mavjud emas.</p>
              ) : (
                <div className="border border-zinc-200/70 rounded-2xl overflow-hidden">
                  <table className="min-w-full divide-y divide-zinc-200/70 text-left text-xs bg-white">
                    <thead className="bg-[#fafafa] text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">F.I.SH</th>
                        <th className="px-4 py-2.5">Sinfi</th>
                        <th className="px-4 py-2.5">Holati</th>
                        <th className="px-4 py-2.5 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {clubStudents.map((cs) => (
                        <tr key={cs.id} className="hover:bg-zinc-50/50 transition">
                          <td className="px-4 py-2.5 font-bold text-zinc-900">{cs.student_name}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold text-zinc-500">{cs.class_name}</td>
                          <td className="px-4 py-2.5">
                            {cs.status === "PENDING" ? (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                                Kutilmoqda (Ariza)
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                                A'zo ✓
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right space-x-2">
                            {cs.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleApproveStudent(cs.student_id)}
                                className="text-[10px] bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold py-1 px-2.5 rounded-lg transition cursor-pointer"
                              >
                                Tasdiqlash
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(cs.student_id)}
                              className="text-[10px] bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-bold py-1 px-2.5 rounded-lg transition cursor-pointer"
                            >
                              {cs.status === "PENDING" ? "Rad etish" : "Chiqarish"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-3 border-t border-zinc-100 text-right">
            <button
              onClick={() => setShowClubStudentsModal(false)}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    );
  };

  function renderAddParentModal() {
    if (!showAddParentModal) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddParentModal(false);
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[85vh] text-zinc-900 animate-fadeIn">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Yangi Ota-onani Bog'lash (Qo'shish)</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Ota-onani ro'yxatdan o'tkazish va o'quvchiga biriktirish
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddParentModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            <form onSubmit={handleCreateAndLinkParent} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  O'quvchini tanlang *
                </label>
                <select
                  required
                  value={selectedStudentIdForAdd}
                  onChange={(e) => setSelectedStudentIdForAdd(Number(e.target.value))}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none cursor-pointer"
                >
                  <option value="">-- O'quvchini tanlang --</option>
                  {studentsTabList.map((st) => (
                    <option key={st.id} value={st.id || st.student_id}>
                      {st.first_name} {st.last_name} ({st.phone || "Telefon kiritilmagan"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Ism *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                    placeholder="Masalan: Asror"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Familiya *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentLastName}
                    onChange={(e) => setParentLastName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                    placeholder="Masalan: Karimov"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Otasining ismi (Sharifi)
                  </label>
                  <input
                    type="text"
                    value={parentMiddleName}
                    onChange={(e) => setParentMiddleName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                    placeholder="Sharifini kiriting"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Telefon *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                    placeholder="Telefon raqamini kiriting"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Pasport
                  </label>
                  <input
                    type="text"
                    value={parentPassport}
                    onChange={(e) => setParentPassport(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                    placeholder="AA1234567"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Parol *
                  </label>
                  <input
                    type="password"
                    required
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {actionLoading && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                  <span>Ota-onani bog'lash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  function renderClubGradingModal() {
    if (!showClubGradingModal || !selectedClubForGrading) return null;

    const fetchHistory = async () => {
      if (!selectedClubForGrading) return;
      setClubGradeHistoryLoading(true);
      try {
        const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
        const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
        if (sId) headers["X-School-ID"] = sId;
        const res = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForGrading.id}/grades/history`, { headers });
        if (res.ok) {
          const data = await res.json();
          setClubGradeHistory(Array.isArray(data) ? data : []);
        } else {
          // Fallback: fetch grades for the current date as history
          setClubGradeHistory([]);
        }
      } catch {
        setClubGradeHistory([]);
      } finally {
        setClubGradeHistoryLoading(false);
      }
    };

    const attendanceBadge = (att: string) => {
      if (att === "PRESENT") return <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg">Keldi</span>;
      if (att === "ABSENT") return <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-lg">Kelmadi</span>;
      if (att === "EXCUSED") return <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg">Sababli</span>;
      return null;
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn"
        onClick={(e) => { if (e.target === e.currentTarget) setShowClubGradingModal(false); }}
        onKeyDown={(e) => { if (e.key === "Escape") setShowClubGradingModal(false); }}
      >
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-[#16193E] text-white flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span>To'garak Jurnali va Baholash</span>
              </h3>
              <p className="text-xs text-zinc-400 font-medium">{selectedClubForGrading.name} — {selectedClubForGrading.subject_name}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowClubGradingModal(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-zinc-100 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setClubJournalTab("grade")}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
                clubJournalTab === "grade"
                  ? "border-purple-600 text-purple-700 bg-purple-50/60"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Baholash
            </button>
            <button
              type="button"
              onClick={() => { setClubJournalTab("history"); fetchHistory(); }}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
                clubJournalTab === "history"
                  ? "border-purple-600 text-purple-700 bg-purple-50/60"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              O'tgan Mashg'ulotlar
            </button>
          </div>

          {/* Tab: Grading */}
          {clubJournalTab === "grade" && (
            <form onSubmit={handleSaveClubGradesBatch} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/60 border border-purple-200/60 p-4 rounded-2xl">
                <div>
                  <label className="block text-[10px] font-extrabold text-purple-800 uppercase tracking-wider mb-1.5 font-mono">Mashg'ulot Sanasi</label>
                  <input
                    type="date"
                    required
                    value={clubGradingDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setClubGradingDate(newDate);
                      fetchClubStudentsAndGrades(selectedClubForGrading.id, newDate);
                    }}
                    className="px-3.5 py-2 bg-white border border-purple-300 rounded-xl text-xs font-extrabold text-purple-950 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <span className="text-xs text-purple-700 font-medium max-w-xs bg-purple-50 px-3 py-2 rounded-xl border border-purple-200/60">
                  Sana tanlang va o'quvchilarning davomati va baholarini kiriting.
                </span>
              </div>

              {clubGradingLoading ? (
                <div className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                </div>
              ) : clubGradingStudents.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl text-zinc-500 text-xs font-medium space-y-1">
                  <Users className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="font-bold text-zinc-800">O'quvchilar topilmadi</p>
                  <p>To'garakda hali rasman tasdiqlangan o'quvchilar yo'q. Avval "A'zolar" bo'limidan o'quvchilarni qo'shing.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="p-3 font-extrabold text-zinc-500 uppercase tracking-wide text-[10px]">O'quvchi</th>
                        <th className="p-3 text-center font-extrabold text-zinc-500 uppercase tracking-wide text-[10px]">Davomat</th>
                        <th className="p-3 w-24 font-extrabold text-zinc-500 uppercase tracking-wide text-[10px]">Baho</th>
                        <th className="p-3 font-extrabold text-zinc-500 uppercase tracking-wide text-[10px]">Izoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {clubGradingStudents.map((st, idx) => (
                        <tr key={st.student_id} className="hover:bg-purple-50/30 transition">
                          <td className="p-3 font-bold text-zinc-900">
                            {st.student_name}
                            <span className="block text-[10px] text-zinc-400 font-medium">{st.class_name}</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                              {(["PRESENT", "ABSENT", "EXCUSED"] as const).map((att) => (
                                <button
                                  key={att}
                                  type="button"
                                  onClick={() => setClubGradingStudents((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, attendance: att } : item))
                                  )}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                    st.attendance === att
                                      ? att === "PRESENT" ? "bg-emerald-600 text-white" : att === "ABSENT" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                                      : "text-zinc-500 hover:text-zinc-900"
                                  }`}
                                >
                                  {att === "PRESENT" ? "Keldi" : att === "ABSENT" ? "Kelmadi" : "Sababli"}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="—"
                              value={st.score_value}
                              onChange={(e) => {
                                const val = e.target.value;
                                setClubGradingStudents((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, score_value: val } : item))
                                );
                              }}
                              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-zinc-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-300 text-center"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="Izoh..."
                              value={st.feedback}
                              onChange={(e) => {
                                const val = e.target.value;
                                setClubGradingStudents((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, feedback: val } : item))
                                );
                              }}
                              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 outline-none focus:border-purple-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowClubGradingModal(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingClubGrades || clubGradingStudents.length === 0}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition cursor-pointer shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingClubGrades && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></span>}
                  <Save className="w-3.5 h-3.5" />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab: History */}
          {clubJournalTab === "history" && (
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {clubGradeHistoryLoading ? (
                <div className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-zinc-400 font-mono">Tarix yuklanmoqda...</p>
                </div>
              ) : clubGradeHistory.length === 0 ? (
                <div className="p-10 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                  <History className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="text-sm font-bold text-zinc-700">O'tgan mashg'ulotlar mavjud emas</p>
                  <p className="text-xs text-zinc-400 font-medium mt-1">Hozircha baholangan mashg'ulotlar yo'q yoki API history endpoint mavjud emas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clubGradeHistory.map((session: any, si: number) => (
                    <div key={si} className="border border-zinc-200 rounded-2xl overflow-hidden">
                      <div className="bg-purple-50 border-b border-purple-100 px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-purple-800 flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {new Date(session.lesson_date || session.date || "").toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <span className="text-[10px] font-mono text-purple-600">{session.grades?.length || 0} ta o'quvchi</span>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {(session.grades || []).map((g: any) => (
                          <div key={g.student_id || g.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50/60 transition text-xs">
                            <div>
                              <span className="font-bold text-zinc-900">{g.student_name}</span>
                              <span className="text-zinc-400 ml-2 font-medium">{g.class_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {attendanceBadge(g.attendance)}
                              {g.score_value && (
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                                  Number(g.score_value) >= 5 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  Number(g.score_value) >= 4 ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  Number(g.score_value) >= 3 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-rose-50 text-rose-700 border-rose-200"
                                }`}>{g.score_value}</span>
                              )}
                              {g.feedback && <span className="text-[10px] text-zinc-500 font-medium italic max-w-[120px] truncate">{g.feedback}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderLogoutModal() {
    return (
      <CustomDialogModal
        isOpen={showLogoutModal}
        type="danger"
        title="Tizimdan chiqish"
        message="Haqiqatan ham o'qituvchi portalidan chiqmoqchimisiz?"
        confirmText="Ha, chiqish"
        cancelText="Bekor qilish"
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    );
  }

  function renderTeacherDialogModal() {
    return (
      <CustomDialogModal
        isOpen={teacherDialog.isOpen}
        type={teacherDialog.type}
        title={teacherDialog.title}
        message={teacherDialog.message}
        confirmText={teacherDialog.confirmText}
        cancelText="Bekor qilish"
        onConfirm={teacherDialog.onConfirm}
        onCancel={() => setTeacherDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    );
  }

  // 4. Grade Comment Modal (Multiple Choice Support)
  function renderGradeCommentModal() {
    if (!showGradeCommentModal || !selectedStudentForComment || availableGradeOptions.length === 0) return null;
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowGradeCommentModal(false);
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      >
        <div className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-2xl text-zinc-900 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#16193E] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Baho bo'yicha izoh / xabar</span>
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {selectedStudentForComment.first_name} {selectedStudentForComment.last_name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGradeCommentModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grade Selector Multiple Choice Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Qaysi baholar uchun izoh yozilmoqda (Multiple choice):
              </label>
              {availableGradeOptions.length > 1 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAllGrades}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
                >
                  {selectedGradeColIds.length === availableGradeOptions.length ? "Barchasini bekor qilish" : "Barchasini tanlash"}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableGradeOptions.map((opt) => {
                const isChecked = selectedGradeColIds.includes(opt.colId);
                return (
                  <button
                    key={opt.colId}
                    type="button"
                    onClick={() => handleToggleGradeColId(opt.colId)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2.5 border select-none ${
                      isChecked
                        ? "bg-[#5B50EC] text-white border-[#5B50EC] shadow-xs"
                        : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black border transition ${
                      isChecked ? "bg-white text-[#5B50EC] border-white" : "border-zinc-300 bg-white text-transparent"
                    }`}>
                      ✓
                    </div>
                    <span>{opt.colName}:</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black ${
                      isChecked ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-800"
                    }`}>
                      {opt.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Thread List */}
          <div className="max-h-56 overflow-y-auto space-y-3 p-1">
            {gradeCommentsLoading ? (
              <div className="py-8 text-center text-xs text-zinc-400 font-mono">
                Izohlar yuklanmoqda...
              </div>
            ) : gradeCommentsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-2xl">
                Ushbu baholar uchun hali izoh yozilmagan. Ilk izohni yozing.
              </div>
            ) : (
              gradeCommentsList.map((comm) => (
                <div key={comm.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-zinc-800">
                    <div className="flex items-center gap-2">
                      <span>{comm.author_name || `Foydalanuvchi #${comm.author_id}`}</span>
                      {comm.gradeColName && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 text-[9px] rounded-md font-medium">
                          {comm.gradeColName} ({comm.gradeVal})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono font-normal">
                      {new Date(comm.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-zinc-700 leading-relaxed font-medium">{comm.content}</p>
                </div>
              ))
            )}
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleAddGradeComment} className="pt-2 border-t border-zinc-100 space-y-3">
            <textarea
              required
              rows={2}
              placeholder="Tanlangan baholar bo'yicha izoh yoki ota-onaga bildirishnoma yozing..."
              value={newGradeCommentText}
              onChange={(e) => setNewGradeCommentText(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowGradeCommentModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs"
              >
                Yopish
              </button>
              <button
                type="submit"
                disabled={commentSubmitting || selectedGradeColIds.length === 0}
                className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold rounded-xl text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {commentSubmitting ? "Yuborilmoqda..." : `Izoh Qoldirish (${selectedGradeColIds.length})`}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderTodayLessonsModal() {
    if (!showTodayLessonsModal) return null;
    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowTodayLessonsModal(false);
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
      >
        <div className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-fadeIn space-y-6 text-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#16193E]">Bugungi Darslar</h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  {currentDayNumber}-{currentMonthName}, {currentYear} kungi dars jadvali
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTodayLessonsModal(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lessons List */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 font-mono">Dars Jadvali</h4>
            {todayLessons.length > 0 ? (
              todayLessons.map((lesson, idx) => {
                const borderAccents = ["bg-orange-500", "bg-indigo-600", "bg-emerald-500", "bg-purple-500"];
                const accentColor = borderAccents[idx % borderAccents.length];

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectLessonAndGoToJournal(lesson)}
                    className="bg-zinc-50/80 border border-zinc-200/70 rounded-2xl p-4 relative overflow-hidden flex items-center justify-between transition hover:border-indigo-300 cursor-pointer group"
                  >
                    <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${accentColor}`} />
                    <div className="pl-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-extrabold text-[#16193E] group-hover:text-indigo-600 transition">{lesson.subject_name}</h5>
                        <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                          {lesson.lesson_number}-soat
                        </span>
                      </div>
                      <p className="text-xs font-bold text-indigo-600 flex items-center gap-2">
                        <span>{lesson.class_name}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="font-mono text-zinc-500">{lesson.time}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLessonAndGoToJournal(lesson);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                    >
                      Jurnalni ochish
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-zinc-400 font-medium bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                Bugun darslar mavjud emas
              </div>
            )}

            {/* Teacher Clubs (To'garaklar) Section at bottom of modal */}
            {clubs.length > 0 && (
              <div className="pt-4 border-t border-zinc-100 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#16193E] font-mono">To'garaklar</h4>
                </div>
                <div className="space-y-2">
                  {clubs.map((club, idx) => (
                    <div key={club.id || idx} className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3.5 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-extrabold text-purple-900">{club.name}</h5>
                        <p className="text-[11px] text-purple-600 font-medium">{club.subject_name || "Qo'shimcha dars"}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-purple-200/70 text-purple-900 px-2.5 py-1 rounded-xl">To'garak</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setShowTodayLessonsModal(false)}
              className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 px-5 rounded-xl transition cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    );
  }
}
