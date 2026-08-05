import React, { useState, useRef, useEffect } from "react";
import { History, Pencil, Trash2 } from "lucide-react";
import DateRangePresets from "../DateRangePresets";
import TargetPresets from "../TargetPresets";
import { ImportResult } from "./types";

interface SearchableMultiSelectOption {
  id: number | string;
  label: string;
  sublabel?: string;
}

interface SearchableMultiSelectProps {
  title: string;
  placeholder?: string;
  options: SearchableMultiSelectOption[];
  selectedIds: (number | string)[];
  onChange: (newSelectedIds: any[]) => void;
  hintText?: string;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  title,
  placeholder = "Qidirish...",
  options,
  selectedIds,
  onChange,
  hintText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleOption = (id: number | string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((opt) => opt.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase font-mono">
          {title} {selectedIds.length > 0 && <span className="text-[#65A30D]">({selectedIds.length} ta tanlandi)</span>}
        </label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Control Box / Selected Badges Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] bg-slate-50 border rounded-2xl p-2 flex flex-wrap items-center gap-1.5 cursor-pointer transition ${
          isOpen ? "border-[#D4F562] ring-2 ring-[#D4F562]/30 bg-white" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {selectedOptions.length === 0 ? (
          <div className="flex items-center justify-between w-full px-2 text-xs text-slate-400 font-medium">
            <span>{placeholder}</span>
            <span className="text-slate-400 text-[10px]">▼</span>
          </div>
        ) : (
          <>
            {selectedOptions.map((opt) => (
              <span
                key={opt.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#D4F562] text-[#1D1E26] font-bold rounded-xl text-xs shadow-2xs"
              >
                <span>{opt.label} {opt.sublabel || ""}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(opt.id);
                  }}
                  className="w-3.5 h-3.5 rounded-full bg-[#1D1E26]/10 hover:bg-[#1D1E26]/20 flex items-center justify-center text-[9px] font-extrabold"
                >
                  ✕
                </button>
              </span>
            ))}
            <div className="ml-auto pr-1 text-slate-400 text-[10px]">▼</div>
          </>
        )}
      </div>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 max-h-64 flex flex-col">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#D4F562]"
              autoFocus
            />
          </div>

          {/* Quick Select Actions */}
          <div className="flex items-center justify-between text-[11px] font-bold px-1 text-slate-500 border-b border-slate-100 pb-1.5">
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:text-[#1D1E26] cursor-pointer"
            >
              ✓ Barchasini tanlash ({options.length})
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="hover:text-red-600 cursor-pointer"
            >
              ✕ Bekor qilish
            </button>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredOptions.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-3 italic">Mos keluvchi ma'lumot topilmadi</p>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selectedIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      isChecked ? "bg-emerald-50 text-emerald-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                          isChecked ? "bg-[#D4F562] border-[#65A30D] text-[#1D1E26] font-black" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && "✓"}
                      </div>
                      <span>{opt.label}</span>
                      {opt.sublabel && <span className="text-slate-400 text-[11px] font-normal">{opt.sublabel}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {hintText && <p className="text-[9px] text-slate-400 font-mono mt-1">{hintText}</p>}
    </div>
  );
};

interface BalanceSectionProps {
  token: string;
  API_URL: string;
  classes?: any[];
  studentsBalanceList: any[];
  setStudentsBalanceList: React.Dispatch<React.SetStateAction<any[]>>;
  chargePlans: any[];
  setChargePlans: React.Dispatch<React.SetStateAction<any[]>>;
  globalTransactionsList: any[];
  setGlobalTransactionsList: React.Dispatch<React.SetStateAction<any[]>>;
  studentsBalanceLoading: boolean;
  setStudentsBalanceLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chargePlansLoading: boolean;
  setChargePlansLoading: React.Dispatch<React.SetStateAction<boolean>>;
  globalTransactionsLoading: boolean;
  setGlobalTransactionsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function BalanceSection({
  token,
  API_URL,
  classes = [],
  studentsBalanceList,
  setStudentsBalanceList,
  chargePlans,
  setChargePlans,
  globalTransactionsList,
  setGlobalTransactionsList,
  studentsBalanceLoading,
  setStudentsBalanceLoading,
  chargePlansLoading,
  setChargePlansLoading,
  globalTransactionsLoading,
  setGlobalTransactionsLoading,
}: BalanceSectionProps) {
  const [balanceActiveSubTab, setBalanceActiveSubTab] = useState<"balances" | "plans" | "transactions">("balances");

  // Modals visibility & Form states
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentTransactionType, setPaymentTransactionType] = useState<"PAYMENT" | "CHARGE">("PAYMENT");
  const [paymentStudentId, setPaymentStudentId] = useState<number | "">("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBonusAmount, setPaymentBonusAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");

  const [showImportPaymentsModal, setShowImportPaymentsModal] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentImportLoading, setPaymentImportLoading] = useState(false);
  const [paymentImportError, setPaymentImportError] = useState("");
  const [paymentImportResult, setPaymentImportResult] = useState<ImportResult | null>(null);

  const [showAddChargePlanModal, setShowAddChargePlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [showEditChargePlanModal, setShowEditChargePlanModal] = useState(false);
  const [showChargePlanHistoryModal, setShowChargePlanHistoryModal] = useState(false);
  const [chargePlanHistoryList, setChargePlanHistoryList] = useState<any[]>([]);
  const [chargePlanHistoryLoading, setChargePlanHistoryLoading] = useState(false);
  const [selectedHistorySnapshot, setSelectedHistorySnapshot] = useState<any | null>(null);
  const [showRevertButtonRecordId, setShowRevertButtonRecordId] = useState<number | null>(null);

  const [planName, setPlanName] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planStartDate, setPlanStartDate] = useState("2026-09-01");
  const [planEndDate, setPlanEndDate] = useState("2027-05-31");
  const [planChargeDay, setPlanChargeDay] = useState(1);

  // Pagination states
  const [balancesPage, setBalancesPage] = useState(1);
  const [balancesPerPage, setBalancesPerPage] = useState<number>(10);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState<number>(10);

  // Interactive selection state for charge plans
  const [planSelectedLevels, setPlanSelectedLevels] = useState<number[]>([]);
  const [planSelectedClasses, setPlanSelectedClasses] = useState<number[]>([]);
  const [planSelectedStudents, setPlanSelectedStudents] = useState<number[]>([]);

  const [actionLoading, setActionLoading] = useState(false);

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  const fetchStudentsBalanceData = async () => {
    setStudentsBalanceLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/users?role=STUDENT`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok) setStudentsBalanceList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setStudentsBalanceLoading(false);
    }
  };

  const fetchChargePlansData = async () => {
    setChargePlansLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok) setChargePlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setChargePlansLoading(false);
    }
  };

  const fetchGlobalTransactionsData = async () => {
    setGlobalTransactionsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/balance/transactions`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok) setGlobalTransactionsList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setGlobalTransactionsLoading(false);
    }
  };

  const handleAddPaymentQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    const paidVal = parseFloat(paymentAmount) || 0;
    const bonusVal = parseFloat(paymentBonusAmount) || 0;
    const totalVal = paidVal + bonusVal;

    if (!paymentStudentId) {
      alert("Iltimos, o'quvchini tanlang");
      return;
    }

    if (paymentTransactionType === "PAYMENT" && totalVal <= 0) {
      alert("To'lov summasi yoki bonus summa musbat bo'lishi kerak");
      return;
    }

    if (paymentTransactionType === "CHARGE" && (!paymentAmount || parseFloat(paymentAmount) <= 0)) {
      alert("Ayirish summasi majburiy va musbat bo'lishi kerak");
      return;
    }

    setActionLoading(true);
    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const defaultDesc = paymentTransactionType === "PAYMENT" ? "Kassa/Bank orqali to'lov" : "Qo'lda kiritilgan yechim (To'lov ayirish)";

      const response = await fetch(`${API_URL}/api/schools/students/${paymentStudentId}/balance/transaction`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: paymentTransactionType === "PAYMENT" ? totalVal : parseFloat(paymentAmount),
          paid_amount: paymentTransactionType === "PAYMENT" ? paidVal : 0,
          bonus_amount: paymentTransactionType === "PAYMENT" ? bonusVal : 0,
          type: paymentTransactionType,
          description: paymentDescription.trim() || defaultDesc,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tranzaksiya bajarilmadi");

      alert(paymentTransactionType === "PAYMENT" ? "To'lov va bonus muvaffaqiyatli qabul qilindi!" : "To'lov (yechim) muvaffaqiyatli bajarildi!");
      setShowAddPaymentModal(false);
      setPaymentAmount("");
      setPaymentBonusAmount("");
      setPaymentDescription("");
      setPaymentStudentId("");

      fetchStudentsBalanceData();
      fetchGlobalTransactionsData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportPaymentsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFile) return;
    setPaymentImportLoading(true);
    setPaymentImportError("");
    setPaymentImportResult(null);

    const formData = new FormData();
    formData.append("file", paymentFile);

    try {
      const response = await fetch(`${API_URL}/api/schools/import/payments`, {
        method: "POST",
        headers: safeFetchHeaders(),
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentImportResult(data);
        fetchStudentsBalanceData();
        fetchGlobalTransactionsData();
      } else {
        setPaymentImportError(data.error || "Fayl yuklashda xatolik yuz berdi");
      }
    } catch (err: any) {
      setPaymentImportError(err.message || "Fayl yuklashda xatolik");
    } finally {
      setPaymentImportLoading(false);
    }
  };

  const handleCreateChargePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planAmount) {
      alert("Nomi va summa majburiy");
      return;
    }
    setActionLoading(true);

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: planName.trim(),
          amount: parseFloat(planAmount),
          start_date: planStartDate,
          end_date: planEndDate,
          charge_day: parseInt(planChargeDay.toString()),
          levels: planSelectedLevels,
          classes: planSelectedClasses,
          students: planSelectedStudents,
          target_levels: planSelectedLevels,
          target_classes: planSelectedClasses,
          target_students: planSelectedStudents,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "To'lov rejasini saqlab bo'lmadi");

      alert("Yangi to'lov rejasi yaratildi!");
      setShowAddChargePlanModal(false);
      setPlanName("");
      setPlanAmount("");
      setPlanSelectedLevels([]);
      setPlanSelectedClasses([]);
      setPlanSelectedStudents([]);
      fetchChargePlansData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditPlanModal = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanAmount(plan.amount);
    setPlanStartDate(plan.start_date ? new Date(plan.start_date).toISOString().split("T")[0] : "2026-09-01");
    setPlanEndDate(plan.end_date ? new Date(plan.end_date).toISOString().split("T")[0] : "2027-05-31");
    setPlanChargeDay(plan.charge_day || 1);
    setPlanSelectedLevels(plan.levels || plan.target_levels || []);
    setPlanSelectedClasses(plan.classes || plan.target_classes || []);
    setPlanSelectedStudents(plan.students || plan.target_students || []);
    setShowEditChargePlanModal(true);
  };

  const handleUpdateChargePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlanId) return;

    const todayStr = new Date().toISOString().split("T")[0];
    if (planEndDate < todayStr) {
      alert("Tugash sanasi bugungi sanadan oldin bo'lishi mumkin emas!");
      return;
    }

    setActionLoading(true);
    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans/${editingPlanId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: planName,
          amount: parseFloat(planAmount),
          start_date: planStartDate,
          end_date: planEndDate,
          charge_day: Number(planChargeDay),
          levels: planSelectedLevels,
          classes: planSelectedClasses,
          students: planSelectedStudents,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Yangilab bo'lmadi");

      alert("To'lov rejasi muvaffaqiyatli tahrirlandi!");
      setShowEditChargePlanModal(false);
      setEditingPlanId(null);
      fetchChargePlansData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenHistoryModal = async (plan: any) => {
    setEditingPlanId(plan.id);
    setShowChargePlanHistoryModal(true);
    setChargePlanHistoryLoading(true);
    setSelectedHistorySnapshot(null);
    setShowRevertButtonRecordId(null);

    try {
      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans/${plan.id}/history`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tarixni yuklab bo'lmadi");
      setChargePlanHistoryList(data || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setChargePlanHistoryLoading(false);
    }
  };

  const handleRevertToOldState = async (planId: number, oldState: any) => {
    if (!oldState || !planId) return;
    if (!confirm("Haqiqatdan ham to'lov rejasini ushbu eski holatiga qaytarmoqchimisiz?")) return;

    setActionLoading(true);
    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans/${planId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: oldState.name,
          amount: oldState.amount,
          start_date: oldState.start_date,
          end_date: oldState.end_date,
          charge_day: oldState.charge_day,
          levels: oldState.levels || [],
          classes: oldState.classes || [],
          students: oldState.students || [],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Eski holatga qaytarib bo'lmadi");

      alert("To'lov rejasi muvaffaqiyatli eski holatiga qaytarildi!");
      setShowRevertButtonRecordId(null);
      setShowChargePlanHistoryModal(false);
      fetchChargePlansData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChargePlan = async (id: number) => {
    if (!confirm("Ushbu to'lov rejasini o'chirmoqchimisiz?")) return;
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans/${id}`, {
        method: "DELETE",
        headers: safeFetchHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "O'chirib bo'lmadi");
      }

      alert("To'lov rejasi o'chirildi!");
      fetchChargePlansData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunChargesManually = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans/run`, {
        method: "POST",
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "To'lovlarni hisoblashda xatolik");

      alert(`To'lov rejasi bo'yicha yechimlar muvaffaqiyatli bajarildi! Jami yechilgan to'lovlar soni: ${data.processed_charge_count}`);
      fetchStudentsBalanceData();
      fetchGlobalTransactionsData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#1D1E26] select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight">Balans va To'lovlar boshqaruvi</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            O'quvchilar balansini ko'rish, to'lovlar qabul qilish va avtomat to'lov rejalarini sozlash.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunChargesManually}
            disabled={actionLoading}
            className="bg-[#FFEADB] text-[#FF7A00] hover:bg-[#FFD2B8] font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            To'lovlarni hisoblash
          </button>
          <button
            onClick={() => setShowImportPaymentsModal(true)}
            className="bg-[#1D1E26] text-white hover:bg-slate-800 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
          >
            Excel orqali to'lovlar
          </button>
          <button
            onClick={() => {
              setPaymentStudentId("");
              setPaymentAmount("");
              setPaymentDescription("");
              setShowAddPaymentModal(true);
            }}
            className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
          >
            + Yangi To'lov
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/60 text-xs font-extrabold">
        <button
          onClick={() => setBalanceActiveSubTab("balances")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            balanceActiveSubTab === "balances"
              ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          O'quvchilar Balansi ({studentsBalanceList.length})
        </button>
        <button
          onClick={() => setBalanceActiveSubTab("plans")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            balanceActiveSubTab === "plans"
              ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          To'lov Rejalari ({chargePlans.length})
        </button>
        <button
          onClick={() => setBalanceActiveSubTab("transactions")}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            balanceActiveSubTab === "transactions"
              ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Barcha Tranzaksiyalar ({globalTransactionsList.length})
        </button>
      </div>

      {/* Sub-tab 1: O'quvchilar Balansi */}
      {balanceActiveSubTab === "balances" && (() => {
        const totalPages = Math.ceil(studentsBalanceList.length / balancesPerPage) || 1;
        const currentPaginatedStudents = studentsBalanceList.slice((balancesPage - 1) * balancesPerPage, balancesPage * balancesPerPage);

        return (
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-4">
            {studentsBalanceLoading ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : studentsBalanceList.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-slate-400 text-xs font-medium">O'quvchilar topilmadi.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                      <tr>
                        <th className="px-6 py-4">O'quvchi F.I.SH</th>
                        <th className="px-6 py-4">Sinf va Lvl</th>
                        <th className="px-6 py-4">Balans</th>
                        <th className="px-6 py-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                      {currentPaginatedStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-4 font-bold text-[#1D1E26]">
                            {st.first_name} {st.last_name} {st.middle_name && <span className="text-slate-400 font-normal">({st.middle_name})</span>}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-500">
                            {st.class_name ? `${st.class_name} (Level ${st.class_level ?? '-'})` : "-"}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">
                            <span className={`px-2.5 py-1 rounded-lg text-xs ${
                              st.balance < 0
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-[#ECFCCA] text-[#65A30D]"
                            }`}>
                              {parseFloat(st.balance || 0).toLocaleString()} UZS
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setPaymentTransactionType("PAYMENT");
                                setPaymentStudentId(st.student_id || st.id);
                                setPaymentAmount("");
                                setPaymentDescription("");
                                setShowAddPaymentModal(true);
                              }}
                              className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-1.5 px-3 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                            >
                              To'lov qo'shish
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Balances Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Jami <b>{studentsBalanceList.length}</b> ta o'quvchidan <b>{((balancesPage - 1) * balancesPerPage) + 1}</b> - <b>{Math.min(balancesPage * balancesPerPage, studentsBalanceList.length)}</b> arasi ko'rsatilyapti
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Har sahifada:</span>
                      <select
                        value={balancesPerPage}
                        onChange={(e) => {
                          setBalancesPerPage(Number(e.target.value));
                          setBalancesPage(1);
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
                      disabled={balancesPage === 1}
                      onClick={() => setBalancesPage(prev => Math.max(prev - 1, 1))}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold cursor-pointer transition text-xs"
                    >
                      &larr; Oldingi
                    </button>
                    <span className="font-mono font-bold text-[#1D1E26] px-2 text-xs">
                      {balancesPage} / {totalPages}
                    </span>
                    <button
                      disabled={balancesPage === totalPages}
                      onClick={() => setBalancesPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold cursor-pointer transition text-xs"
                    >
                      Keyingi &rarr;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Sub-tab 2: To'lov Rejalari */}
      {balanceActiveSubTab === "plans" && (
        <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#1D1E26]">To'lov Rejalari (Oylik to'lovlar)</h2>
            <button
              onClick={() => setShowAddChargePlanModal(true)}
              className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              + Yangi Reja Qo'shish
            </button>
          </div>

          {chargePlansLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : chargePlans.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-slate-400 text-xs font-medium">To'lov rejalari topilmadi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chargePlans.map((plan) => (
                <div key={plan.id} className="bg-slate-50/80 border border-slate-100 rounded-3xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-[#1D1E26] text-sm">{plan.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenHistoryModal(plan)}
                        title="Tarix"
                        className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center justify-center shadow-2xs"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditPlanModal(plan)}
                        title="Tahrirlash"
                        className="p-2 bg-[#D4F562] hover:opacity-90 text-[#1D1E26] rounded-xl transition cursor-pointer flex items-center justify-center shadow-2xs"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteChargePlan(plan.id)}
                        title="O'chirish"
                        className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition cursor-pointer flex items-center justify-center shadow-2xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Summa: <strong className="text-[#1D1E26] font-mono">{parseFloat(plan.amount).toLocaleString()} UZS</strong> / oy
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Har oyning {plan.charge_day}-kuni yechiladi ({new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()})
                  </p>

                  <div className="text-[10px] font-mono text-slate-400 border-t border-slate-200/60 pt-2 flex flex-wrap gap-2">
                    {plan.target_levels?.length > 0 && (
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">Levellar: {plan.target_levels.join(", ")}</span>
                    )}
                    {plan.target_classes?.length > 0 && (
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">Sinflar: {plan.target_classes.join(", ")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 3: Barcha Tranzaksiyalar */}
      {balanceActiveSubTab === "transactions" && (() => {
        const totalPages = Math.ceil(globalTransactionsList.length / transactionsPerPage) || 1;
        const currentPaginatedTransactions = globalTransactionsList.slice((transactionsPage - 1) * transactionsPerPage, transactionsPage * transactionsPerPage);

        const getItemAmounts = (t: any) => {
          const totalAmt = parseFloat(t.amount) || 0;
          const bonusAmt = parseFloat(t.bonus_amount) || 0;
          let paidAmt = 0;
          if (t.type === "PAYMENT") {
            if (bonusAmt > 0) {
              paidAmt = totalAmt - bonusAmt;
            } else if (parseFloat(t.paid_amount) > 0) {
              paidAmt = parseFloat(t.paid_amount);
            } else {
              paidAmt = totalAmt;
            }
          }
          return { totalAmt, bonusAmt, paidAmt };
        };

        const totalPaidKirim = globalTransactionsList
          .filter((t) => t.type === "PAYMENT")
          .reduce((sum, t) => sum + getItemAmounts(t).paidAmt, 0);

        const totalBonusKirim = globalTransactionsList
          .filter((t) => t.type === "PAYMENT")
          .reduce((sum, t) => sum + getItemAmounts(t).bonusAmt, 0);

        return (
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-[#1D1E26]">Tranzaksiyalar Tarixi & Hisoboti</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Kirim va yechimlarning to'liq auditi.</p>
              </div>

              {/* Financial KPI Summary Cards */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase font-mono block">Real Kassa Kirimi</span>
                  <span className="text-sm font-black text-[#1D1E26] font-mono">{totalPaidKirim.toLocaleString()} UZS</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase font-mono block">Berilgan Bonuslar</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">+{totalBonusKirim.toLocaleString()} UZS</span>
                </div>
              </div>
            </div>

            {globalTransactionsLoading ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : globalTransactionsList.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-slate-400 text-xs font-medium">Tranzaksiyalar topilmadi.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                      <tr>
                        <th className="px-6 py-4">Sana</th>
                        <th className="px-6 py-4">O'quvchi F.I.SH</th>
                        <th className="px-6 py-4">Turi</th>
                        <th className="px-6 py-4">To'lov (Kassa)</th>
                        <th className="px-6 py-4">Bonus</th>
                        <th className="px-6 py-4">Jami Balansga</th>
                        <th className="px-6 py-4">Izoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                      {currentPaginatedTransactions.map((tx) => {
                        const { totalAmt, bonusAmt, paidAmt } = getItemAmounts(tx);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-6 py-4 font-mono text-slate-400">{new Date(tx.created_at).toLocaleString()}</td>
                            <td className="px-6 py-4 font-bold text-[#1D1E26]">{tx.student_name || `ID: ${tx.student_id}`}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono ${
                                tx.type === "PAYMENT" ? "bg-[#ECFCCA] text-[#65A30D]" : "bg-red-50 text-red-600"
                              }`}>
                                {tx.type === "PAYMENT" ? "To'lov (+)" : "Yechim (-)"}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-800">
                              {tx.type === "PAYMENT" ? `${paidAmt.toLocaleString()} UZS` : "-"}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold">
                              {bonusAmt > 0 ? (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">+{bonusAmt.toLocaleString()} UZS</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono font-black text-[#1D1E26]">
                              {totalAmt.toLocaleString()} UZS
                            </td>
                            <td className="px-6 py-4 text-slate-500">{tx.description || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Transactions Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Jami <b>{globalTransactionsList.length}</b> ta tranzaksiyadan <b>{((transactionsPage - 1) * transactionsPerPage) + 1}</b> - <b>{Math.min(transactionsPage * transactionsPerPage, globalTransactionsList.length)}</b> arasi ko'rsatilyapti
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Har sahifada:</span>
                      <select
                        value={transactionsPerPage}
                        onChange={(e) => {
                          setTransactionsPerPage(Number(e.target.value));
                          setTransactionsPage(1);
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
                      disabled={transactionsPage === 1}
                      onClick={() => setTransactionsPage(prev => Math.max(prev - 1, 1))}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold cursor-pointer transition text-xs"
                    >
                      &larr; Oldingi
                    </button>
                    <span className="font-mono font-bold text-[#1D1E26] px-2 text-xs">
                      {transactionsPage} / {totalPages}
                    </span>
                    <button
                      disabled={transactionsPage === totalPages}
                      onClick={() => setTransactionsPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold cursor-pointer transition text-xs"
                    >
                      Keyingi &rarr;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Modal: Add Payment / Charge */}
      {showAddPaymentModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddPaymentModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">
                  {paymentTransactionType === "PAYMENT" ? "➕ To'lov Qo'shish (Kirim)" : "➖ To'lov Ayirish (Chiqim)"}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {paymentTransactionType === "PAYMENT" ? "O'quvchi balansiga pul to'ldirish." : "O'quvchi balansidan mablag' ayirish (yechish)."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Kirim / Chiqim Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-black">
              <button
                type="button"
                onClick={() => setPaymentTransactionType("PAYMENT")}
                className={`py-2 rounded-xl transition ${
                  paymentTransactionType === "PAYMENT"
                    ? "bg-[#D4F562] text-[#1D1E26] shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                ➕ Kirim (To'lov)
              </button>
              <button
                type="button"
                onClick={() => setPaymentTransactionType("CHARGE")}
                className={`py-2 rounded-xl transition ${
                  paymentTransactionType === "CHARGE"
                    ? "bg-red-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                ➖ Chiqim (Ayirish)
              </button>
            </div>

            <form onSubmit={handleAddPaymentQuick} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">O'quvchini tanlang</label>
                <select
                  required
                  value={paymentStudentId}
                  onChange={(e) => setPaymentStudentId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition cursor-pointer font-bold"
                >
                  <option value="">-- O'quvchini tanlang --</option>
                  {studentsBalanceList.map((st) => (
                    <option key={st.id} value={st.student_id || st.id}>
                      {st.first_name} {st.last_name} ({st.class_name || "Sinfsiz"})
                    </option>
                  ))}
                </select>
              </div>

              {paymentTransactionType === "PAYMENT" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">To'lov Summasi (UZS)</label>
                      <input
                        type="number"
                        placeholder="Masalan: 500000"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">Ota-ona to'lagan summa</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Bonus Summa (UZS)</label>
                      <input
                        type="number"
                        placeholder="Masalan: 50000"
                        value={paymentBonusAmount}
                        onChange={(e) => setPaymentBonusAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold text-emerald-600"
                      />
                      <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Tashkilot bonusi</span>
                    </div>
                  </div>

                  {((parseFloat(paymentAmount) || 0) > 0 || (parseFloat(paymentBonusAmount) || 0) > 0) && (
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-100 rounded-2xl space-y-1.5 text-xs font-semibold text-emerald-900">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Ota-ona to'lovi (Direktor Kirimi):</span>
                        <span className="font-mono font-bold text-slate-800">{(parseFloat(paymentAmount) || 0).toLocaleString()} UZS</span>
                      </div>
                      {(parseFloat(paymentBonusAmount) || 0) > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Bonus (Balansga qo'shiladi):</span>
                          <span className="font-mono font-bold text-emerald-600">+{(parseFloat(paymentBonusAmount) || 0).toLocaleString()} UZS</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/60 font-black text-xs">
                        <span>O'quvchi balansiga o'tadigan jami:</span>
                        <span className="font-mono text-emerald-700 text-sm">{((parseFloat(paymentAmount) || 0) + (parseFloat(paymentBonusAmount) || 0)).toLocaleString()} UZS</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Summa (UZS)</label>
                  <input
                    type="number"
                    required
                    placeholder="Masalan: 500000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold text-red-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Izoh (Kassa / Sabab)</label>
                <input
                  type="text"
                  placeholder={paymentTransactionType === "PAYMENT" ? "Kassa orqali naqd to'lov" : "Qo'lda kiritilgan yechim"}
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer ${
                    paymentTransactionType === "PAYMENT"
                      ? "bg-[#D4F562] text-[#1D1E26] hover:opacity-90"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {actionLoading ? "Bajarilmoqda..." : paymentTransactionType === "PAYMENT" ? "To'lovni qabul qilish" : "To'lovni ayirish (yechish)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Charge Plan */}
      {showAddChargePlanModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddChargePlanModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-xl max-h-[90vh] bg-white border border-slate-100 rounded-3xl shadow-2xl text-[#1D1E26] flex flex-col overflow-hidden">
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Yangi To'lov Rejasi Yaratish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Oylik to'lov summasi va yechilish qoidasini belgilang.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddChargePlanModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleCreateChargePlan} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Reja Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Oylik ta'lim to'lovi"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Oylik Summa (UZS)</label>
                <input
                  type="number"
                  required
                  placeholder="Masalan: 1200000"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                />
              </div>

              <DateRangePresets
                startDate={planStartDate}
                endDate={planEndDate}
                onStartDateChange={setPlanStartDate}
                onEndDateChange={setPlanEndDate}
                token={token}
                apiUrl={API_URL}
                category="charge_plan"
                theme="slate"
                startLabel="Boshlanish Sanasi"
                endLabel="Tugash Sanasi"
              />

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Har Oyning Qaysi Kuni (1-31)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={planChargeDay}
                  onChange={(e) => setPlanChargeDay(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono"
                />
              </div>

              {/* O'quvchilar To'plamlari (Target Presets) Selection */}
              <TargetPresets
                selectedLevels={planSelectedLevels}
                selectedClasses={planSelectedClasses}
                selectedStudents={planSelectedStudents}
                onLevelsChange={setPlanSelectedLevels}
                onClassesChange={setPlanSelectedClasses}
                onStudentsChange={setPlanSelectedStudents}
                token={token}
                apiUrl={API_URL}
                label="O'quvchilar To'plami (Mavjud shablonlar)"
                theme="slate"
              />

              {/* Sinf Levellari Selection */}
              <SearchableMultiSelect
                title="Sinf Levellari (Darajalar)"
                placeholder="Levellarni tanlang (Masalan: 1-sinf, 5-sinf)..."
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => ({
                  id: lvl,
                  label: `${lvl}-sinf`,
                }))}
                selectedIds={planSelectedLevels}
                onChange={setPlanSelectedLevels}
                hintText="* Hech narsa tanlanmasa, barcha levellar uchun amal qiladi."
              />

              {/* Sinf Nomlari Selection */}
              <SearchableMultiSelect
                title="Sinf Nomlari"
                placeholder="Sinflarni tanlang (Masalan: 10-A, 11-B)..."
                options={classes.map((cls) => ({
                  id: cls.id,
                  label: cls.name,
                }))}
                selectedIds={planSelectedClasses}
                onChange={setPlanSelectedClasses}
                hintText="* Hech narsa tanlanmasa, barcha sinflar uchun amal qiladi."
              />

              {/* Alohida O'quvchilar Selection */}
              <SearchableMultiSelect
                title="Alohida O'quvchilar"
                placeholder="O'quvchilarni ismi yoki sinfi bo'yicha qidirib tanlang..."
                options={studentsBalanceList.map((st) => ({
                  id: st.student_id || st.id,
                  label: `${st.first_name} ${st.last_name}`,
                  sublabel: st.class_name ? `(${st.class_name})` : "",
                }))}
                selectedIds={planSelectedStudents}
                onChange={setPlanSelectedStudents}
                hintText="* Hech narsa tanlanmasa, barcha o'quvchilar uchun amal qiladi."
              />

              {/* Action Buttons inside scrollable form or sticky bottom */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddChargePlanModal(false)}
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

      {/* Modal: Import Payments via Excel */}
      {showImportPaymentsModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImportPaymentsModal(false);
              setPaymentImportError("");
              setPaymentImportResult(null);
              setPaymentFile(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Excel orqali to'lovlar importi</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Toplu to'lovlarni Excel fayl (.xlsx) orqali kassa balansiga yuklash.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportPaymentsModal(false);
                  setPaymentImportError("");
                  setPaymentImportResult(null);
                  setPaymentFile(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Template Download Link */}
            <div className="bg-[#ECFCCA]/60 border border-lime-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#65A30D]">Excel Namuna Shablon</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Ustunlar: O'quvchi ID, Telefon, Summa, Izoh
                </p>
              </div>
              <a
                href={`${API_URL}/api/schools/balance/import-template/payments`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-black bg-[#D4F562] hover:bg-[#bce438] text-[#1D1E26] px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
              >
                <span>📥 Shablonni Yuklab Olish</span>
              </a>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleImportPaymentsSubmit} className="space-y-4">
              {paymentImportError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                  {paymentImportError}
                </div>
              )}

              {paymentImportResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-extrabold">
                    <span className="text-[#65A30D]">
                      ✓ Muvaffaqiyatli: {paymentImportResult.imported_count} ta
                    </span>
                    {paymentImportResult.failed_count > 0 && (
                      <span className="text-red-600">
                        ✕ Xatolik: {paymentImportResult.failed_count} ta
                      </span>
                    )}
                  </div>
                  {paymentImportResult.errors && paymentImportResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 pt-2 border-t border-slate-200 text-[10px]">
                      {paymentImportResult.errors.map((err, idx) => (
                        <p key={idx} className="text-red-600 font-mono">
                          Qator #{err.row}: {err.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">
                  Excel faylni tanlang (.xlsx, .xls)
                </label>
                <input
                  type="file"
                  required
                  accept=".xlsx, .xls"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition cursor-pointer font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportPaymentsModal(false);
                    setPaymentImportError("");
                    setPaymentImportResult(null);
                    setPaymentFile(null);
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={paymentImportLoading || !paymentFile}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {paymentImportLoading ? "Yuklanmoqda..." : "Faylni Yuklash va Kirim Qilish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Charge Plan */}
      {showEditChargePlanModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditChargePlanModal(false);
              setEditingPlanId(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg max-h-[90vh] bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">To'lov Rejasini Tahrirlash</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Reja parametrlari, amal qilish muddati va sinf/o'quvchilarni tahrirlash.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditChargePlanModal(false);
                  setEditingPlanId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateChargePlan} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Reja Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Yillik Ta'lim Kontrakti 2026-2027"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5 flex items-center justify-between">
                  <span>Oylik To'lov Summasi (UZS)</span>
                  <span className="text-[9px] text-amber-600 lowercase font-sans">🔒 (o'zgartirib bo'lmaydi)</span>
                </label>
                <input
                  type="number"
                  disabled
                  readOnly
                  placeholder="1200000"
                  value={planAmount}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs outline-none cursor-not-allowed font-mono font-bold select-none opacity-75"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5 flex items-center justify-between">
                    <span>Boshlanish Sanasi</span>
                    <span className="text-[9px] text-amber-600 lowercase font-sans">🔒</span>
                  </label>
                  <input
                    type="date"
                    disabled
                    readOnly
                    value={planStartDate}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs outline-none cursor-not-allowed font-mono select-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Tugash Sanasi (Min: Bugun)</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Har Oyning Qaysi Kuni (1-31)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={planChargeDay}
                  onChange={(e) => setPlanChargeDay(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono"
                />
              </div>

              {/* Searchable Multi-Select Components */}
              <SearchableMultiSelect
                title="Sinf Levellari (Darajalar)"
                placeholder="Levellarni tanlang..."
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => ({
                  id: lvl,
                  label: `${lvl}-sinf`,
                }))}
                selectedIds={planSelectedLevels}
                onChange={setPlanSelectedLevels}
                hintText="* Hech narsa tanlanmasa, barcha levellar uchun amal qiladi."
              />

              <SearchableMultiSelect
                title="Sinf Nomlari"
                placeholder="Sinflarni tanlang..."
                options={classes.map((cls) => ({
                  id: cls.id,
                  label: cls.name,
                }))}
                selectedIds={planSelectedClasses}
                onChange={setPlanSelectedClasses}
                hintText="* Hech narsa tanlanmasa, barcha sinflar uchun amal qiladi."
              />

              <SearchableMultiSelect
                title="Alohida O'quvchilar"
                placeholder="O'quvchilarni ismi bo'yicha qidirib tanlang..."
                options={studentsBalanceList.map((st) => ({
                  id: st.student_id || st.id,
                  label: `${st.first_name} ${st.last_name}`,
                  sublabel: st.class_name ? `(${st.class_name})` : "",
                }))}
                selectedIds={planSelectedStudents}
                onChange={setPlanSelectedStudents}
                hintText="* Hech narsa tanlanmasa, barcha o'quvchilar uchun amal qiladi."
              />

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditChargePlanModal(false);
                    setEditingPlanId(null);
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
                  {actionLoading ? "Saqlanmoqda..." : "O'zgarishlarni Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Charge Plan History */}
      {showChargePlanHistoryModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChargePlanHistoryModal(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">📜 Reja O'zgarishlari Tarixi</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Ushbu to'lov rejasi bo'yicha kiritilgan barcha tahrirlar auditi.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowChargePlanHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {chargePlanHistoryLoading ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : chargePlanHistoryList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-slate-400 text-xs font-medium">Ushbu reja uchun hali tahrir tarixi mavjud emas (Hali o'zgartirilmagan).</p>
                </div>
              ) : (
                chargePlanHistoryList.map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-extrabold text-xs text-[#1D1E26]">{item.edited_by_user_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({new Date(item.edited_at).toLocaleString()})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedHistorySnapshot(selectedHistorySnapshot?.id === item.id ? null : item)}
                        className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-1 px-3 rounded-xl transition cursor-pointer"
                      >
                        {selectedHistorySnapshot?.id === item.id ? "Yashirish ▲" : "Tahrirdan oldingi holati ▼"}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{item.change_summary}</p>

                    {/* Snapshot comparison card when expanded */}
                    {selectedHistorySnapshot?.id === item.id && (
                      <div className="mt-3 p-4 bg-white border border-slate-200 rounded-2xl space-y-3 text-xs">
                        <h4 className="font-black text-xs text-[#1D1E26] border-b border-slate-100 pb-2">
                          🔍 Tahrirdan Oldingi vs Keyingi Holati Taqqoslami
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Old State Card (Double-click to reveal Revert button) */}
                          <div
                            onDoubleClick={() =>
                              setShowRevertButtonRecordId(showRevertButtonRecordId === item.id ? null : item.id)
                            }
                            className="bg-amber-50/70 border border-amber-200/80 hover:border-amber-400 rounded-xl p-3 space-y-1.5 cursor-pointer transition select-none group"
                            title="Eski holatga qaytarish tugmasini chiqarish uchun 2 marta bosing (Double Click)"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-extrabold text-[11px] text-amber-900 uppercase font-mono">
                                TAHRIRDAN OLDINGI (ESKI)
                              </h5>
                              <span className="text-[9px] text-amber-600/80 font-mono italic group-hover:text-amber-900">
                                🖱️ (2x Click)
                              </span>
                            </div>
                            <p className="text-slate-700"><strong>Nomi:</strong> {item.old_state?.name}</p>
                            <p className="text-slate-700 font-mono"><strong>Summa:</strong> {item.old_state?.amount?.toLocaleString()} UZS</p>
                            <p className="text-slate-700 font-mono"><strong>Muddati:</strong> {item.old_state?.start_date} ~ {item.old_state?.end_date}</p>
                            <p className="text-slate-700 font-mono"><strong>Yechish kuni:</strong> {item.old_state?.charge_day}-kun</p>
                            <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-amber-200/40">
                              <p>Levellar: {item.old_state?.levels?.length > 0 ? item.old_state.levels.join(", ") : "Barchasi"}</p>
                              <p>Sinflar: {item.old_state?.classes?.length > 0 ? item.old_state.classes.join(", ") : "Barchasi"}</p>
                              <p>O'quvchilar soni: {item.old_state?.students?.length || 0} ta</p>
                            </div>

                            {/* Revert Action Button */}
                            {showRevertButtonRecordId === item.id && (
                              <div className="pt-2 border-t border-amber-300 mt-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevertToOldState(item.charge_plan_id, item.old_state);
                                  }}
                                  disabled={actionLoading}
                                  className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2 px-3 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <span>⏪ Ushbu Eski Holatga Qaytarish (Revert)</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* New State */}
                          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-1.5">
                            <h5 className="font-extrabold text-[11px] text-emerald-900 uppercase font-mono">Tahrirdan Keyingi (Yangi)</h5>
                            <p className="text-slate-700"><strong>Nomi:</strong> {item.new_state?.name}</p>
                            <p className="text-slate-700 font-mono"><strong>Summa:</strong> {item.new_state?.amount?.toLocaleString()} UZS</p>
                            <p className="text-slate-700 font-mono"><strong>Muddati:</strong> {item.new_state?.start_date} ~ {item.new_state?.end_date}</p>
                            <p className="text-slate-700 font-mono"><strong>Yechish kuni:</strong> {item.new_state?.charge_day}-kun</p>
                            <div className="text-[10px] text-slate-500 font-mono pt-1">
                              <p>Levellar: {item.new_state?.levels?.length > 0 ? item.new_state.levels.join(", ") : "Barchasi"}</p>
                              <p>Sinflar: {item.new_state?.classes?.length > 0 ? item.new_state.classes.join(", ") : "Barchasi"}</p>
                              <p>O'quvchilar soni: {item.new_state?.students?.length || 0} ta</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowChargePlanHistoryModal(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
