"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect, useRef, Suspense } from "react";
import api from "@/lib/api";
import { formatLocalDate, parseLocalDate } from "@/lib/dateUtils";
import { useRouter, useSearchParams } from "next/navigation";
import AnnouncementsSection from "@/components/dashboard/AnnouncementsSection";
import SmartCalendarModal from "@/components/SmartCalendarModal";
import CustomDialogModal from "@/components/CustomDialogModal";
import PasswordInput from "@/components/common/PasswordInput";
import LibrarySection from "@/components/dashboard/LibrarySection";
import DateRangePresets from "@/components/DateRangePresets";
import SocialPassportImportSection from "@/components/dashboard/SocialPassportImportSection";
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
import TodayLessonsModal from "@/components/teacher/modals/TodayLessonsModal";
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

  const setTeacherTab = (newTab: TeacherTabType | string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const qs = params.toString();
    router.push(qs ? `/teacher?${qs}` : "/teacher", { scroll: false });
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Default expanded (shows labels/tabs)

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
  const dashboardDateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDashboardDatePicker = () => {
    if (dashboardDateInputRef.current) {
      if (typeof dashboardDateInputRef.current.showPicker === "function") {
        dashboardDateInputRef.current.showPicker();
      } else {
        dashboardDateInputRef.current.focus();
      }
    }
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

      // Load all students for dashboard analytics
      try {
        const studData = await api.get("/api/schools/users?role=STUDENT");
        if (Array.isArray(studData)) setDashboardStudents(studData);
      } catch (e) {
        console.error("Dashboard students load failed", e);
      }

      // Load grades for dashboard analytics
      try {
        const gradesData = await api.get("/api/schools/grades");
        if (Array.isArray(gradesData)) setDashboardGrades(gradesData);
      } catch (e) {
        console.error("Dashboard grades load failed", e);
      }

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

  // Fetch unapproved (marked) grades for the selected class
  const fetchUnapprovedGrades = async () => {
    if (!selectedClassId) return;
    setUnapprovedLoading(true);
    try {
      const data = await api.get(`/api/schools/grades?class_id=${selectedClassId}&status=marked`);
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
    setStudentsTabLoading(true);
    try {
      const url = selectedClassId
        ? `/api/schools/users?role=STUDENT&class_id=${selectedClassId}`
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
    if (!selectedClassId) return;
    
    const body: any = {
      first_name: studentForm.first_name.trim(),
      last_name: studentForm.last_name.trim(),
      middle_name: studentForm.middle_name.trim() || undefined,
      phone: studentForm.phone.trim() ? studentForm.phone.trim() : undefined,
      address: studentForm.address.trim() || undefined,
      birthdate: studentForm.birthdate || undefined,
      enrollment_date: studentForm.enrollment_date || new Date().toISOString().split("T")[0],
      ina: studentForm.ina.trim() || undefined,
    };

    try {
      if (studentModalMode === "create") {
        body.password = studentForm.password.trim() || "123456";
        await api.post(`/api/schools/classes/${selectedClassId}/students`, body);
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
          await api.delete(`/api/schools/students/${studentId}`);
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
      const data = await api.get(`/api/schools/students/${studentId}/parents`);
      setLinkedParents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setLinkedParents([]);
    } finally {
      setLinkedParentsLoading(false);
    }
  };

  const fetchClassParents = async () => {
    setClassParentsLoading(true);
    try {
      if (studentsTabList.length === 0) {
        fetchStudentsTabList();
      }
      const url = selectedClassId
        ? `/api/schools/users?role=PARENT&class_id=${selectedClassId}`
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
      const data = await api.post(`/api/schools/import/students?class_id=${selectedClassId}`, formData);

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
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">Maktabga kirish sanasi</label>
                <input
                  type="date"
                  value={studentForm.enrollment_date}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, enrollment_date: e.target.value }))}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                />
              </div>
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
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                {studentModalMode === "create" ? "Parol *" : "Yangi Parol (Ixtiyoriy)"}
              </label>
              <PasswordInput
                required={studentModalMode === "create"}
                value={studentForm.password}
                onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
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
      <TeacherSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        teacherTab={teacherTab}
        setTeacherTab={setTeacherTab}
        userInfo={userInfo}
        unapprovedCount={unapprovedGrades.length}
        onTabClick={(tabId) => {
          if (tabId === "feedback") fetchFeedbackFeed(token);
          if (tabId === "announcements") fetchAllStudents(token);
          if (tabId === "clubs") fetchClubs(token);
        }}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* Main Workspace (Scrollable) */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-y-auto">
        <TeacherHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="FARZANDIM"
        />

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
                    <div
                      onClick={handleOpenDashboardDatePicker}
                      className="flex items-center space-x-3 cursor-pointer group select-none flex-1"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 group-hover:bg-indigo-100 group-hover:border-indigo-200 transition">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-zinc-400 uppercase font-mono block">Sana Tanlash</span>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-extrabold text-[#16193E] group-hover:text-indigo-600 transition">
                            {(() => {
                              const d = parseLocalDate(selectedDashboardDate);
                              const mNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
                              return `${d.getDate()}-${mNames[d.getMonth()]}, ${d.getFullYear()}`;
                            })()}
                          </h4>
                        </div>
                      </div>
                      <input
                        ref={dashboardDateInputRef}
                        type="date"
                        value={selectedDashboardDate}
                        onChange={(e) => setSelectedDashboardDate(e.target.value)}
                        className="sr-only"
                        title="Sana tanlash"
                      />
                    </div>

                    {selectedDashboardDate === formatLocalDate(new Date()) ? (
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                        Bugun
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedDashboardDate(formatLocalDate(new Date()))}
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
            <JournalTab
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
            />
          )}

          {/* TAB CONTENT: Class Schedule */}
          {teacherTab === "schedule" && (
            <ScheduleTab
              selectedClassId={selectedClassId}
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
              onOpenEditScheduleModal={() => {
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

                const currentPeriod =
                  schedulePeriods.find((p: any) => scheduleViewDate >= p.start_date && scheduleViewDate <= p.end_date) ||
                  schedulePeriods[0];
                const activeStart =
                  currentPeriod?.start_date ||
                  (classSchedule.length > 0 && classSchedule[0].start_date) ||
                  "2026-09-01";
                const activeEnd =
                  currentPeriod?.end_date ||
                  (classSchedule.length > 0 && classSchedule[0].end_date) ||
                  "2027-05-31";
                setEditingScheduleOriginalStartDate(activeStart);
                setScheduleStartDate(activeStart);
                setScheduleEndDate(activeEnd);
                setShowEditScheduleModal(true);
              }}
              onOpenNewPeriodModal={() => {
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
              }}
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
            />
          )}

          {/* TAB CONTENT: Student Management */}
          {teacherTab === "students" && (
            <StudentsTab
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
            />
          )}

          {/* TAB CONTENT: Feedback / Comments Feed */}
          {teacherTab === "feedback" && (
              <FeedbackTab
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
            {teacherTab === "parents" && (
              <ParentsTab
                selectedClassId={selectedClassId}
                classParents={classParents}
                classParentsLoading={classParentsLoading}
                parentsSearch={parentsSearch}
                setParentsSearch={setParentsSearch}
                parentsPage={parentsPage}
                setParentsPage={setParentsPage}
                parentsPageSize={parentsPageSize}
                setParentsPageSize={setParentsPageSize}
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
                onDeleteSchedule={handleDeleteSchedule}
              />
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
              <TeacherSettingsTab
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

      <TodayLessonsModal
        isOpen={showTodayLessonsModal}
        onClose={() => setShowTodayLessonsModal(false)}
        todayLessons={todayLessons}
        clubs={clubs}
        currentDayNumber={currentDayNumber}
        currentMonthName={currentMonthName}
        currentYear={currentYear}
        onSelectLesson={handleSelectLessonAndGoToJournal}
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
