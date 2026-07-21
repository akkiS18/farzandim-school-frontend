"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AnnouncementsSection from "@/components/dashboard/AnnouncementsSection";

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

  // Teacher navigation view tab: "journal" | "schedule" | "students" | "parents" | "unapproved" | "feedback" | "announcements" | "clubs"
  const [teacherTab, setTeacherTab] = useState<"journal" | "schedule" | "students" | "parents" | "unapproved" | "feedback" | "announcements" | "clubs">("journal");

  // Feedback/Comments States
  const [feedbackFeed, setFeedbackFeed] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState("");

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

  const [showClubStudentsModal, setShowClubStudentsModal] = useState(false);
  const [selectedClubForStudents, setSelectedClubForStudents] = useState<any>(null);
  const [clubStudents, setClubStudents] = useState<any[]>([]);
  const [clubStudentsLoading, setClubStudentsLoading] = useState(false);
  const [searchStudentTerm, setSearchStudentTerm] = useState("");

  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [selectedClubForSchedule, setSelectedClubForSchedule] = useState<any>(null);
  const [newScheduleDay, setNewScheduleDay] = useState<number>(1);
  const [newScheduleStartTime, setNewScheduleStartTime] = useState("14:00");
  const [newScheduleEndTime, setNewScheduleEndTime] = useState("15:30");

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
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForStudents.id}/add-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (response.ok) {
        fetchClubStudents(selectedClubForStudents.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveStudent = async (studentId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForStudents.id}/approve-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (response.ok) {
        fetchClubStudents(selectedClubForStudents.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!window.confirm("Ushbu o'quvchini to'garakdan chiqarmoqchimisiz?")) return;
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/${selectedClubForStudents.id}/remove-student`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (response.ok) {
        fetchClubStudents(selectedClubForStudents.id);
      }
    } catch (err) {
      console.error(err);
    }
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

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!window.confirm("Ushbu dars vaqtini o'chirmoqchimisiz?")) return;
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/schedules/${scheduleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchClubs(token);
      }
    } catch (err) {
      console.error(err);
    }
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

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");

  // Contextual Sub-lists
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  const [classTeachersLoading, setClassTeachersLoading] = useState(false);

  // Weekly Schedule States
  const [classSchedule, setClassSchedule] = useState<any[]>([]);
  const [classScheduleLoading, setClassScheduleLoading] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [scheduleFormState, setScheduleFormState] = useState<{ [key: string]: number }>({});
  const [scheduleStartDate, setScheduleStartDate] = useState("2026-09-01");
  const [scheduleEndDate, setScheduleEndDate] = useState("2027-05-31");
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

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const scheduleDateInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  // Active Grading System rules (for user guidance)
  const [activeGS, setActiveGS] = useState<any | null>(null);
  const [gradingSystemsList, setGradingSystemsList] = useState<any[]>([]);

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
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setSchoolId(savedSchoolId);
    try {
      const parsedUser = JSON.parse(savedUserStr);
      if (parsedUser.role !== "MAIN_TEACHER" && parsedUser.role !== "SUBJECT_TEACHER" && parsedUser.role !== "ADMIN") {
        router.push("/login");
        return;
      }
      setUserInfo(parsedUser);
      loadInitialData(savedToken, savedSchoolId);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

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
    if (selectedClassId && token && teacherTab === 'students') {
      fetchStudentsTabList();
    }
  }, [selectedClassId, token, teacherTab]);

  // Parents tab data load: reload when class or active tab changes to "parents"
  useEffect(() => {
    if (selectedClassId && token && teacherTab === 'parents') {
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
      const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClassScheduleLoading(false);
    }
  };

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

  const handleDeleteException = async (exceptionId: number) => {
    if (!selectedClassId) return;
    if (!confirm("Haqiqatan ham ushbu dars o'zgarishini bekor qilmoqchimisiz? (Jadval haftalik shablondagi holatiga qaytadi)")) return;

    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClassId}/schedule-exceptions/${exceptionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
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
      setExistingGrades(Array.isArray(gradeData) ? gradeData : []);

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

      const d = new Date(targetDate + 'T00:00:00');
      if (isNaN(d.getTime())) return;
      const dow = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon…7=Sun
      
      const lessonsListToday: JournalLessonItem[] = [];
      (Array.isArray(schedData) ? schedData : []).forEach((item: any) => {
        if (item.day_of_week === dow && item.subject_id > 0 && item.subject_name) {
          lessonsListToday.push({
            subject_id: item.subject_id,
            subject_name: item.subject_name,
            lesson_number: item.lesson_number,
          });
        }
      });
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
      const gradesList = Array.isArray(gradesData) ? gradesData : [];
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
              const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
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
                    const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
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
      const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
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
      const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
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
            const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
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
      const gradesList = Array.isArray(data) ? data : [];

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
    if (!selectedClassId || !token) return;
    setStudentsTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/users?role=STUDENT&class_id=${selectedClassId}`, {
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
  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm("Haqiqatan ham bu o'quvchini o'chirmoqchimisiz?")) return;
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
    if (!selectedClassId) return;
    setClassParentsLoading(true);
    try {
      if (studentsTabList.length === 0) {
        fetchStudentsTabList();
      }
      const response = await fetch(`${API_URL}/api/schools/users?role=PARENT&class_id=${selectedClassId}`, {
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

  const handleUnlinkParentFromStudent = async (studentId: number, parentId: number) => {
    if (!window.confirm("Haqiqatan ham ushbu ota-onani o'quvchidan ajratmoqchisiz?")) return;
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

  const handleUnlinkParent = async (parentId: number) => {
    if (!selectedStudentForParents) return;
    if (!confirm("Haqiqatan ham ushbu ota-onani o'quvchidan ajratmoqchisiz?")) return;

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

    if (!window.confirm(`Haqiqatan ham darsdagi barcha ${totalToSave} ta bahoni saqlamoqchimisiz? Saqlangandan so'ng ularni o'zgartirib bo'lmaydi.`)) {
      return;
    }

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
      <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="w-full max-w-5xl bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl my-8 relative text-zinc-900">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-200 pb-3">
            <div>
              <h3 className="text-md font-bold text-zinc-900 font-sans">Haftalik dars jadvalini tahrirlash</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Har bir kun va dars soati uchun fanni tanlang. Dars yo'q soatlarni "Bo'sh" holatida qoldiring.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowEditScheduleModal(false);
                setScheduleFormState({});
                setActionError("");
              }}
              className="text-zinc-500 hover:text-zinc-700 transition text-xs font-semibold cursor-pointer"
            >
              Yopish
            </button>
          </div>

          {actionError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs p-3 rounded-lg mb-4">{actionError}</div>
          )}

          <form onSubmit={handleSaveSchedule} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Jadval boshlanish sanasi (Start Date)</label>
                <input
                  type="date"
                  value={scheduleStartDate}
                  onChange={(e) => setScheduleStartDate(e.target.value)}
                  required
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-600 text-zinc-700 rounded-lg px-3 py-1.5 text-xs outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Jadval tugash sanasi (End Date)</label>
                <input
                  type="date"
                  value={scheduleEndDate}
                  onChange={(e) => setScheduleEndDate(e.target.value)}
                  required
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-600 text-zinc-700 rounded-lg px-3 py-1.5 text-xs outline-none transition"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50/20">
              <table className="min-w-full divide-y divide-zinc-200 text-center table-fixed">
                <thead className="bg-zinc-50 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-2 py-3 w-16">Soat</th>
                    <th className="px-2 py-3">Dushanba</th>
                    <th className="px-2 py-3">Seshanba</th>
                    <th className="px-2 py-3">Chorshanba</th>
                    <th className="px-2 py-3">Payshanba</th>
                    <th className="px-2 py-3">Juma</th>
                    <th className="px-2 py-3">Shanba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-xs text-zinc-700">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <tr key={period} className="hover:bg-zinc-50/50 transition">
                      <td className="px-2 py-2 font-mono font-semibold text-zinc-400 bg-zinc-50/50">
                        {period}-dars
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((day) => {
                        const slotKey = `${day}-${period}`;
                        const selectedVal = scheduleFormState[slotKey] || 0;
                        return (
                          <td key={day} className="px-2 py-2 border-l border-zinc-200">
                            <select
                              value={selectedVal}
                              onChange={(e) => {
                                setScheduleFormState((prev) => ({
                                  ...prev,
                                  [slotKey]: Number(e.target.value),
                                }));
                              }}
                              className="w-full bg-white border border-zinc-200 focus:border-emerald-600 text-zinc-800 rounded px-1.5 py-1 text-[11px] outline-none cursor-pointer font-semibold"
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

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => {
                  setShowEditScheduleModal(false);
                  setScheduleFormState({});
                  setActionError("");
                }}
                className="text-xs bg-zinc-100 border border-zinc-200 text-zinc-500 py-2.5 px-4 rounded-lg transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="text-xs bg-[#059669] hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg transition cursor-pointer"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto text-zinc-900">
        <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl relative">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-200 pb-3">
            <div>
              <h3 className="text-md font-bold text-zinc-900 font-sans">Kunlik Dars Jadvali O'zgarishi Kiritish</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Tanlangan kun va dars soati uchun bir martalik o'zgarish yoki darsni bekor qilish.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddExceptionModal(false);
                setActionError("");
              }}
              className="text-zinc-500 hover:text-zinc-700 transition text-xs font-semibold cursor-pointer"
            >
              Yopish
            </button>
          </div>

          {actionError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs p-3 rounded-lg mb-4">{actionError}</div>
          )}

          <form onSubmit={handleAddExceptionSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-2">Kun (Sana)</label>
              <input
                type="date"
                required
                value={excDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setExcDate(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 text-zinc-700 rounded-lg px-3.5 py-2.5 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-2">Dars soati</label>
              <select
                value={excLesson}
                onChange={(e) => setExcLesson(Number(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 text-zinc-700 rounded-lg px-3.5 py-2.5 text-sm outline-none transition cursor-pointer font-semibold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <option key={period} value={period}>{period}-dars</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-2">O'zgarish turi</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-xs text-zinc-650 cursor-pointer">
                  <input
                    type="radio"
                    name="excType"
                    checked={excType === "replace"}
                    onChange={() => setExcType("replace")}
                    className="text-emerald-600 focus:ring-0"
                  />
                  <span>O'zgartirish / Qo'shimcha fan</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-zinc-650 cursor-pointer">
                  <input
                    type="radio"
                    name="excType"
                    checked={excType === "cancel"}
                    onChange={() => setExcType("cancel")}
                    className="text-emerald-600 focus:ring-0"
                  />
                  <span>Darsni bekor qilish (Cancel)</span>
                </label>
              </div>
            </div>

            {excType === "replace" && (
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-2">Fan</label>
                <select
                  required={excType === "replace"}
                  value={excSubjectId}
                  onChange={(e) => setExcSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 text-zinc-700 rounded-lg px-3.5 py-2.5 text-sm outline-none transition cursor-pointer font-semibold"
                >
                  <option value="">Fanni tanlang</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddExceptionModal(false);
                  setActionError("");
                }}
                className="text-xs bg-zinc-100 border border-zinc-200 text-zinc-500 py-2.5 px-4 rounded-lg transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-6 rounded-lg transition cursor-pointer"
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
      <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/70 backdrop-blur-sm p-4 overflow-y-auto text-zinc-900">
        <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl my-8 relative">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-200 pb-3">
            <div>
              <h3 className="text-md font-bold text-zinc-900 font-sans">Mavjud Dars Jadvallari</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Ushbu sinf uchun kiritilgan barcha haftalik dars jadvali davrlari.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPeriodsModal(false)}
              className="text-zinc-500 hover:text-zinc-700 transition text-xs font-semibold cursor-pointer"
            >
              Yopish
            </button>
          </div>

          {schedulePeriodsLoading ? (
            <div className="text-center py-6">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : schedulePeriods.length === 0 ? (
            <p className="text-zinc-400 text-xs font-mono py-6 text-center">Ushbu sinf uchun hech qanday haftalik dars jadvali topilmadi.</p>
          ) : (
            <div className="space-y-3">
              {schedulePeriods.map((period, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100/50 transition">
                  <div className="space-y-1">
                    <span className="bg-emerald-55 border border-emerald-200 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                      Jadval #{schedulePeriods.length - idx}
                    </span>
                    <p className="text-xs text-zinc-800 font-semibold mt-1">
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
                    className="text-xs bg-[#059669] hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer"
                  >
                    Tanlash (Ko'rish)
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-zinc-200 mt-6">
            <button
              type="button"
              onClick={() => setShowPeriodsModal(false)}
              className="text-xs bg-zinc-100 border border-zinc-200 text-zinc-500 py-2 px-4 rounded-lg transition cursor-pointer"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
          onClick={() => setShowStudentModal(false)}
        />
        {/* Dialog */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl max-w-sm w-full p-6 relative z-10 space-y-4 animate-in fade-in zoom-in-95 duration-205 text-zinc-900">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              {studentModalMode === "create" ? "Yangi o'quvchi qo'shish" : "O'quvchi ma'lumotlarini tahrirlash"}
            </h3>
            <p className="text-[10px] text-zinc-405 font-mono mt-0.5">
              Barcha maydonlarni to'ldiring
            </p>
          </div>

          <form onSubmit={handleStudentFormSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Familiya</label>
              <input
                type="text"
                required
                value={studentForm.last_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-205 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none transition font-semibold"
                placeholder="Familiyani kiriting"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Ism</label>
              <input
                type="text"
                required
                value={studentForm.first_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-205 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none transition font-semibold"
                placeholder="Ismni kiriting"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Otasining ismi (sharif)</label>
              <input
                type="text"
                value={studentForm.middle_name}
                onChange={(e) => setStudentForm(prev => ({ ...prev, middle_name: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-205 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none transition font-semibold"
                placeholder="Otasining ismini kiriting"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Telefon raqam (Ixtiyoriy)</label>
              <input
                type="text"
                value={studentForm.phone}
                onChange={(e) => setStudentForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-205 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none transition font-semibold font-mono"
                placeholder="+998901234567"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Manzil</label>
              <input
                type="text"
                value={studentForm.address}
                onChange={(e) => setStudentForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-205 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none transition font-semibold"
                placeholder="Masalan: Toshkent sh., Chilonzor"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Tug'ilgan sana</label>
                <input
                  type="date"
                  value={studentForm.birthdate}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, birthdate: e.target.value }))}
                  className="w-full bg-zinc-50 border border-zinc-205 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none transition font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Guvohnoma (INA)</label>
                <input
                  type="text"
                  value={studentForm.ina}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, ina: e.target.value }))}
                  className="w-full bg-zinc-50 border border-zinc-205 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none transition font-semibold font-mono"
                  placeholder="I-TV No 123456"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                {studentModalMode === "create" ? "Parol" : "Yangi Parol (Ixtiyoriy)"}
              </label>
              <input
                type="password"
                required={studentModalMode === "create"}
                value={studentForm.password}
                onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-205 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none transition font-semibold"
                placeholder={studentModalMode === "create" ? "Tizimga kirish paroli (Kamida 6 ta belgi)" : "O'zgartirmaslik uchun bo'sh qoldiring"}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-650 font-bold py-2 px-4 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow transition cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-900 flex flex-col font-sans selection:bg-zinc-200">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-sm tracking-wider">OJ</span>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 uppercase">O'qituvchi Portali</h1>
            <p className="text-[10px] text-zinc-500 font-mono font-semibold">ONLINE JURNAL</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold">{userInfo?.first_name} {userInfo?.last_name}</p>
            <p className="text-[9px] text-emerald-600 font-mono uppercase tracking-wider font-semibold">{userInfo?.role === "MAIN_TEACHER" ? "Sinf Rahbari" : "O'qituvchi"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
          >
            Chiqish
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-28">
        {!selectedClassId ? (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-16">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-zinc-800 tracking-tight mb-2">ONLINE JURNAL — O'QITUVCHI PORTALI</h2>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Dars jurnali, dars jadvali, o'quvchilar va ota-onalar ma'lumotlarini boshqarish uchun pastdagi panel orqali kerakli sinf va fanni tanlang.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none border-b border-zinc-200/80 mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setTeacherTab("journal")}
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer shrink-0 ${
                  teacherTab === "journal"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                Sinf Jurnali (Baholash)
              </button>
              <button
                type="button"
                onClick={() => setTeacherTab("schedule")}
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer shrink-0 ${
                  teacherTab === "schedule"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                Dars Jadvali va O'zgarishlar
              </button>
              {isMainTeacherOfClass() && (
                <button
                  type="button"
                  onClick={() => setTeacherTab("students")}
                  className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer shrink-0 ${
                    teacherTab === "students"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-650"
                  }`}
                >
                  O'quvchilar
                </button>
              )}
              {isMainTeacherOfClass() && (
                <button
                  type="button"
                  onClick={() => setTeacherTab("parents")}
                  className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer shrink-0 ${
                    teacherTab === "parents"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-650"
                  }`}
                >
                  Ota-onalar
                </button>
              )}
              <button
                type="button"
                onClick={() => setTeacherTab("unapproved")}
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer shrink-0 ${
                  teacherTab === "unapproved"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                Tasdiqlanmagan Baholar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeacherTab("feedback");
                  fetchFeedbackFeed(token);
                }}
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer shrink-0 ${
                  teacherTab === "feedback"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                💬 Fikrlar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeacherTab("announcements");
                  fetchAllStudents(token);
                }}
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer shrink-0 ${
                  teacherTab === "announcements"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                📢 E'lonlar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeacherTab("clubs");
                  fetchClubs(token);
                }}
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer shrink-0 ${
                  teacherTab === "clubs"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                🎯 To'garaklar
              </button>
            </div>

            {/* TAB CONTENT: Grading Journal — Daily Grid */}
            {teacherTab === "journal" && (
              <div className="space-y-6">
                {/* Date/Class/Subject Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Kunlik jurnal</h2>
                    <p className="text-xs text-zinc-500 font-semibold mt-1">
                      {(() => {
                        const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
                        const dateObj = new Date(journalDate + 'T00:00:00');
                        const dayName = !isNaN(dateObj.getTime()) ? days[dateObj.getDay()] : "";
                        const dateParts = journalDate.split("-");
                        const formattedDate = dateParts.length === 3 ? `${dateParts[0]} M${dateParts[1]} ${Number(dateParts[2])}` : journalDate;
                        const clsName = classes.find(c => c.id === selectedClassId)?.name || "";
                        const subjName = selectedSubjectId ? (subjects.find(s => s.id === selectedSubjectId)?.name || "") : "";
                        
                        let result = "";
                        if (formattedDate) result += `${formattedDate}, ${dayName ? dayName.slice(0, 3) : ""}`;
                        if (clsName) result += ` · ${clsName} sinf`;
                        if (subjName) result += ` · ${subjName}`;
                        return result || "Jurnal ma'lumotlari";
                      })()}
                    </p>
                  </div>
                </div>

                {/* Holiday Warning Banner */}
                {(() => {
                  const activeHoliday = holidays.find(h => {
                    const hDate = h.holiday_date ? new Date(h.holiday_date).toISOString().split('T')[0] : '';
                    return hDate === journalDate;
                  });
                  if (activeHoliday) {
                    return (
                      <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center space-x-3 text-xs font-semibold animate-fadeIn mb-4">
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

                {/* Journal Grid */}
                {!selectedClassId ? (
                  <section className="text-center py-16 border border-dashed border-zinc-200 rounded-xl bg-white/40">
                    <p className="text-zinc-500 text-xs font-mono">Jurnalni ko'rish uchun sinf tanlang.</p>
                  </section>
                ) : journalLoading ? (
                  <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl shadow-sm">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : !selectedSubjectId ? (
                  (() => {
                    const isScheduleEmpty = classSchedule.length === 0 || classSchedule.every(item => item.subject_id === 0 || !item.subject_id);
                    if (isScheduleEmpty) {
                      return (
                        <div className="text-center py-16 bg-white border border-dashed border-red-200 rounded-xl animate-fadeIn">
                          <p className="text-sm text-red-650 font-bold mb-1">Dars jadvali hali qo'shilmagan</p>
                          <p className="text-xs text-zinc-400 font-mono">
                            Dars baholarini ko'rish va kiritish uchun birinchi navbatda haftalik dars jadvalini kiriting.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl">
                        <p className="text-sm text-zinc-500 font-semibold mb-1">Fanni tanlang</p>
                        <p className="text-xs text-zinc-400 font-mono">Dars baholarini ko'rish va kiritish uchun pastdagi panel orqali fanni tanlang.</p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
                    {/* Grid legend row */}
                    <div className="px-5 py-3 bg-[#fafafa] border-b border-zinc-150 flex flex-wrap items-center justify-between gap-3 text-zinc-800">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-widest font-mono">
                          {selectedLessonNumber ? `${selectedLessonNumber}-SOAT ` : ""}BAHOLAR
                        </span>

                        {(() => {
                          const hasApprovedOrAnyGradesForToday = journalAllGrades.some(g => {
                            const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
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
                                  if (confirm(`Haqiqatan ham "${found.name}" ustunini o'chirmoqchimisiz?`)) {
                                    handleRemoveJournalColumn(found.id);
                                  }
                                } else {
                                  alert("Bunday baholash turi topilmadi.");
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
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-200 text-left">
                        <thead className="bg-[#fafafa] text-[10px] font-bold text-zinc-450 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4 w-12 text-center font-mono">№</th>
                            <th className="px-6 py-4">O'quvchi ismi</th>
                            {journalColumns.map((col) => (
                              <th key={col.id} className="px-6 py-4 text-center">
                                <div>{col.name}</div>
                                {col.id !== "ATTENDANCE" && (() => {
                                  const hasGradesInThisColumn = journalAllGrades.some(g => {
                                    const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
                                    return g.subject_id === Number(selectedSubjectId) &&
                                           g.lesson_number === Number(selectedLessonNumber) &&
                                           g.grade_type === col.id &&
                                           gDate === journalDate;
                                  });

                                  return (
                                    <div className="flex flex-col items-center mt-1">
                                      <select
                                        value={columnGradingSystems[col.id] || ""}
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-xs bg-white">
                          {students.length === 0 ? (
                            <tr>
                              <td colSpan={2 + journalColumns.length} className="px-6 py-10 text-center text-zinc-450 italic font-mono">
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
                                  <td className="px-6 py-4 text-center font-mono text-zinc-400 text-xs font-semibold">
                                    {String(idx + 1).padStart(2, '0')}
                                  </td>
                                  
                                  {/* Student Name */}
                                  <td className="px-6 py-4 font-bold text-zinc-800 text-sm whitespace-nowrap">
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

                                            if (col.id === "MASTERY") {
                                              return (
                                                <select
                                                  value={cellVal}
                                                  onChange={(e) => handleCellSave(st.id, Number(selectedSubjectId), Number(selectedLessonNumber), "MASTERY", e.target.value)}
                                                  disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                                  className={`w-14 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer
                                                    ${cellVal === "" ? "bg-zinc-50 border-zinc-300 text-zinc-400" :
                                                      cellVal === "5" ? "bg-emerald-100 border-emerald-300 text-emerald-700" :
                                                      cellVal === "4" ? "bg-blue-100 border-blue-300 text-blue-700" :
                                                      cellVal === "3" ? "bg-amber-100 border-amber-300 text-amber-700" :
                                                      "bg-red-100 border-red-300 text-red-700"
                                                    }
                                                  `}
                                                >
                                                  <option value="">—</option>
                                                  <option value="5">5</option>
                                                  <option value="4">4</option>
                                                  <option value="3">3</option>
                                                  <option value="2">2</option>
                                                  <option value="1">1</option>
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
                                              title="Tasdiqlangan baholash, o'zgartirib bo'lmaydi"
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
            )}

            {/* TAB CONTENT: Class Schedule */}
            {teacherTab === "schedule" && (
              <div className="space-y-6">
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-800">Sinf Haftalik Dars Jadvali</h3>
                      {scheduleStartDate && scheduleEndDate ? (
                        <div className="flex items-center space-x-2.5 mt-1">
                          <p className="text-[11px] text-zinc-500">
                            Faol dars jadvali davri: <span className="text-[#059669] font-bold font-mono">{scheduleStartDate}</span> dan <span className="text-[#059669] font-bold font-mono">{scheduleEndDate}</span> gacha
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowPeriodsModal(true)}
                            className="text-[11px] text-[#059669] hover:text-emerald-700 hover:underline font-semibold cursor-pointer"
                          >
                            Barcha jadvallar ro'yxati
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 mt-1">Ushbu sinf uchun dars jadvali va kunlik o'zgarishlar.</p>
                      )}
                    </div>
                  </div>

                  {classScheduleLoading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                      <table className="min-w-full divide-y divide-zinc-200/60 text-center table-fixed">
                        <thead className="bg-zinc-50 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-3 w-16 text-center bg-zinc-50/50">Soat</th>
                            <th className="px-3 py-3">Dushanba</th>
                            <th className="px-3 py-3">Seshanba</th>
                            <th className="px-3 py-3">Chorshanba</th>
                            <th className="px-3 py-3">Payshanba</th>
                            <th className="px-3 py-3">Juma</th>
                            <th className="px-3 py-3">Shanba</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/60 text-xs text-zinc-700">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                            <tr key={period} className="hover:bg-zinc-50/50 transition">
                              <td className="px-3 py-4 font-mono font-semibold text-zinc-400 bg-zinc-50/50">
                                {period}-dars
                              </td>
                              {[1, 2, 3, 4, 5, 6].map((day) => {
                                const lesson = classSchedule.find(
                                  (item) => item.day_of_week === day && item.lesson_number === period
                                );
                                return (
                                  <td key={day} className="px-3 py-4 border-l border-zinc-200/60">
                                    {lesson ? (
                                      <span className={lesson.subject_id === 0 || lesson.subject_name === "Bekor qilingan" ? "text-red-500 font-semibold line-through block italic text-[11px]" : "text-zinc-900 font-semibold block"}>
                                        {lesson.subject_name}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-350 italic text-[11px]">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Exceptions manager */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-800">Kunlik Dars Jadvali O'zgarishlari</h3>
                      <p className="text-[11px] text-zinc-500 mt-1">Sinf o'qituvchisi tomonidan kiritilgan bir martalik dars qo'shimchalari yoki bekor qilishlar.</p>
                    </div>
                    {isMainTeacherOfClass() && (
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
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-4 rounded-lg transition cursor-pointer flex items-center space-x-1"
                      >
                        <span>+ O'zgarish kiritish</span>
                      </button>
                    )}
                  </div>

                  {scheduleExceptionsLoading ? (
                    <div className="text-center py-6">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : scheduleExceptions.length === 0 ? (
                    <p className="text-zinc-400 text-[11px] font-mono py-4 text-center border border-dashed border-zinc-200 rounded-lg bg-zinc-50/20">Hech qanday dars o'zgarishi kiritilmagan.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                      <table className="min-w-full divide-y divide-zinc-200/60 text-left text-xs text-zinc-700">
                        <thead className="bg-zinc-50 text-[9px] font-semibold text-zinc-505 uppercase tracking-wider">
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
                                  {!exc.is_deleted && !isPast && isMainTeacherOfClass() && (
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
            {teacherTab === "students" && (
              <div className="space-y-4">
                <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Sinf O'quvchilari</h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Sinf rahbari sifatida o'quvchilarni qo'shishingiz va boshqarishingiz mumkin
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImportResult(null);
                        setImportError("");
                        setShowImportStudentsModal(true);
                      }}
                      className="bg-teal-55 hover:bg-teal-100 border border-teal-205 text-teal-800 font-bold text-xs py-2 px-4 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>Excel orqali yuklash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentModalMode("create");
                        setStudentForm({
                          first_name: "",
                          last_name: "",
                          middle_name: "",
                          phone: "",
                          password: "123456", // default password
                          address: "",
                          birthdate: "",
                          ina: ""
                        });
                        setShowStudentModal(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>+ O'quvchi qo'shish</span>
                    </button>
                  </div>
                </div>

                {studentsTabLoading ? (
                  <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl shadow-sm">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : studentsTabList.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl">
                    <p className="text-xs text-zinc-400 font-mono">Ushbu sinfda hozircha o'quvchilar yo'q.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-150 text-left text-xs">
                        <thead className="bg-[#fafafa] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 w-10 text-center font-mono">#</th>
                            <th className="px-5 py-3">F.I.SH</th>
                            <th className="px-5 py-3 text-right">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {studentsTabList.map((st, idx) => (
                            <tr key={st.id} className="hover:bg-zinc-50/50 transition">
                              <td className="px-4 py-3 text-center font-mono text-zinc-400">{idx + 1}</td>
                              <td className="px-5 py-3 font-semibold text-zinc-900">
                                {st.first_name} {st.last_name} {st.middle_name || ""}
                              </td>
                              <td className="px-5 py-3 text-right space-x-2">
                                <button
                                  type="button"
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
                                  className="text-xs bg-blue-50 border border-blue-200 text-blue-650 hover:bg-blue-100 font-semibold py-1 px-3 rounded-lg transition cursor-pointer"
                                >
                                  Vasiylar
                                </button>
                                <button
                                  type="button"
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
                                  className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-semibold py-1 px-3 rounded-lg transition cursor-pointer"
                                >
                                  Tahrirlash
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(st.student_id || st.id)}
                                  className="text-xs bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-semibold py-1 px-3 rounded-lg transition cursor-pointer"
                                >
                                  O'chirish
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Unapproved Grades List */}
            {teacherTab === "unapproved" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Tasdiqlanmagan Baholar Ro'yxati</h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Bu oynada tasdiqlanmagan (draft) baholar sanasi bo'yicha kamayish (descending) tartibida ko'rinadi.
                    </p>
                  </div>
                </div>

                {unapprovedLoading ? (
                  <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl shadow-sm">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : unapprovedGrades.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl bg-white/40">
                    <p className="text-sm font-bold text-zinc-800 mb-1">Barcha baholar tasdiqlangan! 🎉</p>
                    <p className="text-xs text-zinc-400 font-mono">Ushbu sinfda hozircha yangi tasdiqlanmagan (draft) baholar mavjud emas.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-150 text-left text-xs">
                        <thead className="bg-[#fafafa] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={unapprovedGrades.length > 0 && unapprovedGrades.every(g => selectedGradeIds.has(g.id))}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedGradeIds(() => {
                                    const next = new Set<number>();
                                    if (checked) {
                                      unapprovedGrades.forEach(g => next.add(g.id));
                                    }
                                    return next;
                                  });
                                }}
                                className="w-3.5 h-3.5 text-emerald-600 border-zinc-300 rounded focus:ring-0 cursor-pointer"
                              />
                            </th>
                            <th className="px-4 py-3 w-28 font-semibold">Sana</th>
                            <th className="px-5 py-3">O'quvchi</th>
                            <th className="px-5 py-3">Fan</th>
                            <th className="px-4 py-3 text-center w-20">Baho</th>
                            <th className="px-5 py-3">Kiritdi</th>
                            <th className="px-5 py-3 text-right">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {unapprovedGrades.map((g) => {
                            const formattedDate = g.grade_date ? new Date(g.grade_date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
                            return (
                              <tr key={g.id} className="hover:bg-zinc-50/50 transition">
                                <td className="px-4 py-3 text-center">
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
                                    className="w-3.5 h-3.5 text-emerald-600 border-zinc-300 rounded focus:ring-0 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-3 text-zinc-500 font-mono font-bold whitespace-nowrap">{formattedDate}</td>
                                <td className="px-5 py-3 font-semibold text-zinc-900">{g.student_name}</td>
                                <td className="px-5 py-3">
                                  <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                                    {g.subject_name}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="bg-emerald-50 border border-emerald-250 text-emerald-700 font-mono font-bold px-2.5 py-1 rounded text-xs">
                                    {g.value}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-zinc-500 font-medium">{g.teacher_name}</td>
                                <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
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
                                    className="text-[10px] bg-blue-50 border border-blue-200 text-blue-750 hover:bg-blue-100 font-bold py-1 px-2.5 rounded transition cursor-pointer"
                                  >
                                    Tasdiqlash
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!window.confirm("Haqiqatan ham bu bahoni o'chirmoqchimisiz?")) return;
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
                                    }}
                                    className="text-[10px] bg-red-50 border border-red-200 text-red-650 hover:bg-red-100 font-bold py-1 px-2.5 rounded transition cursor-pointer"
                                  >
                                    O'chirish
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Feedback / Comments Feed */}
            {teacherTab === "feedback" && (
              <div className="space-y-4">
                <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-zinc-900">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Ota-onalardan kelgan Fikr-mulohazalar</h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Siz dars beradigan fanlar va siz rahbarlik qiladigan sinf ota-onalarining izohlari.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-lg px-3 py-1.5 shrink-0">
                    <span className="text-zinc-400 text-xs">🔍</span>
                    <input
                      type="text"
                      value={feedbackSearch}
                      onChange={(e) => setFeedbackSearch(e.target.value)}
                      placeholder="Qidirish..."
                      className="bg-transparent border-none text-xs text-zinc-700 outline-none w-32 focus:w-48 transition-all"
                    />
                  </div>
                </div>

                {feedbackLoading ? (
                  <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl shadow-sm">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : feedbackFeed.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl bg-white/40">
                    <p className="text-sm font-bold text-zinc-850 mb-1">Fikrlar mavjud emas</p>
                    <p className="text-xs text-zinc-400 font-mono">Hozircha ota-onalardan hech qanday izoh yoki fikrlar kelmagan.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedbackFeed
                      .filter((f) =>
                        f.author_name.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
                        f.content.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
                        (f.subject_name && f.subject_name.toLowerCase().includes(feedbackSearch.toLowerCase())) ||
                        (f.student_name && f.student_name.toLowerCase().includes(feedbackSearch.toLowerCase()))
                      )
                      .map((f) => {
                        const isGrade = f.type === "GRADE";
                        return (
                          <div
                            key={f.id + "-" + f.type}
                            className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:border-zinc-300 transition text-zinc-900 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                              <div className="flex items-center space-x-2">
                                {isGrade ? (
                                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                    📝 Bahoga izoh
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-md">
                                    🍽️ Taomnomaga izoh
                                  </span>
                                )}
                                <span className="text-xs font-bold text-zinc-800">{f.author_name}</span>
                                <span className="text-[10px] text-zinc-450">Ota-ona</span>
                              </div>
                              <span className="text-[10px] text-zinc-450 font-mono">
                                {new Date(f.created_at).toLocaleString("uz-UZ", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {isGrade ? (
                              <div className="flex items-center space-x-3 bg-zinc-50 border border-zinc-150 p-2.5 rounded-lg text-xs">
                                <div className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-250 text-emerald-700 font-bold flex items-center justify-center font-mono">
                                  {f.grade_value}
                                </div>
                                <div>
                                  <span className="text-zinc-800 font-bold block">{f.subject_name}</span>
                                  <span className="text-zinc-500 text-[10px]">
                                    O&apos;quvchi: <b>{f.student_name}</b> ({f.class_name} sinfi)
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-zinc-50 border border-zinc-150 p-2.5 rounded-lg text-xs font-semibold text-zinc-700">
                                🍽️ Taomnoma kuni: {new Date(f.menu_date || "").toLocaleDateString("uz-UZ", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric"
                                })}
                              </div>
                            )}

                            <div className="text-xs text-zinc-700 bg-zinc-50/50 p-3 rounded-lg border border-zinc-150 font-medium leading-relaxed italic">
                              &ldquo;{f.content}&rdquo;
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChatComment(f);
                                  setReplyText("");
                                  setReplyError("");
                                  setChatModalOpen(true);
                                  fetchChatMessages(f);
                                }}
                                className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                💬 Chatni ochish
                              </button>
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
            {teacherTab === "parents" && (
              <div className="space-y-4">
                <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-zinc-900">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Sinf Ota-onalari (Vasiylar)</h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Sinfdagi barcha o'quvchilarning ota-onalari (vasiylari) va ularni boshqarish
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImportResult(null);
                        setImportError("");
                        setShowImportParentsModal(true);
                      }}
                      className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-850 font-bold text-xs py-2 px-4 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>Excel orqali yuklash</span>
                    </button>
                    <button
                      type="button"
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg transition cursor-pointer"
                    >
                      <span>+ Ota-ona qo'shish</span>
                    </button>
                  </div>
                </div>

                {classParentsLoading ? (
                  <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl shadow-sm">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : classParents.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl bg-white/40">
                    <p className="text-sm font-bold text-zinc-800 mb-1">Ota-onalar mavjud emas</p>
                    <p className="text-xs text-zinc-400 font-mono">Ushbu sinfda hozircha bog'langan ota-onalar ro'yxatga olinmagan.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden text-zinc-900">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-150 text-left text-xs">
                        <thead className="bg-[#fafafa] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3 w-10 text-center font-mono">T/R</th>
                            <th className="px-5 py-3">F.I.SH</th>
                            <th className="px-5 py-3 font-mono">Telefon</th>
                            <th className="px-5 py-3">E-mail</th>
                            <th className="px-5 py-3">O'quvchi (Farzand)</th>

                            <th className="px-5 py-3 text-right">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {classParents.map((pt, idx) => (
                            <tr key={`${pt.id || pt.user_id}-${idx}`} className="hover:bg-zinc-50/50 transition">
                              <td className="px-5 py-3 text-center font-mono text-zinc-400">{idx + 1}</td>
                              <td className="px-5 py-3 font-semibold text-zinc-900">
                                {pt.first_name} {pt.last_name} {pt.middle_name && <span className="text-zinc-400 font-normal">({pt.middle_name})</span>}
                              </td>
                              <td className="px-5 py-3 font-mono text-zinc-505">{pt.phone || "—"}</td>
                              <td className="px-5 py-3 font-mono text-zinc-550">{pt.email || "—"}</td>
                              <td className="px-5 py-3 text-zinc-700 font-medium">{pt.student_name || "Noma'lum"}</td>

                              <td className="px-5 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleUnlinkParentFromStudent(pt.student_id, pt.id || pt.user_id)}
                                  className="text-[10px] bg-red-50 border border-red-200 text-red-655 hover:bg-red-100 font-bold py-1 px-2.5 rounded transition cursor-pointer"
                                >
                                  Ajratish
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Extracurricular Clubs */}
            {teacherTab === "clubs" && (
              <div className="space-y-4">
                <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-zinc-900">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">To'garaklar (To'garak faoliyati)</h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg transition cursor-pointer"
                    >
                      + Yangi to'garak
                    </button>
                  </div>
                </div>

                {clubsLoading ? (
                  <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl shadow-sm">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
                  </div>
                ) : clubs.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl bg-white/40">
                    <p className="text-sm font-bold text-zinc-800 mb-1">To'garaklar mavjud emas</p>
                    <p className="text-xs text-zinc-400 font-mono">Siz yaratgan to'garaklar hali yo'q. "+ Yangi to'garak" tugmasi orqali yaratishingiz mumkin.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clubs.map((club) => (
                      <div key={club.id} className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4 text-zinc-900 relative">
                        <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                          <div>
                            <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md font-mono">
                              {club.subject_name}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-800 mt-1">{club.name}</h4>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              Ruxsat etilgan sinflar: {club.allowed_class_levels ? club.allowed_class_levels.join(", ") + " - sinflar" : "Barchasi"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClubForStudents(club);
                                setSearchStudentTerm("");
                                setClubStudents([]);
                                fetchClubStudents(club.id);
                                setShowClubStudentsModal(true);
                              }}
                              className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              A'zolar & So'rovlar
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
                              className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              + Jadval
                            </button>
                          </div>
                        </div>

                        {/* Schedule list for the club */}
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">📅 To'garak Jadvali</h5>
                          {(!club.schedules || club.schedules.length === 0) ? (
                            <p className="text-xs text-zinc-400 font-medium italic">Hali dars jadvali belgilanmagan</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {club.schedules.map((sch: any) => {
                                const days = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
                                return (
                                  <div key={sch.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-150 p-2 rounded-lg text-xs">
                                    <div className="font-semibold text-zinc-750">
                                      <span className="font-bold text-zinc-900">{days[sch.day_of_week]}</span>
                                      <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">{sch.start_time} - {sch.end_time}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSchedule(sch.id)}
                                      className="text-red-500 hover:text-red-750 font-bold px-1.5 py-0.5 text-xs transition cursor-pointer"
                                      title="O'chirish"
                                    >
                                      &times;
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

          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-zinc-200/50 py-6 text-center text-[10px] text-zinc-400 font-mono mt-auto">
        &copy; {new Date().getFullYear()} ONLINE JURNAL.
      </footer>

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
      {/* Sticky Bottom Tabbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] w-max">
        <div className="bg-white/95 backdrop-blur-md border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-3xl sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-between gap-3 sm:gap-6 transition-all duration-300">
          
          {/* Left Part: Class & Subject Selectors */}
          <div className="flex items-center space-x-4 shrink-0">
            {/* Sinf Selection */}
            <div className="flex items-center space-x-2.5 relative hover:bg-zinc-50 px-3 py-1.5 rounded-2xl transition cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex flex-col text-left pr-4">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">SINF</span>
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1 select-none whitespace-nowrap">
                  {selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : "Tanlang"}
                  <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  setSelectedClassId(val);
                  setSelectedSubjectId("");
                  // Clear grade selection when switching classes
                  setSelectedGradeIds(new Set());
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="">Sinfni tanlang</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            {/* Divider & Fan Selection (Only shown when NOT on schedule tab) */}
            {teacherTab !== "schedule" && (
              <>
                {/* Divider */}
                <div className="h-8 w-px bg-zinc-200"></div>

                {/* Fan Selection */}
                {selectedClassId ? (
                  (() => {
                    const currentCls = classes.find(c => c.id === selectedClassId);
                    const hasFixedSubject = currentCls?.subject_id && userInfo?.role !== "ADMIN" && userInfo?.role !== "MAIN_TEACHER";
                    const isScheduleEmpty = classSchedule.length === 0 || classSchedule.every(item => item.subject_id === 0 || !item.subject_id);
                    
                    if (isScheduleEmpty) {
                      return (
                        <div
                          onClick={() => {
                            showToast("error", "Dars jadvali hali qo'shilmagan");
                            alert("Dars jadvali hali qo'shilmagan");
                          }}
                          className="flex items-center space-x-2.5 hover:bg-zinc-50 px-3 py-1.5 rounded-2xl transition cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650 shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="flex flex-col text-left pr-4">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">FAN</span>
                            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1 select-none whitespace-nowrap">
                              Tanlang
                              <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center space-x-2.5 relative hover:bg-zinc-50 px-3 py-1.5 rounded-2xl transition cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650 shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="flex flex-col text-left pr-4">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">FAN</span>
                          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1 select-none whitespace-nowrap">
                            {selectedSubjectId ? (
                              teacherTab === "journal" && selectedLessonNumber
                                ? `${selectedLessonNumber}-soat: ${subjects.find(s => s.id === selectedSubjectId)?.name || ""}`
                                : (subjects.find(s => s.id === selectedSubjectId)?.name || currentCls?.subject_name || "Noma'lum")
                            ) : "Tanlang"}
                            {!hasFixedSubject && (
                              <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </span>
                        </div>
                        {!hasFixedSubject && (
                          teacherTab === "journal" ? (
                            <select
                              value={selectedSubjectId && selectedLessonNumber ? `${selectedSubjectId}_${selectedLessonNumber}` : ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setSelectedSubjectId("");
                                  setSelectedLessonNumber("");
                                } else {
                                  const [subId, lessonNum] = val.split("_").map(Number);
                                  setSelectedSubjectId(subId);
                                  setSelectedLessonNumber(lessonNum);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                              <option value="">Darsni tanlang</option>
                              {journalLessonsToday.map((lesson) => (
                                <option key={`${lesson.subject_id}_${lesson.lesson_number}`} value={`${lesson.subject_id}_${lesson.lesson_number}`}>
                                  {lesson.lesson_number}-soat: {lesson.subject_name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={selectedSubjectId}
                              onChange={(e) => {
                                setSelectedSubjectId(e.target.value === "" ? "" : Number(e.target.value));
                                setSelectedLessonNumber("");
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                              <option value="">Fanni tanlang</option>
                              {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                              ))}
                            </select>
                          )
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center space-x-2.5 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-zinc-105 border border-zinc-200 flex items-center justify-center text-zinc-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
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
            <div className="flex items-center space-x-2.5">
              {/* Datepicker */}
              <div 
                onClick={() => {
                  if (dateInputRef.current) {
                     if (typeof dateInputRef.current.showPicker === 'function') {
                       dateInputRef.current.showPicker();
                     } else {
                       dateInputRef.current.click();
                     }
                  }
                }}
                className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 rounded-full px-3.5 py-1.5 transition relative cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-bold font-mono text-zinc-700 select-none">
                  {(() => {
                    const parts = journalDate.split("-");
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    return journalDate;
                  })()}
                </span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={journalDate}
                  onChange={(e) => {
                    setJournalDate(e.target.value);
                    if (e.target.value) {
                      fetchJournalData(e.target.value);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Schedule Date picker */}
          {selectedClassId && teacherTab === "schedule" && (
            <div className="flex items-center space-x-2.5">
              <div 
                onClick={() => {
                  if (scheduleDateInputRef.current) {
                     if (typeof scheduleDateInputRef.current.showPicker === 'function') {
                       scheduleDateInputRef.current.showPicker();
                     } else {
                       scheduleDateInputRef.current.click();
                     }
                  }
                }}
                className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 rounded-full px-3.5 py-1.5 transition relative cursor-pointer font-bold"
              >
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-bold font-mono text-zinc-700 select-none">
                  {(() => {
                    const parts = scheduleViewDate.split("-");
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    return scheduleViewDate;
                  })()}
                </span>
                <input
                  ref={scheduleDateInputRef}
                  type="date"
                  value={scheduleViewDate}
                  onChange={(e) => {
                    setScheduleViewDate(e.target.value);
                    if (e.target.value) {
                      fetchClassSchedule(e.target.value);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Right Part: Action Buttons */}
          <div className="flex items-center space-x-2 sm:ml-auto shrink-0">
            {selectedClassId && (teacherTab === "journal" || teacherTab === "unapproved") ? (
              <>
                {teacherTab === "journal" && (
                  selectedGradeIds.size > 0 ? (
                    <button
                      type="button"
                      onClick={handleBulkApprove}
                      disabled={approveLoading}
                      className="px-5 py-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_4px_14px_rgba(91,80,236,0.3)] cursor-pointer disabled:opacity-50"
                    >
                      {approveLoading ? (
                        <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-white mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>Saqlash ({selectedGradeIds.size} ta)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApproveAllToday}
                      disabled={approveLoading}
                      className="px-5 py-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_4px_14px_rgba(91,80,236,0.3)] cursor-pointer disabled:opacity-50"
                    >
                      {approveLoading ? (
                        <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin mr-1.5"></span>
                      ) : (
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-4-4H8z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v-8" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6v4H9z" />
                        </svg>
                      )}
                      <span>Saqlash</span>
                    </button>
                  )
                )}

                {teacherTab === "unapproved" && selectedGradeIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkApprove}
                    disabled={approveLoading}
                    className="px-5 py-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_4px_14px_rgba(91,80,236,0.3)] cursor-pointer disabled:opacity-50"
                  >
                    {approveLoading ? (
                      <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-white mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>Saqlash ({selectedGradeIds.size} ta)</span>
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
                  setShowEditScheduleModal(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_4px_14px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Jadvalni tahrirlash</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {renderEditWeeklyScheduleModal()}
      {renderAddExceptionModal()}
      {renderPeriodsModal()}
      {renderStudentModal()}
      {renderParentsModal()}
      {renderImportParentsModal()}
      {renderImportStudentsModal()}
      {renderAddParentModal()}
      {renderAddClubModal()}
      {renderAddScheduleModal()}
      {renderClubStudentsModal()}

      {chatModalOpen && selectedChatComment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 w-full max-w-[450px] shadow-2xl flex flex-col max-h-[90vh] text-zinc-900">
            <div className="flex justify-between items-start mb-3 border-b border-zinc-150 pb-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">💬 Muhokama (Chat)</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Ota-ona: <b>{selectedChatComment.author_name}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatModalOpen(false)}
                className="text-zinc-450 hover:text-zinc-700 text-xl border-none background-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Chat messages */}
            <div className="max-h-[300px] min-h-[150px] overflow-y-auto border border-zinc-150 rounded-xl p-3 mb-4 bg-zinc-50 flex flex-col gap-2.5 flex-1">
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
                          backgroundColor: isMyMessage ? "#10B981" : "#E5E7EB",
                          color: isMyMessage ? "white" : "#374151",
                          borderRadius: "12px",
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
                className="flex-1 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 outline-none resize-none focus:border-emerald-600 transition"
                placeholder="Javobingizni yozing..."
              />
              <button
                type="submit"
                disabled={replySubmitLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition cursor-pointer h-10 flex items-center justify-center shrink-0"
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
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[85vh]">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Vasiylar Boshqaruvi</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                O'quvchi: {selectedStudentForParents.first_name} {selectedStudentForParents.last_name}
              </p>
            </div>
            <button
              onClick={() => setShowParentsModal(false)}
              className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg p-1"
            >
              &times;
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Linked Parents list */}
            <div>
              <h4 className="text-xs font-bold text-zinc-700 mb-3 flex items-center">
                <span>Bog'langan Ota-onalar</span>
                <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-zinc-100 text-zinc-500 rounded-full font-mono">
                  {linkedParents.length}
                </span>
              </h4>

              {linkedParentsLoading ? (
                <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                  <p className="text-[10px] text-zinc-400 font-mono">Yuklanmoqda...</p>
                </div>
              ) : linkedParents.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                  <p className="text-[11px] text-zinc-400 font-mono">Ushbu o'quvchiga hali ota-ona bog'lanmagan.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedParents.map((parent) => (
                    <div
                      key={parent.id || parent.user_id}
                      className="flex items-center justify-between p-3 border border-zinc-150 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition"
                    >
                      <div>
                        <p className="text-xs font-bold text-zinc-800">
                          {parent.first_name} {parent.last_name} {parent.middle_name || ""}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          Tel: {parent.phone} {parent.email ? `| Email: ${parent.email}` : ""}
                        </p>
                        {parent.parent_code && (
                          <p className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-mono inline-block mt-1 font-bold">
                            Taklif kodi: {parent.parent_code}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlinkParent(parent.id || parent.user_id)}
                        className="text-[10px] bg-red-50 border border-red-200 text-red-650 hover:bg-red-100 font-semibold py-1 px-2.5 rounded-lg transition cursor-pointer"
                      >
                        Ajratish
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-zinc-150" />

            {/* Manual Link/Add parent Form */}
            <form onSubmit={handleLinkParent} className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-700">Yangi Ota-onani Bog'lash (Qo'shish)</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">
                    Ism *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold"
                    placeholder="Masalan: Asror"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">
                    Familiya *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentLastName}
                    onChange={(e) => setParentLastName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold"
                    placeholder="Masalan: Karimov"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">
                    Otasining ismi (Sharifi)
                  </label>
                  <input
                    type="text"
                    value={parentMiddleName}
                    onChange={(e) => setParentMiddleName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold"
                    placeholder="Masalan: Baxtiyorovich"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">
                    Telefon *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-mono font-semibold"
                    placeholder="Masalan: +998901234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">
                    Pasport
                  </label>
                  <input
                    type="text"
                    value={parentPassport}
                    onChange={(e) => setParentPassport(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-mono font-semibold"
                    placeholder="Masalan: AA1234567"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">
                    Parol *
                  </label>
                  <input
                    type="password"
                    required
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-mono font-semibold"
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowParentsModal(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {actionLoading && <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
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
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden transition-all transform scale-100">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Excel orqali ota-onalarni yuklash</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Bir vaqtning o'zida bir nechta ota-ona hisobini bog'lash
              </p>
            </div>
            <button
              onClick={() => setShowImportParentsModal(false)}
              className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg p-1"
            >
              &times;
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Step 1: Download Template */}
            <div className="bg-zinc-50/50 border border-zinc-150 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-800">1-bosqich: Shablonni yuklab olish</p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Sinf o'quvchilari ro'yxati biriktirilgan tayyor shablon
                </p>
              </div>
              <button
                type="button"
                onClick={downloadParentsTemplate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition cursor-pointer shrink-0"
              >
                Shablonni yuklash
              </button>
            </div>

            {/* Step 2: Upload Excel File */}
            <form onSubmit={handleParentsExcelImport} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-800 mb-2">2-bosqich: To'ldirilgan shablonni yuklash</p>
                <label className="border-2 border-dashed border-zinc-200 rounded-xl py-6 px-4 text-center block cursor-pointer hover:bg-zinc-50 transition">
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
                  <p className="text-xs font-semibold text-zinc-650">
                    {selectedFile ? selectedFile.name : "Excel faylini tanlang (.xlsx)"}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-mono mt-1">Fayl hajmi 5MB dan oshmasligi kerak</p>
                </label>
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs font-semibold">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-bold">Muvaffaqiyatli yuklandi!</p>
                  <ul className="list-disc pl-4 font-mono text-[10px] space-y-0.5">
                    <li>Yuklangan ota-onalar: {importResult.imported_count} ta</li>
                    <li>O'quvchilarga bog'landi: {importResult.linked_count || importResult.imported_count} ta</li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportParentsModal(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !selectedFile}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {importLoading && <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
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
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden transition-all transform scale-100">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between text-zinc-900">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Excel orqali o'quvchilarni yuklash</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Bir vaqtning o'zida bir nechta o'quvchi hisobini yaratish va sinflarga joylash
              </p>
            </div>
            <button
              onClick={() => setShowImportStudentsModal(false)}
              className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg p-1"
            >
              &times;
            </button>
          </div>

          <div className="p-6 space-y-5 text-zinc-900">
            {/* Step 1: Download Template */}
            <div className="bg-zinc-50/50 border border-zinc-150 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-800">1-bosqich: Shablonni yuklab olish</p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Ustunlar: ism, familiya, sharif, sinf (namuna bilan birga)
                </p>
              </div>
              <button
                type="button"
                onClick={downloadStudentsTemplate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition cursor-pointer shrink-0"
              >
                Shablonni yuklash
              </button>
            </div>

            {/* Step 2: Upload Excel File */}
            <form onSubmit={handleStudentsExcelImport} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-800 mb-2">2-bosqich: To'ldirilgan shablonni yuklash</p>
                <label className="border-2 border-dashed border-zinc-200 rounded-xl py-6 px-4 text-center block cursor-pointer hover:bg-zinc-50 transition">
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
                  <p className="text-xs font-semibold text-zinc-650">
                    {selectedFile ? selectedFile.name : "Excel faylini tanlang (.xlsx)"}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-mono mt-1">Fayl hajmi 5MB dan oshmasligi kerak</p>
                </label>
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs font-semibold">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-bold">Muvaffaqiyatli yuklandi!</p>
                  <ul className="list-disc pl-4 font-mono text-[10px] space-y-0.5">
                    <li>Yuklangan o'quvchilar: {importResult.imported_count} ta</li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportStudentsModal(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !selectedFile}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {importLoading && <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Yangi To'garak Yaratish</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Fan to'garagini tashkil etish</p>
            </div>
            <button
              onClick={() => setShowAddClubModal(false)}
              className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg p-1"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleCreateClub} className="p-6 overflow-y-auto space-y-4">
            {clubsError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg">
                {clubsError}
              </div>
            )}
            {clubsSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-semibold rounded-lg">
                {clubsSuccess}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">To'garak nomi *</label>
              <input
                type="text"
                required
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold"
                placeholder="Masalan: Yosh Fiziklar"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">Fan *</label>
              <select
                required
                value={newClubSubjectId}
                onChange={(e) => setNewClubSubjectId(Number(e.target.value))}
                className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold cursor-pointer"
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
              <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1 font-mono">Ruxsat etilgan sinflar (Level)*</label>
              <div className="grid grid-cols-4 gap-2 border border-zinc-150 p-3 rounded-lg bg-zinc-50/30">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => {
                  const isChecked = newClubAllowedLevels.includes(lvl);
                  return (
                    <label key={lvl} className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-700 cursor-pointer">
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
                        className="w-3.5 h-3.5 text-emerald-600 border-zinc-300 rounded focus:ring-0 cursor-pointer"
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
                className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
              >
                Yopish
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tashkil qilish
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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Jadval qo'shish</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{selectedClubForSchedule.name} to'garagi uchun</p>
            </div>
            <button
              onClick={() => setShowAddScheduleModal(false)}
              className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg p-1"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">Hafta kuni *</label>
              <select
                value={newScheduleDay}
                onChange={(e) => setNewScheduleDay(Number(e.target.value))}
                className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold cursor-pointer"
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
                <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">Boshlanish vaqti *</label>
                <input
                  type="time"
                  required
                  value={newScheduleStartTime}
                  onChange={(e) => setNewScheduleStartTime(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1 font-mono">Tugash vaqti *</label>
                <input
                  type="time"
                  required
                  value={newScheduleEndTime}
                  onChange={(e) => setNewScheduleEndTime(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddScheduleModal(false)}
                className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
              >
                Yopish
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
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

    // Filter students to search in all school students or class students to directly add
    const filteredToDirectAdd = studentsTabList.filter((st) => {
      const fullName = `${st.first_name} ${st.last_name}`.toLowerCase();
      // Already a member?
      const isMember = clubStudents.some((cs) => cs.student_id === st.id || cs.student_id === st.student_id);
      return fullName.includes(searchStudentTerm.toLowerCase()) && !isMember;
    });

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">A'zolar va Qo'shilish So'rovlari</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{selectedClubForStudents.name} to'garagi</p>
            </div>
            <button
              onClick={() => setShowClubStudentsModal(false)}
              className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg p-1"
            >
              &times;
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-900">
            {/* Direct Add Student Section */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">To'g'ridan-to'g'ri o'quvchi qo'shish</h4>
              <div className="flex items-center gap-2 bg-white border border-zinc-200/80 rounded-lg px-3 py-1.5">
                <span className="text-zinc-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={searchStudentTerm}
                  onChange={(e) => setSearchStudentTerm(e.target.value)}
                  placeholder="Ism-familiya bo'yicha qidirish..."
                  className="bg-transparent border-none text-xs text-zinc-700 outline-none w-full focus:ring-0"
                />
              </div>

              {searchStudentTerm.trim() !== "" && (
                <div className="max-h-32 overflow-y-auto border border-zinc-150 rounded-lg bg-white divide-y divide-zinc-100">
                  {filteredToDirectAdd.length === 0 ? (
                    <p className="text-xs text-zinc-450 p-3 italic">O'quvchi topilmadi yoki barchasi a'zo</p>
                  ) : (
                    filteredToDirectAdd.map((st) => (
                      <div key={st.id || st.student_id} className="flex items-center justify-between p-2 text-xs hover:bg-zinc-50/50 transition">
                        <span className="font-semibold text-zinc-800">{st.first_name} {st.last_name}</span>
                        <button
                          type="button"
                          onClick={() => handleAddDirectStudent(st.id || st.student_id)}
                          className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[10px] py-1 px-2.5 rounded transition cursor-pointer"
                        >
                          Qo'shish
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* List of current requests & members */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">To'garakdagilar ro'yxati</h4>
              {clubStudentsLoading ? (
                <div className="text-center py-6">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                  <p className="text-[10px] text-zinc-400 font-mono">Yuklanmoqda...</p>
                </div>
              ) : clubStudents.length === 0 ? (
                <p className="text-xs text-zinc-450 italic text-center py-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg">Hozircha a'zolar yoki so'rovlar mavjud emas.</p>
              ) : (
                <div className="border border-zinc-150 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-zinc-150 text-left text-xs bg-white">
                    <thead className="bg-[#fafafa] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2">F.I.SH</th>
                        <th className="px-4 py-2">Sinfi</th>
                        <th className="px-4 py-2">Holati</th>
                        <th className="px-4 py-2 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {clubStudents.map((cs) => (
                        <tr key={cs.id} className="hover:bg-zinc-50/50 transition">
                          <td className="px-4 py-2.5 font-semibold text-zinc-900">{cs.student_name}</td>
                          <td className="px-4 py-2.5 font-mono text-zinc-500">{cs.class_name}</td>
                          <td className="px-4 py-2.5">
                            {cs.status === "PENDING" ? (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                Kutilmoqda (Ariza)
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                A'zo ✓
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right space-x-2">
                            {cs.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleApproveStudent(cs.student_id)}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded-md transition cursor-pointer"
                              >
                                Tasdiqlash
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(cs.student_id)}
                              className="text-[10px] bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-bold py-1 px-2 rounded-md transition cursor-pointer"
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
          <div className="px-6 py-3 border-t border-zinc-150 bg-zinc-50 text-right">
            <button
              onClick={() => setShowClubStudentsModal(false)}
              className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
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
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[85vh] text-zinc-900">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Yangi Ota-onani Bog'lash (Qo'shish)</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Ota-onani ro'yxatdan o'tkazish va o'quvchiga biriktirish
              </p>
            </div>
            <button
              onClick={() => setShowAddParentModal(false)}
              className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg p-1"
            >
              &times;
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            <form onSubmit={handleCreateAndLinkParent} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1 font-mono">
                  O'quvchini tanlang *
                </label>
                <select
                  required
                  value={selectedStudentIdForAdd}
                  onChange={(e) => setSelectedStudentIdForAdd(Number(e.target.value))}
                  className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold cursor-pointer"
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
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1 font-mono">
                    Ism *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold"
                    placeholder="Masalan: Asror"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1 font-mono">
                    Familiya *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentLastName}
                    onChange={(e) => setParentLastName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold"
                    placeholder="Masalan: Karimov"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1 font-mono">
                    Otasining ismi (Sharifi)
                  </label>
                  <input
                    type="text"
                    value={parentMiddleName}
                    onChange={(e) => setParentMiddleName(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-semibold"
                    placeholder="Sharifini kiriting"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1 font-mono">
                    Telefon *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-mono font-semibold"
                    placeholder="Telefon raqamini kiriting"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1 font-mono">
                    Pasport
                  </label>
                  <input
                    type="text"
                    value={parentPassport}
                    onChange={(e) => setParentPassport(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-mono font-semibold"
                    placeholder="AA1234567"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1 font-mono">
                    Parol *
                  </label>
                  <input
                    type="password"
                    required
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50 font-mono font-semibold"
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                >
                  {actionLoading && <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                  <span>Ota-onani bog'lash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
