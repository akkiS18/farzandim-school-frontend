import React, { useState, useEffect } from "react";
import { ClassItem, SubjectItem, TenantUser, ClassTeacherItem, ClassScheduleItem, UserInfo, RowError, ImportResult } from "./types";

interface ClassesSectionProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
  teachers: TenantUser[];
  token: string;
  API_URL: string;
  userInfo: UserInfo | null;
  setClasses: React.Dispatch<React.SetStateAction<ClassItem[]>>;
  selectedClass: ClassItem | null;
  setSelectedClass: (cls: ClassItem | null) => void;
  fetchStudentsBalanceData: (t: string) => Promise<void>;
}

export default function ClassesSection({
  classes,
  subjects,
  teachers,
  token,
  API_URL,
  userInfo,
  setClasses,
  selectedClass,
  setSelectedClass,
  fetchStudentsBalanceData,
}: ClassesSectionProps) {
  // Navigation
  const [classDetailsTab, setClassDetailsTab] = useState<"students" | "teachers" | "parents" | "schedule">("students");

  // Contextual Sub-lists
  const [classStudents, setClassStudents] = useState<TenantUser[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherItem[]>([]);
  const [classParents, setClassParents] = useState<TenantUser[]>([]);
  const [classSchedule, setClassSchedule] = useState<ClassScheduleItem[]>([]);
  const [classStudentsLoading, setClassStudentsLoading] = useState(false);
  const [classTeachersLoading, setClassTeachersLoading] = useState(false);
  const [classParentsLoading, setClassParentsLoading] = useState(false);
  const [classScheduleLoading, setClassScheduleLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Forms visibility
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassLevel, setNewClassLevel] = useState<number>(1);

  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editClassName, setEditClassName] = useState("");
  const [editClassLevel, setEditClassLevel] = useState<number>(1);

  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentMiddleName, setStudentMiddleName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [studentBirthDate, setStudentBirthDate] = useState("");
  const [studentINA, setStudentINA] = useState("");
  const [studentPassword, setStudentPassword] = useState("password123");

  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<TenantUser | null>(null);
  const [editStudentFirstName, setEditStudentFirstName] = useState("");
  const [editStudentLastName, setEditStudentLastName] = useState("");
  const [editStudentMiddleName, setEditStudentMiddleName] = useState("");
  const [editStudentAddress, setEditStudentAddress] = useState("");
  const [editStudentBirthDate, setEditStudentBirthDate] = useState("");
  const [editStudentINA, setEditStudentINA] = useState("");

  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);

  const [showParentsModal, setShowParentsModal] = useState(false);
  const [selectedStudentForParents, setSelectedStudentForParents] = useState<TenantUser | null>(null);
  const [linkedParents, setLinkedParents] = useState<any[]>([]);
  const [linkedParentsLoading, setLinkedParentsLoading] = useState(false);
  
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [selectedStudentIdForAdd, setSelectedStudentIdForAdd] = useState<number | "">("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentMiddleName, setParentMiddleName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentPassport, setParentPassport] = useState("");
  const [parentPassword, setParentPassword] = useState("password123");

  const [showUnlinkParentModal, setShowUnlinkParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState<TenantUser | null>(null);
  const [unlinkStudentId, setUnlinkStudentId] = useState<number | null>(null);

  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignIsMain, setAssignIsMain] = useState(false);

  const [showUnassignTeacherModal, setShowUnassignTeacherModal] = useState(false);
  const [unassignClassTeacherId, setUnassignClassTeacherId] = useState<number | null>(null);

  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [scheduleFormState, setScheduleFormState] = useState<{ [key: string]: number }>({});
  const [scheduleStartDate, setScheduleStartDate] = useState("2026-09-01");
  const [scheduleEndDate, setScheduleEndDate] = useState("2027-05-31");

  const [scheduleViewDate, setScheduleViewDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduleExceptions, setScheduleExceptions] = useState<any[]>([]);
  const [scheduleExceptionsLoading, setScheduleExceptionsLoading] = useState(false);
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false);
  const [excDate, setExcDate] = useState(new Date().toISOString().split("T")[0]);
  const [excLesson, setExcLesson] = useState(1);
  const [excType, setExcType] = useState("replace"); // "replace" or "cancel"
  const [excSubjectId, setExcSubjectId] = useState<number | "">("");

  const [showImportStudentsModal, setShowImportStudentsModal] = useState(false);
  const [showImportParentsModal, setShowImportParentsModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Contextual view triggers
  useEffect(() => {
    if (selectedClass && token) {
      fetchClassStudents();
      fetchClassTeachers();
      fetchClassParents();
      fetchClassSchedule();
      fetchScheduleExceptions();
    }
  }, [selectedClass, token]);

  const fetchClassStudents = async () => {
    if (!selectedClass) return;
    setClassStudentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/users?role=STUDENT&class_id=${selectedClass.id}`, {
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
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/teachers`, {
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
      const response = await fetch(`${API_URL}/api/schools/users?role=PARENT&class_id=${selectedClass.id}`, {
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

  const fetchClassSchedule = async () => {
    if (!selectedClass) return;
    setClassScheduleLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/schedule?date=${scheduleViewDate}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setClassSchedule(Array.isArray(data) ? data : []);
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
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/schedule-exceptions?date=${scheduleViewDate}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setScheduleExceptions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setScheduleExceptionsLoading(false);
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
      const response = await fetch(`${API_URL}/api/schools/students/${selectedStudentForParents.id}/parents`, {
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

      fetchLinkedParents(selectedStudentForParents.id);
      fetchClassParents();
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
      const response = await fetch(`${API_URL}/api/schools/students/${selectedStudentForParents.id}/parents/${parentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "O'chirishda xatolik yuz berdi");
      }

      fetchLinkedParents(selectedStudentForParents.id);
      fetchClassParents();
      alert("Bog'liqlik muvaffaqiyatli o'chirildi");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newClassName.trim(), level: Number(newClassLevel) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sinfni saqlab bo'lmadi");

      setClasses((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewClassName("");
      setNewClassLevel(1);
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
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editClassName.trim(), level: Number(editClassLevel) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sinfni yangilab bo'lmadi");

      setClasses((prev) => prev.map((c) => (c.id === selectedClass.id ? data : c)));
      setSelectedClass(data);
      setEditClassName("");
      setEditClassLevel(1);
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
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}`, {
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: studentFirstName.trim(),
          last_name: studentLastName.trim(),
          middle_name: studentMiddleName.trim() || undefined,
          address: studentAddress.trim() || undefined,
          birthdate: studentBirthDate || undefined,
          ina: studentINA.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'quvchini qo'shib bo'lmadi");

      setStudentFirstName("");
      setStudentLastName("");
      setStudentMiddleName("");
      setStudentPhone("");
      setStudentAddress("");
      setStudentBirthDate("");
      setStudentINA("");
      setStudentPassword("password123");
      setShowAddStudentModal(false);

      fetchClassStudents();
      fetchStudentsBalanceData(token);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/students/${editingStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: editStudentFirstName.trim(),
          last_name: editStudentLastName.trim(),
          middle_name: editStudentMiddleName.trim() || undefined,
          address: editStudentAddress.trim() || undefined,
          birthdate: editStudentBirthDate || undefined,
          ina: editStudentINA.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ma'lumotlarni yangilab bo'lmadi");

      setShowEditStudentModal(false);
      setEditingStudent(null);
      fetchClassStudents();
      fetchStudentsBalanceData(token);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudentId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/students/${deletingStudentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'quvchini o'chirib bo'lmadi");

      setShowDeleteStudentModal(false);
      setDeletingStudentId(null);
      fetchClassStudents();
      fetchStudentsBalanceData(token);
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
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_date: scheduleStartDate,
          end_date: scheduleEndDate,
          lessons: lessonsPayload,
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

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !assignTeacherId || !assignSubjectId) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          teacher_id: Number(assignTeacherId),
          subject_id: Number(assignSubjectId),
          is_main_teacher: assignIsMain,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'qituvchini biriktirib bo'lmadi");

      setAssignTeacherId("");
      setAssignSubjectId("");
      setAssignIsMain(false);
      setShowAssignTeacherModal(false);
      fetchClassTeachers();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignTeacherSubmit = async () => {
    if (!selectedClass || !unassignClassTeacherId) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/teachers/${unassignClassTeacherId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Biriktiruvni o'chirib bo'lmadi");

      setShowUnassignTeacherModal(false);
      setUnassignClassTeacherId(null);
      fetchClassTeachers();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/schedule-exceptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          exception_date: excDate,
          lesson_number: Number(excLesson),
          type: excType,
          subject_id: excType === "replace" ? Number(excSubjectId) : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Dars jadvali o'zgarishini saqlab bo'lmadi");

      alert("Dars jadvali o'zgarishi muvaffaqiyatli kiritildi!");
      setShowAddExceptionModal(false);
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
    if (!selectedClass) return;
    if (!confirm("Haqiqatan ham ushbu dars jadvali o'zgarishini o'chirmoqchisiz?")) return;
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/schedule-exceptions/${exceptionId}`, {
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

  const handleUnlinkParentFromTab = async () => {
    if (!editingParent || !unlinkStudentId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/students/${unlinkStudentId}/parents/${editingParent.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ajratib bo'lmadi");

      setShowUnlinkParentModal(false);
      setEditingParent(null);
      setUnlinkStudentId(null);
      fetchClassParents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Sheet Importers
  const handleSheetUpload = async (e: React.FormEvent, type: "students" | "parents") => {
    e.preventDefault();
    if (!selectedFile || !selectedClass) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("class_id", selectedClass.id.toString());

    try {
      const endpoint = type === "students" ? "import/students" : "import/parents";
      const response = await fetch(`${API_URL}/api/schools/${endpoint}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setImportResult(data);
        if (type === "students") {
          fetchClassStudents();
          fetchStudentsBalanceData(token);
        } else {
          fetchClassParents();
        }
      } else {
        setImportError(data.error || "Yuklashda xatolik yuz berdi");
      }
    } catch (err: any) {
      setImportError(err.message || "Fayl yuklashda xatolik");
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = async (type: "students" | "parents") => {
    try {
      const response = await fetch(`${API_URL}/api/schools/import/template/${type}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shablon_${type === "students" ? "o'quvchilar" : "ota_onalar"}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Shablon yuklab olishda xatolik");
      }
    } catch (err) {
      console.error(err);
      alert("Serverga bog'lanishda xatolik");
    }
  };

  const closeSheetModal = () => {
    setShowImportStudentsModal(false);
    setShowImportParentsModal(false);
    setSelectedFile(null);
    setImportResult(null);
    setImportError("");
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
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
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-900/30 text-blue-400 text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border border-blue-800/40">
                        Lvl {cls.level ?? 0}
                      </span>
                      <span className="bg-zinc-800/60 text-zinc-400 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border border-zinc-800">
                        ID: {cls.id}
                      </span>
                    </div>
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
                  {selectedClass.name} sinfi <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 align-middle ml-2 font-mono">Level {selectedClass.level ?? 0}</span>
                </h1>
                <p className="text-xs text-zinc-500 mt-1">Sinf tarkibidagi o'quvchilar va fan o'qituvchilari boshqaruvi.</p>
              </div>
            </div>

            {userInfo?.role === "ADMIN" && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setEditClassName(selectedClass.name);
                    setEditClassLevel(selectedClass.level ?? 1);
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
                        <th className="px-5 py-3">Manzil</th>
                        <th className="px-5 py-3">Tug'ilgan sana</th>
                        <th className="px-5 py-3">INA</th>
                        <th className="px-5 py-3">Balans</th>
                        <th className="px-5 py-3 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                      {classStudents.map((student, i) => (
                        <tr key={student.id} className="hover:bg-zinc-900/10 transition">
                          <td className="px-5 py-3 text-zinc-500 font-mono">{i + 1}</td>
                          <td className="px-5 py-3 font-semibold text-zinc-200">
                            {student.last_name} {student.first_name} {student.middle_name}
                          </td>
                          <td className="px-5 py-3 text-zinc-400">{student.address || "Kiritilmagan"}</td>
                          <td className="px-5 py-3 text-zinc-400">
                            {student.birthdate ? student.birthdate.split("T")[0] : "Kiritilmagan"}
                          </td>
                          <td className="px-5 py-3 text-zinc-450 font-mono">{student.ina || "Kiritilmagan"}</td>
                          <td className={`px-5 py-3 font-mono font-bold ${
                            (student.balance ? student.balance : 0) >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {new Intl.NumberFormat("uz-UZ").format(student.balance || 0)} UZS
                          </td>
                          <td className="px-5 py-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedStudentForParents(student);
                                fetchLinkedParents(student.id);
                                setShowParentsModal(true);
                              }}
                              className="text-[10px] bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-900/30 text-indigo-400 py-1.5 px-3 rounded-lg transition cursor-pointer"
                            >
                              Vasiylar
                            </button>
                            {isMainTeacherOfClass() && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingStudent(student);
                                    setEditStudentFirstName(student.first_name);
                                    setEditStudentLastName(student.last_name);
                                    setEditStudentMiddleName(student.middle_name || "");
                                    setEditStudentAddress(student.address || "");
                                    setEditStudentBirthDate(student.birthdate ? student.birthdate.split("T")[0] : "");
                                    setEditStudentINA(student.ina || "");
                                    setShowEditStudentModal(true);
                                  }}
                                  className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-1.5 px-3 rounded-lg transition cursor-pointer"
                                >
                                  Tahrirlash
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletingStudentId(student.id);
                                    setShowDeleteStudentModal(true);
                                  }}
                                  className="text-[10px] bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 py-1.5 px-3 rounded-lg transition cursor-pointer"
                                >
                                  O'chirish
                                </button>
                              </>
                            )}
                          </td>
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
                <h3 className="text-md font-bold text-zinc-300">Sinf fan o'qituvchilari</h3>
                {userInfo?.role === "ADMIN" && (
                  <button
                    onClick={() => setShowAssignTeacherModal(true)}
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
                  <p className="text-zinc-500 text-xs">Ushbu sinfga hali o'qituvchilar biriktirilmagan.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                  <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                    <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">T/R</th>
                        <th className="px-5 py-3">O'qituvchi</th>
                        <th className="px-5 py-3">Fan</th>
                        <th className="px-5 py-3">Telefon</th>
                        <th className="px-5 py-3">Rol</th>
                        {userInfo?.role === "ADMIN" && <th className="px-5 py-3 text-right">Amallar</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                      {classTeachers.map((ct, i) => (
                        <tr key={ct.id} className="hover:bg-zinc-900/10 transition">
                          <td className="px-5 py-3 text-zinc-500 font-mono">{i + 1}</td>
                          <td className="px-5 py-3 font-semibold text-zinc-200">
                            {ct.last_name} {ct.first_name} {ct.middle_name}
                          </td>
                          <td className="px-5 py-3">
                            <span className="bg-blue-950/40 text-blue-400 border border-blue-900/25 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              {ct.subject_name}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-zinc-400">{ct.phone}</td>
                          <td className="px-5 py-3">
                            {ct.is_main_teacher ? (
                              <span className="bg-indigo-950/40 text-indigo-400 border border-indigo-900/25 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                Sinf Rahbari ⭐
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[10px]">Fan o'qituvchisi</span>
                            )}
                          </td>
                          {userInfo?.role === "ADMIN" && (
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => {
                                  setUnassignClassTeacherId(ct.id);
                                  setShowUnassignTeacherModal(true);
                                }}
                                className="text-[10px] bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 py-1.5 px-3 rounded-lg transition cursor-pointer"
                              >
                                Ajratish
                              </button>
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

          {/* Tab Content: Parents */}
          {classDetailsTab === "parents" && (
            <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-zinc-300">Sinf ota-onalari</h3>
                {userInfo?.role === "ADMIN" && (
                  <button
                    onClick={() => setShowImportParentsModal(true)}
                    className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-indigo-400 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                  >
                    Excel orqali yuklash
                  </button>
                )}
              </div>

              {classParentsLoading ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : classParents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/10">
                  <p className="text-zinc-500 text-xs">Ushbu sinf o'quvchilariga vasiylar biriktirilmagan.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                  <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                    <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">T/R</th>
                        <th className="px-5 py-3">Vasiy</th>
                        <th className="px-5 py-3">Farzandi (O'quvchi)</th>
                        <th className="px-5 py-3">Telefon</th>
                        <th className="px-5 py-3">Pasport</th>
                        {userInfo?.role === "ADMIN" && <th className="px-5 py-3 text-right">Amallar</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                      {classParents.map((parent, i) => (
                        <tr key={parent.id} className="hover:bg-zinc-900/10 transition">
                          <td className="px-5 py-3 text-zinc-500 font-mono">{i + 1}</td>
                          <td className="px-5 py-3 font-semibold text-zinc-200">
                            {parent.last_name} {parent.first_name} {parent.middle_name}
                          </td>
                          <td className="px-5 py-3 text-blue-400 font-semibold">{parent.student_name}</td>
                          <td className="px-5 py-3 font-mono text-zinc-400">{parent.phone}</td>
                          <td className="px-5 py-3 font-mono text-zinc-400">{parent.email || "Kiritilmagan"}</td>
                          {userInfo?.role === "ADMIN" && (
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => {
                                  setEditingParent(parent);
                                  setUnlinkStudentId(parent.student_id || 0);
                                  setShowUnlinkParentModal(true);
                                }}
                                className="text-[10px] bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 py-1.5 px-3 rounded-lg transition cursor-pointer"
                              >
                                Ajratish
                              </button>
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

          {/* Tab Content: Schedule */}
          {classDetailsTab === "schedule" && (
            <div className="space-y-6">
              <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-md font-bold text-zinc-300">Haftalik dars jadvali</h3>
                    <p className="text-[11px] text-zinc-500 mt-1">Ushbu sinf uchun dars jadvali va o'qituvchilarning biriktiruvlari.</p>
                  </div>
                  {userInfo?.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        // Populate form mapping
                        const mapped: { [key: string]: number } = {};
                        classSchedule.forEach((item) => {
                          mapped[`${item.day_of_week}-${item.lesson_number}`] = item.subject_id;
                        });
                        setScheduleFormState(mapped);
                        setShowEditScheduleModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer whitespace-nowrap"
                    >
                      ✏️ Jadvalni tahrirlash
                    </button>
                  )}
                </div>

                {classScheduleLoading ? (
                  <div className="text-center py-10">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : classSchedule.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/10">
                    <p className="text-zinc-550 text-xs">Ushbu sinfda dars jadvali hali belgilanmagan.</p>
                  </div>
                ) : (
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
                      <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-350 font-medium">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                          <tr key={period} className="hover:bg-zinc-900/10 transition">
                            <td className="px-2 py-2.5 font-mono font-bold text-zinc-500 bg-zinc-900/10">
                              {period}-dars
                            </td>
                            {[1, 2, 3, 4, 5, 6].map((day) => {
                              const lesson = classSchedule.find(
                                (item) => item.day_of_week === day && item.lesson_number === period
                              );
                              return (
                                <td key={day} className="px-2 py-2.5 border-l border-zinc-800/30">
                                  {lesson ? (
                                    <div className="space-y-1">
                                      <span className="font-semibold text-zinc-200 text-xs block">
                                        {lesson.subject_name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-650 text-[10px] font-mono">-</span>
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

              {/* Day Exception Section */}
              <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800/20 pb-4">
                  <div>
                    <h3 className="text-md font-bold text-zinc-300">Kunlik dars o'zgarishlari</h3>
                    <p className="text-[11px] text-zinc-500 mt-1">Haftalik dars jadvaliga kiritilgan bir martalik o'zgarishlar.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="date"
                      value={scheduleViewDate}
                      onChange={(e) => {
                        setScheduleViewDate(e.target.value);
                        // Trigger fetch with new date immediately
                        setTimeout(() => {
                          fetchClassSchedule();
                          fetchScheduleExceptions();
                        }, 50);
                      }}
                      className="bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-zinc-200 text-xs rounded-xl px-3 py-2 outline-none transition font-mono cursor-pointer"
                    />
                    {userInfo?.role === "ADMIN" && (
                      <button
                        onClick={() => {
                          setExcDate(scheduleViewDate);
                          setShowAddExceptionModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer whitespace-nowrap"
                      >
                        + O'zgarish kiritish
                      </button>
                    )}
                  </div>
                </div>

                {scheduleExceptionsLoading ? (
                  <div className="text-center py-6">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : scheduleExceptions.length === 0 ? (
                  <p className="text-center text-zinc-550 text-xs py-6">Ushbu sana bo'yicha hech qanday dars o'zgarishi kiritilmagan.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                    <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                      <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Sana</th>
                          <th className="px-5 py-3">Dars soati</th>
                          <th className="px-5 py-3">Holat</th>
                          <th className="px-5 py-3">Yangi Fan</th>
                          {userInfo?.role === "ADMIN" && <th className="px-5 py-3 text-right">Amallar</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                        {scheduleExceptions.map((exc) => (
                          <tr key={exc.id} className="hover:bg-zinc-900/10 transition">
                            <td className="px-5 py-3 font-mono text-zinc-400">
                              {new Date(exc.exception_date).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3 text-zinc-300 font-semibold">{exc.lesson_number}-dars</td>
                            <td className="px-5 py-3">
                              {exc.type === "cancel" ? (
                                <span className="bg-red-950/40 text-red-400 border border-red-900/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                  Bekor qilingan
                                </span>
                              ) : (
                                <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                  O'zgartirilgan
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-zinc-200">
                              {exc.type === "replace" ? exc.subject_name : <span className="text-zinc-650">-</span>}
                            </td>
                            {userInfo?.role === "ADMIN" && (
                              <td className="px-5 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteException(exc.id)}
                                  className="text-[10px] bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 py-1.5 px-3 rounded-lg transition cursor-pointer"
                                >
                                  O'chirish
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS INCLUDED IN CLASSES SECTION */}

      {/* Modal 1: Add Class */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi Sinf Qo'shish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Sinf nomi va unga mos to'lov guruhini aniqlovchi levelni kiriting.</p>

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

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Sinf Leveli (0 - 13) *</label>
                <select
                  value={newClassLevel}
                  onChange={(e) => setNewClassLevel(Number(e.target.value))}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition cursor-pointer"
                >
                  {Array.from({ length: 14 }, (_, i) => (
                    <option key={i} value={i}>Level {i}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClassModal(false);
                    setNewClassName("");
                    setNewClassLevel(1);
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

      {/* Modal 2: Edit Class */}
      {showEditClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Sinfni Tahrirlash</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Sinf nomi va levelini tahrirlash.</p>

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

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Sinf Leveli (0 - 13) *</label>
                <select
                  value={editClassLevel}
                  onChange={(e) => setEditClassLevel(Number(e.target.value))}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition cursor-pointer"
                >
                  {Array.from({ length: 14 }, (_, i) => (
                    <option key={i} value={i}>Level {i}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditClassModal(false);
                    setEditClassName("");
                    setEditClassLevel(1);
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
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Manzil</label>
                <input
                  type="text"
                  placeholder="Masalan: Toshkent sh., Chilonzor"
                  value={studentAddress}
                  onChange={(e) => setStudentAddress(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Tug'ilgan sana</label>
                  <input
                    type="date"
                    value={studentBirthDate}
                    onChange={(e) => setStudentBirthDate(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Guvohnoma (INA)</label>
                  <input
                    type="text"
                    placeholder="I-TV No 123456"
                    value={studentINA}
                    onChange={(e) => setStudentINA(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition font-mono"
                  />
                </div>
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
                    setStudentAddress("");
                    setStudentBirthDate("");
                    setStudentINA("");
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

      {/* Modal 4.5: Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">O'quvchi ma'lumotlarini tahrirlash</h3>

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
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Otang ismi</label>
                <input
                  type="text"
                  value={editStudentMiddleName}
                  onChange={(e) => setEditStudentMiddleName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Manzil</label>
                <input
                  type="text"
                  value={editStudentAddress}
                  onChange={(e) => setEditStudentAddress(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Tug'ilgan sana</label>
                  <input
                    type="date"
                    value={editStudentBirthDate}
                    onChange={(e) => setEditStudentBirthDate(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Guvohnoma (INA)</label>
                  <input
                    type="text"
                    value={editStudentINA}
                    onChange={(e) => setEditStudentINA(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditStudentModal(false);
                    setEditingStudent(null);
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

      {/* Modal 4.6: Delete Student Modal */}
      {showDeleteStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-md font-bold text-red-500 mb-2">O'quvchini o'chirish</h3>
            <p className="text-sm text-zinc-300 mb-6 font-medium">
              Haqiqatan ham ushbu o'quvchini sinfdan o'chirmoqchisiz? Barcha baholar va bog'liqliklar saqlanadi, lekin o'quvchi ro'yxatdan o'chadi.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteStudentModal(false);
                  setDeletingStudentId(null);
                }}
                className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                O'chirishni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Linked Parents management popup */}
      {showParentsModal && selectedStudentForParents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8 relative text-zinc-200">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-md font-bold text-zinc-200">
                  Vasiylarni Boshqarish ({selectedStudentForParents.first_name} {selectedStudentForParents.last_name})
                </h3>
                <p className="text-[10px] text-zinc-550 mt-1">Ushbu o'quvchiga biriktirilgan vasiylar (ota-onalar) ro'yxati va yangi bog'lash oynasi.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowParentsModal(false);
                  setSelectedStudentForParents(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition text-xs font-semibold cursor-pointer"
              >
                Yopish
              </button>
            </div>

            {/* List of current parents */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mavjud bog'langan vasiylar</h4>
              {linkedParentsLoading ? (
                <div className="text-center py-4">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : linkedParents.length === 0 ? (
                <p className="text-zinc-550 text-xs py-2">Ushbu o'quvchiga hali vasiy biriktirilmagan.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-850 bg-zinc-950/20 text-xs">
                  <div className="divide-y divide-zinc-850">
                    {linkedParents.map((parent) => (
                      <div key={parent.id} className="p-3 flex items-center justify-between hover:bg-zinc-900/10 transition">
                        <div>
                          <p className="font-semibold text-zinc-300">
                            {parent.last_name} {parent.first_name} {parent.middle_name}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Tel: {parent.phone} | Pasport: {parent.email || "Kiritilmagan"}
                          </p>
                        </div>
                        {isMainTeacherOfClass() && (
                          <button
                            onClick={() => handleUnlinkParent(parent.id)}
                            className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 text-[10px] font-semibold py-1 px-2.5 rounded-lg transition cursor-pointer"
                          >
                            Ajratish
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Manual add new parent form */}
            {isMainTeacherOfClass() && (
              <div className="border-t border-zinc-800/60 pt-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Yangi vasiy qo'shish va bog'lash</h4>
                <form onSubmit={handleLinkParent} className="space-y-3.5 text-zinc-300">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase mb-1">Familiyasi *</label>
                      <input
                        type="text"
                        required
                        placeholder="Valiyeva"
                        value={parentLastName}
                        onChange={(e) => setParentLastName(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase mb-1">Ismi *</label>
                      <input
                        type="text"
                        required
                        placeholder="Dilnoza"
                        value={parentFirstName}
                        onChange={(e) => setParentFirstName(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase mb-1">Otasining ismi (sharif)</label>
                      <input
                        type="text"
                        placeholder="Karimovna"
                        value={parentMiddleName}
                        onChange={(e) => setParentMiddleName(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase mb-1">Telefon raqami *</label>
                      <input
                        type="text"
                        required
                        placeholder="+998901234567"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase mb-1">Pasport</label>
                      <input
                        type="text"
                        placeholder="AB1234567"
                        value={parentPassport}
                        onChange={(e) => setParentPassport(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-zinc-400 uppercase mb-1">Parol (Default: password123) *</label>
                      <input
                        type="password"
                        required
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-lg px-3 py-2 text-xs outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-3">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer"
                    >
                      {actionLoading ? "Bog'lanmoqda..." : "Yangi vasiyni bog'lash"}
                    </button>
                  </div>
                </form>
              </div>
            )}
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
                    Sinf Rahbari (Main Teacher) etib tayinlash
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
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Biriktirilmoqda..." : "Biriktirish"}
                </button>
              </div>
            </form>
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
                        <td className="px-2 py-2.5 font-mono font-semibold text-zinc-500 bg-zinc-900/10">
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
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition font-mono"
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

      {/* Modal: Import Students (Excel sheet) */}
      {showImportStudentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">O'quvchilarni Excel Orqali Import Qilish</h3>
            {selectedClass && <p className="text-[11px] text-zinc-500 mb-6">Yuklangan barcha o'quvchilar avtomat ravishda "{selectedClass.name}" sinfiga biriktiriladi.</p>}

            {/* Template Download Option */}
            <div className="bg-[#4f46e5]/10 border border-[#4f46e5]/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-400">Excel shablonini ko'chirib oling</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">O'quvchilar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={() => downloadTemplate("students")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
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
                    <div className="text-2xl">📝</div>
                    <p className="text-sm text-zinc-300">
                      {selectedFile ? selectedFile.name : "O'quvchilar Excel shablonini tanlang (.xlsx)"}
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
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition cursor-pointer"
                  >
                    Tugatish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
