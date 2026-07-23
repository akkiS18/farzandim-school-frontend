import React, { useState } from "react";
import { ImportResult } from "./types";

interface BalanceSectionProps {
  token: string;
  API_URL: string;
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
  const [paymentStudentId, setPaymentStudentId] = useState<number | "">("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");

  const [showImportPaymentsModal, setShowImportPaymentsModal] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentImportLoading, setPaymentImportLoading] = useState(false);
  const [paymentImportError, setPaymentImportError] = useState("");
  const [paymentImportResult, setPaymentImportResult] = useState<ImportResult | null>(null);

  const [showAddChargePlanModal, setShowAddChargePlanModal] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planStartDate, setPlanStartDate] = useState("2026-09-01");
  const [planEndDate, setPlanEndDate] = useState("2027-05-31");
  const [planChargeDay, setPlanChargeDay] = useState(1);
  const [rawPlanSelectedLevels, setRawPlanSelectedLevels] = useState("");
  const [rawPlanSelectedClasses, setRawPlanSelectedClasses] = useState("");
  const [rawPlanSelectedStudents, setRawPlanSelectedStudents] = useState("");

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
    if (!paymentStudentId || !paymentAmount) {
      alert("O'quvchi va summa majburiy");
      return;
    }
    setActionLoading(true);
    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/students/${paymentStudentId}/balance/transaction`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          type: "PAYMENT",
          description: paymentDescription.trim() || "Kassa/Bank orqali to'lov",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "To'lov kiritilmadi");

      alert("To'lov muvaffaqiyatli qabul qilindi!");
      setShowAddPaymentModal(false);
      setPaymentAmount("");
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

    const targetLevels = rawPlanSelectedLevels
      ? rawPlanSelectedLevels.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
      : [];
    const targetClasses = rawPlanSelectedClasses
      ? rawPlanSelectedClasses.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
      : [];
    const targetStudents = rawPlanSelectedStudents
      ? rawPlanSelectedStudents.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
      : [];

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
          target_levels: targetLevels,
          target_classes: targetClasses,
          target_students: targetStudents,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "To'lov rejasini saqlab bo'lmadi");

      alert("Yangi to'lov rejasi yaratildi!");
      setShowAddChargePlanModal(false);
      setPlanName("");
      setPlanAmount("");
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
      {balanceActiveSubTab === "balances" && (
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
                  {studentsBalanceList.map((st) => (
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
                            setPaymentStudentId(st.id);
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
          )}
        </div>
      )}

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
                    <button
                      onClick={() => handleDeleteChargePlan(plan.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-extrabold py-1 px-2.5 rounded-xl transition cursor-pointer"
                    >
                      O'chirish
                    </button>
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
      {balanceActiveSubTab === "transactions" && (
        <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-black text-[#1D1E26]">Tranzaksiyalar Tarixi</h2>

          {globalTransactionsLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : globalTransactionsList.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-slate-400 text-xs font-medium">Tranzaksiyalar topilmadi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                  <tr>
                    <th className="px-6 py-4">Sana</th>
                    <th className="px-6 py-4">O'quvchi F.I.SH</th>
                    <th className="px-6 py-4">Turi</th>
                    <th className="px-6 py-4">Summa</th>
                    <th className="px-6 py-4">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                  {globalTransactionsList.map((tx) => (
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
                      <td className="px-6 py-4 font-mono font-black">
                        {parseFloat(tx.amount).toLocaleString()} UZS
                      </td>
                      <td className="px-6 py-4 text-slate-500">{tx.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Payment */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26]">
            <h3 className="text-base font-black text-[#1D1E26] mb-1">To'lov Qabul Qilish</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">O'quvchi balansini to'ldirish.</p>

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
                    <option key={st.id} value={st.id}>
                      {st.first_name} {st.last_name} ({st.class_name || "Sinfsiz"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">To'lov Summasi (UZS)</label>
                <input
                  type="number"
                  required
                  placeholder="Masalan: 500000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Izoh (Kassa / Kvitansiya)</label>
                <input
                  type="text"
                  placeholder="Kassa orqali naqd to'lov"
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
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  {actionLoading ? "Qabul qilinmoqda..." : "To'lovni qabul qilish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Charge Plan */}
      {showAddChargePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26]">
            <h3 className="text-base font-black text-[#1D1E26] mb-1">Yangi To'lov Rejasi Yaratish</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Oylik to'lov summasi va yechilish qoidasini belgilang.</p>

            <form onSubmit={handleCreateChargePlan} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Boshlanish Sanasi</label>
                  <input
                    type="date"
                    required
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Tugash Sanasi</label>
                  <input
                    type="date"
                    required
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
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
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
