import React, { useState, useEffect, useRef } from "react";
import { Users, Pencil, Trash2, UserMinus } from "lucide-react";
import { ClassItem, SubjectItem, TenantUser, ClassTeacherItem, ClassTeacherHistoryItem, ClassScheduleItem, UserInfo, RowError, ImportResult } from "./types";

interface SearchableSingleSelectProps {
  value: number;
  options: { id: number; name: string }[];
  placeholder?: string;
  onChange: (val: number) => void;
}

const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({
  value,
  options,
  placeholder = "Bo'sh",
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.id === value);
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative font-sans text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setSearch("");
          setIsOpen(!isOpen);
        }}
        className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-between gap-1 shadow-2xs ${
          value > 0
            ? "bg-[#ECFCCA] border-lime-300 text-[#1D1E26]"
            : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100/80"
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.name : placeholder}</span>
        <span className="text-[9px] text-slate-400 shrink-0">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 min-w-[150px] max-h-56 flex flex-col space-y-1.5 animate-fadeIn">
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#D4F562] font-semibold"
            autoFocus
          />
          <div className="flex-1 overflow-y-auto space-y-0.5 max-h-40 pr-0.5 custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                onChange(0);
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                value === 0 ? "bg-slate-100 font-extrabold text-slate-900" : "hover:bg-slate-50 text-slate-500"
              }`}
            >
              Bo'sh
            </button>
            {filteredOptions.length === 0 ? (
              <p className="text-[11px] text-slate-400 p-2 text-center italic">Topilmadi</p>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition truncate ${
                    value === opt.id
                      ? "bg-[#D4F562] font-black text-[#1D1E26]"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {opt.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  setSubjects?: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
  initialTab?: "students" | "teachers" | "parents" | "schedule";
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
  setSubjects,
  initialTab,
}: ClassesSectionProps) {
  // Navigation
  const [classDetailsTab, setClassDetailsTab] = useState<"students" | "teachers" | "parents" | "schedule">(initialTab || "students");

  // Sync initialTab if it changes (e.g. redirect from schedule overview)
  useEffect(() => {
    if (initialTab) setClassDetailsTab(initialTab);
  }, [initialTab]);

  // Quick Add Subject Modal (inside Schedule Modal)
  const [showQuickAddSubjectModal, setShowQuickAddSubjectModal] = useState(false);
  const [quickSubjectName, setQuickSubjectName] = useState("");
  const [quickSubjectLevels, setQuickSubjectLevels] = useState<number[]>([]);
  const [quickSubjectLoading, setQuickSubjectLoading] = useState(false);
  const [quickSubjectError, setQuickSubjectError] = useState("");

  const filteredSubjectsForClass = subjects.filter((sub) => {
    if (!selectedClass || !selectedClass.level) return true;
    if (!sub.target_levels || sub.target_levels.length === 0) return true;
    return sub.target_levels.includes(selectedClass.level);
  });

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

  const [classStudentsPage, setClassStudentsPage] = useState(1);
  const [classStudentsPerPage, setClassStudentsPerPage] = useState<number>(10);

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

  // Edit Class Teacher modal
  const [showEditClassTeacherModal, setShowEditClassTeacherModal] = useState(false);
  const [editingClassTeacher, setEditingClassTeacher] = useState<ClassTeacherItem | null>(null);
  const [editCTSubjectId, setEditCTSubjectId] = useState<number>(0);
  const [editCTTeacherId, setEditCTTeacherId] = useState<number>(0);
  const [editCTIsMain, setEditCTIsMain] = useState(false);

  // Class Teacher History modal
  const [showClassTeacherHistoryModal, setShowClassTeacherHistoryModal] = useState(false);
  const [classTeacherHistory, setClassTeacherHistory] = useState<ClassTeacherHistoryItem[]>([]);
  const [classTeacherHistoryLoading, setClassTeacherHistoryLoading] = useState(false);

  // Edit Parent modal
  const [showEditParentModal, setShowEditParentModal] = useState(false);
  const [editParentFirstName, setEditParentFirstName] = useState("");
  const [editParentLastName, setEditParentLastName] = useState("");
  const [editParentMiddleName, setEditParentMiddleName] = useState("");
  const [editParentPhone, setEditParentPhone] = useState("");
  const [editParentPassport, setEditParentPassport] = useState("");

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

  // ESC key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddClassModal(false);
        setShowEditClassModal(false);
        setShowDeleteClassModal(false);
        setShowAddStudentModal(false);
        setShowEditStudentModal(false);
        setShowDeleteStudentModal(false);
        setShowParentsModal(false);
        setShowUnassignTeacherModal(false);
        setShowUnlinkParentModal(false);
        setShowAssignTeacherModal(false);
        setShowEditClassTeacherModal(false);
        setShowClassTeacherHistoryModal(false);
        setShowEditParentModal(false);
        setShowEditScheduleModal(false);
        setShowAddExceptionModal(false);
        setShowImportStudentsModal(false);
        setShowImportParentsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
      if (sId) headers["X-School-ID"] = sId;

      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/schedule?date=${scheduleViewDate}`, {
        headers,
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

  const handleAddParentDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentIdForAdd) {
      alert("Iltimos, o'quvchini tanlang");
      return;
    }
    if (!parentFirstName.trim() || !parentLastName.trim() || !parentPhone.trim() || !parentPassword.trim()) {
      alert("Majburiy maydonlarni to'ldiring");
      return;
    }

    setActionLoading(true);
    setActionError("");

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
      if (!response.ok) {
        throw new Error(data.error || "Ota-onani qo'shib bo'lmadi");
      }

      setParentFirstName("");
      setParentLastName("");
      setParentMiddleName("");
      setParentPhone("");
      setParentPassport("");
      setParentPassword("password123");
      setSelectedStudentIdForAdd("");

      setShowAddParentModal(false);
      fetchClassParents();
      alert("Ota-ona muvaffaqiyatli qo'shildi!");
    } catch (err: any) {
      setActionError(err.message);
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

  const handleUpdateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    setActionLoading(true);
    setActionError("");
    try {
      const response = await fetch(`${API_URL}/api/schools/parents/${editingParent.id}`, {
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
          passport: editParentPassport.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ota-onani yangilab bo'lmadi");
      setShowEditParentModal(false);
      setEditingParent(null);
      fetchClassParents();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassTeacher || !selectedClass) return;
    setActionLoading(true);
    setActionError("");
    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/teachers/${editingClassTeacher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject_id: editCTSubjectId || undefined,
          teacher_id: editCTTeacherId || undefined,
          is_main_teacher: editCTIsMain,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'qituvchi biriktiruvi yangilanmadi");
      setShowEditClassTeacherModal(false);
      setEditingClassTeacher(null);
      fetchClassTeachers();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchClassTeacherHistory = async () => {
    if (!selectedClass) return;
    setClassTeacherHistoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/teachers/history`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      setClassTeacherHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setClassTeacherHistory([]);
    } finally {
      setClassTeacherHistoryLoading(false);
    }
  };

  const handleOpenClassTeacherHistory = () => {
    setShowClassTeacherHistoryModal(true);
    fetchClassTeacherHistory();
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
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const response = await fetch(`${API_URL}/api/schools/classes/${selectedClass.id}/schedule`, {
        method: "POST",
        headers,
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
        <div className="space-y-6 font-sans text-[#1D1E26]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight">Sinflar Boshqaruvi</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Maktabingizdagi faol sinflar va ularning tarkibini boshqaring.</p>
            </div>
            {userInfo?.role === "ADMIN" && (
              <button
                onClick={() => setShowAddClassModal(true)}
                className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl hover:opacity-90 transition duration-200 shadow-md cursor-pointer whitespace-nowrap"
              >
                + Yangi Sinf
              </button>
            )}
          </div>

          {/* Search & Statistics bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white border border-slate-100/80 p-4 rounded-3xl shadow-xs">
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Sinf nomini qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-[#D4F562] pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition font-medium"
              />
            </div>
            <div className="flex items-center space-x-6 text-xs text-slate-500 px-2 font-mono">
              <span>Jami sinflar: <strong className="text-[#1D1E26] font-extrabold">{classes.length}</strong></span>
            </div>
          </div>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-white">
              <p className="text-slate-400 text-xs font-medium">
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
                  className="bg-white border border-slate-100/80 hover:border-[#D4F562] rounded-3xl p-5 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between h-40 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-[#1D1E26] group-hover:text-[#65A30D] transition">
                      {cls.name} sinfi
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="bg-[#ECFCCA] text-[#65A30D] text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-xl">
                        Lvl {cls.level ?? 0}
                      </span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-1 rounded-xl">
                        ID: {cls.id}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="flex items-center font-medium">
                      <svg className="w-3.5 h-3.5 text-slate-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <div className="space-y-6 select-none font-sans">
          {/* Class Details Header */}
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedClass(null)}
                className="bg-slate-100 hover:bg-slate-200 text-[#1D1E26] p-2.5 rounded-2xl transition cursor-pointer font-extrabold shadow-xs"
                title="Ortga qarata"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight flex items-center gap-2">
                  {selectedClass.name} sinfi{" "}
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-[#ECFCCA] text-[#65A30D] align-middle font-mono">
                    Level {selectedClass.level ?? 0}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Sinf tarkibidagi o'quvchilar va fan o'qituvchilari boshqaruvi.
                </p>
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
                  className="bg-[#1D1E26] text-white hover:bg-slate-800 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Nomini o'zgartirish
                </button>
                <button
                  onClick={() => setShowDeleteClassModal(true)}
                  className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Sinfni o'chirish
                </button>
              </div>
            )}
          </div>

          {/* Inside Tab Switcher */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/60 text-xs font-extrabold">
            <button
              onClick={() => setClassDetailsTab("students")}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                classDetailsTab === "students"
                  ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sinf O'quvchilari ({classStudents.length})
            </button>
            <button
              onClick={() => setClassDetailsTab("teachers")}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                classDetailsTab === "teachers"
                  ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Biriktirilgan O'qituvchilar ({classTeachers.length})
            </button>
            <button
              onClick={() => setClassDetailsTab("parents")}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                classDetailsTab === "parents"
                  ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Ota-onalar ({classParents.length})
            </button>
            <button
              onClick={() => setClassDetailsTab("schedule")}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                classDetailsTab === "schedule"
                  ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Dars Jadvali
            </button>
          </div>

          {/* Tab Content: Students */}
          {classDetailsTab === "students" && (
            <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[#1D1E26]">O'quvchilar ro'yxati</h3>
                
                <div className="flex items-center space-x-3">
                  {userInfo?.role === "ADMIN" && (
                    <button
                      onClick={() => setShowImportStudentsModal(true)}
                      className="bg-[#1D1E26] text-white hover:bg-slate-800 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Excel orqali yuklash
                    </button>
                  )}

                  {isMainTeacherOfClass() && (
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                    >
                      + O'quvchi qo'shish
                    </button>
                  )}
                </div>
              </div>

              {classStudentsLoading ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : classStudents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-slate-400 text-xs font-medium">Ushbu sinfda o'quvchilar mavjud emas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 relative">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                        <tr>
                          <th className="px-6 py-4">T/R</th>
                          <th className="px-6 py-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">F.I.SH</th>
                          <th className="px-6 py-4">Manzil</th>
                          <th className="px-6 py-4">Tug'ilgan sana</th>
                          <th className="px-6 py-4">INA</th>
                          <th className="px-6 py-4">Balans</th>
                          <th className="px-6 py-4 text-right">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                        {(() => {
                          const perPage = classStudentsPerPage;
                          const startIndex = (classStudentsPage - 1) * perPage;
                          const paginatedList = classStudents.slice(startIndex, startIndex + perPage);

                          return paginatedList.map((student, i) => (
                            <tr key={student.id} className="group hover:bg-slate-50/80 transition">
                              <td className="px-6 py-4 text-slate-400 font-mono">{startIndex + i + 1}</td>
                              <td className="px-6 py-4 font-bold text-[#1D1E26] sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] min-w-[200px]">
                                {student.last_name} {student.first_name} {student.middle_name}
                              </td>
                              <td className="px-6 py-4 text-slate-500">{student.address || "Kiritilmagan"}</td>
                              <td className="px-6 py-4 text-slate-500 font-mono">
                                {student.birthdate ? student.birthdate.split("T")[0] : "Kiritilmagan"}
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-mono">{student.ina || "Kiritilmagan"}</td>
                              <td className={`px-6 py-4 font-mono font-bold ${
                                (student.balance ? student.balance : 0) >= 0 ? "text-emerald-600" : "text-red-500"
                              }`}>
                                {new Intl.NumberFormat("uz-UZ").format(student.balance || 0)} UZS
                              </td>
                              <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setSelectedStudentForParents(student);
                                    fetchLinkedParents(student.id);
                                    setShowParentsModal(true);
                                  }}
                                  title="Vasiylar"
                                  className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Users className="w-4 h-4" />
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
                                      title="Tahrirlash"
                                      className="p-2 bg-slate-100 hover:bg-slate-200 text-[#1D1E26] rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeletingStudentId(student.id);
                                        setShowDeleteStudentModal(true);
                                      }}
                                      title="O'chirish"
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-[11px] text-slate-400 font-medium font-mono">
                        Jami <b>{classStudents.length}</b> ta o'quvchi · Sahifa {classStudentsPage} / {Math.ceil(classStudents.length / classStudentsPerPage) || 1}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">Har sahifada:</span>
                        <select
                          value={classStudentsPerPage}
                          onChange={(e) => {
                            setClassStudentsPerPage(Number(e.target.value));
                            setClassStudentsPage(1);
                          }}
                          className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-2 py-1 rounded-xl outline-none cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-[#D4F562] transition"
                        >
                          <option value={10}>10 ta</option>
                          <option value={25}>25 ta</option>
                          <option value={50}>50 ta</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={classStudentsPage === 1}
                        onClick={() => setClassStudentsPage((prev) => Math.max(prev - 1, 1))}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold cursor-pointer transition text-xs"
                      >
                        ← Oldingi
                      </button>
                      <button
                        type="button"
                        disabled={classStudentsPage >= Math.ceil(classStudents.length / classStudentsPerPage)}
                        onClick={() => setClassStudentsPage((prev) => Math.min(prev + 1, Math.ceil(classStudents.length / classStudentsPerPage)))}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold cursor-pointer transition text-xs"
                      >
                        Keyingi →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Teachers */}
          {classDetailsTab === "teachers" && (
            <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[#1D1E26]">Sinf fan o&apos;qituvchilari</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleOpenClassTeacherHistory}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    📜 Tarix
                  </button>
                  {userInfo?.role === "ADMIN" && (
                    <button
                      onClick={() => setShowAssignTeacherModal(true)}
                      className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                    >
                      + O&apos;qituvchi biriktirish
                    </button>
                  )}
                </div>
              </div>

              {classTeachersLoading ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : classTeachers.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-slate-400 text-xs font-medium">Ushbu sinfga hali o'qituvchilar biriktirilmagan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                      <tr>
                        <th className="px-6 py-4">T/R</th>
                        <th className="px-6 py-4">O'qituvchi</th>
                        <th className="px-6 py-4">Fan</th>
                        <th className="px-6 py-4">Telefon</th>
                        <th className="px-6 py-4">Rol</th>
                        {userInfo?.role === "ADMIN" && <th className="px-6 py-4 text-right">Amallar</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                      {classTeachers.map((ct, i) => (
                        <tr key={ct.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-4 text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-6 py-4 font-bold text-[#1D1E26]">
                            {ct.last_name} {ct.first_name} {ct.middle_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-[#E0F2FE] text-[#0284C7] font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg">
                              {ct.subject_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">{ct.phone}</td>
                          <td className="px-6 py-4">
                            {ct.is_main_teacher ? (
                              <span className="bg-[#ECFCCA] text-[#65A30D] font-extrabold text-[11px] px-2.5 py-1 rounded-lg">
                                Sinf Rahbari
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Fan o'qituvchisi</span>
                            )}
                          </td>
                          {userInfo?.role === "ADMIN" && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingClassTeacher(ct);
                                    setEditCTSubjectId(ct.subject_id);
                                    setEditCTTeacherId(ct.teacher_id);
                                    setEditCTIsMain(ct.is_main_teacher);
                                    setActionError("");
                                    setShowEditClassTeacherModal(true);
                                  }}
                                  title="Tahrirlash"
                                  className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setUnassignClassTeacherId(ct.id);
                                    setShowUnassignTeacherModal(true);
                                  }}
                                  title="Ajratish"
                                  className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <UserMinus className="w-4 h-4" />
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

          {/* Tab Content: Parents */}
          {classDetailsTab === "parents" && (
            <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[#1D1E26]">Sinf ota-onalari</h3>
                <div className="flex items-center space-x-3">
                  {userInfo?.role === "ADMIN" && (
                    <button
                      onClick={() => setShowImportParentsModal(true)}
                      className="bg-[#1D1E26] text-white hover:bg-slate-800 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Excel orqali yuklash
                    </button>
                  )}
                  {(userInfo?.role === "ADMIN" || isMainTeacherOfClass()) && (
                    <button
                      onClick={() => {
                        setSelectedStudentIdForAdd(classStudents.length > 0 ? classStudents[0].id : "");
                        setParentFirstName("");
                        setParentLastName("");
                        setParentMiddleName("");
                        setParentPhone("");
                        setParentPassport("");
                        setParentPassword("password123");
                        setShowAddParentModal(true);
                      }}
                      className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                    >
                      + Ota-ona qo'shish
                    </button>
                  )}
                </div>
              </div>

              {classParentsLoading ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : classParents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-slate-400 text-xs font-medium">Ushbu sinf o'quvchilariga vasiylar biriktirilmagan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                      <tr>
                        <th className="px-6 py-4">T/R</th>
                        <th className="px-6 py-4">Vasiy</th>
                        <th className="px-6 py-4">Farzandi (O'quvchi)</th>
                        <th className="px-6 py-4">Telefon</th>
                        <th className="px-6 py-4">Pasport</th>
                        {userInfo?.role === "ADMIN" && <th className="px-6 py-4 text-right">Amallar</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                      {classParents.map((parent, i) => (
                        <tr key={parent.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-4 text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-6 py-4 font-bold text-[#1D1E26]">
                            {parent.last_name} {parent.first_name} {parent.middle_name}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-indigo-600">{parent.student_name}</td>
                          <td className="px-6 py-4 font-mono text-slate-500">{parent.phone}</td>
                          <td className="px-6 py-4 font-mono text-slate-500">{parent.email || "Kiritilmagan"}</td>
                          {userInfo?.role === "ADMIN" && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingParent(parent);
                                    setEditParentFirstName(parent.first_name || "");
                                    setEditParentLastName(parent.last_name || "");
                                    setEditParentMiddleName(parent.middle_name || "");
                                    setEditParentPhone(parent.phone || "");
                                    setEditParentPassport(parent.email || "");
                                    setActionError("");
                                    setShowEditParentModal(true);
                                  }}
                                  title="Tahrirlash"
                                  className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingParent(parent);
                                    setUnlinkStudentId(parent.student_id || 0);
                                    setShowUnlinkParentModal(true);
                                  }}
                                  title="Ajratish"
                                  className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <UserMinus className="w-4 h-4" />
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

          {/* Tab Content: Schedule */}
          {classDetailsTab === "schedule" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-black text-[#1D1E26]">Haftalik dars jadvali</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Ushbu sinf uchun dars jadvali va o'qituvchilarning biriktiruvlari.</p>
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
                      className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer whitespace-nowrap"
                    >
                      Jadvalni tahrirlash
                    </button>
                  )}
                </div>

                {classScheduleLoading ? (
                  <div className="text-center py-10">
                    <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : classSchedule.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-slate-400 text-xs font-medium">Ushbu sinfda dars jadvali hali belgilanmagan.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-center border-collapse table-fixed">
                      <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                        <tr>
                          <th className="px-2 py-4 w-20">Soat</th>
                          <th className="px-2 py-4">Dushanba</th>
                          <th className="px-2 py-4">Seshanba</th>
                          <th className="px-2 py-4">Chorshanba</th>
                          <th className="px-2 py-4">Payshanba</th>
                          <th className="px-2 py-4">Juma</th>
                          <th className="px-2 py-4">Shanba</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                          <tr key={period} className="hover:bg-slate-50/80 transition">
                            <td className="px-2 py-3 font-mono font-bold text-slate-400 bg-slate-50/50">
                              {period}-dars
                            </td>
                            {[1, 2, 3, 4, 5, 6].map((day) => {
                              const lesson = classSchedule.find(
                                (item) => item.day_of_week === day && item.lesson_number === period
                              );
                              return (
                                <td key={day} className="px-2 py-3 border-l border-slate-100">
                                  {lesson ? (
                                    <div className="space-y-1">
                                      <span className="font-extrabold text-[#1D1E26] text-xs block">
                                        {lesson.subject_name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-xs font-mono">-</span>
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
              <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#1D1E26]">Kunlik dars o'zgarishlari</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Haftalik dars jadvaliga kiritilgan bir martalik o'zgarishlar.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="date"
                      value={scheduleViewDate}
                      onChange={(e) => {
                        setScheduleViewDate(e.target.value);
                        setTimeout(() => {
                          fetchClassSchedule();
                          fetchScheduleExceptions();
                        }, 50);
                      }}
                      className="bg-slate-50 border border-slate-200 text-[#1D1E26] text-xs font-bold rounded-xl px-3.5 py-2 outline-none transition font-mono cursor-pointer"
                    />
                    {userInfo?.role === "ADMIN" && (
                      <button
                        onClick={() => {
                          setExcDate(scheduleViewDate);
                          setShowAddExceptionModal(true);
                        }}
                        className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer whitespace-nowrap"
                      >
                        + O'zgarish kiritish
                      </button>
                    )}
                  </div>
                </div>

                {scheduleExceptionsLoading ? (
                  <div className="text-center py-6">
                    <div className="w-5 h-5 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : scheduleExceptions.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-6 font-medium">Ushbu sana bo'yicha hech qanday dars o'zgarishi kiritilmagan.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                      <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                        <tr>
                          <th className="px-5 py-3.5">Sana</th>
                          <th className="px-5 py-3.5">Dars soati</th>
                          <th className="px-5 py-3.5">Holat</th>
                          <th className="px-5 py-3.5">Yangi Fan</th>
                          {userInfo?.role === "ADMIN" && <th className="px-5 py-3.5 text-right">Amallar</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                        {scheduleExceptions.map((exc) => {
                          const excDateStr = exc.date || exc.exception_date || "";
                          const formattedExcDate = excDateStr ? excDateStr.split("T")[0] : "-";
                          const isCancel = exc.type === "cancel" || !exc.subject_id;

                          return (
                            <tr key={exc.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-5 py-3.5 font-mono text-slate-500 font-bold">
                                {formattedExcDate}
                              </td>
                              <td className="px-5 py-3.5 text-[#1D1E26] font-bold">{exc.lesson_number}-dars</td>
                              <td className="px-5 py-3.5">
                                {isCancel ? (
                                  <span className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono">
                                    Bekor qilingan
                                  </span>
                                ) : (
                                  <span className="bg-[#ECFCCA] text-[#65A30D] border border-lime-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono">
                                    O'zgartirilgan
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-[#1D1E26] font-bold">
                                {!isCancel ? (exc.subject_name || "Mavjud fan") : <span className="text-slate-300 font-mono">-</span>}
                              </td>
                              {userInfo?.role === "ADMIN" && (
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    onClick={() => handleDeleteException(exc.id)}
                                    className="text-xs bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-extrabold py-1.5 px-3 rounded-xl transition shadow-xs cursor-pointer"
                                  >
                                    O'chirish
                                  </button>
                                </td>
                              )}
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

      {/* ======================================================== */}
      {/* MODALS INCLUDED IN CLASSES SECTION */}

      {/* Modal 1: Add Class */}
      {showAddClassModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddClassModal(false);
              setNewClassName("");
              setNewClassLevel(1);
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Yangi Sinf Qo'shish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Sinf nomi va unga mos to'lov guruhini aniqlovchi levelni kiriting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddClassModal(false);
                  setNewClassName("");
                  setNewClassLevel(1);
                  setActionError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Sinf Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 9-A"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Sinf Leveli (0 - 13) *</label>
                <select
                  value={newClassLevel}
                  onChange={(e) => setNewClassLevel(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold cursor-pointer"
                >
                  {Array.from({ length: 14 }, (_, i) => (
                    <option key={i} value={i}>Level {i}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClassModal(false);
                    setNewClassName("");
                    setNewClassLevel(1);
                    setActionError("");
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditClassModal(false);
              setEditClassName("");
              setEditClassLevel(1);
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Sinfni Tahrirlash</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Sinf nomi va levelini tahrirlash.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditClassModal(false);
                  setEditClassName("");
                  setEditClassLevel(1);
                  setActionError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                {actionError}
              </div>
            )}

            <form onSubmit={handleEditClass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Sinf Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 10-C"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Sinf Leveli (0 - 13) *</label>
                <select
                  value={editClassLevel}
                  onChange={(e) => setEditClassLevel(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold cursor-pointer"
                >
                  {Array.from({ length: 14 }, (_, i) => (
                    <option key={i} value={i}>Level {i}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditClassModal(false);
                    setEditClassName("");
                    setEditClassLevel(1);
                    setActionError("");
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteClassModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-red-600">Sinfni o'chirish</h3>
              <button
                type="button"
                onClick={() => setShowDeleteClassModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
            {selectedClass && (
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Haqiqatan ham <strong className="text-slate-900 font-black">"{selectedClass.name}"</strong> sinfini o'chirib yubormoqchimisiz? Ushbu sinfga tegishli barcha o'quvchilar bazadan soft-delete qilinadi.
              </p>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteClassModal(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteClass}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "O'chirilmoqda..." : "O'chirishni tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Manual Student Add under Selected Class */}
      {showAddStudentModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
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
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md max-h-[90vh] bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] flex flex-col overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Yangi O'quvchi Qo'shish</h3>
                {selectedClass && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Ushbu o'quvchi avtomat ravishda "{selectedClass.name}" sinfiga biriktiriladi.
                  </p>
                )}
              </div>
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-4">
              {actionError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Ismi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ali"
                      value={studentFirstName}
                      onChange={(e) => setStudentFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Familiyasi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Valiyev"
                      value={studentLastName}
                      onChange={(e) => setStudentLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Otasining ismi (sharif)</label>
                  <input
                    type="text"
                    placeholder="Karimovich"
                    value={studentMiddleName}
                    onChange={(e) => setStudentMiddleName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Manzil</label>
                  <input
                    type="text"
                    placeholder="Masalan: Toshkent sh., Chilonzor"
                    value={studentAddress}
                    onChange={(e) => setStudentAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Tug'ilgan sana</label>
                    <input
                      type="date"
                      value={studentBirthDate}
                      onChange={(e) => setStudentBirthDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Guvohnoma (INA)</label>
                    <input
                      type="text"
                      placeholder="I-TV No 123456"
                      value={studentINA}
                      onChange={(e) => setStudentINA(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
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
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Qo'shilmoqda..." : "Qo'shish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4.5: Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditStudentModal(false);
              setEditingStudent(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md max-h-[90vh] bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] flex flex-col overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">O'quvchi ma'lumotlarini tahrirlash</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">O'quvchi shaxsiy va hujjat ma'lumotlarini yangilash.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditStudentModal(false);
                  setEditingStudent(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-4">
              {actionError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleEditStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Ismi *</label>
                    <input
                      type="text"
                      required
                      value={editStudentFirstName}
                      onChange={(e) => setEditStudentFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Familiyasi *</label>
                    <input
                      type="text"
                      required
                      value={editStudentLastName}
                      onChange={(e) => setEditStudentLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Otasining ismi</label>
                  <input
                    type="text"
                    value={editStudentMiddleName}
                    onChange={(e) => setEditStudentMiddleName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Manzil</label>
                  <input
                    type="text"
                    value={editStudentAddress}
                    onChange={(e) => setEditStudentAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Tug'ilgan sana</label>
                    <input
                      type="date"
                      value={editStudentBirthDate}
                      onChange={(e) => setEditStudentBirthDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Guvohnoma (INA)</label>
                    <input
                      type="text"
                      value={editStudentINA}
                      onChange={(e) => setEditStudentINA(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditStudentModal(false);
                      setEditingStudent(null);
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Yangilanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4.6: Delete Student Modal */}
      {showDeleteStudentModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteStudentModal(false);
              setDeletingStudentId(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-red-600">O'quvchini o'chirish</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteStudentModal(false);
                  setDeletingStudentId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Haqiqatan ham ushbu o'quvchini sinfdan o'chirmoqchisiz? Barcha baholar va bog'liqliklar saqlanadi, lekin o'quvchi ro'yxatdan o'chadi.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteStudentModal(false);
                  setDeletingStudentId(null);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "O'chirilmoqda..." : "O'chirishni tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Linked Parents management popup */}
      {/* Modal 3: Manage Parents (Vasiylar) for Student */}
      {showParentsModal && selectedStudentForParents && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowParentsModal(false);
              setSelectedStudentForParents(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-xl max-h-[90vh] bg-white border border-slate-100 rounded-3xl shadow-2xl text-[#1D1E26] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">
                  Vasiylarni Boshqarish ({selectedStudentForParents.first_name} {selectedStudentForParents.last_name})
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Ushbu o'quvchiga biriktirilgan vasiylar (ota-onalar) ro'yxati va yangi bog'lash oynasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowParentsModal(false);
                  setSelectedStudentForParents(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* List of current parents */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase font-mono tracking-wider">Mavjud bog'langan vasiylar</h4>
                {linkedParentsLoading ? (
                  <div className="text-center py-6">
                    <div className="w-5 h-5 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : linkedParents.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <p className="text-slate-400 text-xs font-medium">Ushbu o'quvchiga hali vasiy biriktirilmagan.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 text-xs">
                    <div className="divide-y divide-slate-100">
                      {linkedParents.map((parent) => (
                        <div key={parent.id} className="p-3.5 flex items-center justify-between hover:bg-slate-100/50 transition">
                          <div>
                            <p className="font-bold text-[#1D1E26]">
                              {parent.last_name} {parent.first_name} {parent.middle_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Tel: {parent.phone} | Pasport: {parent.email || "Kiritilmagan"}
                            </p>
                          </div>
                          {isMainTeacherOfClass() && (
                            <button
                              onClick={() => handleUnlinkParent(parent.id)}
                              title="Ajratish"
                              className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            >
                              <UserMinus className="w-4 h-4" />
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
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase font-mono tracking-wider mb-3">Yangi vasiy qo'shish va bog'lash</h4>
                  <form onSubmit={handleLinkParent} autoComplete="off" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Familiyasi *</label>
                        <input
                          type="text"
                          required
                          placeholder="Valiyeva"
                          value={parentLastName}
                          onChange={(e) => setParentLastName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Ismi *</label>
                        <input
                          type="text"
                          required
                          placeholder="Dilnoza"
                          value={parentFirstName}
                          onChange={(e) => setParentFirstName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Otasining ismi (sharif)</label>
                        <input
                          type="text"
                          placeholder="Karimovna"
                          value={parentMiddleName}
                          onChange={(e) => setParentMiddleName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Telefon raqami *</label>
                        <input
                          type="text"
                          required
                          placeholder="+998901234567"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Pasport</label>
                        <input
                          type="text"
                          name="parent_passport_serial_no_no_autofill"
                          autoComplete="off"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck={false}
                          data-lpignore="true"
                          placeholder="AB1234567"
                          value={parentPassport}
                          onChange={(e) => setParentPassport(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Parol (Default: password123) *</label>
                        <input
                          type="password"
                          required
                          autoComplete="new-password"
                          value={parentPassword}
                          onChange={(e) => setParentPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-6 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? "Bog'lanmoqda..." : "Yangi vasiyni bog'lash"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Parent directly to Class */}
      {showAddParentModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddParentModal(false);
              setParentFirstName("");
              setParentLastName("");
              setParentMiddleName("");
              setParentPhone("");
              setParentPassport("");
              setParentPassword("password123");
              setSelectedStudentIdForAdd("");
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md max-h-[90vh] bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] flex flex-col overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Yangi Ota-ona Qo'shish</h3>
                {selectedClass && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    "{selectedClass.name}" sinfidagi o'quvchiga vasiy biriktirish.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddParentModal(false);
                  setParentFirstName("");
                  setParentLastName("");
                  setParentMiddleName("");
                  setParentPhone("");
                  setParentPassport("");
                  setParentPassword("password123");
                  setSelectedStudentIdForAdd("");
                  setActionError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-4">
              {actionError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleAddParentDirect} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Sinf O'quvchisi *</label>
                  <select
                    required
                    value={selectedStudentIdForAdd}
                    onChange={(e) => setSelectedStudentIdForAdd(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold cursor-pointer"
                  >
                    <option value="">-- O'quvchini tanlang --</option>
                    {classStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.last_name} {st.first_name} {st.middle_name || ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Ismi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dilnoza"
                      value={parentFirstName}
                      onChange={(e) => setParentFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Familiyasi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Valiyeva"
                      value={parentLastName}
                      onChange={(e) => setParentLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Otasining ismi (sharif)</label>
                  <input
                    type="text"
                    placeholder="Karimovna"
                    value={parentMiddleName}
                    onChange={(e) => setParentMiddleName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Telefon raqami *</label>
                  <input
                    type="text"
                    required
                    placeholder="+998901234567"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Pasport (Email)</label>
                    <input
                      type="text"
                      placeholder="AB1234567"
                      value={parentPassport}
                      onChange={(e) => setParentPassport(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Parol *</label>
                    <input
                      type="password"
                      required
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddParentModal(false);
                      setParentFirstName("");
                      setParentLastName("");
                      setParentMiddleName("");
                      setParentPhone("");
                      setParentPassport("");
                      setParentPassword("password123");
                      setSelectedStudentIdForAdd("");
                      setActionError("");
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Qo'shilmoqda..." : "Qo'shish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3.5: Unassign Teacher Mapping Confirmation */}
      {showUnassignTeacherModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUnassignTeacherModal(false);
              setUnassignClassTeacherId(null);
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-red-600">Biriktiruvni o'chirish</h3>
              <button
                type="button"
                onClick={() => {
                  setShowUnassignTeacherModal(false);
                  setUnassignClassTeacherId(null);
                  setActionError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Haqiqatan ham ushbu o'qituvchi va dars fani biriktiruvini sinfdan o'chirib tashlamoqchimisiz?
            </p>

            {actionError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">{actionError}</div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowUnassignTeacherModal(false);
                  setUnassignClassTeacherId(null);
                  setActionError("");
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleUnassignTeacherSubmit}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "O'chirilmoqda..." : "O'chirishni tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Unlink Parent Confirmation */}
      {showUnlinkParentModal && editingParent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUnlinkParentModal(false);
              setEditingParent(null);
              setUnlinkStudentId(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#1D1E26]">Vasiyni o'quvchidan ajratish</h3>
              <button
                type="button"
                onClick={() => {
                  setShowUnlinkParentModal(false);
                  setEditingParent(null);
                  setUnlinkStudentId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Haqiqatan ham ota-ona <span className="text-slate-900 font-bold">{editingParent.first_name} {editingParent.last_name}</span>ni ushbu o'quvchidan ajratmoqchisiz?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowUnlinkParentModal(false);
                  setEditingParent(null);
                  setUnlinkStudentId(null);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleUnlinkParentFromTab}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Ajratilmoqda..." : "Ha, ajratish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Assign Teacher to Class (with Subject & Main status) */}
      {showAssignTeacherModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAssignTeacherModal(false);
              setAssignTeacherId("");
              setAssignSubjectId("");
              setAssignIsMain(false);
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Sinfga O'qituvchi Biriktirish</h3>
                {selectedClass && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5 font-sans">
                    "{selectedClass.name}" sinfi uchun o'qituvchi va dars beradigan fanini tanlang.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAssignTeacherModal(false);
                  setAssignTeacherId("");
                  setAssignSubjectId("");
                  setAssignIsMain(false);
                  setActionError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">{actionError}</div>
            )}

            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">O'qituvchini tanlang</label>
                <select
                  required
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold cursor-pointer"
                >
                  <option value="">O'qituvchini tanlang...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Dars beradigan fanini tanlang</label>
                <select
                  required
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold cursor-pointer"
                >
                  <option value="">Fanni tanlang...</option>
                  {filteredSubjectsForClass.map((s) => (
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
                    className="w-4 h-4 rounded border-slate-300 text-[#1D1E26] focus:ring-[#D4F562] cursor-pointer"
                  />
                  <label htmlFor="assign-is-main-checkbox" className="text-xs text-slate-700 font-bold cursor-pointer select-none">
                    Sinf Rahbari (Main Teacher) etib tayinlash
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignTeacherModal(false);
                    setAssignTeacherId("");
                    setAssignSubjectId("");
                    setAssignIsMain(false);
                    setActionError("");
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditScheduleModal(false);
              setScheduleFormState({});
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-5xl max-h-[90vh] bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] flex flex-col overflow-hidden my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Haftalik dars jadvalini tahrirlash</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Har bir kun va dars soati uchun fanni tanlang. Dars yo'q soatlarni "Bo'sh" holatida qoldiring.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuickSubjectName("");
                    setQuickSubjectLevels(selectedClass?.level ? [selectedClass.level] : []);
                    setQuickSubjectError("");
                    setShowQuickAddSubjectModal(true);
                  }}
                  className="bg-lime-100 text-lime-900 hover:bg-lime-200 font-black text-xs py-2 px-3 rounded-xl transition cursor-pointer"
                >
                  + Yangi Fan Qo'shish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditScheduleModal(false);
                    setScheduleFormState({});
                    setActionError("");
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-5">
              {actionError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">{actionError}</div>
              )}

              <form onSubmit={handleSaveSchedule} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Jadval boshlanish sanasi (Start Date)</label>
                    <input
                      type="date"
                      value={scheduleStartDate}
                      onChange={(e) => setScheduleStartDate(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Jadval tugash sanasi (End Date)</label>
                    <input
                      type="date"
                      value={scheduleEndDate}
                      onChange={(e) => setScheduleEndDate(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] font-bold"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                  <table className="min-w-full divide-y divide-slate-100 text-center table-fixed">
                    <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase font-mono tracking-wider">
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
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                        <tr key={period} className="hover:bg-slate-50/50 transition">
                          <td className="px-2 py-2.5 font-mono font-bold text-slate-500 bg-slate-50/60">
                            {period}-dars
                          </td>
                          {[1, 2, 3, 4, 5, 6].map((day) => {
                            const slotKey = `${day}-${period}`;
                            const selectedVal = scheduleFormState[slotKey] || 0;
                            return (
                              <td key={day} className="px-2 py-2 border-l border-slate-100">
                                <SearchableSingleSelect
                                  value={selectedVal}
                                  options={filteredSubjectsForClass}
                                  placeholder="Bo'sh"
                                  onChange={(val) => {
                                    setScheduleFormState((prev) => ({
                                      ...prev,
                                      [slotKey]: val,
                                    }));
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditScheduleModal(false);
                      setScheduleFormState({});
                      setActionError("");
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-6 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Schedule Exception Override */}
      {showAddExceptionModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddExceptionModal(false);
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Kunlik Dars Jadvali O'zgarishi Kiritish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Tanlangan kun va dars soati uchun bir martalik o'zgarish yoki darsni bekor qilish.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddExceptionModal(false);
                  setActionError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">{actionError}</div>
            )}

            <form onSubmit={handleAddExceptionSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Kun (Sana)</label>
                <input
                  type="date"
                  required
                  value={excDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExcDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Dars soati</label>
                <select
                  value={excLesson}
                  onChange={(e) => setExcLesson(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <option key={period} value={period}>{period}-dars</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">O'zgarish turi</label>
                <div className="flex items-center space-x-4 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="excType"
                      checked={excType === "replace"}
                      onChange={() => setExcType("replace")}
                      className="text-[#1D1E26] focus:ring-[#D4F562]"
                    />
                    <span>O'zgartirish / Qo'shimcha fan</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-slate-700 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="excType"
                      checked={excType === "cancel"}
                      onChange={() => setExcType("cancel")}
                      className="text-[#1D1E26] focus:ring-[#D4F562]"
                    />
                    <span>Darsni bekor qilish (Cancel)</span>
                  </label>
                </div>
              </div>

              {excType === "replace" && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Fan</label>
                  <select
                    required={excType === "replace"}
                    value={excSubjectId}
                    onChange={(e) => setExcSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold cursor-pointer"
                  >
                    <option value="">Fanni tanlang</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExceptionModal(false);
                    setActionError("");
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-6 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheetModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">O'quvchilarni Excel Orqali Import Qilish</h3>
                {selectedClass && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Yuklangan barcha o'quvchilar avtomat ravishda "{selectedClass.name}" sinfiga biriktiriladi.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeSheetModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Template Download Option */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-indigo-900">Excel shablonini ko'chirib oling</h4>
                <p className="text-[11px] text-indigo-600 font-medium mt-0.5">O'quvchilar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={() => downloadTemplate("students")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer shadow-xs"
              >
                📥 Shablonni Yuklash
              </button>
            </div>

            {importError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">{importError}</div>
            )}

            {!importResult ? (
              <form onSubmit={(e) => handleSheetUpload(e, "students")} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:border-slate-400 transition relative">
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
                    <div className="text-3xl">📝</div>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : "O'quvchilar Excel shablonini tanlang (.xlsx)"}
                    </p>
                    <p className="text-[10px] text-slate-400">Maksimal hajm: 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !selectedFile}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              // Results View
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-extrabold text-emerald-600 block uppercase font-mono">Qabul qilindi</span>
                    <span className="text-2xl font-black">{importResult.imported_count}</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 text-red-800 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-extrabold text-red-600 block uppercase font-mono">Rad etildi</span>
                    <span className="text-2xl font-black">{importResult.failed_count}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-extrabold text-slate-400 block uppercase font-mono">Status</span>
                    <span className="text-xs font-bold block mt-1">
                      {importResult.success ? "✅ Hammasi to'g'ri" : "⚠️ Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <div className="bg-slate-100 text-slate-600 px-4 py-2 uppercase font-mono font-extrabold text-[10px]">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto bg-slate-50/50">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2 flex items-start space-x-2">
                          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">Satr {err.row}</span>
                          <span className="mt-0.5 text-slate-700 font-medium">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-6 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheetModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">O'quvchilar Ota-onalarini Excel Orqali Import Qilish</h3>
                {selectedClass && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Yuklangan ota-onalar tegishli o'quvchilarga bog'lanadi. Sinf: "{selectedClass.name}".
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeSheetModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Template Download Option */}
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-teal-900">Excel shablonini ko'chirib oling</h4>
                <p className="text-[11px] text-teal-600 font-medium mt-0.5">Ota-onalar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={() => downloadTemplate("parents")}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer shadow-xs"
              >
                📥 Shablonni Yuklash
              </button>
            </div>

            {importError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">{importError}</div>
            )}

            {!importResult ? (
              <form onSubmit={(e) => handleSheetUpload(e, "parents")} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:border-slate-400 transition relative">
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
                    <div className="text-3xl">👨‍👩‍👧‍👦</div>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : "Ota-ona Excel shablonini tanlang (.xlsx)"}
                    </p>
                    <p className="text-[10px] text-slate-400">Maksimal hajm: 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !selectedFile}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              // Results View
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-extrabold text-emerald-600 block uppercase font-mono">Qabul qilindi</span>
                    <span className="text-2xl font-black">{importResult.imported_count}</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 text-red-800 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-extrabold text-red-600 block uppercase font-mono">Rad etildi</span>
                    <span className="text-2xl font-black">{importResult.failed_count}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-extrabold text-slate-400 block uppercase font-mono">Status</span>
                    <span className="text-xs font-bold block mt-1">
                      {importResult.success ? "✅ Hammasi to'g'ri" : "⚠️ Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <div className="bg-slate-100 text-slate-600 px-4 py-2 uppercase font-mono font-extrabold text-[10px]">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto bg-slate-50/50">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2 flex items-start space-x-2">
                          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">Satr {err.row}</span>
                          <span className="mt-0.5 text-slate-700 font-medium">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-6 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                  >
                    Tugatish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Add Subject Modal (inside Schedule Modal) */}
      {showQuickAddSubjectModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowQuickAddSubjectModal(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Tezkor Fan Qo'shish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Dars jadvali uchun yangi fan yarating.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddSubjectModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {quickSubjectError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3.5 rounded-2xl font-medium">
                {quickSubjectError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!quickSubjectName.trim()) return;
                setQuickSubjectLoading(true);
                setQuickSubjectError("");

                try {
                  const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
                  const headers: Record<string, string> = {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  };
                  if (sId) headers["X-School-ID"] = sId;

                  const response = await fetch(`${API_URL}/api/schools/subjects`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                      name: quickSubjectName.trim(),
                      target_levels: quickSubjectLevels,
                    }),
                  });

                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error || "Fan saqlanmadi");

                  // Refresh subjects
                  const resList = await fetch(`${API_URL}/api/schools/subjects`, { headers });
                  const dataList = await resList.json();
                  if (resList.ok && setSubjects) {
                    setSubjects(Array.isArray(dataList) ? dataList : []);
                  }

                  setShowQuickAddSubjectModal(false);
                  setQuickSubjectName("");
                  setQuickSubjectLevels([]);
                } catch (err: any) {
                  setQuickSubjectError(err.message);
                } finally {
                  setQuickSubjectLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Fan Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Odobnoma"
                  value={quickSubjectName}
                  onChange={(e) => setQuickSubjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Tegishli Level(lar)</label>
                <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-36 overflow-y-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setQuickSubjectLevels((prev) =>
                          prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
                        );
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        quickSubjectLevels.includes(lvl)
                          ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}-sinf
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddSubjectModal(false)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={quickSubjectLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {quickSubjectLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Parent Modal ─── */}
      {showEditParentModal && editingParent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowEditParentModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-[#1D1E26]">Vasiy ma&apos;lumotlarini tahrirlash</h2>
              <button onClick={() => setShowEditParentModal(false)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleUpdateParent} className="p-6 space-y-4">
              {actionError && <p className="text-red-500 text-xs font-bold bg-red-50 px-3 py-2 rounded-xl">{actionError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Familya *</label>
                  <input
                    type="text"
                    required
                    value={editParentLastName}
                    onChange={(e) => setEditParentLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Ism *</label>
                  <input
                    type="text"
                    required
                    value={editParentFirstName}
                    onChange={(e) => setEditParentFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Sharif</label>
                <input
                  type="text"
                  value={editParentMiddleName}
                  onChange={(e) => setEditParentMiddleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Telefon *</label>
                <input
                  type="text"
                  required
                  value={editParentPhone}
                  onChange={(e) => setEditParentPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Pasport</label>
                <input
                  type="text"
                  value={editParentPassport}
                  onChange={(e) => setEditParentPassport(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditParentModal(false)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer">Bekor qilish</button>
                <button type="submit" disabled={actionLoading} className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50">
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Class Teacher Modal ─── */}
      {showEditClassTeacherModal && editingClassTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowEditClassTeacherModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-[#1D1E26]">Biriktiruvni tahrirlash</h2>
              <button onClick={() => setShowEditClassTeacherModal(false)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleUpdateClassTeacher} className="p-6 space-y-4">
              {actionError && <p className="text-red-500 text-xs font-bold bg-red-50 px-3 py-2 rounded-xl">{actionError}</p>}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Fan</label>
                <SearchableSingleSelect
                  value={editCTSubjectId}
                  options={subjects.map((s) => ({ id: s.id, name: s.name }))}
                  placeholder="Fan tanlang"
                  onChange={(val) => setEditCTSubjectId(val)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">O&apos;qituvchi</label>
                <SearchableSingleSelect
                  value={editCTTeacherId}
                  options={teachers.map((t) => ({ id: t.id, name: `${t.last_name} ${t.first_name}` }))}
                  placeholder="O'qituvchi tanlang"
                  onChange={(val) => setEditCTTeacherId(val)}
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="editCTIsMain"
                  checked={editCTIsMain}
                  onChange={(e) => setEditCTIsMain(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1D1E26] cursor-pointer"
                />
                <label htmlFor="editCTIsMain" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Sinf rahbari sifatida belgilash
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditClassTeacherModal(false)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer">Bekor qilish</button>
                <button type="submit" disabled={actionLoading} className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50">
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Class Teacher History Modal ─── */}
      {showClassTeacherHistoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowClassTeacherHistoryModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-black text-[#1D1E26]">O&apos;qituvchi biriktiruvi tarixi</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedClass?.name} · barcha faol va oldingi biriktirishlar</p>
              </div>
              <button onClick={() => setShowClassTeacherHistoryModal(false)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer text-xl leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {classTeacherHistoryLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : classTeacherHistory.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-400 text-sm font-medium">Tarix topilmadi.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {classTeacherHistory.map((item) => {
                    const startDate = new Date(item.created_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });
                    const endDate = item.deleted_at
                      ? new Date(item.deleted_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" })
                      : null;
                    const isActive = !item.is_deleted;
                    return (
                      <div key={item.id} className="px-6 py-4 flex items-start gap-4">
                        <div className="mt-1 shrink-0">
                          {isActive ? (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-green-100"></span>
                          ) : (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-red-100"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-[#1D1E26]">
                              {item.last_name} {item.first_name} {item.middle_name}
                            </span>
                            <span className="bg-[#E0F2FE] text-[#0284C7] font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                              {item.subject_name}
                            </span>
                            {item.is_main_teacher && (
                              <span className="bg-[#ECFCCA] text-[#65A30D] font-extrabold text-[11px] px-2 py-0.5 rounded-lg">
                                Sinf Rahbari
                              </span>
                            )}
                            {isActive ? (
                              <span className="text-green-600 font-bold text-[11px] bg-green-50 px-2 py-0.5 rounded-lg">● Faol</span>
                            ) : (
                              <span className="text-red-500 font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded-lg">● Almashtirilgan</span>
                            )}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400 font-mono">
                            {endDate ? (
                              <span>{startDate} → {endDate}</span>
                            ) : (
                              <span>{startDate} → hozirgi kunga qadar</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button
                onClick={() => setShowClassTeacherHistoryModal(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
