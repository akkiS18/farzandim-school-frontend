"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  created_at: string;
}

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

  // Teacher navigation view tab: "journal" | "schedule" | "students" | "unapproved"
  const [teacherTab, setTeacherTab] = useState<"journal" | "schedule" | "students" | "unapproved">("journal");

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
  const [scheduleViewDate, setScheduleViewDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduleExceptions, setScheduleExceptions] = useState<any[]>([]);
  const [scheduleExceptionsLoading, setScheduleExceptionsLoading] = useState(false);
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false);
  const [excDate, setExcDate] = useState(new Date().toISOString().split("T")[0]);
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
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalAllGrades, setJournalAllGrades] = useState<GradeItem[]>([]);
  const [journalSubjectsToday, setJournalSubjectsToday] = useState<{ id: number; name: string }[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [cellInputs, setCellInputs] = useState<{ [key: string]: string }>({});
  const [cellSaving, setCellSaving] = useState<string | null>(null);
  const [selectedGradingSystems, setSelectedGradingSystems] = useState<{ [subjectId: number]: number }>({});

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
    password: ""
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

  // Toast Notification state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  // Active Grading System rules (for user guidance)
  const [activeGS, setActiveGS] = useState<any | null>(null);
  const [gradingSystemsList, setGradingSystemsList] = useState<any[]>([]);

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
      const clsRes = await fetch("http://localhost:6560/api/schools/classes", {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const clsData = await clsRes.json();
      if (clsRes.ok) setClasses(Array.isArray(clsData) ? clsData : []);

      // Load subjects
      const subRes = await fetch("http://localhost:6560/api/schools/subjects", {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const subData = await subRes.json();
      if (subRes.ok) setSubjects(Array.isArray(subData) ? subData : []);

      // Load active grading system
      const gsRes = await fetch("http://localhost:6560/api/schools/grading-systems/active", {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const gsData = await gsRes.json();
      if (gsRes.ok) setActiveGS(gsData);

      // Load all grading systems
      const gsListRes = await fetch("http://localhost:6560/api/schools/grading-systems", {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const gsListData = await gsListRes.json();
      if (gsListRes.ok) setGradingSystemsList(Array.isArray(gsListData) ? gsListData : []);
    } catch (e) {
      console.error("Initial load failed", e);
    } finally {
      setLoading(false);
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

  // Journal data: reload when class or active tab changes to "journal"
  useEffect(() => {
    if (selectedClassId && token && teacherTab === 'journal') {
      fetchJournalData(journalDate);
    }
  }, [selectedClassId, token, teacherTab, classTeachers, userInfo]);

  // Students tab data load: reload when class or active tab changes to "students"
  useEffect(() => {
    if (selectedClassId && token && teacherTab === 'students') {
      fetchStudentsTabList();
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

  const isMainTeacherOfClass = () => {
    if (!userInfo || !selectedClassId) return false;
    if (userInfo.role === "ADMIN") return true;
    return classTeachers.some((ct) => ct.teacher_id === userInfo.id && ct.is_main_teacher);
  };

  const fetchClassTeachers = async () => {
    if (!selectedClassId) return;
    setClassTeachersLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClassId}/teachers`, {
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
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClassId}/schedule?date=${dateQuery}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setClassSchedule(data);
        if (data.length > 0 && data[0].start_date && data[0].end_date) {
          setScheduleStartDate(data[0].start_date);
          setScheduleEndDate(data[0].end_date);
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
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClassId}/schedule-exceptions`, {
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
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClassId}/schedule-periods`, {
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
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClassId}/schedule-exceptions`, {
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
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClassId}/schedule-exceptions/${exceptionId}`, {
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
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClassId}/schedule`, {
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
      const studRes = await fetch(`http://localhost:6560/api/schools/users?role=STUDENT&class_id=${selectedClassId}`, {
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
      const gradeRes = await fetch(`http://localhost:6560/api/schools/grades?class_id=${selectedClassId}&subject_id=${selectedSubjectId}`, {
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
      // 1. Schedule for that date's week → determine subjects of the day
      const schedRes = await fetch(
        `http://localhost:6560/api/schools/classes/${selectedClassId}/schedule?date=${targetDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const schedData = await schedRes.json();
      const d = new Date(targetDate + 'T00:00:00');
      if (isNaN(d.getTime())) return;
      const dow = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon…7=Sun
      
      const subjectMap = new Map<number, string>();
      const subjectsListToday: { id: number; name: string }[] = [];
      
      (Array.isArray(schedData) ? schedData : []).forEach((item: any) => {
        if (item.day_of_week === dow && item.subject_id > 0 && item.subject_name) {
          if (!subjectMap.has(item.subject_id)) {
            subjectMap.set(item.subject_id, item.subject_name);
            subjectsListToday.push({ id: item.subject_id, name: item.subject_name });
          }
        }
      });

      // Filter subjects: if SUBJECT_TEACHER (and not advisor/admin), only show their assigned subjects
      let filteredSubjects = subjectsListToday;
      if (userInfo && userInfo.role !== "ADMIN" && !isMainTeacherOfClass()) {
        filteredSubjects = subjectsListToday.filter(sub => 
          classTeachers.some(ct => ct.teacher_id === userInfo.id && ct.subject_id === sub.id)
        );
      }
      setJournalSubjectsToday(filteredSubjects);

      // 2. Students for this class
      const studRes = await fetch(
        `http://localhost:6560/api/schools/users?role=STUDENT&class_id=${selectedClassId}&date=${targetDate}`,
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
        `http://localhost:6560/api/schools/grades?class_id=${selectedClassId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const gradesData = await gradesRes.json();
      const gradesList = Array.isArray(gradesData) ? gradesData : [];
      setJournalAllGrades(gradesList);

      // Initialize grading systems mapping
      const gSysMap: { [key: number]: number } = {};
      subjectsListToday.forEach(sub => {
        if (activeGS) {
          gSysMap[sub.id] = activeGS.id;
        }
      });
      gradesList.forEach((g: any) => {
        const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
        if (gDate === targetDate && g.grading_system_id) {
          gSysMap[g.subject_id] = g.grading_system_id;
        }
      });
      setSelectedGradingSystems(gSysMap);

      // 4. Initialize cell inputs from existing grades
      const inputs: { [key: string]: string } = {};
      studentsList.forEach((st) => {
        subjectsListToday.forEach((subj) => {
          const key = `${st.id}_${subj.id}`;
          const grade = gradesList.find((g: any) => {
            const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
            return g.student_id === st.id && g.subject_id === subj.id && gDate === targetDate;
          });
          inputs[key] = grade ? grade.value : "";
        });
      });
      setCellInputs(inputs);
    } catch (e) {
      console.error(e);
    } finally {
      setJournalLoading(false);
    }
  };

  // Find a specific grade for a student+subject on the selected journal date
  const findGradeForDay = (studentId: number, subjectId: number): GradeItem | undefined => {
    return journalAllGrades.find(g => {
      const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
      return g.student_id === studentId && g.subject_id === subjectId && gDate === journalDate;
    });
  };

  // Inline cell save: handles POST (create), PUT (update), or DELETE (delete)
  const handleCellSave = async (studentId: number, subjectId: number) => {
    const key = `${studentId}_${subjectId}`;
    const value = (cellInputs[key] || '').trim();
    
    // Find if there is an existing grade for this cell on the selected day
    const existingGrade = journalAllGrades.find(g => {
      const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
      return g.student_id === studentId && g.subject_id === subjectId && gDate === journalDate;
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
        const res = await fetch(`http://localhost:6560/api/schools/grades/${existingGrade.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Bahoni o\'chirib bo\'lmadi');
        }
        // Update local state
        setJournalAllGrades(prev => prev.filter(g => g.id !== existingGrade.id));
        showToast('success', 'Baho o\'chirildi');
      } else {
        // Create or Update
        let res;
        if (existingGrade) {
          // PUT update
          res = await fetch(`http://localhost:6560/api/schools/grades/${existingGrade.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              student_id: studentId,
              subject_id: subjectId,
              value: value,
              grade_date: journalDate,
              grading_system_id: selectedGradingSystems[subjectId] || undefined,
            })
          });
        } else {
          // POST create
          res = await fetch('http://localhost:6560/api/schools/grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              student_id: studentId,
              subject_id: subjectId,
              value: value,
              grade_date: journalDate,
              grading_system_id: selectedGradingSystems[subjectId] || undefined,
            })
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
      const res = await fetch(`http://localhost:6560/api/schools/grades?class_id=${selectedClassId}&status=marked`, {
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
      const res = await fetch(`http://localhost:6560/api/schools/users?role=STUDENT&class_id=${selectedClassId}`, {
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
    };

    try {
      let res;
      if (studentModalMode === "create") {
        body.password = studentForm.password.trim() || "123456";
        res = await fetch(`http://localhost:6560/api/schools/classes/${selectedClassId}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
      } else {
        if (studentForm.password.trim()) {
          body.password = studentForm.password.trim();
        }
        res = await fetch(`http://localhost:6560/api/schools/students/${editingStudent.student_id || editingStudent.id}`, {
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
      const res = await fetch(`http://localhost:6560/api/schools/students/${studentId}`, {
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
      const response = await fetch("http://localhost:6560/api/schools/grades/batch", {
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
      const response = await fetch("http://localhost:6560/api/schools/grades/change-status", {
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
    const gradesToday = journalAllGrades.filter(g => {
      const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
      return gDate === journalDate && g.status !== 'approved';
    });

    if (gradesToday.length === 0) {
      showToast("error", "Bugungi kunda tasdiqlash uchun baholar yo'q");
      return;
    }

    if (!window.confirm(`Haqiqatan ham bugungi ${gradesToday.length} ta bahoni tasdiqlamoqchimisiz? Tasdiqlangandan so'ng ularni o'zgartirib bo'lmaydi.`)) {
      return;
    }

    setApproveLoading(true);
    try {
      const response = await fetch("http://localhost:6560/api/schools/grades/change-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          mark_uids: gradesToday.map(g => g.id),
          status: "approved",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tasdiqlashda xatolik yuz berdi");

      showToast("success", `Bugungi ${data.updated_count} ta baho muvaffaqiyatli tasdiqlandi (🔒 qulflanib saqlandi)!`);
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
    window.open(`http://localhost:6560/api/schools/import/template/grades?class_id=${selectedClassId}&subject_id=${selectedSubjectId}&token=${token}`);
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
      const response = await fetch("http://localhost:6560/api/schools/import/grades", {
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Step 1: Subject and Class Selection Cards */}
        <section className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Sinf Jurnalini tanlang</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {classes.map((cls, idx) => {
              const pastelColors = [
                { bg: "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 border-emerald-200/60" },
                { bg: "bg-blue-50 hover:bg-blue-100/80 text-blue-950 border-blue-200/60" },
                { bg: "bg-violet-50 hover:bg-violet-100/80 text-violet-950 border-violet-200/60" },
                { bg: "bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-amber-200/60" },
                { bg: "bg-rose-50 hover:bg-rose-100/80 text-rose-950 border-rose-200/60" },
                { bg: "bg-indigo-50 hover:bg-indigo-100/80 text-indigo-950 border-indigo-200/60" },
                { bg: "bg-teal-50 hover:bg-teal-100/80 text-teal-950 border-teal-200/60" },
                { bg: "bg-sky-50 hover:bg-sky-100/80 text-sky-950 border-sky-200/60" },
              ];
              const color = pastelColors[idx % pastelColors.length];
              const isSelected = selectedClassId === cls.id;
              
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedClassId("");
                      setSelectedSubjectId("");
                    } else {
                      setSelectedClassId(cls.id);
                      if (cls.subject_id) {
                        setSelectedSubjectId(cls.subject_id);
                      }
                    }
                  }}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer select-none flex flex-col justify-between h-28 shadow-sm ${color.bg} ${
                    isSelected
                      ? "ring-2 ring-emerald-600 border-transparent scale-[1.02]"
                      : "border-zinc-200/80 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xl font-extrabold tracking-tight">{cls.name}</span>
                    <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded font-mono font-bold">Sinf</span>
                  </div>
                  <div className="mt-2">
                    {cls.subject_name ? (
                      <p className="text-[10px] font-bold tracking-wide uppercase opacity-90">
                        {cls.subject_name}
                      </p>
                    ) : (
                      <p className="text-[10px] italic opacity-60">Dars tanlash...</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* If ADMIN role, and class is selected but has no pre-defined subject, show select dropdown */}
          {userInfo?.role === "ADMIN" && selectedClassId && !classes.find(c => c.id === selectedClassId)?.subject_id && (
            <div className="bg-[#fafafa] border border-zinc-200 rounded-xl p-4 space-y-2 mt-4 max-w-sm">
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Fan tanlang (Admin uchun)</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-white border border-zinc-200 focus:border-emerald-600 rounded-lg px-3 py-2 text-xs outline-none transition cursor-pointer font-semibold"
              >
                <option value="">Fanni tanlang</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeGS && (
            <div className="pt-3 border-t border-dashed border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Maktab baholash tizimi: <strong className="text-zinc-700">{activeGS.name} ({activeGS.type})</strong></span>
              {activeGS.type === "NUMERIC" && <span>Ruxsat etilgan diapazon: {activeGS.min_value} - {activeGS.max_value}</span>}
              {activeGS.type === "PERCENTAGE" && <span>Ruxsat etilgan foiz: {activeGS.min_value}% - {activeGS.max_value}%</span>}
              {activeGS.type === "LETTER" && (
                <span>Ruxsat etilgan harflar: {activeGS.options?.map((o: any) => o.label).join(", ")}</span>
              )}
            </div>
          )}
        </section>

        {/* Step 2: Excel-style Grading Spreadsheet Form */}
        {/* Step 2: Tab Switcher & Workspace content */}
        {!selectedClassId ? (
          <section className="text-center py-20 border border-dashed border-zinc-200 rounded-xl bg-white/40">
            <svg className="w-8 h-8 text-zinc-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-zinc-505 text-xs font-mono">Dars jurnalini yoki jadvalini ko'rish uchun sinf tanlang.</p>
          </section>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-200/80 mb-6">
              <button
                type="button"
                onClick={() => setTeacherTab("journal")}
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
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
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
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
                  className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                    teacherTab === "students"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-650"
                  }`}
                >
                  O'quvchilar
                </button>
              )}
              <button
                type="button"
                onClick={() => setTeacherTab("unapproved")}
                className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                  teacherTab === "unapproved"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                Tasdiqlanmagan Baholar
              </button>
            </div>

            {/* TAB CONTENT: Grading Journal — Daily Grid */}
            {teacherTab === "journal" && (
              <div className="space-y-4">
                {/* Date Selector Header */}
                <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Kunlik Sinf Jurnali</h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Sanani tanlang — o'sha kun dars jadvalidagi fanlar column bo'lib chiqadi
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Prev day */}
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(journalDate + 'T00:00:00');
                        if (isNaN(d.getTime())) return;
                        d.setDate(d.getDate() - 1);
                        const nd = d.toISOString().split('T')[0];
                        setJournalDate(nd);
                        fetchJournalData(nd);
                      }}
                      className="w-8 h-8 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition cursor-pointer text-sm"
                    >‹</button>
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5">
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={journalDate}
                        onChange={(e) => {
                          setJournalDate(e.target.value);
                          if (e.target.value) {
                            fetchJournalData(e.target.value);
                          }
                        }}
                        className="bg-transparent text-zinc-700 text-xs outline-none cursor-pointer font-semibold font-mono"
                      />
                    </div>
                    {/* Next day */}
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(journalDate + 'T00:00:00');
                        if (isNaN(d.getTime())) return;
                        d.setDate(d.getDate() + 1);
                        const nd = d.toISOString().split('T')[0];
                        setJournalDate(nd);
                        fetchJournalData(nd);
                      }}
                      className="w-8 h-8 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition cursor-pointer text-sm"
                    >›</button>
                    <button
                      type="button"
                      onClick={() => fetchJournalData()}
                      className="text-xs bg-zinc-900 hover:bg-zinc-700 text-white font-semibold py-1.5 px-4 rounded-lg transition cursor-pointer"
                    >
                      Yangilash
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveAllToday}
                      disabled={approveLoading}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-lg transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
                    >
                      {approveLoading ? (
                        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>Bugungi barcha baholarni tasdiqlash (🔒)</span>
                      )}
                    </button>
                    {selectedGradeIds.size > 0 && (
                      <button
                        type="button"
                        onClick={handleBulkApprove}
                        disabled={approveLoading}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded-lg transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
                      >
                        {approveLoading ? (
                          <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <span>Tanlanganlarni tasdiqlash ({selectedGradeIds.size} ta)</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

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
                ) : journalSubjectsToday.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl">
                    <p className="text-sm text-zinc-500 font-semibold mb-1">
                      {getFormattedJournalDate()}
                    </p>
                    <p className="text-xs text-zinc-400 font-mono">Bu kuni dars jadvali bo'yicha hech qanday fan topilmadi.</p>
                    <p className="text-[10px] text-zinc-300 font-mono mt-1">Dars jadvali "Dars Jadvali" tabida sozlanadi.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Grid legend row */}
                    <div className="px-5 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                        {getFormattedJournalDate()}
                        {' — '}
                        {journalSubjectsToday.length} ta fan
                      </span>
                      <div className="flex items-center gap-3 text-[9px] font-bold font-mono">
                        <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded bg-emerald-600 inline-block"></span>Marked</span>
                        <span className="flex items-center gap-1 text-teal-600"><span className="w-2 h-2 rounded bg-teal-500 inline-block"></span>Ota-ona ko'rdi</span>
                        <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded bg-blue-600 inline-block"></span>Tasdiqlangan 🔒</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-100 text-left">
                        <thead className="bg-[#fafafa] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 w-10 text-center font-mono sticky left-0 bg-[#fafafa] z-10">#</th>
                            <th className="px-5 py-3 w-52 sticky left-10 bg-[#fafafa] z-10">O'quvchi</th>
                            {journalSubjectsToday.map(subj => (
                              <th key={subj.id} className="px-4 py-3 text-center min-w-[120px] text-[9px] border-l border-zinc-100">
                                <div className="space-y-1 flex flex-col items-center">
                                  <span className="font-bold text-zinc-700 tracking-tight">{subj.name}</span>
                                  <select
                                    value={selectedGradingSystems[subj.id] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : "";
                                      if (val) {
                                        setSelectedGradingSystems(prev => ({ ...prev, [subj.id]: val }));
                                      }
                                    }}
                                    className="bg-zinc-100 hover:bg-zinc-200 border-none rounded px-1.5 py-0.5 text-[8px] font-bold text-zinc-500 outline-none transition cursor-pointer max-w-[100px] text-center"
                                  >
                                    {gradingSystemsList.map(gs => (
                                      <option key={gs.id} value={gs.id}>
                                        {gs.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-xs">
                          {students.length === 0 ? (
                            <tr>
                              <td colSpan={2 + journalSubjectsToday.length} className="px-5 py-10 text-center text-zinc-400 italic font-mono">
                                Bu sinfda o'quvchilar topilmadi.
                              </td>
                            </tr>
                          ) : (
                            students.map((st, idx) => (
                              <tr key={st.id} className="hover:bg-zinc-50/60 transition group">
                                <td className="px-4 py-3 text-center font-mono text-zinc-300 text-[10px] sticky left-0 bg-white group-hover:bg-zinc-50/60">{idx + 1}</td>
                                <td className="px-5 py-3 font-semibold text-zinc-900 sticky left-10 bg-white group-hover:bg-zinc-50/60 whitespace-nowrap">
                                  {st.first_name} {st.last_name}
                                </td>
                                {journalSubjectsToday.map(subj => {
                                  const grade = findGradeForDay(st.id, subj.id);
                                  const key = `${st.id}_${subj.id}`;
                                  const isApproved = grade?.status === 'approved';
                                  const isParentApproved = grade?.approved_by_parent;
                                  const isSaving = cellSaving === key;

                                  return (
                                    <td key={subj.id} className="px-2 py-2 text-center">
                                      <div className="relative inline-block">
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
                                            className="absolute -left-4 top-3 w-3 h-3 text-emerald-600 border-zinc-300 rounded focus:ring-0 cursor-pointer z-20"
                                            title="Tasdiqlash uchun tanlash"
                                          />
                                        )}
                                        <input
                                          type="text"
                                          value={cellInputs[key] || ''}
                                          onChange={(e) => setCellInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleCellSave(st.id, subj.id);
                                            }
                                          }}
                                          onBlur={() => {
                                            handleCellSave(st.id, subj.id);
                                          }}
                                          disabled={isSaving || isApproved}
                                          placeholder="—"
                                          className={`w-14 text-center bg-transparent border rounded-lg pl-1 pr-4 py-1.5 text-xs outline-none transition font-mono font-bold text-zinc-800
                                            ${isSaving
                                              ? 'border-emerald-400 animate-pulse'
                                              : isApproved
                                              ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed font-bold'
                                              : isParentApproved
                                              ? 'bg-teal-50 border-teal-200 text-teal-700 focus:bg-white focus:border-emerald-500'
                                              : grade
                                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:bg-white focus:border-emerald-500'
                                              : (cellInputs[key] || '').trim()
                                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-750'
                                              : 'border-dashed border-zinc-200 hover:border-zinc-350 focus:border-emerald-500 focus:bg-emerald-50/20'
                                            }`}
                                        />
                                        {isApproved && (
                                          <span className="absolute right-1.5 top-2 text-[8px]" title="Tasdiqlangan baholash, o'zgartirib bo'lmaydi">🔒</span>
                                        )}
                                        {!isApproved && isParentApproved && (
                                          <span className="absolute right-1.5 top-2 text-[8px] text-teal-600 font-bold" title="Ota-ona ko'rdi">✓</span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Footer hint */}
                    <div className="px-5 py-2.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
                      <p className="text-[10px] text-zinc-400 font-mono">
                        Bo'sh katakka baho kiriting → <kbd className="bg-white border border-zinc-200 rounded px-1 py-0.5 text-[9px]">Enter</kbd> yoki boshqa katakka o'tish bilan saqlanadi
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {journalAllGrades.filter(g => {
                          const gDate = g.grade_date ? new Date(g.grade_date).toISOString().split('T')[0] : '';
                          return gDate === journalDate;
                        }).length} ta baho kiritilgan bu kuni
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
                          <span className="text-zinc-300 text-xs">â€¢</span>
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
                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                      <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Sana:</label>
                        <input
                          type="date"
                          value={scheduleViewDate}
                          onChange={(e) => {
                            setScheduleViewDate(e.target.value);
                            fetchClassSchedule(e.target.value);
                          }}
                          className="bg-transparent text-zinc-700 text-xs outline-none border-none cursor-pointer w-28 font-semibold animate-pulse"
                        />
                      </div>
                      {isMainTeacherOfClass() && (
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
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg transition cursor-pointer"
                        >
                          Jadvalni tahrirlash
                        </button>
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
                  <button
                    type="button"
                    onClick={() => {
                      setStudentModalMode("create");
                      setStudentForm({
                        first_name: "",
                        last_name: "",
                        middle_name: "",
                        phone: "",
                        password: "123456" // default password
                      });
                      setShowStudentModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg transition cursor-pointer flex items-center space-x-1"
                  >
                    <span>+ O'quvchi qo'shish</span>
                  </button>
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
                            <th className="px-5 py-3">Telefon raqam</th>
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
                              <td className="px-5 py-3 font-mono text-zinc-500">{st.phone || "—"}</td>
                              <td className="px-5 py-3 text-right space-x-2">
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
                                      password: ""
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
                <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Tasdiqlanmagan Baholar Ro'yxati</h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Bu oynada tasdiqlanmagan (draft) baholar sanasi bo'yicha kamayish (descending) tartibida ko'rinadi.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedGradeIds.size > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          setApproveLoading(true);
                          try {
                            const response = await fetch("http://localhost:6560/api/schools/grades/change-status", {
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
                            fetchUnapprovedGrades();
                          } catch (err: any) {
                            showToast("error", err.message);
                          } finally {
                            setApproveLoading(false);
                          }
                        }}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded-lg transition cursor-pointer flex items-center space-x-1 shadow-sm"
                      >
                        <span>Tanlanganlarni tasdiqlash ({selectedGradeIds.size} ta)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fetchUnapprovedGrades()}
                      className="text-xs bg-zinc-900 hover:bg-zinc-700 text-white font-semibold py-1.5 px-4 rounded-lg transition cursor-pointer"
                    >
                      Yangilash
                    </button>
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
                                        const response = await fetch("http://localhost:6560/api/schools/grades/change-status", {
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
                                        const response = await fetch(`http://localhost:6560/api/schools/grades/${g.id}`, {
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
      {renderEditWeeklyScheduleModal()}
      {renderAddExceptionModal()}
      {renderPeriodsModal()}
      {renderStudentModal()}
    </div>
  );
}
