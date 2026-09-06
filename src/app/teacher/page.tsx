"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import api from "@/lib/api";
import { formatLocalDate, parseLocalDate } from "@/lib/dateUtils";
import { useRouter, useSearchParams } from "next/navigation";
import TeacherAnnouncementsSection from "@/components/teacher/TeacherAnnouncementsSection";
import SmartCalendarModal from "@/components/SmartCalendarModal";
import CustomDialogModal from "@/components/CustomDialogModal";
import PasswordInput from "@/components/common/PasswordInput";
import TeacherLibrarySection from "@/components/teacher/TeacherLibrarySection";
import DateRangePresets from "@/components/DateRangePresets";
import TeacherSocialPassportSection from "@/components/teacher/TeacherSocialPassportSection";
import LessonPlansSection from "@/components/teacher/LessonPlansSection";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherHeader from "@/components/teacher/TeacherHeader";
import FeedbackTab from "@/components/teacher/FeedbackTab";
import TeacherSettingsTab from "@/components/teacher/TeacherSettingsTab";
import JournalTab from "@/components/teacher/JournalTab";
import ScheduleTab from "@/components/teacher/ScheduleTab";
import StudentsTab from "@/components/teacher/StudentsTab";
import UnapprovedGradesTab from "@/components/teacher/UnapprovedGradesTab";
import ParentsTab from "@/components/teacher/ParentsTab";
import ClubsTab from "@/components/teacher/ClubsTab";
import ChatModal from "@/components/teacher/modals/ChatModal";
import GradeCommentModal from "@/components/teacher/modals/GradeCommentModal";
import ParentsListModal from "@/components/teacher/modals/ParentsListModal";
import { ImportParentsModal } from "@/components/teacher/modals/ImportParentsModal";
import { ImportStudentsModal } from "@/components/teacher/modals/ImportStudentsModal";
import { AddClubModal } from "@/components/teacher/modals/AddClubModal";
import { EditClubModal } from "@/components/teacher/modals/EditClubModal";
import { AddScheduleModal } from "@/components/teacher/modals/AddScheduleModal";
import { ClubStudentsModal } from "@/components/teacher/modals/ClubStudentsModal";
import { AddParentModal } from "@/components/teacher/modals/AddParentModal";
import { ClubGradingModal } from "@/components/teacher/modals/ClubGradingModal";
import useSwipeMobileMenu from "@/hooks/useSwipeMobileMenu";
import { ForcePasswordResetModal } from "@/components/ForcePasswordResetModal";
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
  ChevronDown,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Award,
  CheckCircle2,
  X,
  FileText,
  Clock,
  RotateCcw,
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
  CalendarOff,
} from "lucide-react";

import TransferStudentsModal from "@/components/dashboard/TransferStudentsModal";

interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  school_id: string;
  password_reset_required?: boolean;
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

type TeacherTabType =
  | "dashboard"
  | "journal"
  | "schedule"
  | "lesson-plans"
  | "students"
  | "parents"
  | "unapproved"
  | "feedback"
  | "announcements"
  | "clubs"
  | "books"
  | "social-passport"
  | "settings";

function TeacherDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth States
  const [token, setToken] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Core Data lists
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Teacher navigation view tab synchronized with URL query params (supports mobile back button)
  const tabParam = searchParams.get("tab") as TeacherTabType | null;
  const validTabs: TeacherTabType[] = [
    "dashboard",
    "journal",
    "schedule",
    "lesson-plans",
    "students",
    "parents",
    "unapproved",
    "feedback",
    "announcements",
    "clubs",
    "books",
    "social-passport",
    "settings",
  ];
  const teacherTab: TeacherTabType =
    tabParam && validTabs.includes(tabParam) ? tabParam : "dashboard";

  const hasMainClass = useMemo(() => {
    if (userInfo?.role === "ADMIN") return true;
    return classes.some((c) => c.is_main_teacher);
  }, [classes, userInfo]);

  const mainClasses = useMemo(() => {
    if (userInfo?.role === "ADMIN") return classes;
    return classes.filter((c) => c.is_main_teacher);
  }, [classes, userInfo]);

  const setTeacherTab = (newTab: TeacherTabType | string) => {
    if (!hasMainClass && ["students", "parents", "social-passport"].includes(newTab)) {
      newTab = "dashboard";
    }
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const qs = params.toString();
    router.push(qs ? `/teacher?${qs}` : "/teacher", { scroll: false });
  };

  useEffect(() => {
    if (!loading && !hasMainClass && ["students", "parents", "social-passport"].includes(teacherTab)) {
      setTeacherTab("dashboard");
    }
  }, [loading, hasMainClass, teacherTab]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Default expanded (shows labels/tabs)
  const [tabResetKeys, setTabResetKeys] = useState<Record<string, number>>({});

  // Profile & Settings states
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileOldPassword, setProfileOldPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
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

  const fetchFeedbackFeed = async (_authToken?: string) => {
    setTeacherTab("feedback");
    setFeedbackLoading(true);
    try {
      const data = await api.get("/api/schools/comments/feed");
      setFeedbackFeed(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // All Students state (for teacher targeted announcements)
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const fetchAllStudents = async (_authToken?: string) => {
    try {
      const data = await api.get("/api/schools/users?role=STUDENT");
      setAllStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  // Extracurricular Clubs States
  const [clubs, setClubs] = useState<any[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [openClubMenuId, setOpenClubMenuId] = useState<number | null>(null);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubSubjectId, setNewClubSubjectId] = useState<number | "">("");
  const [newClubAllowedLevels, setNewClubAllowedLevels] = useState<number[]>([]);
  const [newClubExtraStudentIds, setNewClubExtraStudentIds] = useState<number[]>([]);
  const [clubsError, setClubsError] = useState("");
  const [clubsSuccess, setClubsSuccess] = useState("");

  // Close club action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openClubMenuId !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest(`.club-menu-container-${openClubMenuId}`)) {
          setOpenClubMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openClubMenuId]);

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
  const [selectedDashboardDate, setSelectedDashboardDate] = useState<string>(() => formatLocalDate(new Date()));

  const handleOpenDashboardDatePicker = () => {
    setTeacherCalendarTarget("dashboard");
    setIsTeacherCalendarOpen(true);
  };

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
      const [stData, grData] = await Promise.all([
        api.get(`/api/schools/clubs/${clubId}/students`),
        api.get(`/api/schools/clubs/${clubId}/grades?date=${dateStr}`),
      ]);

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
      const payload = {
        lesson_date: clubGradingDate,
        grades: clubGradingStudents.map((st) => ({
          student_id: st.student_id,
          attendance: st.attendance,
          score_value: st.score_value,
          feedback: st.feedback,
        })),
      };

      await api.post(`/api/schools/clubs/${selectedClubForGrading.id}/grades`, payload);
      setToast({ message: "To'garak mashg'uloti baholari va davomati muvaffaqiyatli saqlandi!", type: "success" });
      setShowClubGradingModal(false);
    } catch (err: any) {
      setToast({ message: err.message || "Xatolik yuz berdi", type: "error" });
    } finally {
      setSavingClubGrades(false);
    }
  };

  const fetchClubs = async (_authToken?: string) => {
    setClubsLoading(true);
    try {
      const data = await api.get("/api/schools/clubs");
      setClubs(Array.isArray(data) ? data : []);
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
      await api.post("/api/schools/clubs", {
        name: newClubName.trim(),
        subject_id: Number(newClubSubjectId),
        allowed_class_levels: newClubAllowedLevels,
        extra_student_ids: newClubExtraStudentIds,
      });
      setClubsSuccess("To'garak muvaffaqiyatli yaratildi");
      setNewClubName("");
      setNewClubSubjectId("");
      setNewClubAllowedLevels([]);
      setNewClubExtraStudentIds([]);
      fetchClubs();
      setTimeout(() => setShowAddClubModal(false), 1500);
    } catch (err: any) {
      setClubsError(err.message || "Server bilan bog'lanishda xatolik");
    }
  };

  const fetchClubStudents = async (clubId: number) => {
    setClubStudentsLoading(true);
    try {
      const data = await api.get(`/api/schools/clubs/${clubId}/students`);
      setClubStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setClubStudentsLoading(false);
    }
  };

  const handleAddDirectStudent = async (studentId: number) => {
    if (!selectedClubForStudents) return;
    try {
      await api.post(`/api/schools/clubs/${selectedClubForStudents.id}/add-student`, { student_id: studentId });
      setToast({ message: "O'quvchi to'garakka muvaffaqiyatli qo'shildi", type: "success" });
      fetchClubStudents(selectedClubForStudents.id);
    } catch (err: any) {
      setToast({ message: err.message || "Qo'shishda xatolik", type: "error" });
    }
  };

  const handleApproveStudent = async (studentId: number) => {
    if (!selectedClubForStudents) return;
    try {
      await api.post(`/api/schools/clubs/${selectedClubForStudents.id}/approve-student`, { student_id: studentId });
      setToast({ message: "Qo'shilish so'rovi tasdiqlandi", type: "success" });
      fetchClubStudents(selectedClubForStudents.id);
    } catch (err: any) {
      setToast({ message: err.message || "Tasdiqlashda xatolik", type: "error" });
    }
  };

  const handleRemoveStudent = (studentId: number) => {
    if (!selectedClubForStudents) return;
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "O'quvchini to'garakdan chiqarish",
      message: "Ushbu o'quvchini to'garakdan chiqarmoqchimisiz?",
      confirmText: "Ha, chiqarish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/api/schools/clubs/${selectedClubForStudents.id}/remove-student`, {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: studentId })
          });
          setToast({ message: "O'quvchi to'garakdan chiqarildi", type: "success" });
          fetchClubStudents(selectedClubForStudents.id);
        } catch (err: any) {
          setToast({ message: err.message || "Tarmoq xatoligi", type: "error" });
        }
      },
    });
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubForSchedule) return;
    try {
      await api.post(`/api/schools/clubs/${selectedClubForSchedule.id}/schedules`, {
        day_of_week: Number(newScheduleDay),
        start_time: newScheduleStartTime,
        end_time: newScheduleEndTime,
      });
      fetchClubs();
      setShowAddScheduleModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClubSchedule = (scheduleId: number) => {
    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "Jadvalni o'chirish",
      message: "Haqiqatan ham ushbu jadvalni o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/api/schools/clubs/schedules/${scheduleId}`);
          showToast("success", "Jadval o'chirildi!");
          fetchClubs();
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
      await api.put(`/api/schools/clubs/${editingClub.id}`, payload);
      showToast("success", "To'garak muvaffaqiyatli yangilandi!");
      setShowEditClubModal(false);
      fetchClubs();
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
          await api.delete(`/api/schools/clubs/${clubId}`);
          showToast("success", "To'garak o'chirildi!");
          fetchClubs();
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
      let endpoint = "";
      if (comment.type === "GRADE") {
        endpoint = `/api/schools/grades/${comment.grade_id}/comments`;
      } else {
        const dateStr = comment.menu_date ? comment.menu_date.split("T")[0] : "";
        endpoint = `/api/schools/menu/comments?menu_date=${dateStr}&parent_id=${comment.parent_id}`;
      }
      const data = await api.get(endpoint);
      setChatMessages(Array.isArray(data) ? data : []);
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
      let endpoint = "";
      let body = {};
      if (selectedChatComment.type === "GRADE") {
        endpoint = `/api/schools/grades/${selectedChatComment.grade_id}/comments`;
        body = { content: replyText.trim() };
      } else {
        const dateStr = selectedChatComment.menu_date ? selectedChatComment.menu_date.split("T")[0] : "";
        endpoint = `/api/schools/menu/comments`;
        body = {
          menu_date: dateStr,
          parent_id: selectedChatComment.parent_id,
          content: replyText.trim(),
        };
      }

      await api.post(endpoint, body);
      setReplyText("");
      fetchChatMessages(selectedChatComment);
    } catch (err: any) {
      setReplyError(err.message || "Server bilan bog'lanishda xatolik");
    } finally {
      setReplySubmitLoading(false);
    }
  };



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

  // Today's Lessons States (Backend-driven)
  const [todayLessonsData, setTodayLessonsData] = useState<{
    date: string;
    day_of_week: number;
    is_weekend: boolean;
    is_holiday: boolean;
    holiday_name?: string | null;
    total_lessons: number;
    pending_count: number;
    completed_count: number;
    lessons: Array<{
      lesson_number: number;
      time: string;
      class_id: number;
      class_name: string;
      subject_id: number;
      subject_name: string;
      is_marked: boolean;
      is_fully_marked: boolean;
      marked_students_count: number;
      total_students_count: number;
    }>;
  } | null>(null);
  const [todayLessonsLoading, setTodayLessonsLoading] = useState(false);

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
  const [qaClassOpen, setQaClassOpen] = useState(false);
  const [qaSubjectOpen, setQaSubjectOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Smart Calendar State
  const [isTeacherCalendarOpen, setIsTeacherCalendarOpen] = useState(false);
  const [teacherCalendarTarget, setTeacherCalendarTarget] = useState<"journal" | "schedule" | "exception" | "dashboard">("dashboard");

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
  const [isRedirectingFromUnapproved, setIsRedirectingFromUnapproved] = useState(false);
  const [highlightStudentId, setHighlightStudentId] = useState<number | null>(null);

  // Lesson topic state for current journal view
  const [currentJournalTopic, setCurrentJournalTopic] = useState<string>("");
  const [currentJournalTopicLoading, setCurrentJournalTopicLoading] = useState(false);

  useEffect(() => {
    if (!token || !selectedClassId || !selectedSubjectId || !journalDate) {
      setCurrentJournalTopic("");
      return;
    }

    const fetchCurrentLessonTopic = async () => {
      setCurrentJournalTopicLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("class_id", String(selectedClassId));
        params.append("subject_id", String(selectedSubjectId));
        params.append("start_date_from", journalDate);
        params.append("start_date_to", journalDate);

        const data = await api.get(`/api/schools/lesson-plans?${params.toString()}`);
        if (Array.isArray(data) && data.length > 0) {
          const matched = selectedLessonNumber
            ? data.find((p: any) => p.lesson_number === Number(selectedLessonNumber)) || data[0]
            : data[0];
          setCurrentJournalTopic(matched ? matched.topic_name : "");
        } else {
          setCurrentJournalTopic("");
        }
      } catch (err) {
        console.error("Failed to fetch current lesson topic:", err);
        setCurrentJournalTopic("");
      } finally {
        setCurrentJournalTopicLoading(false);
      }
    };

    fetchCurrentLessonTopic();
  }, [token, selectedClassId, selectedSubjectId, journalDate, selectedLessonNumber]);

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
    enrollment_date: new Date().toISOString().split("T")[0],
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
  const [selectedParentFilterClassId, setSelectedParentFilterClassId] = useState<string | number>("");
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
            const data = await api.get(`/api/schools/grades/${opt.grade.id}/comments`);
            if (Array.isArray(data)) {
              data.forEach((c: any) => {
                allComments.push({ ...c, gradeColName: opt.colName, gradeVal: opt.value });
              });
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
            const createdGrade = await api.post("/api/schools/grades", {
              student_id: selectedStudentForComment.id,
              subject_id: Number(selectedSubjectId),
              lesson_number: Number(selectedLessonNumber),
              grade_type: opt.colId,
              value: opt.value,
              grade_date: journalDate,
              grade_category: selectedGradeCategory || "DAILY",
              grading_system_id: columnGradingSystems[opt.colId] || undefined,
            });
            if (createdGrade && createdGrade.id) {
              targetGradeId = createdGrade.id;
              opt.grade = createdGrade;
            }
          }

          if (targetGradeId) {
            await api.post(`/api/schools/grades/${targetGradeId}/comments`, {
              content: newGradeCommentText.trim(),
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
    try {
      const clsData = await api.get("/api/schools/classes");
      setClasses(Array.isArray(clsData) ? clsData : []);
    } catch (e) {
      console.error("Error fetching classes:", e);
    }
  };

  const loadInitialData = async (_authToken?: string, _currentSchoolId?: string) => {
    setLoading(true);
    try {
      // Load classes
      const clsData = await api.get("/api/schools/classes");
      const classesList = Array.isArray(clsData) ? clsData : [];
      setClasses(classesList);

      // Load subjects
      const subData = await api.get("/api/schools/subjects");
      const subjectsList = Array.isArray(subData) ? subData : [];
      setSubjects(subjectsList);

      // Load active grading system
      const gsData = await api.get("/api/schools/grading-systems/active").catch(() => null);
      if (gsData) setActiveGS(gsData);

      // Load all grading systems
      const gsListData = await api.get("/api/schools/grading-systems").catch(() => []);
      setGradingSystemsList(Array.isArray(gsListData) ? gsListData : []);



      // Load holidays
      await fetchHolidays();
    } catch (e) {
      console.error("Initial load failed", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async (_authToken?: string, _currentSchoolId?: string) => {
    setHolidaysLoading(true);
    try {
      const data = await api.get("/api/schools/holidays");
      if (Array.isArray(data)) {
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

  // Parents tab data load: reload when class filter or active tab changes to "parents"
  useEffect(() => {
    if (token && teacherTab === 'parents') {
      fetchClassParents();
    }
  }, [selectedParentFilterClassId, token, teacherTab]);

  // Unapproved grades tab data load: reload when tab changes
  useEffect(() => {
    if (token && teacherTab === 'unapproved') {
      fetchUnapprovedGrades();
    }
  }, [token, teacherTab, userInfo]);

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
      const data = await api.get(`/api/schools/classes/${selectedClassId}/teachers`);
      setClassTeachers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setClassTeachersLoading(false);
    }
  };

  const fetchClassSchedule = async (targetDate?: string) => {
    if (!selectedClassId) return;
    setClassScheduleLoading(true);
    const dateQuery = targetDate || scheduleViewDate || formatLocalDate(new Date());
    try {
      const data = await api.get(`/api/schools/classes/${selectedClassId}/schedule?date=${dateQuery}&ignore_holiday=true&raw=true`);
      if (Array.isArray(data)) {
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
    if (!classes.length) return;
    setOverallScheduleLoading(true);
    const dateQuery = targetDate || scheduleViewDate || formatLocalDate(new Date());
    try {
      const results: { [key: string]: Array<{ class_id: number; class_name: string; subject_id: number; subject_name: string }> } = {};

      await Promise.all(
        classes.map(async (cls) => {
          try {
            const [schData, tchData] = await Promise.all([
              api.get(`/api/schools/classes/${cls.id}/schedule?date=${dateQuery}&ignore_holiday=true&raw=true`).catch(() => []),
              api.get(`/api/schools/classes/${cls.id}/teachers`).catch(() => []),
            ]);

            const teacherIdStr = String(userInfo?.id);
            const myTeacherSubjects = new Set(
              Array.isArray(tchData)
                ? tchData.filter((t: any) => String(t.teacher_id) === teacherIdStr).map((t: any) => String(t.subject_id))
                : []
            );

            const isMyClass = String(cls.main_teacher_id) === teacherIdStr || cls.is_main_teacher || userInfo?.role === "ADMIN";

            if (Array.isArray(schData)) {
              schData.forEach((item: any) => {
                if (!item.subject_id || item.subject_id === 0) return;
                const isMySubject = myTeacherSubjects.has(String(item.subject_id)) || (isMyClass && myTeacherSubjects.size === 0) || userInfo?.role === "ADMIN" || (cls.subject_id && String(cls.subject_id) === String(item.subject_id)) || (item.teacher_id && String(item.teacher_id) === teacherIdStr);

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

  const fetchTeacherTodayLessons = async (targetDate?: string) => {
    setTodayLessonsLoading(true);
    const dateQuery = targetDate || selectedDashboardDate || formatLocalDate(new Date());
    try {
      const res = await api.get(`/api/schools/teachers/today-lessons?date=${dateQuery}`);
      if (res && typeof res === "object") {
        setTodayLessonsData(res);
      }
    } catch (e) {
      console.error("Error fetching teacher today lessons:", e);
    } finally {
      setTodayLessonsLoading(false);
    }
  };

  useEffect(() => {
    if (token && teacherTab === "dashboard") {
      fetchTeacherTodayLessons(selectedDashboardDate);
    }
  }, [token, teacherTab, selectedDashboardDate]);

  useEffect(() => {
    if (token && teacherTab === "schedule" && !selectedClassId && classes.length > 0) {
      fetchOverallTeacherSchedule(scheduleViewDate);
    }
  }, [token, teacherTab, selectedClassId, scheduleViewDate, classes.length]);

  const fetchScheduleExceptions = async () => {
    if (!selectedClassId) return;
    setScheduleExceptionsLoading(true);
    try {
      const data = await api.get(`/api/schools/classes/${selectedClassId}/schedule-exceptions`);
      setScheduleExceptions(Array.isArray(data) ? data : []);
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
      const data = await api.get(`/api/schools/classes/${selectedClassId}/schedule-periods`);
      setSchedulePeriods(Array.isArray(data) ? data : []);
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
      await api.post(`/api/schools/classes/${selectedClassId}/schedule-exceptions`, payload);
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
          await api.delete(`/api/schools/classes/${selectedClassId}/schedule-exceptions/${exceptionId}`);
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
      await api.post(`/api/schools/classes/${selectedClassId}/schedule`, {
        start_date: scheduleStartDate,
        end_date: scheduleEndDate,
        original_start_date: editingScheduleOriginalStartDate || undefined,
        lessons: lessonsPayload
      });

      showToast("success", "Haftalik dars jadvali muvaffaqiyatli saqlandi!");
      setShowEditScheduleModal(false);
      setScheduleViewDate(scheduleStartDate);
      await fetchSchedulePeriods();
      await fetchClassSchedule(scheduleStartDate);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditScheduleModal = (overrideStart?: string) => {
    setActionError("");

    const targetDate = overrideStart || scheduleViewDate;
    const currentPeriod =
      schedulePeriods.find((p: any) => p.start_date === targetDate || (targetDate >= p.start_date && targetDate <= p.end_date)) ||
      schedulePeriods[0];

    const activeStart =
      overrideStart ||
      currentPeriod?.start_date ||
      (classSchedule.length > 0 && classSchedule[0].start_date) ||
      "2026-09-01";
    const activeEnd =
      currentPeriod?.end_date ||
      (classSchedule.length > 0 && classSchedule[0].end_date) ||
      "2027-05-31";

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
    setEditingScheduleOriginalStartDate(activeStart);
    setScheduleStartDate(activeStart);
    setScheduleEndDate(activeEnd);
    setShowEditScheduleModal(true);
  };

  const handleOpenNewPeriodModal = () => {
    const initialFormState: { [key: string]: number } = {};
    for (let d = 1; d <= 6; d++) {
      for (let l = 1; l <= 8; l++) {
        initialFormState[`${d}-${l}`] = 0;
      }
    }
    setScheduleFormState(initialFormState);
    setActionError("");
    setEditingScheduleOriginalStartDate("");

    if (schedulePeriods.length > 0) {
      const sorted = [...schedulePeriods].sort((a, b) => a.end_date.localeCompare(b.end_date));
      const lastPeriod = sorted[sorted.length - 1];
      if (lastPeriod && lastPeriod.end_date) {
        const nextStart = new Date(lastPeriod.end_date + "T00:00:00");
        nextStart.setDate(nextStart.getDate() + 1);
        const nextEnd = new Date(nextStart);
        nextEnd.setMonth(nextEnd.getMonth() + 2);
        const yyyy1 = nextStart.getFullYear();
        const mm1 = String(nextStart.getMonth() + 1).padStart(2, "0");
        const dd1 = String(nextStart.getDate()).padStart(2, "0");
        const yyyy2 = nextEnd.getFullYear();
        const mm2 = String(nextEnd.getMonth() + 1).padStart(2, "0");
        const dd2 = String(nextEnd.getDate()).padStart(2, "0");
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
  };

  const handleDeleteSchedule = (startDateToDelete?: string) => {
    if (!selectedClassId) return;

    const currentPeriod =
      schedulePeriods.find((p: any) => p.start_date === scheduleViewDate || (scheduleViewDate >= p.start_date && scheduleViewDate <= p.end_date)) ||
      schedulePeriods[0];
    const targetStart = startDateToDelete || currentPeriod?.start_date || (classSchedule.length > 0 && classSchedule[0].start_date) || "";

    const periodLabel = currentPeriod
      ? `(${currentPeriod.start_date} — ${currentPeriod.end_date})`
      : targetStart ? `(${targetStart})` : "";

    setTeacherDialog({
      isOpen: true,
      type: "danger",
      title: "Dars jadvalini o'chirish",
      message: `Haqiqatan ham ushbu ${periodLabel} dars jadvalini o'chirmoqchimisiz? Ushbu davrdagi barcha darslar o'chiriladi.`,
      confirmText: "Ha, o'chirish",
      onConfirm: async () => {
        setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        setActionError("");
        try {
          const deleteUrl = targetStart
            ? `/api/schools/classes/${selectedClassId}/schedule?start_date=${targetStart}`
            : `/api/schools/classes/${selectedClassId}/schedule`;
          await api.delete(deleteUrl);
          showToast("success", "Dars jadvali muvaffaqiyatli o'chirildi!");
          setShowEditScheduleModal(false);
          setClassSchedule([]);
          await fetchSchedulePeriods();
          await fetchClassSchedule();
        } catch (err: any) {
          showToast("error", err.message || "Dars jadvalini o'chirishda xatolik yuz berdi");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const fetchClassData = async () => {
    setDataLoading(true);
    try {
      // Fetch students
      const studData = await api.get(`/api/schools/users?role=STUDENT&class_id=${selectedClassId}`);
      const studentsList = Array.isArray(studData) ? studData.map((u: any) => ({
        id: u.student_id || u.id,
        user_id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        middle_name: u.middle_name,
      })) : [];
      setStudents(studentsList);

      // Fetch grades
      const gradeData = await api.get(`/api/schools/grades?class_id=${selectedClassId}&subject_id=${selectedSubjectId}`);
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
      const [schedData, subData, teacherData, holidayData] = await Promise.all([
        api.get(`/api/schools/classes/${selectedClassId}/schedule?date=${targetDate}`).catch(() => []),
        api.get("/api/schools/subjects").catch(() => []),
        api.get(`/api/schools/classes/${selectedClassId}/teachers`).catch(() => []),
        api.get("/api/schools/holidays").catch(() => [])
      ]);

      if (Array.isArray(subData)) {
        setSubjects(subData);
      }

      let latestClassTeachers = classTeachers;
      if (Array.isArray(teacherData)) {
        latestClassTeachers = teacherData;
        setClassTeachers(teacherData);
      }

      if (Array.isArray(holidayData)) {
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
        if (isRedirectingFromUnapproved) {
          setIsRedirectingFromUnapproved(false);
        } else {
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
      } else {
        if (isRedirectingFromUnapproved) {
          setIsRedirectingFromUnapproved(false);
        }
      }

      // 2. Students for this class
      const studData = await api.get(
        `/api/schools/users?role=STUDENT&class_id=${selectedClassId}&date=${targetDate}`
      ).catch(() => []);
      const studentsList = Array.isArray(studData) ? studData.map((u: any) => ({
        id: u.student_id || u.id,
        user_id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        middle_name: u.middle_name,
      })) : [];
      setStudents(studentsList);

      // 3. All grades for this class
      const gradesData = await api.get(
        `/api/schools/grades?class_id=${selectedClassId}`
      ).catch(() => []);
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
        await api.delete(`/api/schools/grades/${existingGrade.id}`);
        // Update local state
        setJournalAllGrades(prev => prev.filter(g => g.id !== existingGrade.id));
        setCellInputs(prev => ({ ...prev, [key]: '' }));
        showToast('success', 'Baho o\'chirildi');
      } else {
        // Create or Update
        let data;
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
          data = await api.put(`/api/schools/grades/${existingGrade.id}`, gradePayload);
        } else {
          // POST create
          data = await api.post("/api/schools/grades", gradePayload);
        }

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
              await api.delete(`/api/schools/grades/${og.id}`);
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

  // Fetch unapproved (marked) grades globally (for all classes the teacher has access to)
  const fetchUnapprovedGrades = async () => {
    setUnapprovedLoading(true);
    try {
      // 1. Fetch all marked grades
      const data = await api.get(`/api/schools/grades?status=marked`);
      const rawList = Array.isArray(data) ? data : [];

      // 2. Filter out invalid lesson numbers
      const validGrades = rawList.filter((g: any) => g.lesson_number && g.lesson_number > 0);

      // 3. Admin sees all valid marked grades
      if (userInfo && userInfo.role === "ADMIN") {
        setUnapprovedGrades(validGrades);
        return;
      }

      // 4. Teacher sees grades they gave themselves OR grades in classes where they are MAIN_TEACHER
      const metaData = await api.get("/api/schools/lesson-plans/meta").catch(() => ({ classes: [] }));
      const myClasses = Array.isArray(metaData.classes) ? metaData.classes : [];
      const mainTeacherClassIds = myClasses.filter((c: any) => c.is_main_teacher).map((c: any) => c.id);

      const filteredGrades = validGrades.filter((g: any) => {
        const isMyGrade = g.teacher_id === userInfo?.id;
        const isMyMainClass = mainTeacherClassIds.includes(g.class_id);
        return isMyGrade || isMyMainClass;
      });

      setUnapprovedGrades(filteredGrades);
    } catch (e) {
      console.error(e);
    } finally {
      setUnapprovedLoading(false);
    }
  };

  // Students list for CRUD operations
  const fetchStudentsTabList = async () => {
    setStudentsTabLoading(true);
    try {
      const isSelectedClassMain = selectedClassId && mainClasses.some((c) => c.id === Number(selectedClassId));
      const effectiveClassId = isSelectedClassMain ? selectedClassId : (mainClasses[0]?.id || "");

      const url = effectiveClassId
        ? `/api/schools/users?role=STUDENT&class_id=${effectiveClassId}`
        : `/api/schools/users?role=STUDENT`;
      const data = await api.get(url);
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
    const isSelectedClassMain = selectedClassId && mainClasses.some((c) => c.id === Number(selectedClassId));
    const effectiveClassId = isSelectedClassMain ? selectedClassId : (mainClasses[0]?.id || "");
    if (!effectiveClassId) {
      showToast("error", "Sinf rahbari bo'lgan sinf topilmadi");
      return;
    }
    
    const cleanIna = studentForm.ina.trim();
    if (!cleanIna || cleanIna === "-" || cleanIna.toLowerCase() === "yo'q") {
      showToast("error", "O'quvchining I-NA yoki pasport seriya raqami kiritilishi shart");
      return;
    }

    const body: any = {
      first_name: studentForm.first_name.trim(),
      last_name: studentForm.last_name.trim(),
      middle_name: studentForm.middle_name.trim() || undefined,
      phone: studentForm.phone.trim() ? studentForm.phone.trim() : undefined,
      address: studentForm.address.trim() || undefined,
      birthdate: studentForm.birthdate || undefined,
      enrollment_date: studentForm.enrollment_date || new Date().toISOString().split("T")[0],
      ina: cleanIna,
    };

    try {
      if (studentModalMode === "create") {
        body.password = studentForm.password.trim() || "123456";
        await api.post(`/api/schools/classes/${effectiveClassId}/students`, body);
      } else {
        if (studentForm.password.trim()) {
          body.password = studentForm.password.trim();
        }
        await api.put(`/api/schools/students/${editingStudent.student_id || editingStudent.id}`, body);
      }

      showToast("success", studentModalMode === "create" ? "O'quvchi muvaffaqiyatli qo'shildi" : "O'quvchi ma'lumotlari yangilandi");
      setShowStudentModal(false);
      fetchStudentsTabList();
      fetchJournalData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const [showTeacherDeleteStudentModal, setShowTeacherDeleteStudentModal] = useState(false);
  const [teacherDeletingStudentId, setTeacherDeletingStudentId] = useState<number | null>(null);
  const [teacherDeleteLeavingDate, setTeacherDeleteLeavingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [teacherDeleteStudentLoading, setTeacherDeleteStudentLoading] = useState(false);

  // Student soft delete handler
  const handleDeleteStudent = (studentId: number) => {
    setTeacherDeletingStudentId(studentId);
    setTeacherDeleteLeavingDate(new Date().toISOString().split("T")[0]);
    setShowTeacherDeleteStudentModal(true);
  };

  const handleConfirmTeacherDeleteStudent = async () => {
    if (!teacherDeletingStudentId) return;
    setTeacherDeleteStudentLoading(true);
    try {
      const leavingParam = teacherDeleteLeavingDate ? `?leaving_date=${encodeURIComponent(teacherDeleteLeavingDate)}` : "";
      await api.delete(`/api/schools/students/${teacherDeletingStudentId}${leavingParam}`);
      showToast("success", "O'quvchi muvaffaqiyatli o'chirildi");
      setShowTeacherDeleteStudentModal(false);
      setTeacherDeletingStudentId(null);
      fetchStudentsTabList();
      fetchJournalData();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setTeacherDeleteStudentLoading(false);
    }
  };

  // Parent Management API Calls
  const fetchLinkedParents = async (studentId: number) => {
    setLinkedParentsLoading(true);
    try {
      const data = await api.get(`/api/schools/students/${studentId}/parents`);
      setLinkedParents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setLinkedParents([]);
    } finally {
      setLinkedParentsLoading(false);
    }
  };

  const fetchClassParents = async (overrideClassId?: string | number) => {
    setClassParentsLoading(true);
    try {
      if (studentsTabList.length === 0) {
        fetchStudentsTabList();
      }
      const classIdToUse = overrideClassId !== undefined ? overrideClassId : selectedParentFilterClassId;

      const url = classIdToUse
        ? `/api/schools/users?role=PARENT&class_id=${classIdToUse}`
        : `/api/schools/users?role=PARENT`;
      const data = await api.get(url);
      setClassParents(Array.isArray(data) ? data : []);
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
      await api.post(`/api/schools/students/${selectedStudentIdForAdd}/parents`, {
        first_name: parentFirstName.trim(),
        last_name: parentLastName.trim(),
        middle_name: parentMiddleName.trim() || undefined,
        phone: parentPhone.trim(),
        passport: parentPassport.trim() || undefined,
        password: parentPassword,
      });

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
          await api.delete(`/api/schools/students/${studentId}/parents/${parentId}`);
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
      await api.post(`/api/schools/students/${selectedStudentForParents.id || selectedStudentForParents.user_id}/parents`, {
        first_name: parentFirstName.trim(),
        last_name: parentLastName.trim(),
        middle_name: parentMiddleName.trim() || undefined,
        phone: parentPhone.trim(),
        passport: parentPassport.trim() || undefined,
        password: parentPassword,
      });

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
          await api.delete(`/api/schools/students/${selectedStudentForParents.id || selectedStudentForParents.user_id}/parents/${parentId}`);
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
      const data = await api.post("/api/schools/import/parents", formData);

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
    const isSelectedClassMain = selectedClassId && mainClasses.some((c) => c.id === Number(selectedClassId));
    const effectiveClassId = isSelectedClassMain ? selectedClassId : (mainClasses[0]?.id || "");
    if (!effectiveClassId) {
      showToast("error", "Sinf rahbari bo'lgan sinf tanlanmagan");
      return;
    }
    try {
      const url = `${API_URL}/api/schools/import/template/parents?class_id=${effectiveClassId}`;
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
    const isSelectedClassMain = selectedClassId && mainClasses.some((c) => c.id === Number(selectedClassId));
    const effectiveClassId = isSelectedClassMain ? selectedClassId : (mainClasses[0]?.id || "");
    if (!selectedFile || !effectiveClassId) {
      showToast("error", "Fayl yoki sinf rahbari bo'lgan sinf tanlanmagan");
      return;
    }
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const data = await api.post(`/api/schools/import/students?class_id=${effectiveClassId}`, formData);

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
    const isSelectedClassMain = selectedClassId && mainClasses.some((c) => c.id === Number(selectedClassId));
    const effectiveClassId = isSelectedClassMain ? selectedClassId : (mainClasses[0]?.id || "");
    if (!effectiveClassId) {
      showToast("error", "Sinf rahbari bo'lgan sinf tanlanmagan");
      return;
    }
    try {
      const url = `${API_URL}/api/schools/import/template/students?class_id=${effectiveClassId}`;
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
      await api.post("/api/schools/grades/batch", { grades: gradesToSubmit });

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
      const data = await api.post("/api/schools/grades/change-status", {
        mark_uids: Array.from(selectedGradeIds),
        status: "approved",
      });

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
            const createdData = await api.post("/api/schools/grades/batch", { grades: gradesToCreate });
            if (Array.isArray(createdData)) {
              createdData.forEach((g: any) => {
                gradesToApprove.push(g.id);
              });
            }
          }

          if (gradesToApprove.length > 0) {
            await api.post("/api/schools/grades/change-status", {
              mark_uids: gradesToApprove,
              status: "approved",
            });
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
      const data = await api.post("/api/schools/import/grades", formData);

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
        <div className="w-full max-w-5xl bg-white border border-neutral-200 rounded-none p-6 sm:p-8 shadow-2xl my-8 relative text-slate-900 animate-fadeIn space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900">
                {editingScheduleOriginalStartDate ? "Haftalik dars jadvalini tahrirlash" : "Yangi Davr Dars Jadvalini Qo'shish"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
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
              className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-none font-bold">{actionError}</div>
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

            <div className="overflow-x-auto rounded-none border border-neutral-200 bg-white">
              <table className="min-w-full divide-y divide-neutral-200 text-center table-fixed">
                <thead className="bg-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-2 py-3 w-16 bg-slate-100 border-r border-neutral-200">Soat</th>
                    <th className="px-2 py-3 border-r border-neutral-200">Dushanba</th>
                    <th className="px-2 py-3 border-r border-neutral-200">Seshanba</th>
                    <th className="px-2 py-3 border-r border-neutral-200">Chorshanba</th>
                    <th className="px-2 py-3 border-r border-neutral-200">Payshanba</th>
                    <th className="px-2 py-3 border-r border-neutral-200">Juma</th>
                    <th className="px-2 py-3">Shanba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs text-slate-700">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <tr key={period} className="hover:bg-slate-50 transition">
                      <td className="px-2 py-2 font-mono font-bold text-slate-400 bg-slate-50 border-r border-neutral-200">
                        {period}-dars
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((day) => {
                        const slotKey = `${day}-${period}`;
                        const selectedVal = scheduleFormState[slotKey] || 0;
                        return (
                          <td key={day} className="px-1.5 py-2 border-r border-neutral-200 last:border-r-0">
                            <select
                              value={selectedVal}
                              onChange={(e) => {
                                setScheduleFormState((prev) => ({
                                  ...prev,
                                  [slotKey]: Number(e.target.value),
                                }));
                              }}
                              className="w-full bg-white border border-neutral-200 focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42] text-slate-800 rounded-none px-2 py-1.5 text-xs outline-none cursor-pointer font-bold transition"
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

            <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
              <div>
                {editingScheduleOriginalStartDate && (classes.find(c => c.id === selectedClassId)?.is_main_teacher || userInfo?.role === "ADMIN") && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(editingScheduleOriginalStartDate)}
                    disabled={actionLoading}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2.5 px-4 rounded-none transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Jadvalni o'chirish</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditScheduleModal(false);
                    setScheduleFormState({});
                    setActionError("");
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-none transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#1E2B42] hover:bg-slate-700 text-white font-bold py-2.5 px-6 rounded-none transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto text-slate-900"
      >
        <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-none p-6 sm:p-8 shadow-2xl relative animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Kunlik Dars Jadvali O'zgarishi</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tanlangan kun va dars soati uchun bir martalik o'zgarish yoki darsni bekor qilish.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddExceptionModal(false);
                setActionError("");
              }}
              className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-none font-bold">{actionError}</div>
          )}

          <form onSubmit={handleAddExceptionSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Sinf *</label>
              <select
                required
                value={selectedClassId || ""}
                onChange={(e) => {
                  const clsId = e.target.value === "" ? "" : Number(e.target.value);
                  setSelectedClassId(clsId);
                }}
                className="w-full bg-white border border-neutral-200 focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42] text-slate-800 font-bold rounded-none px-3.5 py-2.5 text-xs outline-none transition cursor-pointer"
              >
                <option value="">Sinfni tanlang</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Kun (Sana) *</label>
              <button
                type="button"
                onClick={() => {
                  setTeacherCalendarTarget("exception");
                  setIsTeacherCalendarOpen(true);
                }}
                className="w-full bg-white border border-neutral-200 hover:bg-slate-50 focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42] text-slate-800 font-bold rounded-none px-3.5 py-2.5 text-xs outline-none transition flex items-center justify-between cursor-pointer"
              >
                <span className="font-mono text-xs">
                  {excDate ? (() => {
                    const parts = excDate.split("-");
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : excDate;
                  })() : "Sana tanlang"}
                </span>
                <Calendar className="w-4 h-4 text-[#A51C30]" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Dars soati</label>
              <select
                value={excLesson}
                onChange={(e) => setExcLesson(Number(e.target.value))}
                className="w-full bg-white border border-neutral-200 focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42] text-slate-800 rounded-none px-3.5 py-2.5 text-xs outline-none transition cursor-pointer font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <option key={period} value={period}>{period}-dars</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">O'zgarish turi</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="excType"
                    checked={excType === "replace"}
                    onChange={() => setExcType("replace")}
                    className="text-[#1E2B42] focus:ring-[#1E2B42]"
                  />
                  <span>O'zgartirish / Qo'shimcha fan</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="excType"
                    checked={excType === "cancel"}
                    onChange={() => setExcType("cancel")}
                    className="text-[#1E2B42] focus:ring-[#1E2B42]"
                  />
                  <span>Darsni bekor qilish</span>
                </label>
              </div>
            </div>

            {excType === "replace" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Fan</label>
                <select
                  required={excType === "replace"}
                  value={excSubjectId}
                  onChange={(e) => setExcSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white border border-neutral-200 focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42] text-slate-800 rounded-none px-3.5 py-2.5 text-xs outline-none transition cursor-pointer font-bold"
                >
                  <option value="">Fanni tanlang</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddExceptionModal(false);
                  setActionError("");
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-none transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="text-xs bg-[#A51C30] hover:bg-[#8B1828] text-white font-bold py-2.5 px-6 rounded-none transition cursor-pointer disabled:opacity-50"
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
        className="fixed inset-0 z-50 flex justify-center items-start bg-black/60 backdrop-blur-md p-4 overflow-y-auto text-slate-900"
      >
        <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-none p-6 sm:p-8 shadow-2xl my-8 relative animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Mavjud Dars Jadvallari</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ushbu sinf uchun kiritilgan barcha haftalik dars jadvali davrlari.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPeriodsModal(false)}
              className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {schedulePeriodsLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : schedulePeriods.length === 0 ? (
            <p className="text-slate-400 text-xs font-mono py-6 text-center">Ushbu sinf uchun hech qanday haftalik dars jadvali topilmadi.</p>
          ) : (
            <div className="space-y-3">
              {schedulePeriods.map((period, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-neutral-200 hover:bg-slate-100 transition">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Jadval #{schedulePeriods.length - idx}
                    </span>
                    <p className="text-xs text-slate-900 font-bold mt-1">
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
                    className="text-xs bg-[#1E2B42] hover:bg-slate-700 text-white font-bold py-2 px-3.5 rounded-none transition cursor-pointer"
                  >
                    Tanlash (Ko'rish)
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-neutral-200 mt-4">
            <button
              type="button"
              onClick={() => setShowPeriodsModal(false)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-none transition cursor-pointer"
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      >
        <div className="bg-white border border-neutral-200 max-w-sm w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-neutral-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-lg font-bold font-serif text-[#1E2B42]">
                {studentModalMode === "create" ? "Yangi o'quvchi qo'shish" : "O'quvchi ma'lumotlarini tahrirlash"}
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Barcha kerakli maydonlarni to'ldiring
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowStudentModal(false)}
              className="p-2 bg-white hover:bg-slate-100 border border-neutral-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleStudentFormSubmit} className="p-6 space-y-4 overflow-y-auto bg-white">
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">Familiya *</label>
              <input
                type="text"
                required
                value={studentForm.last_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="Familiyani kiriting"
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">Ism *</label>
              <input
                type="text"
                required
                value={studentForm.first_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="Ismni kiriting"
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">Otasining ismi (sharif)</label>
              <input
                type="text"
                value={studentForm.middle_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, middle_name: e.target.value }))}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="Otasining ismini kiriting"
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">Telefon raqam (Ixtiyoriy)</label>
              <input
                type="text"
                value={studentForm.phone}
                onChange={(e) => setStudentForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="+998901234567"
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">Manzil</label>
              <input
                type="text"
                value={studentForm.address}
                onChange={(e) => setStudentForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="Masalan: Toshkent sh., Chilonzor"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">Tug'ilgan sana</label>
                <input
                  type="date"
                  value={studentForm.birthdate}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, birthdate: e.target.value }))}
                  className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">Maktabga kirish sanasi</label>
                <input
                  type="date"
                  value={studentForm.enrollment_date}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, enrollment_date: e.target.value }))}
                  className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">Guvohnoma (I-NA) yoki Pasport seriyasi *</label>
              <input
                type="text"
                required
                autoComplete="off"
                value={studentForm.ina}
                onChange={(e) => setStudentForm(prev => ({ ...prev, ina: e.target.value }))}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors font-mono font-bold"
                placeholder="I-TV No 123456 yoki AB1234567"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 border border-neutral-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans cursor-pointer transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#A51C30] hover:bg-[#8a1526] text-white text-xs font-bold font-sans cursor-pointer transition"
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

  // ESC key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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
    if (todayLessonsData && Array.isArray(todayLessonsData.lessons)) {
      return todayLessonsData.lessons;
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
    fetchJournalData(targetDate);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F4F5FB] text-zinc-900 flex font-sans relative">
      <TeacherSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        teacherTab={teacherTab}
        setTeacherTab={setTeacherTab}
        userInfo={userInfo}
        unapprovedCount={unapprovedGrades.length}
        hasMainClass={hasMainClass}
        onTabClick={(tabId) => {
          setTabResetKeys((prev) => ({
            ...prev,
            [tabId]: (prev[tabId] || 0) + 1,
          }));

          if (tabId === "students") {
            setStudentsSearch("");
            setStudentsPage(1);
            setShowStudentModal(false);
            setShowImportStudentsModal(false);
            setShowTransferModal(false);
            setSelectedStudentForParents(null);
          } else if (tabId === "parents") {
            setParentsSearch("");
            setParentsPage(1);
            setShowParentsModal(false);
            setShowAddParentModal(false);
            setShowImportParentsModal(false);
            setSelectedStudentForParents(null);
          } else if (tabId === "unapproved") {
            setUnapprovedPage(1);
            setSelectedGradeIds(new Set());
          } else if (tabId === "feedback") {
            setFeedbackSearch("");
            setSelectedChatComment(null);
            setChatModalOpen(false);
            fetchFeedbackFeed(token);
          } else if (tabId === "announcements") {
            fetchAllStudents(token);
          } else if (tabId === "clubs") {
            setSelectedClubForStudents(null);
            setSelectedClubForGrading(null);
            setShowClubStudentsModal(false);
            setShowClubGradingModal(false);
            setShowAddClubModal(false);
            setShowEditClubModal(false);
            setShowAddScheduleModal(false);
            fetchClubs(token);
          } else if (tabId === "schedule") {
            setShowEditScheduleModal(false);
            setShowAddExceptionModal(false);
            setShowPeriodsModal(false);
          } else if (tabId === "journal") {
            fetchJournalData(journalDate);
          } else if (tabId === "dashboard") {
            setSelectedDashboardDate(new Date().toISOString().split("T")[0]);
          }
        }}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
        <TeacherHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userInfo={userInfo || undefined}
          selectedDate={selectedDashboardDate}
          onOpenDatePicker={handleOpenDashboardDatePicker}
          onDateChange={(newDate) => setSelectedDashboardDate(newDate)}
          unapprovedCount={unapprovedGrades.length}
          onOpenUnapproved={() => setTeacherTab("unapproved")}
          showDatePicker={teacherTab === "dashboard"}
        />

        {/* ── JOURNAL QUICK ACCESS BAR (outside scroll → never scrolls horizontally) ── */}
        {teacherTab === "journal" && (() => {
          const qaCls = classes.find((c) => c.id === selectedClassId);
          const qaSubj = selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId) : null;
          const qaClsName = qaCls?.name || "";
          const qaSubjName = qaSubj?.name || "Fan";
          const isJournalSunday = (() => {
            try {
              const d = new Date(journalDate + "T00:00:00");
              return d.getDay() === 0;
            } catch { return false; }
          })();
          const isJournalHoliday = (holidays || []).some((h: any) => {
            const hDate = h.holiday_date ? (typeof h.holiday_date === "string" ? h.holiday_date.split("T")[0] : "") : "";
            if (hDate !== journalDate) return false;
            if (h.target_classes && Array.isArray(h.target_classes) && h.target_classes.length > 0) {
              if (!selectedClassId || !h.target_classes.includes(Number(selectedClassId))) return false;
            }
            return true;
          });
          const isJournalDayOff = isJournalSunday || isJournalHoliday;
          const qaShortDate = (() => {
            try {
              const d = new Date(journalDate + "T00:00:00");
              const m = ["Yan","Fev","Mar","Apr","May","Iyun","Iyul","Avg","Sen","Okt","Noy","Dek"];
              return `${d.getDate()}-${m[d.getMonth()]}`;
            } catch { return journalDate; }
          })();
          const qaLongDate = (() => {
            try {
              const d = new Date(journalDate + "T00:00:00");
              const mNames = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
              const days = ["Yak","Dush","Sesh","Chor","Pay","Jum","Shan"];
              return `${d.getDate()}-${mNames[d.getMonth()]}, ${days[d.getDay()]}`;
            } catch { return journalDate; }
          })();
          return (
            <div className="bg-white border-b border-neutral-200 px-3 py-2.5 sm:px-4 sm:py-3 z-30 flex items-center justify-between gap-1.5 sm:gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                {/* Class Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setQaClassOpen(!qaClassOpen)}
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-neutral-200 px-3 py-2 sm:px-3.5 rounded-none text-xs sm:text-sm font-bold text-slate-800 transition cursor-pointer h-10 sm:h-11"
                  >
                    <span className="hidden sm:inline text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sinf:</span>
                    <span className="font-bold text-slate-900">{qaClsName || "Sinf"}</span>
                    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  {qaClassOpen && (
                    <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-neutral-200 shadow-md rounded-none p-1 z-50 max-h-60 overflow-y-auto">
                      <div className="text-[10px] font-bold text-slate-400 uppercase px-2.5 py-1 tracking-wider">Sinfni tanlang</div>
                      {classes.map((cls) => (
                        <button key={cls.id} type="button"
                          onClick={() => { setSelectedClassId(cls.id); setSelectedSubjectId(""); setSelectedGradeIds(new Set()); setQaClassOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium transition cursor-pointer flex items-center justify-between ${selectedClassId === cls.id ? "bg-[#1E2B42] text-white font-bold" : "hover:bg-slate-100 text-slate-800"}`}
                        >
                          <span>{cls.name}</span>
                          {cls.is_main_teacher && <span className="text-[9px] bg-amber-100 text-amber-900 px-1 font-bold">★</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject Dropdown */}
                {selectedClassId && (
                  <div className="relative shrink-0 min-w-0 max-w-[130px] sm:max-w-none">
                    <button
                      type="button"
                      onClick={() => setQaSubjectOpen(!qaSubjectOpen)}
                      className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-neutral-200 px-3 py-2 sm:px-3.5 rounded-none text-xs sm:text-sm font-bold text-slate-800 transition cursor-pointer truncate h-10 sm:h-11"
                    >
                      <span className="hidden sm:inline text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Fan:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[80px] sm:max-w-none">
                        {selectedSubjectId ? (selectedLessonNumber ? `${selectedLessonNumber}-soat: ${qaSubjName}` : qaSubjName) : "Fan"}
                      </span>
                      <svg className="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {qaSubjectOpen && (
                      <div className="absolute top-full mt-1 left-0 w-64 bg-white border border-neutral-200 shadow-md rounded-none p-1 z-50 max-h-60 overflow-y-auto">
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-2.5 py-1 tracking-wider">Darsni tanlang</div>
                        {journalLessonsToday.length > 0 ? (
                          journalLessonsToday.map((lesson) => {
                            const isSel = selectedSubjectId === lesson.subject_id && selectedLessonNumber === lesson.lesson_number;
                            return (
                              <button key={`${lesson.subject_id}_${lesson.lesson_number}`} type="button"
                                onClick={() => { setSelectedSubjectId(lesson.subject_id); setSelectedLessonNumber(lesson.lesson_number); setQaSubjectOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-medium transition cursor-pointer ${isSel ? "bg-[#A51C30] text-white font-bold" : "hover:bg-slate-100 text-slate-800"}`}
                              >
                                {lesson.lesson_number}-soat: {lesson.subject_name}
                              </button>
                            );
                          })
                        ) : isJournalDayOff ? (
                          <div className="px-3 py-4 text-center text-xs text-slate-500 font-medium">
                            Bugun dam olish kuni. Darslar mavjud emas.
                          </div>
                        ) : (
                          subjects.map((sub) => {
                            const isSel = selectedSubjectId === sub.id;
                            return (
                              <button key={sub.id} type="button"
                                onClick={() => { setSelectedSubjectId(sub.id); setSelectedLessonNumber(""); setQaSubjectOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-medium transition cursor-pointer ${isSel ? "bg-[#A51C30] text-white font-bold" : "hover:bg-slate-100 text-slate-800"}`}
                              >
                                {sub.name}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Date Button */}
                <button type="button"
                  onClick={() => { setTeacherCalendarTarget("journal"); setIsTeacherCalendarOpen(true); }}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-neutral-200 px-3 py-2 sm:px-3.5 rounded-none text-xs sm:text-sm font-bold text-slate-800 transition cursor-pointer shrink-0 h-10 sm:h-11"
                >
                  <svg className="w-4 h-4 text-[#A51C30]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span className="sm:hidden">{qaShortDate}</span>
                  <span className="hidden sm:inline">{qaLongDate}</span>
                </button>
              </div>

              {/* Save Button */}
              {selectedClassId && selectedSubjectId && !isJournalDayOff && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden md:flex items-center gap-1">
                    <select value={selectedGradeCategory} onChange={(e) => setSelectedGradeCategory(e.target.value)}
                      className="bg-slate-50 border border-neutral-200 px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer h-10"
                    >
                      <option value="DAILY">Kundalik</option>
                      <option value="QUARTERLY_EXAM">Choraklik</option>
                      <option value="SEMESTER_EXAM">Imtihon</option>
                    </select>
                  </div>
                  <button type="button"
                    onClick={selectedGradeIds.size > 0 ? handleBulkApprove : handleApproveAllToday}
                    disabled={approveLoading}
                    className="px-3.5 py-2 sm:px-4 bg-[#A51C30] hover:bg-[#8B1828] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 h-10 sm:h-11"
                  >
                    {approveLoading
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    }
                    <span className="hidden sm:inline">{selectedGradeIds.size > 0 ? `Saqlash (${selectedGradeIds.size})` : "Saqlash"}</span>
                    {selectedGradeIds.size > 0 && <span className="sm:hidden text-xs font-bold">{selectedGradeIds.size}</span>}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── FAN/MAVZU CARD (outside scroll → never scrolls horizontally) ── */}
        {teacherTab === "journal" && selectedClassId && selectedSubjectId && (() => {
          const fmCls = classes.find((c) => c.id === selectedClassId);
          const fmSubj = subjects.find((s) => s.id === selectedSubjectId);
          const fmClsName = fmCls?.name || "";
          const fmSubjName = fmSubj?.name || "";
          return (
            <div className="bg-white border-b border-neutral-200 px-3.5 py-2.5 sm:px-4 sm:py-3 text-slate-900 space-y-1 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif font-bold text-slate-900 text-sm sm:text-lg tracking-tight">
                  {fmClsName} • <span className="text-[#A51C30]">{fmSubjName}</span>{" "}
                  {selectedLessonNumber ? `(${selectedLessonNumber}-soat)` : ""}
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-bold font-sans text-slate-500 uppercase tracking-wider">
                  <span>{students.length} TA O'QUVCHI</span>
                  <span>•</span>
                  <span>{selectedGradeCategory === "DAILY" ? "KUNDALIK BAHOLASH" : selectedGradeCategory}</span>
                </div>
              </div>
              <div className="text-xs text-slate-600">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Mavzu: </span>
                {currentJournalTopicLoading ? (
                  <span className="text-slate-400 font-normal">Yuklanmoqda...</span>
                ) : currentJournalTopic ? (
                  <span className="text-slate-900 font-semibold">{currentJournalTopic}</span>
                ) : (
                  <span className="text-slate-400 italic">Mavzu belgilanmagan</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── SCHEDULE QUICK ACCESS BAR (outside scroll → never scrolls horizontally) ── */}
        {teacherTab === "schedule" && (() => {
          if (!hasMainClass) {
            return (
              <div className="bg-white border-b border-neutral-200 px-3 py-2.5 sm:px-4 sm:py-3 z-30 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#A51C30]" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    Mening haftalik dars jadvalim
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-none">
                  Haftalik darslar taqvimi
                </div>
              </div>
            );
          }

          const qaCls = classes.find((c) => c.id === selectedClassId);
          const qaClsName = qaCls?.name || "";
          
          return (
            <div className="bg-white border-b border-neutral-200 px-3 py-2.5 sm:px-4 sm:py-3 z-30 flex items-center justify-between gap-1.5 sm:gap-2.5 shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                {/* Class Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setQaClassOpen(!qaClassOpen)}
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-neutral-200 px-3 py-2 sm:px-3.5 rounded-none text-xs sm:text-sm font-bold text-slate-800 transition cursor-pointer h-10 sm:h-11"
                  >
                    <span className="hidden sm:inline text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sinf:</span>
                    <span className="font-bold text-slate-900">{qaClsName || "Umumiy Jadval"}</span>
                    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  {qaClassOpen && (
                    <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-neutral-200 shadow-md rounded-none p-1 z-50 max-h-60 overflow-y-auto">
                      <div className="text-[10px] font-bold text-slate-400 uppercase px-2.5 py-1 tracking-wider">Sinfni tanlang</div>
                      <button type="button"
                        onClick={() => { setSelectedClassId(""); setQaClassOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition cursor-pointer flex items-center justify-between ${!selectedClassId ? "bg-[#1E2B42] text-white font-bold" : "hover:bg-slate-100 text-slate-800"}`}
                      >
                        <span>Umumiy Jadval</span>
                      </button>
                      {mainClasses.map((cls) => (
                        <button key={cls.id} type="button"
                          onClick={() => { setSelectedClassId(cls.id); setQaClassOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium transition cursor-pointer flex items-center justify-between ${selectedClassId === cls.id ? "bg-[#1E2B42] text-white font-bold" : "hover:bg-slate-100 text-slate-800"}`}
                        >
                          <span>{cls.name}</span>
                          {cls.is_main_teacher && <span className="text-[9px] bg-amber-100 text-amber-900 px-1 font-bold">★ Rahbar</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quarters (Periods) Dropdown */}
                {selectedClassId && schedulePeriods.length > 0 && (
                  <div className="shrink-0 min-w-0 max-w-[130px] sm:max-w-[200px]">
                    <select
                      value={
                        schedulePeriods.some(p => p.start_date === scheduleViewDate)
                          ? scheduleViewDate
                          : (schedulePeriods.find(p => scheduleViewDate >= p.start_date && scheduleViewDate <= p.end_date)?.start_date || schedulePeriods[0]?.start_date || scheduleViewDate)
                      }
                      onChange={(e) => { setScheduleViewDate(e.target.value); fetchClassSchedule(e.target.value); }}
                      className="w-full h-10 sm:h-11 bg-slate-50 hover:bg-slate-100 border border-neutral-200 px-2 sm:px-3 rounded-none text-xs sm:text-sm font-bold text-slate-800 transition cursor-pointer truncate outline-none focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42]"
                    >
                      {schedulePeriods.map((period: any, pIdx: number) => {
                         const shortStart = (() => {
                            try {
                              const d = new Date(period.start_date + "T00:00:00");
                              const m = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
                              return `${d.getDate()}-${m[d.getMonth()]}`;
                            } catch { return period.start_date; }
                         })();
                         const shortEnd = (() => {
                            try {
                              const d = new Date(period.end_date + "T00:00:00");
                              const m = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
                              return `${d.getDate()}-${m[d.getMonth()]}`;
                            } catch { return period.end_date; }
                         })();
                         return (
                           <option key={pIdx} value={period.start_date}>
                             {pIdx + 1}-chorak ({shortStart} - {shortEnd})
                           </option>
                         );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {selectedClassId && (classes.find(c => c.id === selectedClassId)?.is_main_teacher || userInfo?.role === "ADMIN") && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditScheduleModal()}
                      className="bg-[#1E2B42] hover:bg-slate-700 text-white font-bold text-xs px-3 sm:px-3.5 rounded-none transition cursor-pointer flex items-center justify-center gap-1.5 h-10 sm:h-11"
                      title="Sinf haftalik dars jadvalini tahrirlash"
                    >
                      <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Tahrirlash</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleOpenNewPeriodModal}
                      className="bg-[#1E2B42] hover:bg-slate-700 text-white font-bold text-xs px-3 sm:px-3.5 rounded-none transition cursor-pointer flex items-center justify-center gap-1.5 h-10 sm:h-11"
                      title="Yangi chorak yoki vaqt oralig'i qo'shish"
                    >
                      <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Yangi Davr</span>
                    </button>

                    {classSchedule.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule()}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-2.5 sm:px-3 rounded-none transition cursor-pointer flex items-center justify-center gap-1.5 h-10 sm:h-11"
                        title="Ushbu davr dars jadvalini o'chirish"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">O'chirish</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => exceptionsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs px-3 sm:px-3.5 rounded-none transition cursor-pointer flex items-center justify-center gap-1.5 h-10 sm:h-11"
                  title="O'zgarishlar jadvaliga o'tish"
                >
                  <span className="hidden sm:inline">O'zgarishlar ({scheduleExceptions.length})</span>
                  <span className="sm:hidden font-mono font-bold text-xs">{scheduleExceptions.length}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Scrollable Content Workspace */}
        <div className="flex-1 overflow-auto min-w-0">
          <main className={`flex-1 ${teacherTab === "journal" ? "p-0 sm:p-6 lg:p-8" : "p-3.5 sm:p-6 lg:p-8"} pb-32`}>
          {/* TAB CONTENT: Authentic Harvard Editorial Dashboard */}
          {teacherTab === "dashboard" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* 1. Harvard Academic Header & Summary (Visible ONLY on Desktop) */}
              <div className="hidden md:flex bg-white border border-neutral-200 rounded-none p-5 sm:p-6 shadow-none flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold font-sans text-slate-500 uppercase tracking-widest block">
                    O'QITUVCHI BOSHQARUV PANELI
                  </span>
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    Xush kelibsiz, <span className="text-[#A51C30]">{userInfo?.first_name || "O'qituvchi"}</span>!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-normal">
                    Bugun: <span className="font-bold text-slate-800">{(() => {
                      const d = parseLocalDate(selectedDashboardDate);
                      const mNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
                      return `${d.getDate()}-${mNames[d.getMonth()]}, ${d.getFullYear()}`;
                    })()}</span> • {classes.length} ta sinf biriktirilgan
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleOpenDashboardDatePicker}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-neutral-200 text-xs font-bold font-sans uppercase tracking-wider transition flex items-center gap-2 cursor-pointer rounded-none"
                    title="Sana tanlash"
                  >
                    <Calendar className="w-4 h-4 text-[#A51C30]" />
                    <span>Sana: {(() => {
                      try {
                        const d = parseLocalDate(selectedDashboardDate);
                        const mNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
                        return `${d.getDate()}-${mNames[d.getMonth()]}, ${d.getFullYear()}`;
                      } catch {
                        return selectedDashboardDate;
                      }
                    })()}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherTab("journal")}
                    className="px-4 py-2 bg-[#1E2B42] hover:bg-[#141E2E] text-white text-xs font-bold font-sans uppercase tracking-wider transition flex items-center gap-2 cursor-pointer rounded-none"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Jurnalga O'tish</span>
                  </button>
                </div>
              </div>

              {/* 2. Bugungi Darslar (Today's Lessons) - High-Performance Backend-Driven Cards */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs font-bold font-sans text-slate-700 uppercase tracking-widest">
                      BUGUNGI DARSLAR ({todayLessons.length} TA)
                    </span>
                    {todayLessonsData && todayLessons.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {todayLessonsData.pending_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold font-sans bg-rose-50 text-rose-700 border border-rose-200 rounded-none uppercase">
                            {todayLessonsData.pending_count} ta kutilmoqda
                          </span>
                        )}
                        {todayLessonsData.completed_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold font-sans bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none uppercase">
                            {todayLessonsData.completed_count} ta bajarildi
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTeacherTab("schedule")}
                    className="text-xs font-bold font-sans text-[#A51C30] hover:underline cursor-pointer tracking-wide uppercase"
                  >
                    Haftalik to'liq reja →
                  </button>
                </div>

                {(() => {
                  const isHoliday = todayLessonsData?.is_holiday || Boolean(
                    (holidays || []).find((h: any) => {
                      const hDate = h.holiday_date ? h.holiday_date.split("T")[0] : "";
                      return hDate === selectedDashboardDate;
                    })
                  );

                  const isSunday = todayLessonsData?.is_weekend || (() => {
                    try {
                      const d = parseLocalDate(selectedDashboardDate);
                      return d.getDay() === 0;
                    } catch {
                      return false;
                    }
                  })();

                  if (isHoliday || isSunday) {
                    const holidayObj = (holidays || []).find((h: any) => {
                      const hDate = h.holiday_date ? h.holiday_date.split("T")[0] : "";
                      return hDate === selectedDashboardDate;
                    });
                    const hName = todayLessonsData?.holiday_name || holidayObj?.name || "Maktab Ta'tili";

                    return (
                      <div className="w-full bg-white border border-neutral-200 rounded-none p-8 sm:p-12 text-center space-y-3 shadow-none">
                        <CalendarOff className="w-8 h-8 text-[#A51C30] mx-auto" />
                        <span className="inline-block text-[11px] font-bold font-sans text-slate-500 uppercase tracking-widest">
                          Dam Olish Kuni
                        </span>
                        <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                          {isHoliday ? hName : "Yakshanba — Dam Olish Kuni"}
                        </h3>
                        <p className="text-sm text-slate-600 font-normal leading-relaxed max-w-md mx-auto">
                          {isHoliday
                            ? "Admin tomonidan ushbu sana dam olish kuni deb belgilangan."
                            : "Bugun dam olish kuni. Darslar va baholash o'tkazilmaydi."}
                        </p>
                        {selectedDashboardDate !== formatLocalDate(new Date()) && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDashboardDate(formatLocalDate(new Date()))}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E2B42] text-white text-xs font-bold font-sans uppercase tracking-wider rounded-none cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Bugungi kunga qaytish</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (todayLessonsLoading) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-white border border-neutral-200 p-4 h-32 animate-pulse flex flex-col justify-between">
                            <div className="h-3 bg-neutral-100 w-2/3"></div>
                            <div className="h-5 bg-neutral-100 w-1/2"></div>
                            <div className="h-3 bg-neutral-100 w-1/3"></div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (todayLessons.length > 0) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {todayLessons.map((lesson: any, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectLessonAndGoToJournal(lesson)}
                            className="bg-white border border-neutral-200 hover:border-neutral-400 p-3.5 sm:p-4 cursor-pointer group rounded-none shadow-none transition-all flex flex-col justify-between space-y-3"
                          >
                            {/* Top Meta */}
                            <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold font-sans uppercase tracking-wider text-slate-500 border-b border-neutral-100 pb-2">
                              <span className="flex items-center gap-1.5 truncate">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{lesson.lesson_number}-SOAT DARSI</span>
                              </span>
                              <span className="text-slate-600 font-semibold shrink-0">{lesson.class_name} SINFI</span>
                            </div>

                            {/* Subject Headline */}
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-serif font-normal text-base sm:text-lg text-[#A51C30] group-hover:underline tracking-tight truncate">
                                  {lesson.subject_name}
                                </h3>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#A51C30] group-hover:translate-x-0.5 transition-all shrink-0" />
                              </div>
                              <p className="text-[11px] font-mono text-slate-400 font-medium">{lesson.time}</p>
                            </div>

                            {/* Marking Status Badge */}
                            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                              {lesson.is_fully_marked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase font-sans">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Bajarildi ({lesson.marked_students_count}/{lesson.total_students_count})</span>
                                </span>
                              ) : lesson.is_marked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold uppercase font-sans">
                                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Qisman ({lesson.marked_students_count}/{lesson.total_students_count})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase font-sans">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                  <span>Kiritilmagan ({lesson.marked_students_count || 0}/{lesson.total_students_count || 0})</span>
                                </span>
                              )}
                              <span className="text-[11px] font-bold font-sans text-slate-400 group-hover:text-slate-700 transition">
                                Jurnal →
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div className="w-full bg-white border border-neutral-200 rounded-none p-8 sm:p-12 text-center space-y-2 shadow-none">
                      <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                      <span className="inline-block text-[11px] font-bold font-sans text-slate-500 uppercase tracking-widest">
                        Darslar Rejasi
                      </span>
                      <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">Bugun darslar belgilanmagan</h3>
                      <p className="text-sm text-slate-600 font-normal max-w-md mx-auto leading-relaxed">Ushbu kunda sizning dars jadvalingizda darslar mavjud emas.</p>
                      {selectedDashboardDate !== formatLocalDate(new Date()) && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDashboardDate(formatLocalDate(new Date()))}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E2B42] text-white text-xs font-bold font-sans uppercase tracking-wider rounded-none cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Bugungi kunga qaytish</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 3. Boshqarayotgan Sinflarim (2 Columns on Mobile, Star Icon) */}
              <div className="space-y-3 pt-2">
                <div className="border-b border-neutral-200 pb-2">
                  <span className="text-[11px] sm:text-xs font-bold font-sans text-slate-700 uppercase tracking-widest">
                    BOSHQARAYOTGAN SINFLARIM ({classes.length} TA)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        if (cls.subject_id) setSelectedSubjectId(cls.subject_id);
                        setJournalDate(selectedDashboardDate);
                        setTeacherTab("journal");
                        fetchJournalData(selectedDashboardDate);
                      }}
                      className="bg-white border border-neutral-200 hover:border-neutral-400 p-3.5 sm:p-4 cursor-pointer group rounded-none shadow-none transition-colors flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-bold font-sans uppercase tracking-wider text-slate-500 border-b border-neutral-100 pb-2">
                        <span>MAKTAB SINFI</span>
                        {cls.is_main_teacher && (
                          <span className="text-[#A51C30] text-sm leading-none font-bold" title="Sinf Rahbari">
                            ★
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2.5">
                        <h3 className="font-serif font-normal text-base sm:text-lg text-[#A51C30] group-hover:underline tracking-tight truncate">
                          {cls.name} SINFI
                        </h3>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#A51C30] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Grading Journal — Daily Grid */}
          {teacherTab === "journal" && (
            <JournalTab
              key={`journal-${tabResetKeys["journal"] || 0}`}
              selectedClassId={selectedClassId}
              classes={classes}
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              selectedLessonNumber={selectedLessonNumber}
              journalDate={journalDate}
              currentJournalTopic={currentJournalTopic}
              currentJournalTopicLoading={currentJournalTopicLoading}
              selectedGradeCategory={selectedGradeCategory}
              setSelectedGradeCategory={setSelectedGradeCategory}
              students={students}
              holidays={holidays}
              journalLoading={journalLoading}
              classSchedule={classSchedule}
              journalAllGrades={journalAllGrades}
              journalColumns={journalColumns}
              columnGradingSystems={columnGradingSystems}
              gradingSystemsList={gradingSystemsList}
              cellInputs={cellInputs}
              setCellInputs={setCellInputs}
              cellSaving={cellSaving}
              selectedGradeIds={selectedGradeIds}
              setSelectedGradeIds={setSelectedGradeIds}
              onAddJournalColumn={handleAddJournalColumn}
              onRemoveJournalColumn={handleRemoveJournalColumn}
              onColumnGradingSystemChange={handleColumnGradingSystemChange}
              onCellSave={handleCellSave}
              onOpenCalendar={() => {
                setTeacherCalendarTarget("journal");
                setIsTeacherCalendarOpen(true);
              }}
              onOpenStudentCommentModal={handleOpenStudentCommentModal}
              findGradeForDayAndType={findGradeForDayAndType}
              highlightStudentId={highlightStudentId}
              clearHighlightStudentId={() => setHighlightStudentId(null)}
              onSelectClass={(clsId) => {
                setSelectedClassId(clsId ? Number(clsId) : "");
                setSelectedSubjectId("");
                setSelectedGradeIds(new Set());
              }}
              onSelectSubject={(subId, lessonNum) => {
                setSelectedSubjectId(subId ? Number(subId) : "");
                setSelectedLessonNumber(lessonNum ? Number(lessonNum) : "");
              }}
              journalLessonsToday={journalLessonsToday}
              onSave={selectedGradeIds.size > 0 ? handleBulkApprove : handleApproveAllToday}
              saveLoading={approveLoading}
            />
          )}

          {/* TAB CONTENT: Class Schedule */}
          {teacherTab === "schedule" && (
            <ScheduleTab
              key={`schedule-${tabResetKeys["schedule"] || 0}`}
              selectedClassId={hasMainClass ? selectedClassId : ""}
              classes={classes}
              isMainTeacherOfClass={isMainTeacherOfClass}
              userInfo={userInfo}
              classTeachers={classTeachers}
              schedulePeriods={schedulePeriods}
              scheduleViewDate={scheduleViewDate}
              onSelectPeriodDate={(startDate) => {
                setScheduleViewDate(startDate);
                fetchClassSchedule(startDate);
              }}
              onOpenEditScheduleModal={() => handleOpenEditScheduleModal()}
              onOpenNewPeriodModal={handleOpenNewPeriodModal}
              overallSchedule={overallSchedule}
              overallScheduleLoading={overallScheduleLoading}
              classSchedule={classSchedule}
              classScheduleLoading={classScheduleLoading}
              exceptionsSectionRef={exceptionsSectionRef}
              onOpenAddExceptionModal={() => {
                setExcDate(new Date().toISOString().split("T")[0]);
                setExcLesson(1);
                setExcType("replace");
                setExcSubjectId("");
                setActionError("");
                setShowAddExceptionModal(true);
              }}
              scheduleExceptions={scheduleExceptions}
              scheduleExceptionsLoading={scheduleExceptionsLoading}
              onDeleteException={handleDeleteException}
              hasMainClass={hasMainClass}
            />
          )}

          {/* TAB CONTENT: Student Management */}
          {teacherTab === "students" && (
            <StudentsTab
              key={`students-${tabResetKeys["students"] || 0}`}
              selectedClassId={selectedClassId}
              studentsTabList={studentsTabList}
              studentsTabLoading={studentsTabLoading}
              studentsSearch={studentsSearch}
              setStudentsSearch={setStudentsSearch}
              studentsPage={studentsPage}
              setStudentsPage={setStudentsPage}
              studentsPageSize={studentsPageSize}
              setStudentsPageSize={setStudentsPageSize}
              onOpenTransferModal={() => setShowTransferModal(true)}
              onOpenImportStudentsModal={() => {
                setSelectedFile(null);
                setImportResult(null);
                setImportError("");
                setShowImportStudentsModal(true);
              }}
              onOpenCreateStudentModal={() => {
                setStudentModalMode("create");
                setStudentForm({
                  first_name: "",
                  last_name: "",
                  middle_name: "",
                  phone: "",
                  password: "123456",
                  address: "",
                  birthdate: "",
                  enrollment_date: new Date().toISOString().split("T")[0],
                  ina: "",
                });
                setShowStudentModal(true);
              }}
              onOpenParentsModal={(st) => {
                setSelectedStudentForParents(st);
                setParentFirstName("");
                setParentLastName("");
                setParentMiddleName("");
                setParentPhone("");
                setParentEmail("");
                setParentPassword("password123");
                fetchLinkedParents(Number(st.id || st.student_id));
                setShowParentsModal(true);
              }}
              onOpenEditStudentModal={(st) => {
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
                  enrollment_date: st.enrollment_date
                    ? st.enrollment_date.split("T")[0]
                    : st.created_at
                    ? st.created_at.split("T")[0]
                    : new Date().toISOString().split("T")[0],
                  ina: st.ina || "",
                });
                setShowStudentModal(true);
              }}
              onDeleteStudent={handleDeleteStudent}
            />
          )}

          {/* TAB CONTENT: Unapproved Grades List */}
          {teacherTab === "unapproved" && (
            <UnapprovedGradesTab
              key={`unapproved-${tabResetKeys["unapproved"] || 0}`}
              selectedClassId={selectedClassId}
              selectedSubjectId={selectedSubjectId}
              unapprovedGrades={unapprovedGrades}
              unapprovedLoading={unapprovedLoading}
              selectedGradeIds={selectedGradeIds}
              setSelectedGradeIds={setSelectedGradeIds}
              unapprovedPage={unapprovedPage}
              setUnapprovedPage={setUnapprovedPage}
              unapprovedPageSize={unapprovedPageSize}
              setUnapprovedPageSize={setUnapprovedPageSize}
              onApproveBatch={async () => {
                try {
                  const response = await fetch(`${API_URL}/api/schools/grades/change-status`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
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
              onApproveSingle={async (gId) => {
                try {
                  const response = await fetch(`${API_URL}/api/schools/grades/change-status`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      mark_uids: [gId],
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
              onDeleteSingle={(gId) => {
                setTeacherDialog({
                  isOpen: true,
                  type: "danger",
                  title: "Bahoni o'chirish",
                  message: "Haqiqatan ham bu bahoni o'chirmoqchimisiz?",
                  confirmText: "Ha, o'chirish",
                  onConfirm: async () => {
                    setTeacherDialog((prev) => ({ ...prev, isOpen: false }));
                    try {
                      const response = await fetch(`${API_URL}/api/schools/grades/${gId}`, {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${token}`,
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
              onSelectGrade={(g) => {
                if (!g) return;
                setIsRedirectingFromUnapproved(true);
                setHighlightStudentId(g.student_id || null);
                if (g.class_id) {
                  setSelectedClassId(g.class_id);
                }
                if (g.subject_id) {
                  setSelectedSubjectId(g.subject_id);
                }
                if (g.grade_date) {
                  const dateStr = typeof g.grade_date === "string"
                    ? g.grade_date.split("T")[0]
                    : formatLocalDate(new Date(g.grade_date));
                  setJournalDate(dateStr);
                  setSelectedDashboardDate(dateStr);
                }
                if (g.lesson_number) {
                  setSelectedLessonNumber(g.lesson_number);
                }
                if (g.grade_category || g.grade_type) {
                  setSelectedGradeCategory(g.grade_category || g.grade_type || "ACADEMIC");
                }
                setTeacherTab("journal");
              }}
            />
          )}

          {/* TAB CONTENT: Feedback / Comments Feed */}
          {teacherTab === "feedback" && (
              <FeedbackTab
                key={`feedback-${tabResetKeys["feedback"] || 0}`}
                feedbackFeed={feedbackFeed}
                feedbackLoading={feedbackLoading}
                onOpenChat={(rep) => {
                  setSelectedChatComment(rep);
                  setReplyText("");
                  setReplyError("");
                  setChatModalOpen(true);
                  fetchChatMessages(rep);
                }}
              />
            )}

            {/* TAB CONTENT: Announcements */}
            {teacherTab === "announcements" && (
              <TeacherAnnouncementsSection
                key={`announcements-${tabResetKeys["announcements"] || 0}`}
                token={token}
                classes={classes}
                students={allStudents}
                apiUrl={API_URL}
                isTeacher={true}
                currentUserId={userInfo?.id}
              />
            )}
            {/* TAB CONTENT: Parents List */}
            {teacherTab === "parents" && (
              <ParentsTab
                key={`parents-${tabResetKeys["parents"] || 0}`}
                selectedClassId={selectedClassId}
                classParents={classParents}
                classParentsLoading={classParentsLoading}
                parentsSearch={parentsSearch}
                setParentsSearch={setParentsSearch}
                parentsPage={parentsPage}
                setParentsPage={setParentsPage}
                parentsPageSize={parentsPageSize}
                setParentsPageSize={setParentsPageSize}
                mainClasses={mainClasses}
                selectedFilterClassId={selectedParentFilterClassId}
                onSelectFilterClass={(newCid) => {
                  setSelectedParentFilterClassId(newCid);
                  fetchClassParents(newCid);
                }}
                onRefreshParents={() => fetchClassParents(selectedParentFilterClassId)}
                onOpenImportParentsModal={() => {
                  setSelectedFile(null);
                  setImportResult(null);
                  setImportError("");
                  setShowImportParentsModal(true);
                }}
                onOpenAddParentModal={() => {
                  setParentFirstName("");
                  setParentLastName("");
                  setParentMiddleName("");
                  setParentPhone("");
                  setParentEmail("");
                  setParentPassword("password123");
                  setSelectedStudentIdForAdd("");
                  setShowAddParentModal(true);
                }}
                onUnlinkParentFromStudent={handleUnlinkParentFromStudent}
              />
            )}

            {/* TAB CONTENT: Extracurricular Clubs */}
            {teacherTab === "clubs" && (
              <ClubsTab
                key={`clubs-${tabResetKeys["clubs"] || 0}`}
                clubs={clubs}
                clubsLoading={clubsLoading}
                openClubMenuId={openClubMenuId}
                setOpenClubMenuId={setOpenClubMenuId}
                onOpenAddClubModal={() => {
                  setClubsError("");
                  setClubsSuccess("");
                  setNewClubName("");
                  setNewClubSubjectId("");
                  setNewClubAllowedLevels([]);
                  setNewClubExtraStudentIds([]);
                  setShowAddClubModal(true);
                }}
                onOpenEditClubModal={(club) => {
                  setOpenClubMenuId(null);
                  setEditingClub(club);
                  setEditClubName(club.name);
                  setEditClubSubjectId(club.subject_id);
                  setEditClubAllowedLevels(club.allowed_class_levels || []);
                  setActionError("");
                  setShowEditClubModal(true);
                }}
                onDeleteClub={handleDeleteClub}
                onOpenClubStudentsModal={(club) => {
                  setOpenClubMenuId(null);
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
                onOpenAddScheduleModal={(club) => {
                  setOpenClubMenuId(null);
                  setSelectedClubForSchedule(club);
                  setNewScheduleDay(1);
                  setNewScheduleStartTime("14:00");
                  setNewScheduleEndTime("15:30");
                  setShowAddScheduleModal(true);
                }}
                onOpenClubGradingModal={(club) => {
                  setOpenClubMenuId(null);
                  setSelectedClubForGrading(club);
                  const today = new Date().toISOString().split("T")[0];
                  setClubGradingDate(today);
                  setClubJournalTab("grade");
                  setClubGradeHistory([]);
                  fetchClubStudentsAndGrades(club.id, today);
                  setShowClubGradingModal(true);
                }}
                onDeleteSchedule={handleDeleteClubSchedule}
              />
            )}

            {/* TAB CONTENT: Lesson Plans (Dars Ish Rejalari) */}
            {teacherTab === "lesson-plans" && (
              <LessonPlansSection
                key={`lp-${tabResetKeys["lesson-plans"] || 0}`}
                token={token}
                API_URL={API_URL}
                classes={classes}
                subjects={subjects}
                userInfo={userInfo}
              />
            )}

            {/* TAB CONTENT: Library & Reading Assignments */}
            {teacherTab === "books" && <TeacherLibrarySection key={`books-${tabResetKeys["books"] || 0}`} />}

            {/* TAB CONTENT: Ijtimoiy Pasport Import */}
            {teacherTab === "social-passport" && (
              <TeacherSocialPassportSection
                key={`sp-${tabResetKeys["social-passport"] || 0}`}
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
              <TeacherSettingsTab
                key={`settings-${tabResetKeys["settings"] || 0}`}
                token={token}
                API_URL={API_URL}
                userInfo={userInfo}
                setUserInfo={setUserInfo}
                setToast={setToast}
                onLogoutClick={() => setShowLogoutModal(true)}
              />
            )}
        </main>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 border shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 max-w-sm ${
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

      {renderEditWeeklyScheduleModal()}
      {renderAddExceptionModal()}
      {renderPeriodsModal()}
      {renderStudentModal()}
      <ImportParentsModal
        isOpen={showImportParentsModal}
        onClose={() => setShowImportParentsModal(false)}
        onDownloadTemplate={downloadParentsTemplate}
        onSubmit={handleParentsExcelImport}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        importLoading={importLoading}
        importError={importError}
        importResult={importResult}
      />

      <ImportStudentsModal
        isOpen={showImportStudentsModal}
        onClose={() => setShowImportStudentsModal(false)}
        onDownloadTemplate={downloadStudentsTemplate}
        onSubmit={handleStudentsExcelImport}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        importLoading={importLoading}
        importError={importError}
        importResult={importResult}
      />

      <AddParentModal
        isOpen={showAddParentModal}
        onClose={() => setShowAddParentModal(false)}
        onSubmit={handleCreateAndLinkParent}
        studentsTabList={studentsTabList}
        selectedStudentIdForAdd={selectedStudentIdForAdd}
        setSelectedStudentIdForAdd={setSelectedStudentIdForAdd}
        parentFirstName={parentFirstName}
        setParentFirstName={setParentFirstName}
        parentLastName={parentLastName}
        setParentLastName={setParentLastName}
        parentMiddleName={parentMiddleName}
        setParentMiddleName={setParentMiddleName}
        parentPhone={parentPhone}
        setParentPhone={setParentPhone}
        parentPassport={parentPassport}
        setParentPassport={setParentPassport}
        parentPassword={parentPassword}
        setParentPassword={setParentPassword}
        actionLoading={actionLoading}
      />

      <AddClubModal
        isOpen={showAddClubModal}
        onClose={() => setShowAddClubModal(false)}
        onSubmit={handleCreateClub}
        newClubName={newClubName}
        setNewClubName={setNewClubName}
        newClubSubjectId={newClubSubjectId}
        setNewClubSubjectId={setNewClubSubjectId}
        newClubAllowedLevels={newClubAllowedLevels}
        setNewClubAllowedLevels={setNewClubAllowedLevels}
        subjects={subjects}
        clubsError={clubsError}
        clubsSuccess={clubsSuccess}
      />

      <EditClubModal
        isOpen={showEditClubModal}
        onClose={() => setShowEditClubModal(false)}
        editingClub={editingClub}
        editClubName={editClubName}
        setEditClubName={setEditClubName}
        editClubSubjectId={editClubSubjectId}
        setEditClubSubjectId={setEditClubSubjectId}
        editClubAllowedLevels={editClubAllowedLevels}
        setEditClubAllowedLevels={setEditClubAllowedLevels}
        subjects={subjects}
        actionLoading={actionLoading}
        actionError={actionError}
        onSubmit={handleEditClubSubmit}
      />

      <AddScheduleModal
        isOpen={showAddScheduleModal}
        onClose={() => setShowAddScheduleModal(false)}
        selectedClubForSchedule={selectedClubForSchedule}
        newScheduleDay={newScheduleDay}
        setNewScheduleDay={setNewScheduleDay}
        newScheduleStartTime={newScheduleStartTime}
        setNewScheduleStartTime={setNewScheduleStartTime}
        newScheduleEndTime={newScheduleEndTime}
        setNewScheduleEndTime={setNewScheduleEndTime}
        onSubmit={handleAddSchedule}
      />

      <ClubStudentsModal
        isOpen={showClubStudentsModal}
        onClose={() => setShowClubStudentsModal(false)}
        selectedClubForStudents={selectedClubForStudents}
        searchStudentTerm={searchStudentTerm}
        setSearchStudentTerm={setSearchStudentTerm}
        filteredToDirectAdd={(() => {
          const studentSourceMap = new Map<number, any>();
          allStudents.forEach((st) => studentSourceMap.set(st.id || st.student_id, st));
          studentsTabList.forEach((st) => {
            const id = st.id || st.student_id;
            if (!studentSourceMap.has(id)) studentSourceMap.set(id, st);
          });
          const combinedStudents = Array.from(studentSourceMap.values());
          return combinedStudents.filter((st) => {
            const stId = st.id || st.student_id;
            const isMember = clubStudents.some((cs) => cs.student_id === stId || cs.student_id === st.id);
            if (isMember) return false;
            const fullName = `${st.first_name || ""} ${st.last_name || ""} ${st.middle_name || ""}`.toLowerCase();
            const clsName = (st.class_name || "").toLowerCase();
            if (!searchStudentTerm.trim()) return true;
            const q = searchStudentTerm.toLowerCase().trim();
            return fullName.includes(q) || clsName.includes(q);
          });
        })()}
        onAddDirectStudent={handleAddDirectStudent}
        clubStudentsLoading={clubStudentsLoading}
        clubStudents={clubStudents}
        onApproveStudent={handleApproveStudent}
        onRemoveStudent={handleRemoveStudent}
      />

      <ClubGradingModal
        isOpen={showClubGradingModal}
        onClose={() => setShowClubGradingModal(false)}
        selectedClubForGrading={selectedClubForGrading}
        clubJournalTab={clubJournalTab}
        setClubJournalTab={setClubJournalTab}
        clubGradingDate={clubGradingDate}
        setClubGradingDate={setClubGradingDate}
        onDateChange={(newDate) => {
          if (selectedClubForGrading) {
            fetchClubStudentsAndGrades(selectedClubForGrading.id, newDate);
          }
        }}
        clubGradingLoading={clubGradingLoading}
        clubGradingStudents={clubGradingStudents}
        setClubGradingStudents={setClubGradingStudents}
        savingClubGrades={savingClubGrades}
        onSaveClubGradesBatch={handleSaveClubGradesBatch}
        clubGradeHistoryLoading={clubGradeHistoryLoading}
        clubGradeHistory={clubGradeHistory}
        fetchHistory={async () => {
          if (!selectedClubForGrading) return;
          setClubGradeHistoryLoading(true);
          try {
            const data = await api.get(`/api/schools/clubs/${selectedClubForGrading.id}/grades/history`);
            setClubGradeHistory(Array.isArray(data) ? data : []);
          } catch (err) {
            console.error("Error fetching club grade history:", err);
            setClubGradeHistory([]);
          } finally {
            setClubGradeHistoryLoading(false);
          }
        }}
      />

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

      <ParentsListModal
        isOpen={showParentsModal}
        onClose={() => setShowParentsModal(false)}
        selectedStudent={selectedStudentForParents}
        linkedParents={linkedParents}
        linkedParentsLoading={linkedParentsLoading}
        onUnlinkParent={handleUnlinkParent}
        parentFirstName={parentFirstName}
        setParentFirstName={setParentFirstName}
        parentLastName={parentLastName}
        setParentLastName={setParentLastName}
        parentMiddleName={parentMiddleName}
        setParentMiddleName={setParentMiddleName}
        parentPhone={parentPhone}
        setParentPhone={setParentPhone}
        parentPassport={parentPassport}
        setParentPassport={setParentPassport}
        parentPassword={parentPassword}
        setParentPassword={setParentPassword}
        actionLoading={actionLoading}
        onLinkParentSubmit={handleLinkParent}
      />

      <GradeCommentModal
        isOpen={showGradeCommentModal}
        onClose={() => setShowGradeCommentModal(false)}
        selectedStudent={selectedStudentForComment}
        availableGradeOptions={availableGradeOptions}
        selectedGradeColIds={selectedGradeColIds}
        onToggleGradeColId={handleToggleGradeColId}
        onToggleSelectAllGrades={handleToggleSelectAllGrades}
        gradeCommentsLoading={gradeCommentsLoading}
        gradeCommentsList={gradeCommentsList}
        newGradeCommentText={newGradeCommentText}
        setNewGradeCommentText={setNewGradeCommentText}
        commentSubmitting={commentSubmitting}
        onSubmitComment={handleAddGradeComment}
      />

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
        theme="teacher"
        selectedDate={
          teacherCalendarTarget === "journal"
            ? journalDate
            : teacherCalendarTarget === "exception"
            ? excDate
            : teacherCalendarTarget === "dashboard"
            ? selectedDashboardDate
            : scheduleViewDate
        }
        onSelectDate={(dateStr) => {
          if (teacherCalendarTarget === "journal") {
            setJournalDate(dateStr);
            fetchJournalData(dateStr);
          } else if (teacherCalendarTarget === "exception") {
            setExcDate(dateStr);
          } else if (teacherCalendarTarget === "dashboard") {
            setSelectedDashboardDate(dateStr);
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
            : teacherCalendarTarget === "dashboard"
            ? "Sanani tanlash"
            : "Jadval sanasini tanlash"
        }
      />

      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        selectedChatComment={selectedChatComment}
        userInfo={userInfo}
        chatLoading={chatLoading}
        chatMessages={chatMessages}
        replyText={replyText}
        setReplyText={setReplyText}
        replyError={replyError}
        replySubmitLoading={replySubmitLoading}
        onReplySubmit={handleReplySubmit}
      />

      {userInfo?.password_reset_required && (
        <ForcePasswordResetModal
          onSuccess={() => {
            setUserInfo((prev) => prev ? { ...prev, password_reset_required: false } : null);
          }}
        />
      )}

      {/* MODAL: Teacher Delete Student */}
      {showTeacherDeleteStudentModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTeacherDeleteStudentModal(false);
              setTeacherDeletingStudentId(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 p-6 shadow-2xl text-[#1D1E26] space-y-5 rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-red-600">O'quvchini o'chirish</h3>
              <button
                type="button"
                onClick={() => {
                  setShowTeacherDeleteStudentModal(false);
                  setTeacherDeletingStudentId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Haqiqatan ham ushbu o'quvchini sinfdan o'chirmoqchisiz? Barcha baholar va bog'liqliklar saqlanadi, lekin o'quvchi ro'yxatdan o'chadi.
            </p>

            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block">
                Maktabdan chiqish sanasi:
              </label>
              <input
                type="date"
                value={teacherDeleteLeavingDate}
                onChange={(e) => setTeacherDeleteLeavingDate(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 italic leading-snug">
                * Tanlangan sanadan boshlab o'quvchi jurnaldan o'chiriladi. Ushbu sanagacha bo'lgan barcha o'tgan darslar jurnalida saqlanib qoladi.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowTeacherDeleteStudentModal(false);
                  setTeacherDeletingStudentId(null);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-lg transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmTeacherDeleteStudent}
                disabled={teacherDeleteStudentLoading}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {teacherDeleteStudentLoading ? "O'chirilmoqda..." : "O'chirishni tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <TeacherDashboardContent />
    </Suspense>
  );
}



