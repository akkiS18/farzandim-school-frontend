"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Types
interface ClassItem {
  id: number;
  name: string;
}

interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  school_id: string;
}

interface TenantUser {
  id: number;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  role_id: number;
  role_name: string;
  class_id?: number;
  class_name?: string;
  student_id?: number;
  student_name?: string;
  created_at: string;
}

interface SubjectItem {
  id: number;
  name: string;
}

interface ClassTeacherItem {
  id: number;
  class_id: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone: string;
  is_main_teacher: boolean;
  role_name: string;
}

interface RowError {
  row: number;
  error: string;
}

interface ImportResult {
  success: boolean;
  imported_count: number;
  failed_count: number;
  errors: RowError[];
}

interface ClassScheduleItem {
  id: number;
  class_id: number;
  day_of_week: number;
  lesson_number: number;
  subject_id: number;
  subject_name: string;
}

export default function TenantDashboard() {
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };
  
  // Auth & General States
  const [token, setToken] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Menu / Sidebar View: "classes" | "teachers" | "subjects" | "grading-systems"
  const [activeMenu, setActiveMenu] = useState<"classes" | "teachers" | "subjects" | "grading-systems">("classes");

  // Selected Class details context (if null, show class list grid)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [classDetailsTab, setClassDetailsTab] = useState<"students" | "teachers" | "parents" | "schedule">("students");

  // Weekly Schedule States
  const [classSchedule, setClassSchedule] = useState<ClassScheduleItem[]>([]);
  const [classScheduleLoading, setClassScheduleLoading] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [scheduleFormState, setScheduleFormState] = useState<{ [key: string]: number }>({});
  const [scheduleStartDate, setScheduleStartDate] = useState("2026-09-01");
  const [scheduleEndDate, setScheduleEndDate] = useState("2027-05-31");

  // Daily Schedule Exception States
  const [scheduleViewDate, setScheduleViewDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduleExceptions, setScheduleExceptions] = useState<any[]>([]);
  const [scheduleExceptionsLoading, setScheduleExceptionsLoading] = useState(false);
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false);
  const [excDate, setExcDate] = useState(new Date().toISOString().split("T")[0]);
  const [excLesson, setExcLesson] = useState(1);
  const [excType, setExcType] = useState("replace"); // "replace" or "cancel"
  const [excSubjectId, setExcSubjectId] = useState<number | "">("");

  // Grading System states
  const [gradingSystems, setGradingSystems] = useState<any[]>([]);
  const [activeGS, setActiveGS] = useState<any | null>(null);
  const [showAddGSModal, setShowAddGSModal] = useState(false);
  const [gsNameInput, setGsNameInput] = useState("");
  const [gsTypeInput, setGsTypeInput] = useState("NUMERIC");
  const [gsMinInput, setGsMinInput] = useState("1");
  const [gsMaxInput, setGsMaxInput] = useState("5");
  const [gsOptionsInput, setGsOptionsInput] = useState("");

  // Core Data Lists
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TenantUser[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  
  // Contextual Sub-lists
  const [classStudents, setClassStudents] = useState<TenantUser[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherItem[]>([]);
  const [classParents, setClassParents] = useState<TenantUser[]>([]);
  const [classScheduleItem, setClassScheduleItem] = useState<ClassScheduleItem[]>([]); // unused/duplicate, let's just stick to classSchedule
  const [classStudentsLoading, setClassStudentsLoading] = useState(false);
  const [classTeachersLoading, setClassTeachersLoading] = useState(false);
  const [classParentsLoading, setClassParentsLoading] = useState(false);

  // Filtration & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  // Modal Control States
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showImportStudentsModal, setShowImportStudentsModal] = useState(false);

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showImportTeachersModal, setShowImportTeachersModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [showUnassignTeacherModal, setShowUnassignTeacherModal] = useState(false);
  const [unassignClassTeacherId, setUnassignClassTeacherId] = useState<number | null>(null);

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

  // Form Inputs State
  const [newClassName, setNewClassName] = useState("");
  const [editClassName, setEditClassName] = useState("");

  // Student Form
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentMiddleName, setStudentMiddleName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentPassword, setStudentPassword] = useState("password123");

  // Parent Management States
  const [showParentsModal, setShowParentsModal] = useState(false);
  const [selectedStudentForParents, setSelectedStudentForParents] = useState<TenantUser | null>(null);
  const [linkedParents, setLinkedParents] = useState<any[]>([]);
  const [linkedParentsLoading, setLinkedParentsLoading] = useState(false);
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentMiddleName, setParentMiddleName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("password123");

  // Teacher Form
  const [teacherFirstName, setTeacherFirstName] = useState("");
  const [teacherLastName, setTeacherLastName] = useState("");
  const [teacherMiddleName, setTeacherMiddleName] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherRole, setTeacherRole] = useState("SUBJECT_TEACHER");
  const [teacherPassword, setTeacherPassword] = useState("password123");

  // Subject Form
  const [subjectNameInput, setSubjectNameInput] = useState("");

  // Teacher Assignment Form
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignIsMain, setAssignIsMain] = useState(false);

  // Action Loading & Errors
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Parent Import State
  const [showImportParentsModal, setShowImportParentsModal] = useState(false);

  // Edit/Delete Student States
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<TenantUser | null>(null);
  const [editStudentFirstName, setEditStudentFirstName] = useState("");
  const [editStudentLastName, setEditStudentLastName] = useState("");
  const [editStudentMiddleName, setEditStudentMiddleName] = useState("");
  const [editStudentPhone, setEditStudentPhone] = useState("");
  const [editStudentPassword, setEditStudentPassword] = useState("");

  // Edit/Unlink Parent States
  const [showEditParentModal, setShowEditParentModal] = useState(false);
  const [showUnlinkParentModal, setShowUnlinkParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState<TenantUser | null>(null);
  const [editParentFirstName, setEditParentFirstName] = useState("");
  const [editParentLastName, setEditParentLastName] = useState("");
  const [editParentMiddleName, setEditParentMiddleName] = useState("");
  const [editParentPhone, setEditParentPhone] = useState("");
  const [editParentPassword, setEditParentPassword] = useState("");
  const [unlinkStudentId, setUnlinkStudentId] = useState<number | null>(null);

  // Change Password State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordOld, setChangePasswordOld] = useState("");
  const [changePasswordNew, setChangePasswordNew] = useState("");
  const [changePasswordConfirm, setChangePasswordConfirm] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  // Initialize
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
      setUserInfo(JSON.parse(savedUserStr));
    } catch (e) {
      router.push("/login");
      return;
    }

    loadInitialData(savedToken);
  }, [router]);

  // Contextual Class view trigger
  useEffect(() => {
    if (selectedClass && token) {
      fetchClassStudents();
      fetchClassTeachers();
      fetchClassParents();
      fetchClassSchedule();
      fetchScheduleExceptions();
    }
  }, [selectedClass, token]);

  const loadInitialData = async (authToken: string) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClassesData(authToken),
        fetchTeachersData(authToken),
        fetchSubjectsData(authToken),
        fetchGradingSystemsData(authToken),
        fetchActiveGSData(authToken),
      ]);
    } catch (err) {
      console.error("Initial load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesData = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:6560/api/schools/classes", {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setClasses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeachersData = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:6560/api/schools/teachers", {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setTeachers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGradingSystemsData = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:6560/api/schools/grading-systems", {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setGradingSystems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveGSData = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:6560/api/schools/grading-systems/active", {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setActiveGS(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubjectsData = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:6560/api/schools/subjects", {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) setSubjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass) return;
    setClassStudentsLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/users?role=STUDENT&class_id=${selectedClass.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setClassStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setClassStudentsLoading(false);
    }
  };

  const fetchClassTeachers = async () => {
    if (!selectedClass) return;
    setClassTeachersLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/teachers`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setClassTeachers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setClassTeachersLoading(false);
    }
  };

  const fetchClassParents = async () => {
    if (!selectedClass) return;
    setClassParentsLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/users?role=PARENT&class_id=${selectedClass.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setClassParents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setClassParentsLoading(false);
    }
  };

  const fetchClassSchedule = async (targetDate?: string) => {
    if (!selectedClass) return;
    setClassScheduleLoading(true);
    const dateQuery = targetDate || scheduleViewDate || new Date().toISOString().split("T")[0];
    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/schedule?date=${dateQuery}`, {
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
    if (!selectedClass) return;
    setScheduleExceptionsLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/schedule-exceptions`, {
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

  const handleAddExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setActionLoading(true);
    setActionError("");

    const payload = {
      date: excDate,
      lesson_number: Number(excLesson),
      subject_id: excType === "cancel" ? null : Number(excSubjectId),
    };

    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/schedule-exceptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Dars o'zgarishini saqlab bo'lmadi");

      alert("Dars o'zgarishi muvaffaqiyatli saqlandi!");
      setShowAddExceptionModal(false);
      
      // Reset form fields
      setExcType("replace");
      setExcSubjectId("");

      // Reload both schedule view and exception history
      fetchClassSchedule();
      fetchScheduleExceptions();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteException = async (exceptionId: number) => {
    if (!selectedClass) return;
    if (!confirm("Haqiqatan ham ushbu dars o'zgarishini bekor qilmoqchimisiz? (Jadval haftalik shablondagi holatiga qaytadi)")) return;

    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/schedule-exceptions/${exceptionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'zgarishni o'chirib bo'lmadi");

      alert("Dars o'zgarishi muvaffaqiyatli o'chirildi!");
      fetchClassSchedule();
      fetchScheduleExceptions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
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
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/schedule`, {
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
      if (!response.ok) throw new Error(data.error || "Dars jadvalini saqlab bo'lmadi");

      alert("Dars jadvali muvaffaqiyatli saqlandi!");
      setShowEditScheduleModal(false);
      fetchClassSchedule();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isMainTeacherOfClass = () => {
    if (!userInfo || !selectedClass) return false;
    if (userInfo.role === "ADMIN") return true;
    return classTeachers.some((ct) => ct.teacher_id === userInfo.id && ct.is_main_teacher);
  };

  const fetchLinkedParents = async (studentId: number) => {
    setLinkedParentsLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/students/${studentId}/parents`, {
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

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForParents) return;
    if (!parentFirstName.trim() || !parentLastName.trim() || !parentPhone.trim() || !parentPassword.trim()) {
      alert("Majburiy maydonlarni to'ldiring");
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`http://localhost:6560/api/schools/students/${selectedStudentForParents.id}/parents`, {
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
          email: parentEmail.trim() || undefined,
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
      setParentEmail("");
      setParentPassword("password123");

      fetchLinkedParents(selectedStudentForParents.id);
      alert("Ota-ona muvaffaqiyatli bog'landi");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkParent = async (parentId: number) => {
    if (!selectedStudentForParents) return;
    if (!confirm("Haqiqatan ham ushbu ota-onani o'quvchidan ajratmoqchisiz?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/students/${selectedStudentForParents.id}/parents/${parentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "O'chirishda xatolik yuz berdi");
      }

      fetchLinkedParents(selectedStudentForParents.id);
      alert("Bog'liqlik muvaffaqiyatli o'chirildi");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Class Actions
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch("http://localhost:6560/api/schools/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newClassName.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sinfni saqlab bo'lmadi");

      setClasses((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewClassName("");
      setShowAddClassModal(false);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !editClassName.trim()) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editClassName.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sinfni yangilab bo'lmadi");

      setClasses((prev) => prev.map((c) => (c.id === selectedClass.id ? data : c)));
      setSelectedClass(data);
      setEditClassName("");
      setShowEditClassModal(false);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    setActionLoading(true);

    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Sinfni o'chirib bo'lmadi");
      }

      setClasses((prev) => prev.filter((c) => c.id !== selectedClass.id));
      setSelectedClass(null);
      setShowDeleteClassModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Student Add manual
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: studentFirstName.trim(),
          last_name: studentLastName.trim(),
          middle_name: studentMiddleName.trim() || undefined,
          phone: studentPhone.trim() || null,
          password: studentPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'quvchini qo'shib bo'lmadi");

      // Reset
      setStudentFirstName("");
      setStudentLastName("");
      setStudentMiddleName("");
      setStudentPhone("");
      setStudentPassword("password123");
      setShowAddStudentModal(false);

      // Reload
      fetchClassStudents();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Student Edit manual
  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`http://localhost:6560/api/schools/students/${editingStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: editStudentFirstName.trim(),
          last_name: editStudentLastName.trim(),
          middle_name: editStudentMiddleName.trim() || undefined,
          phone: editStudentPhone.trim() || null,
          password: editStudentPassword ? editStudentPassword : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'quvchi ma'lumotlarini tahrirlab bo'lmadi");

      // Reset
      setEditStudentFirstName("");
      setEditStudentLastName("");
      setEditStudentMiddleName("");
      setEditStudentPhone("");
      setEditStudentPassword("");
      setEditingStudent(null);
      setShowEditStudentModal(false);

      // Reload
      fetchClassStudents();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Student Delete manual
  const handleDeleteStudent = async () => {
    if (!editingStudent) return;
    setActionLoading(true);

    try {
      const response = await fetch(`http://localhost:6560/api/schools/students/${editingStudent.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "O'quvchini o'chirib bo'lmadi");
      }

      setEditingStudent(null);
      setShowDeleteStudentModal(false);
      fetchClassStudents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Parent Edit manual
  const handleEditParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`http://localhost:6560/api/schools/parents/${editingParent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: editParentFirstName.trim(),
          last_name: editParentLastName.trim(),
          middle_name: editParentMiddleName.trim() || undefined,
          phone: editParentPhone.trim(),
          password: editParentPassword ? editParentPassword : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ota-ona ma'lumotlarini tahrirlab bo'lmadi");

      // Reset
      setEditParentFirstName("");
      setEditParentLastName("");
      setEditParentMiddleName("");
      setEditParentPhone("");
      setEditParentPassword("");
      setEditingParent(null);
      setShowEditParentModal(false);

      // Reload parents list
      fetchClassParents();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Parent Unlink from tab list
  const handleUnlinkParentFromTab = async () => {
    if (!editingParent || unlinkStudentId === null) return;
    setActionLoading(true);

    try {
      const response = await fetch(`http://localhost:6560/api/schools/students/${unlinkStudentId}/parents/${editingParent.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ota-onani ajratib bo'lmadi");
      }

      setEditingParent(null);
      setUnlinkStudentId(null);
      setShowUnlinkParentModal(false);
      fetchClassParents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Teacher Add manual
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch("http://localhost:6560/api/schools/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: teacherFirstName.trim(),
          last_name: teacherLastName.trim(),
          middle_name: teacherMiddleName.trim() || undefined,
          phone: teacherPhone.trim(),
          role: teacherRole,
          password: teacherPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'qituvchini qo'shib bo'lmadi");

      // Reset
      setTeacherFirstName("");
      setTeacherLastName("");
      setTeacherMiddleName("");
      setTeacherPhone("");
      setTeacherRole("SUBJECT_TEACHER");
      setTeacherPassword("password123");
      setShowAddTeacherModal(false);

      // Reload
      fetchTeachersData(token);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Subject Add manual
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameInput.trim()) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch("http://localhost:6560/api/schools/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: subjectNameInput.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Fanni saqlab bo'lmadi");

      setSubjects((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSubjectNameInput("");
      setShowAddSubjectModal(false);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Grading System actions
  const handleActivateGS = async (id: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/grading-systems/${id}/activate`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        fetchGradingSystemsData(token);
        fetchActiveGSData(token);
      } else {
        alert(data.error || "Faollashtirishda xatolik");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGS = async (id: number) => {
    if (!confirm("Haqiqatan ham ushbu baholash tizimini o'chirmoqchisiz?")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:6560/api/schools/grading-systems/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        fetchGradingSystemsData(token);
      } else {
        alert(data.error || "O'chirishda xatolik");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateGS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gsNameInput.trim()) return;
    setActionLoading(true);
    setActionError("");

    let bodyData: any = {
      name: gsNameInput.trim(),
      type: gsTypeInput,
    };

    if (gsTypeInput === "NUMERIC" || gsTypeInput === "PERCENTAGE") {
      bodyData.min_value = parseFloat(gsMinInput);
      bodyData.max_value = parseFloat(gsMaxInput);
    } else if (gsTypeInput === "LETTER") {
      try {
        bodyData.options = JSON.parse(gsOptionsInput.trim());
      } catch (err) {
        setActionError("Options formati noto'g'ri (JSON array kutilmoqda)");
        setActionLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:6560/api/schools/grading-systems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Baholash tizimini yaratib bo'lmadi");

      setGsNameInput("");
      setGsOptionsInput("");
      setShowAddGSModal(false);
      fetchGradingSystemsData(token);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Assign Teacher to Class
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !assignTeacherId || !assignSubjectId) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          teacher_id: parseInt(assignTeacherId),
          subject_id: parseInt(assignSubjectId),
          is_main_teacher: assignIsMain,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'qituvchini biriktirib bo'lmadi");

      setAssignTeacherId("");
      setAssignSubjectId("");
      setAssignIsMain(false);
      setShowAssignTeacherModal(false);

      // Reload
      fetchClassTeachers();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Unassign Teacher Trigger
  const triggerUnassignTeacher = (classTeacherID: number) => {
    setUnassignClassTeacherId(classTeacherID);
    setShowUnassignTeacherModal(true);
  };

  const handleUnassignTeacherSubmit = async () => {
    if (!selectedClass || !unassignClassTeacherId) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`http://localhost:6560/api/schools/classes/${selectedClass.id}/teachers/${unassignClassTeacherId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'chirishda xatolik yuz berdi");

      setShowUnassignTeacherModal(false);
      setUnassignClassTeacherId(null);
      
      // Reload
      fetchClassTeachers();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Template Downloads
  const downloadTemplate = async (type: "students" | "teachers" | "parents") => {
    try {
      let url = `http://localhost:6560/api/schools/import/template/${type}`;
      if (type === "parents" && selectedClass) {
        url += `?class_id=${selectedClass.id}`;
      }
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Shablonni yuklab bo'lmadi");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = type === "students" ? "oquvchi_template.xlsx" : type === "teachers" ? "oqituvchilar_shablon.xlsx" : "ota_ona_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Sheet Uploader
  const handleSheetUpload = async (e: React.FormEvent, type: "students" | "teachers" | "parents") => {
    e.preventDefault();
    if (!selectedFile) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`http://localhost:6560/api/schools/import/${type}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Faylni yuklashda xatolik yuz berdi");

      setImportResult(data);
      // Reload relevant views
      loadInitialData(token);
      if (selectedClass) {
        if (classDetailsTab === "students") fetchClassStudents();
        else fetchClassTeachers();
      }
    } catch (err: any) {
      setImportError(err.message || "Yuklashda xatolik");
    } finally {
      setImportLoading(false);
    }
  };

  // Change Password Settings Handler
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordOld.trim() || !changePasswordNew.trim() || !changePasswordConfirm.trim()) {
      setChangePasswordError("Barcha maydonlarni to'ldiring");
      return;
    }
    if (changePasswordNew !== changePasswordConfirm) {
      setChangePasswordError("Yangi parollar mos kelmadi");
      return;
    }
    setChangePasswordLoading(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");

    try {
      const response = await fetch("http://localhost:6560/api/schools/settings/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: changePasswordOld,
          new_password: changePasswordNew,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Parolni o'zgartirib bo'lmadi");
      }

      setChangePasswordSuccess(data.message || "Parol muvaffaqiyatli o'zgartirildi!");
      setChangePasswordOld("");
      setChangePasswordNew("");
      setChangePasswordConfirm("");
    } catch (err: any) {
      setChangePasswordError(err.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const closeSheetModal = () => {
    setShowImportStudentsModal(false);
    setShowImportTeachersModal(false);
    setShowImportParentsModal(false);
    setSelectedFile(null);
    setImportError("");
    setImportResult(null);
  };

  // Search/Filters
  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTeachers = teachers.filter((t) =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (t.phone && t.phone.includes(teacherSearch))
  );
  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#070709] text-zinc-100 flex font-sans overflow-hidden">
      
      {/* Sidebar - Premium frosted glass, thin borders (Apple Design) */}
      <aside className="w-64 bg-[#0d0d12]/40 border-r border-zinc-800/40 backdrop-blur-2xl flex flex-col justify-between shrink-0 h-screen select-none">
        <div>
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-800/40">
            <span className="flex items-center space-x-2.5">
              <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10M6 10h10M6 14h6" />
              </svg>
              <span className="text-md font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Online Jurnal
              </span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => {
                setActiveMenu("classes");
                setSelectedClass(null);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                activeMenu === "classes"
                  ? "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20"
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
              <span>Sinflar</span>
            </button>

            <button
              onClick={() => {
                setActiveMenu("teachers");
                setSelectedClass(null);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                activeMenu === "teachers"
                  ? "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20"
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>O'qituvchilar</span>
            </button>

            <button
              onClick={() => {
                setActiveMenu("subjects");
                setSelectedClass(null);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                activeMenu === "subjects"
                  ? "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20"
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Fanlar</span>
            </button>

            {userInfo && userInfo.role === "ADMIN" && (
              <button
                onClick={() => {
                  setActiveMenu("grading-systems");
                  setSelectedClass(null);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                  activeMenu === "grading-systems"
                    ? "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                    : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20"
                }`}
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Baholash Tizimi</span>
              </button>
            )}
          </nav>
        </div>

        {/* User Card & Logout (Apple Sidebar Profile style) */}
        <div className="p-4 border-t border-zinc-800/40 bg-[#0d0d12]/20">
          {userInfo && (
            <div className="mb-3 px-2 flex justify-between items-center">
              <div className="truncate pr-2">
                <p className="text-sm font-semibold text-zinc-200 truncate">
                  {userInfo.first_name} {userInfo.last_name}
                </p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate uppercase">
                  {userInfo.role === "ADMIN" ? "Maktab Admini" : userInfo.role}
                </p>
              </div>
              <button
                onClick={() => {
                  setChangePasswordOld("");
                  setChangePasswordNew("");
                  setChangePasswordConfirm("");
                  setChangePasswordError("");
                  setChangePasswordSuccess("");
                  setShowChangePasswordModal(true);
                }}
                title="Parolni o'zgartirish"
                className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-zinc-800/50 rounded-lg transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-zinc-900/50 hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 py-2.5 px-4 rounded-xl text-xs font-semibold transition duration-200 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <section className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-b from-[#09090d] to-[#070709]">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-800/40 px-8 flex items-center justify-between backdrop-blur-xl bg-[#09090d]/30 select-none">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-600 font-mono">
              Maktab: {schoolId}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-zinc-900 border border-zinc-800/60 text-zinc-400 px-3 py-1 rounded-full font-mono">
              v1.1 (subdomain)
            </span>
          </div>
        </header>

        {/* View Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-zinc-400 font-medium">Boshqaruv paneli yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {/* MENU 1: CLASSES VIEW */}
              {activeMenu === "classes" && (
                <>
                  {!selectedClass ? (
                    // 1A. Class list grid
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-2xl font-bold text-zinc-100">Sinflar Boshqaruvi</h1>
                          <p className="text-xs text-zinc-500 mt-1">Maktabingizdagi faol sinflar va ularning tarkibini boshqaring.</p>
                        </div>
                        {userInfo?.role === "ADMIN" && (
                          <button
                            onClick={() => setShowAddClassModal(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition duration-200 shadow-lg shadow-blue-600/15 cursor-pointer whitespace-nowrap"
                          >
                            + Yangi Sinf
                          </button>
                        )}
                      </div>

                      {/* Search & Statistics bar */}
                      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-zinc-900/20 border border-zinc-800/40 p-4 rounded-2xl backdrop-blur-md">
                        <div className="relative max-w-sm w-full">
                          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                          </span>
                          <input
                            type="text"
                            placeholder="Sinf nomini qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition"
                          />
                        </div>
                        <div className="flex items-center space-x-6 text-xs text-zinc-400 px-2 font-mono">
                          <span>Jami sinflar: <strong className="text-blue-400 font-bold">{classes.length}</strong></span>
                        </div>
                      </div>

                      {filteredClasses.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-zinc-800/60 rounded-3xl bg-zinc-950/10">
                          <p className="text-zinc-500 text-sm">
                            {searchQuery ? "Mos keluvchi sinflar topilmadi" : "Hozircha hech qanday sinf mavjud emas. Yuqoridan yangi sinf qo'shing."}
                          </p>
                        </div>
                      ) : (
                        // Classes Grid
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredClasses.map((cls) => (
                            <div
                              key={cls.id}
                              onClick={() => {
                                setSelectedClass(cls);
                                setClassDetailsTab("students");
                              }}
                              className="bg-zinc-900/30 border border-zinc-800/50 hover:border-blue-500/30 rounded-2xl p-5 backdrop-blur-xl cursor-pointer hover:shadow-xl hover:shadow-blue-500/[0.02] hover:-translate-y-0.5 transition duration-300 flex flex-col justify-between h-40 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-zinc-100 group-hover:text-blue-400 transition">
                                  {cls.name} sinfi
                                </span>
                                <span className="bg-zinc-800/60 text-zinc-400 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border border-zinc-800">
                                  ID: {cls.id}
                                </span>
                              </div>

                              <div className="text-xs text-zinc-500 space-y-1">
                                <p className="flex items-center">
                                  <svg className="w-3.5 h-3.5 text-zinc-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                  </svg>
                                  Boshqarish uchun ustiga bosing
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // 1B. Contextual Class detail view
                    <div className="space-y-6">
                      {/* Class Details Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/40 pb-5">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setSelectedClass(null)}
                            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 p-2.5 rounded-xl transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <div>
                            <h1 className="text-2xl font-bold text-zinc-100">
                              {selectedClass.name} sinfi
                            </h1>
                            <p className="text-xs text-zinc-500 mt-1">Sinf tarkibidagi o'quvchilar va fan o'qituvchilari boshqaruvi.</p>
                          </div>
                        </div>

                        {userInfo?.role === "ADMIN" && (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                setEditClassName(selectedClass.name);
                                setShowEditClassModal(true);
                              }}
                              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                            >
                              Nomini o'zgartirish
                            </button>
                            <button
                              onClick={() => setShowDeleteClassModal(true)}
                              className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                            >
                              Sinfni o'chirish
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inside Tab Switcher */}
                      <div className="flex border-b border-zinc-800/40">
                        <button
                          onClick={() => setClassDetailsTab("students")}
                          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                            classDetailsTab === "students"
                              ? "border-blue-500 text-blue-400 bg-blue-500/5"
                              : "border-transparent text-zinc-400 hover:text-zinc-300"
                          }`}
                        >
                          Sinf O'quvchilari ({classStudents.length})
                        </button>
                        <button
                          onClick={() => setClassDetailsTab("teachers")}
                          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                            classDetailsTab === "teachers"
                              ? "border-blue-500 text-blue-400 bg-blue-500/5"
                              : "border-transparent text-zinc-400 hover:text-zinc-300"
                          }`}
                        >
                          Biriktirilgan O'qituvchilar ({classTeachers.length})
                        </button>
                        <button
                          onClick={() => setClassDetailsTab("parents")}
                          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                            classDetailsTab === "parents"
                              ? "border-blue-500 text-blue-400 bg-blue-500/5"
                              : "border-transparent text-zinc-400 hover:text-zinc-300"
                          }`}
                        >
                          Ota-onalar ({classParents.length})
                        </button>
                        <button
                          onClick={() => setClassDetailsTab("schedule")}
                          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                            classDetailsTab === "schedule"
                              ? "border-blue-500 text-blue-400 bg-blue-500/5"
                              : "border-transparent text-zinc-400 hover:text-zinc-300"
                          }`}
                        >
                          Dars Jadvali
                        </button>
                      </div>

                      {/* Tab Content: Students */}
                      {classDetailsTab === "students" && (
                        <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-md font-bold text-zinc-300">O'quvchilar ro'yxati</h3>
                            
                            <div className="flex space-x-3">
                              {userInfo?.role === "ADMIN" && (
                                <button
                                  onClick={() => setShowImportStudentsModal(true)}
                                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-indigo-400 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                                >
                                  Excel orqali yuklash
                                </button>
                              )}
                              {isMainTeacherOfClass() && (
                                <button
                                  onClick={() => setShowImportParentsModal(true)}
                                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-teal-400 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                                >
                                  Excel orqali ota-onalarni yuklash
                                </button>
                              )}
                              {isMainTeacherOfClass() && (
                                <button
                                  onClick={() => setShowAddStudentModal(true)}
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                                >
                                  + O'quvchi qo'shish
                                </button>
                              )}
                            </div>
                          </div>

                          {classStudentsLoading ? (
                            <div className="text-center py-10">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          ) : classStudents.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/10">
                              <p className="text-zinc-500 text-xs">Ushbu sinfda o'quvchilar mavjud emas.</p>
                            </div>
                          ) : (
                            <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                              <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                                <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-5 py-3">T/R</th>
                                    <th className="px-5 py-3">F.I.SH</th>
                                    <th className="px-5 py-3">Telefon</th>
                                    <th className="px-5 py-3">Ro'yxatdan o'tgan sana</th>
                                    {isMainTeacherOfClass() && <th className="px-5 py-3 text-right">Amallar</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                                  {classStudents.map((st, idx) => (
                                    <tr key={st.id} className="hover:bg-zinc-900/40 transition">
                                      <td className="px-5 py-3 font-mono text-zinc-500">{idx + 1}</td>
                                      <td className="px-5 py-3 font-medium text-zinc-100">
                                        {st.first_name} {st.last_name} {st.middle_name && <span className="text-zinc-500">({st.middle_name})</span>}
                                      </td>
                                      <td className="px-5 py-3 font-mono">{st.phone || "-"}</td>
                                      <td className="px-5 py-3 text-zinc-500">{new Date(st.created_at).toLocaleDateString()}</td>
                                      {isMainTeacherOfClass() && (
                                        <td className="px-5 py-3 text-right">
                                          <div className="flex items-center justify-end space-x-2">
                                            <button
                                              onClick={() => {
                                                setSelectedStudentForParents(st);
                                                setParentFirstName("");
                                                setParentLastName("");
                                                setParentMiddleName("");
                                                setParentPhone("");
                                                setParentEmail("");
                                                setParentPassword("password123");
                                                fetchLinkedParents(st.id);
                                                setShowParentsModal(true);
                                              }}
                                              className="bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/20 text-blue-400 text-[10px] font-semibold py-1 px-2.5 rounded-lg transition cursor-pointer"
                                            >
                                              Vasiylar
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingStudent(st);
                                                setEditStudentFirstName(st.first_name);
                                                setEditStudentLastName(st.last_name);
                                                setEditStudentMiddleName(st.middle_name || "");
                                                setEditStudentPhone(st.phone || "");
                                                setEditStudentPassword("");
                                                setShowEditStudentModal(true);
                                              }}
                                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold py-1 px-2.5 rounded-lg border border-zinc-700/60 transition cursor-pointer"
                                            >
                                              Tahrirlash
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingStudent(st);
                                                setShowDeleteStudentModal(true);
                                              }}
                                              className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 text-[10px] font-semibold py-1 px-2.5 rounded-lg transition cursor-pointer"
                                            >
                                              O'chirish
                                            </button>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab Content: Teachers */}
                      {classDetailsTab === "teachers" && (
                        <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-md font-bold text-zinc-300">Dars beradigan o'qituvchilar</h3>
                            {isMainTeacherOfClass() && (
                              <button
                                onClick={() => {
                                  if (teachers.length === 0) {
                                    alert("Avval o'qituvchilarni qo'shing");
                                    return;
                                  }
                                  if (subjects.length === 0) {
                                    alert("Avval fanlarni yarating");
                                    return;
                                  }
                                  setAssignTeacherId("");
                                  setAssignSubjectId("");
                                  setAssignIsMain(false);
                                  setShowAssignTeacherModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                              >
                                + O'qituvchi biriktirish
                              </button>
                            )}
                          </div>

                          {classTeachersLoading ? (
                            <div className="text-center py-10">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          ) : classTeachers.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/10">
                              <p className="text-zinc-500 text-xs">Ushbu sinfga o'qituvchilar biriktirilmagan.</p>
                            </div>
                          ) : (
                            <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                              <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                                <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-5 py-3">T/R</th>
                                    <th className="px-5 py-3">O'qituvchi</th>
                                    <th className="px-5 py-3">Fan</th>
                                    <th className="px-5 py-3">Turi</th>
                                    <th className="px-5 py-3 text-right">Amallar</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                                  {classTeachers.map((ct, idx) => (
                                    <tr key={ct.id} className="hover:bg-zinc-900/40 transition">
                                      <td className="px-5 py-3 font-mono text-zinc-500">{idx + 1}</td>
                                      <td className="px-5 py-3 font-medium text-zinc-100">
                                        {ct.first_name} {ct.last_name} {ct.middle_name && <span className="text-zinc-500">({ct.middle_name})</span>}
                                      </td>
                                      <td className="px-5 py-3 text-blue-400 font-semibold">{ct.subject_name}</td>
                                      <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                          ct.is_main_teacher
                                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/20"
                                            : "bg-zinc-800 text-zinc-400 border border-zinc-700/30"
                                        }`}>
                                          {ct.is_main_teacher ? "Sinf rahbari" : "Fan o'qituvchisi"}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3 text-right">
                                        <button
                                          onClick={() => triggerUnassignTeacher(ct.id)}
                                          className="text-[10px] bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 py-1 px-2.5 rounded transition cursor-pointer"
                                        >
                                          O'chirish
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab Content: Parents */}
                      {classDetailsTab === "parents" && (
                        <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-md font-bold text-zinc-300">Sinf Ota-onalari (Vasiylar) ro'yxati</h3>
                          </div>

                          {classParentsLoading ? (
                            <div className="text-center py-10">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          ) : classParents.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/10">
                              <p className="text-zinc-500 text-xs">Ushbu sinfda ota-onalar mavjud emas.</p>
                            </div>
                          ) : (
                            <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                              <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                                <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-5 py-3">T/R</th>
                                    <th className="px-5 py-3">F.I.SH</th>
                                    <th className="px-5 py-3">Telefon</th>
                                    <th className="px-5 py-3">O'quvchi (Farzand)</th>
                                    <th className="px-5 py-3">Qo'shilgan sana</th>
                                    {isMainTeacherOfClass() && <th className="px-5 py-3 text-right">Amallar</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                                  {classParents.map((pt, idx) => (
                                    <tr key={`${pt.id}-${idx}`} className="hover:bg-zinc-900/40 transition">
                                      <td className="px-5 py-3 font-mono text-zinc-500">{idx + 1}</td>
                                      <td className="px-5 py-3 font-semibold text-zinc-100">
                                        {pt.first_name} {pt.last_name} {pt.middle_name && <span className="text-zinc-500 font-normal">({pt.middle_name})</span>}
                                      </td>
                                      <td className="px-5 py-3 font-mono text-zinc-300">{pt.phone}</td>
                                      <td className="px-5 py-3 text-zinc-200 font-medium">{pt.student_name || "Noma'lum"}</td>
                                      <td className="px-5 py-3 text-zinc-500">{new Date(pt.created_at).toLocaleDateString()}</td>
                                      {isMainTeacherOfClass() && (
                                        <td className="px-5 py-3 text-right">
                                          <div className="flex items-center justify-end space-x-2">
                                            <button
                                              onClick={() => {
                                                setEditingParent(pt);
                                                setEditParentFirstName(pt.first_name);
                                                setEditParentLastName(pt.last_name);
                                                setEditParentMiddleName(pt.middle_name || "");
                                                setEditParentPhone(pt.phone || "");
                                                setEditParentPassword("");
                                                setShowEditParentModal(true);
                                              }}
                                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold py-1 px-2.5 rounded-lg border border-zinc-700/60 transition cursor-pointer"
                                            >
                                              Tahrirlash
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingParent(pt);
                                                setUnlinkStudentId(pt.student_id || null);
                                                setShowUnlinkParentModal(true);
                                              }}
                                              className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 text-[10px] font-semibold py-1 px-2.5 rounded-lg transition cursor-pointer"
                                            >
                                              O'chirish
                                            </button>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab Content: Schedule (Dars Jadvali) */}
                      {classDetailsTab === "schedule" && (
                        <div className="space-y-6">
                          <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h3 className="text-md font-bold text-zinc-300 font-sans">Haftalik Dars Rejasi (Jadvali)</h3>
                                {scheduleStartDate && scheduleEndDate ? (
                                  <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                                    Faol dars jadvali davri: <span className="text-[#059669] font-bold font-mono">{scheduleStartDate}</span> dan <span className="text-[#059669] font-bold font-mono">{scheduleEndDate}</span> gacha
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-zinc-500 mt-1">Ushbu sinf uchun haftalik o'tiladigan fanlar jadvali.</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 self-end sm:self-auto">
                                <div className="flex items-center space-x-2 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-1.5">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Sana:</label>
                                  <input
                                    type="date"
                                    value={scheduleViewDate}
                                    onChange={(e) => {
                                      setScheduleViewDate(e.target.value);
                                      fetchClassSchedule(e.target.value);
                                    }}
                                    className="bg-transparent text-zinc-200 text-xs outline-none border-none cursor-pointer w-28 font-semibold"
                                  />
                                </div>
                                {isMainTeacherOfClass() && (
                                  <button
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
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                                  >
                                    Jadvalni tahrirlash
                                  </button>
                                )}
                              </div>
                            </div>

                            {classScheduleLoading ? (
                              <div className="text-center py-10">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                                <table className="min-w-full divide-y divide-zinc-800/60 text-center table-fixed">
                                  <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                    <tr>
                                      <th className="px-3 py-3 w-16">Soat</th>
                                      <th className="px-3 py-3">Dushanba</th>
                                      <th className="px-3 py-3">Seshanba</th>
                                      <th className="px-3 py-3">Chorshanba</th>
                                      <th className="px-3 py-3">Payshanba</th>
                                      <th className="px-3 py-3">Juma</th>
                                      <th className="px-3 py-3">Shanba</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                                      <tr key={period} className="hover:bg-zinc-900/20 transition">
                                        <td className="px-3 py-4 font-mono font-semibold text-zinc-500 bg-zinc-900/10">
                                          {period}-dars
                                        </td>
                                        {[1, 2, 3, 4, 5, 6].map((day) => {
                                          const lesson = classSchedule.find(
                                            (item) => item.day_of_week === day && item.lesson_number === period
                                          );
                                          return (
                                            <td key={day} className="px-3 py-4 border-l border-zinc-800/30">
                                              {lesson ? (
                                                <span className={lesson.subject_id === 0 || lesson.subject_name === "Bekor qilingan" ? "text-red-400 font-semibold line-through block italic text-[11px]" : "text-zinc-100 font-medium block"}>
                                                  {lesson.subject_name}
                                                </span>
                                              ) : (
                                                <span className="text-zinc-650 italic text-[11px]">-</span>
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

                          {/* Daily Exceptions Manager Section */}
                          <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-md font-bold text-zinc-300">Kunlik Dars Jadvali O'zgarishlari</h3>
                                <p className="text-[11px] text-zinc-500 mt-1">Sinf o'qituvchisi tomonidan kiritilgan bir martalik kunlik dars qo'shimchalari yoki bekor qilishlar.</p>
                              </div>
                              {isMainTeacherOfClass() && (
                                <button
                                  onClick={() => {
                                    setExcDate(new Date().toISOString().split("T")[0]);
                                    setExcLesson(1);
                                    setExcType("replace");
                                    setExcSubjectId("");
                                    setActionError("");
                                    setShowAddExceptionModal(true);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center space-x-1"
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
                              <p className="text-zinc-500 text-[11px] font-mono py-4 text-center border border-dashed border-zinc-800 rounded-xl">Hech qanday dars o'zgarishi kiritilmagan.</p>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                                <table className="min-w-full divide-y divide-zinc-800/60 text-left text-xs text-zinc-300">
                                  <thead className="bg-zinc-900/40 text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                                    <tr>
                                      <th className="px-4 py-3">Sana</th>
                                      <th className="px-4 py-3">Dars soati</th>
                                      <th className="px-4 py-3">Holat / Fan</th>
                                      <th className="px-4 py-3">Kiritilgan vaqt</th>
                                      <th className="px-4 py-3 text-right">Amal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-800/40">
                                    {scheduleExceptions.map((exc) => {
                                      const isPast = new Date(exc.date + "T23:59:59") < new Date();
                                      return (
                                        <tr key={exc.id} className="hover:bg-zinc-900/10 transition">
                                          <td className="px-4 py-3 font-semibold text-zinc-300">{exc.date}</td>
                                          <td className="px-4 py-3 font-mono text-zinc-400">{exc.lesson_number}-dars</td>
                                          <td className="px-4 py-3">
                                            {exc.is_deleted ? (
                                              <span className="text-zinc-600 line-through italic text-[11px]">O'chirilgan</span>
                                            ) : exc.subject_id === null ? (
                                              <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-semibold">Bekor qilingan</span>
                                            ) : (
                                              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold">
                                                {exc.subject_name} (O'zgartirilgan)
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-zinc-500 text-[10px] font-mono">
                                            {new Date(exc.created_at).toLocaleString()}
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                            {!exc.is_deleted && !isPast && isMainTeacherOfClass() && (
                                              <button
                                                onClick={() => handleDeleteException(exc.id)}
                                                className="text-red-400 hover:text-red-300 font-semibold text-[10px] bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
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
                    </div>
                  )}
                </>
              )}

              {/* MENU 2: TEACHERS VIEW */}
              {activeMenu === "teachers" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-zinc-100">O'qituvchilar Ro'yxati</h1>
                      <p className="text-xs text-zinc-500 mt-1">Maktabning barcha o'qituvchilari va ularning ma'lumotlarini boshqaring.</p>
                    </div>
                    {userInfo?.role === "ADMIN" && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowImportTeachersModal(true)}
                          className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-indigo-400 font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
                        >
                          Excel orqali yuklash
                        </button>
                        <button
                          onClick={() => setShowAddTeacherModal(true)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
                        >
                          + O'qituvchi qo'shish
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-sm w-full">
                    <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Ism yoki telefon raqam bo'yicha..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition"
                    />
                  </div>

                  {filteredTeachers.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-zinc-800/60 rounded-3xl bg-zinc-950/10">
                      <p className="text-zinc-500 text-sm">O'qituvchilar topilmadi.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-zinc-800/60 bg-[#0d0d12]/30 backdrop-blur-xl">
                      <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                        <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">T/R</th>
                            <th className="px-6 py-4">Ism Familiya</th>
                            <th className="px-6 py-4">Telefon</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4">Qo'shilgan sana</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                          {filteredTeachers.map((tc, idx) => (
                            <tr key={tc.id} className="hover:bg-zinc-900/40 transition">
                              <td className="px-6 py-4 font-mono text-zinc-500">{idx + 1}</td>
                              <td className="px-6 py-4 font-semibold text-zinc-100">
                                {tc.first_name} {tc.last_name} {tc.middle_name && <span className="text-zinc-500 font-normal">({tc.middle_name})</span>}
                              </td>
                              <td className="px-6 py-4 font-mono text-zinc-300">{tc.phone}</td>
                              <td className="px-6 py-4 text-xs font-semibold">
                                <span className={`px-2.5 py-1 rounded-full ${
                                  tc.role_name === 'MAIN_TEACHER'
                                    ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30'
                                    : 'bg-sky-950/40 text-sky-400 border border-sky-900/30'
                                }`}>
                                  {tc.role_name === 'MAIN_TEACHER' ? 'Sinf Rahbari' : 'Fan O\'qituvchisi'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-zinc-500">
                                {new Date(tc.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* MENU 3: SUBJECTS VIEW */}
              {activeMenu === "subjects" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-zinc-100">Fanlar Ma'lumotnomasi</h1>
                      <p className="text-xs text-zinc-500 mt-1">Maktabdagi dars fanlari ro'yxatini shakllantiring.</p>
                    </div>
                    <button
                      onClick={() => setShowAddSubjectModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
                    >
                      + Yangi Fan Qo'shish
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-sm w-full">
                    <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Fanni izlash..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition"
                    />
                  </div>

                  {filteredSubjects.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-zinc-800/60 rounded-3xl bg-zinc-950/10">
                      <p className="text-zinc-500 text-sm">Fanlar topilmadi.</p>
                    </div>
                  ) : (
                    <div className="max-w-xl overflow-hidden rounded-2xl border border-zinc-800/60 bg-[#0d0d12]/30 backdrop-blur-xl">
                      <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                        <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">T/R</th>
                            <th className="px-6 py-4">Fan Nomi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                          {filteredSubjects.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-zinc-900/40 transition">
                              <td className="px-6 py-4 font-mono text-zinc-500">{idx + 1}</td>
                              <td className="px-6 py-4 font-bold text-zinc-200">{s.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeMenu === "grading-systems" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-zinc-100">Baholash Tizimlari</h1>
                      <p className="text-xs text-zinc-500 mt-1">Maktab uchun joriy faol baholash tizimini tanlang yoki yangi tizim yarating.</p>
                    </div>
                    <button
                      onClick={() => setShowAddGSModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-blue-600/15"
                    >
                      + Yangi Tizim
                    </button>
                  </div>

                  {activeGS && (
                    <div className="bg-gradient-to-r from-blue-950/20 to-indigo-950/20 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                          Faol Baholash Tizimi
                        </span>
                        <h2 className="text-xl font-bold text-zinc-100 mt-3">{activeGS.name}</h2>
                        <p className="text-xs text-zinc-400 mt-1">
                          Turi: <strong className="text-zinc-200">{activeGS.type}</strong>
                          {activeGS.type === "NUMERIC" && ` (Diapazon: ${activeGS.min_value} - ${activeGS.max_value})`}
                          {activeGS.type === "PERCENTAGE" && ` (Diapazon: ${activeGS.min_value}% - ${activeGS.max_value}%)`}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 font-bold text-lg">
                        {activeGS.type === "NUMERIC" ? activeGS.max_value : activeGS.type === "PERCENTAGE" ? "%" : "A"}
                      </div>
                    </div>
                  )}

                  {gradingSystems.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-zinc-800/60 rounded-3xl bg-zinc-950/10">
                      <p className="text-zinc-500 text-sm">Baholash tizimlari topilmadi.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {gradingSystems.map((gs) => (
                        <div
                          key={gs.id}
                          className={`bg-zinc-900/10 border rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between h-44 transition duration-300 ${
                            gs.is_active
                              ? "border-blue-500/40 shadow-lg shadow-blue-500/[0.02]"
                              : "border-zinc-850 hover:border-zinc-850"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-md font-bold text-zinc-200">{gs.name}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                gs.is_active
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
                              }`}>
                                {gs.is_active ? "Faol" : "Nofaol"}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-500 mt-3.5">
                              Turi: <span className="text-zinc-400 font-semibold">{gs.type}</span>
                            </p>
                            {gs.type === "NUMERIC" && (
                              <p className="text-xs text-zinc-500 mt-1">
                                Qiymatlar: <span className="text-zinc-400 font-semibold">{gs.min_value} - {gs.max_value}</span>
                              </p>
                            )}
                            {gs.type === "PERCENTAGE" && (
                              <p className="text-xs text-zinc-500 mt-1">
                                Foiz diapazoni: <span className="text-zinc-400 font-semibold">{gs.min_value}% - {gs.max_value}%</span>
                              </p>
                            )}
                            {gs.type === "LETTER" && gs.options && (
                              <div className="text-[10px] text-zinc-500 mt-1 flex flex-wrap gap-1 items-center">
                                <span>Variantlar:</span>
                                {gs.options.map((opt: any, index: number) => (
                                  <span key={index} className="bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded text-zinc-300 font-mono">
                                    {opt.label} ({opt.numeric_value} ball)
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-900/60">
                            {!gs.is_active && (
                              <button
                                onClick={() => handleActivateGS(gs.id)}
                                disabled={actionLoading}
                                className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-transparent text-blue-400 hover:text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg transition duration-200 cursor-pointer disabled:opacity-50"
                              >
                                Faollashtirish
                              </button>
                            )}
                            {!gs.is_active && gs.name !== "5 ballik sistema" && gs.name !== "100 ballik sistema" && (
                              <button
                                onClick={() => handleDeleteGS(gs.id)}
                                disabled={actionLoading}
                                className="bg-red-950/20 hover:bg-red-600 border border-red-900/20 hover:border-transparent text-red-400 hover:text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg transition duration-200 cursor-pointer disabled:opacity-50"
                              >
                                O'chirish
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* MODALS SECTION (Frosted glass overlay, thin Apple borders) */}

      {/* Modal 1: Add Class */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi Sinf Qo'shish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Sinf nomini kiriting (masalan: 10-A, 11-B).</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Sinf Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 9-A"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClassModal(false);
                    setNewClassName("");
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Class Name */}
      {showEditClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Sinf Nomini Tahrirlash</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Sinf uchun yangi nom kiriting.</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleEditClass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Sinf Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 10-C"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditClassModal(false);
                    setEditClassName("");
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Yangilanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Class Confirmation */}
      {showDeleteClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-md font-bold text-red-500 mb-2">Sinfni o'chirish</h3>
            {selectedClass && (
              <p className="text-sm text-zinc-300 mb-6">
                Haqiqatan ham <strong className="text-zinc-100">"{selectedClass.name}"</strong> sinfini o'chirib yubormoqchimisiz? Ushbu sinfga tegishli barcha o'quvchilar bazadan soft-delete qilinadi.
              </p>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteClassModal(false)}
                className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteClass}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                O'chirishni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3.5: Unassign Teacher Mapping Confirmation */}
      {showUnassignTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-md font-bold text-red-500 mb-2">Biriktiruvni o'chirish</h3>
            <p className="text-sm text-zinc-300 mb-6">
              Haqiqatan ham ushbu o'qituvchi va dars fani biriktiruvini sinfdan o'chirib tashlamoqchimisiz?
            </p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => {
                  setShowUnassignTeacherModal(false);
                  setUnassignClassTeacherId(null);
                  setActionError("");
                }}
                className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleUnassignTeacherSubmit}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                {actionLoading ? "O'chirilmoqda..." : "O'chirishni tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Manual Student Add under Selected Class */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi O'quvchi Qo'shish</h3>
            {selectedClass && <p className="text-[11px] text-zinc-500 mb-6">Ushbu o'quvchi avtomat ravishda "{selectedClass.name}" sinfiga biriktiriladi.</p>}

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Ismi</label>
                  <input
                    type="text"
                    required
                    placeholder="Ali"
                    value={studentFirstName}
                    onChange={(e) => setStudentFirstName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Familiyasi</label>
                  <input
                    type="text"
                    required
                    placeholder="Valiyev"
                    value={studentLastName}
                    onChange={(e) => setStudentLastName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Otang ismi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Karimovich"
                  value={studentMiddleName}
                  onChange={(e) => setStudentMiddleName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Telefon raqami (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="+998901234567"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Parol (Default: password123)</label>
                <input
                  type="password"
                  required
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setStudentFirstName("");
                    setStudentLastName("");
                    setStudentMiddleName("");
                    setStudentPhone("");
                    setStudentPassword("password123");
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Qo'shilmoqda..." : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Manual Teacher Add Globally */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi O'qituvchi Yaratish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Yaratilgan o'qituvchini istalgan sinf va fanlarga keyinchalik biriktirishingiz mumkin.</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Ismi</label>
                  <input
                    type="text"
                    required
                    placeholder="Olim"
                    value={teacherFirstName}
                    onChange={(e) => setTeacherFirstName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Familiyasi</label>
                  <input
                    type="text"
                    required
                    placeholder="Sodiqov"
                    value={teacherLastName}
                    onChange={(e) => setTeacherLastName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Otang ismi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Valiyevich"
                  value={teacherMiddleName}
                  onChange={(e) => setTeacherMiddleName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Telefon raqami</label>
                <input
                  type="text"
                  required
                  placeholder="+998907654321"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Rol (Lavozimi)</label>
                <select
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm outline-none transition cursor-pointer"
                >
                  <option value="SUBJECT_TEACHER">Fan O'qituvchisi (Subject Teacher)</option>
                  <option value="MAIN_TEACHER">Sinf Rahbari (Main Teacher)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Parol (Default: password123)</label>
                <input
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTeacherModal(false);
                    setTeacherFirstName("");
                    setTeacherLastName("");
                    setTeacherMiddleName("");
                    setTeacherPhone("");
                    setTeacherRole("SUBJECT_TEACHER");
                    setTeacherPassword("password123");
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Qo'shilmoqda..." : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Add Subject */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi Fan Qo'shish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Tizimga yangi fan nomini kiriting (masalan: Matematika, Ona tili).</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Fan Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Matematika"
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setSubjectNameInput("");
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Assign Teacher to Class (with Subject & Main status) */}
      {showAssignTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Sinfga O'qituvchi Biriktirish</h3>
            {selectedClass && <p className="text-[11px] text-zinc-500 mb-6">"{selectedClass.name}" sinfi uchun o'qituvchi va dars beradigan fanini tanlang.</p>}

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">O'qituvchini tanlang</label>
                <select
                  required
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm outline-none transition cursor-pointer"
                >
                  <option value="">O'qituvchini tanlang...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Dars beradigan fanini tanlang</label>
                <select
                  required
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm outline-none transition cursor-pointer"
                >
                  <option value="">Fanni tanlang...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {userInfo?.role === "ADMIN" && (
                <div className="flex items-center space-x-3 pt-2">
                  <input
                    id="assign-is-main-checkbox"
                    type="checkbox"
                    checked={assignIsMain}
                    onChange={(e) => setAssignIsMain(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-850 bg-zinc-950 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="assign-is-main-checkbox" className="text-xs text-zinc-300 font-semibold cursor-pointer select-none">
                    Ushbu o'qituvchini sinf rahbari sifatida biriktirish
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignTeacherModal(false);
                    setAssignTeacherId("");
                    setAssignSubjectId("");
                    setAssignIsMain(false);
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !assignTeacherId || !assignSubjectId}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Biriktirilmoqda..." : "Biriktirish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 9: Vasiylarni (Ota-onalarni) Boshqarish */}
      {showParentsModal && selectedStudentForParents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-md font-bold text-zinc-200">
                  Vasiylarni Boshqarish
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">
                  O'quvchi: <span className="text-zinc-300 font-semibold">{selectedStudentForParents.first_name} {selectedStudentForParents.last_name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowParentsModal(false);
                  setSelectedStudentForParents(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition text-xs font-semibold"
              >
                Yopish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: List of existing linked parents */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mavjud Vasiylar</h4>
                {linkedParentsLoading ? (
                  <p className="text-xs text-zinc-500">Yuklanmoqda...</p>
                ) : linkedParents.length === 0 ? (
                  <p className="text-xs text-zinc-500 bg-zinc-900/40 p-4 border border-zinc-800/40 rounded-xl">
                    Ushbu o'quvchiga hali vasiy (ota-ona) biriktirilmagan.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {linkedParents.map((p) => (
                      <div key={p.id} className="bg-[#12121a]/60 border border-zinc-800/60 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">
                            {p.first_name} {p.last_name} {p.middle_name && <span className="text-zinc-500">({p.middle_name})</span>}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{p.phone}</p>
                          {p.email && <p className="text-[10px] text-zinc-500 mt-0.5">{p.email}</p>}
                        </div>
                        {isMainTeacherOfClass() && (
                          <button
                            type="button"
                            onClick={() => handleUnlinkParent(p.id)}
                            className="bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-400 text-[10px] font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer"
                          >
                            Ajratish
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Link / Create Parent Form */}
              {isMainTeacherOfClass() && (
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-zinc-800 md:pl-6 pt-4 md:pt-0">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Yangi / Mavjud Vasiyni Bog'lash</h4>
                  <p className="text-[10px] text-zinc-500">
                    Telefon raqam tizimda mavjud bo'lsa, avtomatik ravishda shu profil bog'lanadi. Aks holda yangi profil ochiladi.
                  </p>

                  <form onSubmit={handleLinkParent} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-semibold text-zinc-500 uppercase mb-1">Ismi</label>
                        <input
                          type="text"
                          required
                          placeholder="Ism"
                          value={parentFirstName}
                          onChange={(e) => setParentFirstName(e.target.value)}
                          className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-zinc-500 uppercase mb-1">Familiyasi</label>
                        <input
                          type="text"
                          required
                          placeholder="Familiya"
                          value={parentLastName}
                          onChange={(e) => setParentLastName(e.target.value)}
                          className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-500 uppercase mb-1">Otasining ismi (Ixtiyoriy)</label>
                      <input
                        type="text"
                        placeholder="Sharifi"
                        value={parentMiddleName}
                        onChange={(e) => setParentMiddleName(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-500 uppercase mb-1">Telefon</label>
                      <input
                        type="text"
                        required
                        placeholder="+998901234567"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-500 uppercase mb-1">Email (Ixtiyoriy)</label>
                      <input
                        type="email"
                        placeholder="email@test.uz"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-500 uppercase mb-1">Parol (Yangi profil ochish uchun)</label>
                      <input
                        type="password"
                        required
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer mt-2"
                    >
                      {actionLoading ? "Saqlanmoqda..." : "Bog'lash / Yaratish"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 8: Import Students (Excel sheet) */}
      {showImportStudentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">O'quvchilarni Excel Orqali Import Qilish</h3>
            {selectedClass && <p className="text-[11px] text-zinc-500 mb-6">Yuklangan barcha o'quvchilar avtomat ravishda "{selectedClass.name}" sinfiga biriktiriladi.</p>}

            {/* Template Download Option */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-blue-400">Excel shablonini ko'chirib oling</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">O'quvchilar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={() => downloadTemplate("students")}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
              >
                📥 Shablonni Yuklash
              </button>
            </div>

            {importError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{importError}</div>
            )}

            {!importResult ? (
              <form onSubmit={(e) => handleSheetUpload(e, "students")} className="space-y-4">
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/20 hover:border-zinc-700 transition relative">
                  <input
                    type="file"
                    required
                    accept=".xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="text-2xl">📊</div>
                    <p className="text-sm text-zinc-300">
                      {selectedFile ? selectedFile.name : "Student Excel shablonini tanlang (.xlsx)"}
                    </p>
                    <p className="text-xs text-zinc-500">Maksimal hajm: 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !selectedFile}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              // Results View
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Qabul qilindi</span>
                    <span className="text-2xl font-bold">{importResult.imported_count}</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Rad etildi</span>
                    <span className="text-2xl font-bold">{importResult.failed_count}</span>
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Status</span>
                    <span className="text-xs font-semibold block mt-1">
                      {importResult.success ? "✅ Hammasi to'g'ri" : "⚠️ Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-zinc-850 rounded-xl overflow-hidden text-xs">
                    <div className="bg-zinc-950/60 text-zinc-400 px-4 py-2 uppercase font-semibold">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto bg-zinc-950/10">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2 flex items-start space-x-2">
                          <span className="bg-red-950/40 text-red-400 px-1.5 py-0.5 rounded font-mono">Satr {err.row}</span>
                          <span className="mt-0.5 text-zinc-300">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-xl transition cursor-pointer"
                  >
                    Tugatish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 9: Import Teachers (Excel sheet) */}
      {showImportTeachersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">O'qituvchilarni Excel Orqali Import Qilish</h3>
            <p className="text-xs text-zinc-400 mb-6">Maktab o'qituvchilari ro'yxatini shakllantirish uchun Excel faylini yuklang.</p>

            {/* Template Download Option */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-400">Excel shablonini ko'chirib oling</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">O'qituvchilar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={() => downloadTemplate("teachers")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
              >
                📥 Shablonni Yuklash
              </button>
            </div>

            {importError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{importError}</div>
            )}

            {!importResult ? (
              <form onSubmit={(e) => handleSheetUpload(e, "teachers")} className="space-y-4">
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/20 hover:border-zinc-700 transition relative">
                  <input
                    type="file"
                    required
                    accept=".xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="text-2xl">👔</div>
                    <p className="text-sm text-zinc-300">
                      {selectedFile ? selectedFile.name : "Teacher Excel shablonini tanlang (.xlsx)"}
                    </p>
                    <p className="text-xs text-zinc-500">Maksimal hajm: 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !selectedFile}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              // Results View
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Qabul qilindi</span>
                    <span className="text-2xl font-bold">{importResult.imported_count}</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Rad etildi</span>
                    <span className="text-2xl font-bold">{importResult.failed_count}</span>
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Status</span>
                    <span className="text-xs font-semibold block mt-1">
                      {importResult.success ? "✅ Hammasi to'g'ri" : "⚠️ Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-zinc-850 rounded-xl overflow-hidden text-xs">
                    <div className="bg-zinc-950/60 text-zinc-400 px-4 py-2 uppercase font-semibold">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto bg-zinc-950/10">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2 flex items-start space-x-2">
                          <span className="bg-red-950/40 text-red-400 px-1.5 py-0.5 rounded font-mono">Satr {err.row}</span>
                          <span className="mt-0.5 text-zinc-300">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-xl transition cursor-pointer"
                  >
                    Tugatish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 10: Add Grading System */}
      {showAddGSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi Baholash Tizimi Qo'shish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Maktab uchun moslashtirilgan yangi baholash qoidalarini yarating.</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleCreateGS} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Tizim Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 10 ballik tizim, Harfli A-F"
                  value={gsNameInput}
                  onChange={(e) => setGsNameInput(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Tizim Turi</label>
                <select
                  value={gsTypeInput}
                  onChange={(e) => setGsTypeInput(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                >
                  <option value="NUMERIC">Numeric (Raqamli)</option>
                  <option value="PERCENTAGE">Percentage (Foizli)</option>
                  <option value="LETTER">Letter (Harfli / Matnli)</option>
                </select>
              </div>

              {(gsTypeInput === "NUMERIC" || gsTypeInput === "PERCENTAGE") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Eng kichik qiymat</label>
                    <input
                      type="number"
                      required
                      value={gsMinInput}
                      onChange={(e) => setGsMinInput(e.target.value)}
                      className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Eng katta qiymat</label>
                    <input
                      type="number"
                      required
                      value={gsMaxInput}
                      onChange={(e) => setGsMaxInput(e.target.value)}
                      className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                    />
                  </div>
                </div>
              )}

              {gsTypeInput === "LETTER" && (
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Variantlar (JSON)</label>
                  <textarea
                    required
                    placeholder='Masalan: [{"label": "A", "numeric_value": 5}, {"label": "B", "numeric_value": 4}]'
                    value={gsOptionsInput}
                    onChange={(e) => setGsOptionsInput(e.target.value)}
                    rows={4}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-xs outline-none transition font-mono"
                  />
                  <span className="text-[9px] text-zinc-600 block mt-1 font-sans">Har bir variant JSON formatida "label" va ixtiyoriy "numeric_value" maydonlaridan iborat bo'lishi kerak.</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGSModal(false);
                    setGsNameInput("");
                    setGsOptionsInput("");
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Yaratilmoqda..." : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Parents (Excel sheet) */}
      {showImportParentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">O'quvchilar Ota-onalarini Excel Orqali Import Qilish</h3>
            {selectedClass && <p className="text-[11px] text-zinc-500 mb-6">Yuklangan ota-onalar tegishli o'quvchilarga bog'lanadi. Sinf: "{selectedClass.name}".</p>}

            {/* Template Download Option */}
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-teal-400">Excel shablonini ko'chirib oling</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Ota-onalar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={() => downloadTemplate("parents")}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
              >
                📥 Shablonni Yuklash
              </button>
            </div>

            {importError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{importError}</div>
            )}

            {!importResult ? (
              <form onSubmit={(e) => handleSheetUpload(e, "parents")} className="space-y-4">
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/20 hover:border-zinc-700 transition relative">
                  <input
                    type="file"
                    required
                    accept=".xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="text-2xl">👨‍👩‍👧‍👦</div>
                    <p className="text-sm text-zinc-300">
                      {selectedFile ? selectedFile.name : "Ota-ona Excel shablonini tanlang (.xlsx)"}
                    </p>
                    <p className="text-xs text-zinc-500">Maksimal hajm: 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !selectedFile}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              // Results View
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Qabul qilindi</span>
                    <span className="text-2xl font-bold">{importResult.imported_count}</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Rad etildi</span>
                    <span className="text-2xl font-bold">{importResult.failed_count}</span>
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Status</span>
                    <span className="text-xs font-semibold block mt-1">
                      {importResult.success ? "✅ Hammasi to'g'ri" : "⚠️ Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-zinc-850 rounded-xl overflow-hidden text-xs">
                    <div className="bg-zinc-950/60 text-zinc-400 px-4 py-2 uppercase font-semibold">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto bg-zinc-950/10">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2 flex items-start space-x-2">
                          <span className="bg-red-950/40 text-red-400 px-1.5 py-0.5 rounded font-mono">Satr {err.row}</span>
                          <span className="mt-0.5 text-zinc-300">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-xl transition cursor-pointer"
                  >
                    Tugatish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Change Password Settings */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Profil parolini o'zgartirish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Xavfsizlik maqsadida eski parolingizni kiritib, yangi parol o'rnating.</p>

            {changePasswordError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{changePasswordError}</div>
            )}
            
            {changePasswordSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg mb-4">{changePasswordSuccess}</div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Eski parol</label>
                <input
                  type="password"
                  required
                  placeholder="Eski parolingiz"
                  value={changePasswordOld}
                  onChange={(e) => setChangePasswordOld(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Yangi parol</label>
                <input
                  type="password"
                  required
                  placeholder="Yangi parol"
                  value={changePasswordNew}
                  onChange={(e) => setChangePasswordNew(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Yangi parolni tasdiqlash</label>
                <input
                  type="password"
                  required
                  placeholder="Yangi parolni qayta kiriting"
                  value={changePasswordConfirm}
                  onChange={(e) => setChangePasswordConfirm(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-850/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setChangePasswordOld("");
                    setChangePasswordNew("");
                    setChangePasswordConfirm("");
                    setChangePasswordError("");
                    setChangePasswordSuccess("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {changePasswordLoading ? "Saqlanmoqda..." : "Parolni yangilash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Edit Student */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8 relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">O'quvchi ma'lumotlarini tahrirlash</h3>
            <p className="text-[11px] text-zinc-500 mb-6">O'quvchi ismi, familiyasi, sharifi, telefoni va parolini o'zgartirishingiz mumkin.</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleEditStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Ismi</label>
                  <input
                    type="text"
                    required
                    value={editStudentFirstName}
                    onChange={(e) => setEditStudentFirstName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Familiyasi</label>
                  <input
                    type="text"
                    required
                    value={editStudentLastName}
                    onChange={(e) => setEditStudentLastName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Otang ismi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Sharifi"
                  value={editStudentMiddleName}
                  onChange={(e) => setEditStudentMiddleName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Telefon raqami (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="+998901234567"
                  value={editStudentPhone}
                  onChange={(e) => setEditStudentPhone(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Yangi parol (Bo'sh qoldirilsa, o'zgarmaydi)</label>
                <input
                  type="password"
                  placeholder="Yangi parol kiritish"
                  value={editStudentPassword}
                  onChange={(e) => setEditStudentPassword(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditStudentModal(false);
                    setEditingStudent(null);
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Student Confirmation */}
      {showDeleteStudentModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-850 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">O'quvchini o'chirishni tasdiqlang</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Haqiqatan ham o'quvchi <span className="text-zinc-100 font-semibold">{editingStudent.first_name} {editingStudent.last_name}</span>ni o'chirmoqchisiz? Barcha baholari va vasiylar bog'lanishi ham o'chiriladi.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteStudentModal(false);
                  setEditingStudent(null);
                }}
                className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                {actionLoading ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Parent */}
      {showEditParentModal && editingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8 relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Ota-ona ma'lumotlarini tahrirlash</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Ota-ona ismi, familiyasi, sharifi, telefoni va parolini o'zgartirishingiz mumkin.</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleEditParent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Ismi</label>
                  <input
                    type="text"
                    required
                    value={editParentFirstName}
                    onChange={(e) => setEditParentFirstName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Familiyasi</label>
                  <input
                    type="text"
                    required
                    value={editParentLastName}
                    onChange={(e) => setEditParentLastName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Otang ismi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Sharifi"
                  value={editParentMiddleName}
                  onChange={(e) => setEditParentMiddleName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Telefon raqami</label>
                <input
                  type="text"
                  required
                  placeholder="+998901234567"
                  value={editParentPhone}
                  onChange={(e) => setEditParentPhone(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Yangi parol (Bo'sh qoldirilsa, o'zgarmaydi)</label>
                <input
                  type="password"
                  placeholder="Yangi parol kiritish"
                  value={editParentPassword}
                  onChange={(e) => setEditParentPassword(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditParentModal(false);
                    setEditingParent(null);
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Unlink Parent Confirmation */}
      {showUnlinkParentModal && editingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-850 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Vasiyni o'quvchidan ajratishni tasdiqlang</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Haqiqatan ham ota-ona <span className="text-zinc-100 font-semibold">{editingParent.first_name} {editingParent.last_name}</span>ni ushbu o'quvchidan ajratmoqchisiz?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => {
                  setShowUnlinkParentModal(false);
                  setEditingParent(null);
                  setUnlinkStudentId(null);
                }}
                className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleUnlinkParentFromTab}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                {actionLoading ? "Ajratilmoqda..." : "Ha, ajratish"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Edit Weekly Schedule */}
      {showEditScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-md font-bold text-zinc-200">Haftalik dars jadvalini tahrirlash</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Har bir kun va dars soati uchun fanni tanlang. Dars yo'q soatlarni "Bo'sh" holatida qoldiring.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditScheduleModal(false);
                  setScheduleFormState({});
                  setActionError("");
                }}
                className="text-zinc-500 hover:text-zinc-300 transition text-xs font-semibold"
              >
                Yopish
              </button>
            </div>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/20 border border-zinc-800/80 p-4 rounded-xl">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Jadval boshlanish sanasi (Start Date)</label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    required
                    className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-200 rounded-lg px-3 py-1.5 text-xs outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Jadval tugash sanasi (End Date)</label>
                  <input
                    type="date"
                    value={scheduleEndDate}
                    onChange={(e) => setScheduleEndDate(e.target.value)}
                    required
                    className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-200 rounded-lg px-3 py-1.5 text-xs outline-none transition"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                <table className="min-w-full divide-y divide-zinc-800/60 text-center table-fixed">
                  <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
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
                  <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                      <tr key={period} className="hover:bg-zinc-900/10 transition">
                        <td className="px-2 py-2 font-mono font-semibold text-zinc-500 bg-zinc-900/10">
                          {period}-dars
                        </td>
                        {[1, 2, 3, 4, 5, 6].map((day) => {
                          const slotKey = `${day}-${period}`;
                          const selectedVal = scheduleFormState[slotKey] || 0;
                          return (
                            <td key={day} className="px-2 py-2 border-l border-zinc-800/30">
                              <select
                                value={selectedVal}
                                onChange={(e) => {
                                  setScheduleFormState((prev) => ({
                                    ...prev,
                                    [slotKey]: Number(e.target.value),
                                  }));
                                }}
                                className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-lg px-2 py-1.5 text-xs outline-none transition cursor-pointer"
                              >
                                <option value="0">Bo'sh</option>
                                {subjects.map((sub) => (
                                  <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                  </option>
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

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditScheduleModal(false);
                    setScheduleFormState({});
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Add Schedule Exception Override */}
      {showAddExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-md font-bold text-zinc-200">Kunlik Dars Jadvali O'zgarishi Kiritish</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Tanlangan kun va dars soati uchun bir martalik o'zgarish yoki darsni bekor qilish.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddExceptionModal(false);
                  setActionError("");
                }}
                className="text-zinc-500 hover:text-zinc-300 transition text-xs font-semibold"
              >
                Yopish
              </button>
            </div>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleAddExceptionSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Kun (Sana)</label>
                <input
                  type="date"
                  required
                  value={excDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExcDate(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Dars soati</label>
                <select
                  value={excLesson}
                  onChange={(e) => setExcLesson(Number(e.target.value))}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <option key={period} value={period}>{period}-dars</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">O'zgarish turi</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="excType"
                      checked={excType === "replace"}
                      onChange={() => setExcType("replace")}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span>O'zgartirish / Qo'shimcha fan</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="excType"
                      checked={excType === "cancel"}
                      onChange={() => setExcType("cancel")}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span>Darsni bekor qilish (Cancel)</span>
                  </label>
                </div>
              </div>

              {excType === "replace" && (
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Fan</label>
                  <select
                    required={excType === "replace"}
                    value={excSubjectId}
                    onChange={(e) => setExcSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition cursor-pointer"
                  >
                    <option value="">Fanni tanlang</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExceptionModal(false);
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-6 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Kiritilmoqda..." : "Kiritish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* End Modal: Add Schedule Exception Override */}

    </main>
  );
}

