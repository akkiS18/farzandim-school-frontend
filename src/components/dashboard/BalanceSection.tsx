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

  const fetchStudentsBalanceData = async () => {
    setStudentsBalanceLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/users?role=STUDENT`, {
        headers: { "Authorization": `Bearer ${token}` },
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
        headers: { "Authorization": `Bearer ${token}` },
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
        headers: { "Authorization": `Bearer ${token}` },
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
      const response = await fetch(`${API_URL}/api/schools/students/${paymentStudentId}/balance/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
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
      const response = await fetch(`${API_URL}/api/schools/balance/import-payments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import qilishda xatolik yuz berdi");

      setPaymentImportResult(data);
      if (data.imported_count > 0) {
        fetchStudentsBalanceData();
        fetchGlobalTransactionsData();
      }
    } catch (err: any) {
      setPaymentImportError(err.message);
    } finally {
      setPaymentImportLoading(false);
    }
  };

  const handleCreateChargePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planAmount || !planStartDate || !planEndDate || !planChargeDay) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    setActionLoading(true);
    try {
      const parsedLevels = rawPlanSelectedLevels.split(",")
        .map(v => parseInt(v.trim()))
        .filter(v => !isNaN(v));
      const parsedClasses = rawPlanSelectedClasses.split(",")
        .map(v => parseInt(v.trim()))
        .filter(v => !isNaN(v));
      const parsedStudents = rawPlanSelectedStudents.split(",")
        .map(v => parseInt(v.trim()))
        .filter(v => !isNaN(v));

      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: planName.trim(),
          amount: parseFloat(planAmount),
          start_date: planStartDate,
          end_date: planEndDate,
          charge_day: Number(planChargeDay),
          levels: parsedLevels,
          classes: parsedClasses,
          students: parsedStudents,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "To'lov rejasini saqlab bo'lmadi");

      alert("To'lov rejasi muvaffaqiyatli saqlandi!");
      setShowAddChargePlanModal(false);
      
      setPlanName("");
      setPlanAmount("");
      setPlanStartDate("2026-09-01");
      setPlanEndDate("2027-05-31");
      setPlanChargeDay(1);
      setRawPlanSelectedLevels("");
      setRawPlanSelectedClasses("");
      setRawPlanSelectedStudents("");

      fetchChargePlansData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChargePlan = async (id: number) => {
    if (!confirm("Haqiqatan ham ushbu to'lov rejasini o'chirmoqchisiz? Keyingi oylik yechimlar to'xtatiladi.")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/balance/charge-plans/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'chirishda xatolik yuz berdi");

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
        headers: { "Authorization": `Bearer ${token}` },
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Balans va To'lovlar boshqaruvi</h1>
          <p className="text-xs text-zinc-500 mt-1">O'quvchilar balansini ko'rish, to'lovlar qabul qilish va avtomat to'lov rejalarini sozlash.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunChargesManually}
            disabled={actionLoading}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Dars kunlaridagi oylik to'lovlarni hisoblab, qarzdorliklarni avtomatik hisoblash"
          >
            🔄 To'lovlarni hisoblash (Manual Run)
          </button>
          <button
            onClick={() => setShowImportPaymentsModal(true)}
            className="bg-emerald-650 hover:bg-emerald-600 border border-emerald-700/30 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer whitespace-nowrap"
          >
            📥 Excel orqali to'lovlar
          </button>
          <button
            onClick={() => {
              setPaymentStudentId("");
              setPaymentAmount("");
              setPaymentDescription("");
              setShowAddPaymentModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer whitespace-nowrap"
          >
            + Yangi To'lov
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-zinc-800/40">
        <button
          onClick={() => setBalanceActiveSubTab("balances")}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
            balanceActiveSubTab === "balances"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          O'quvchilar Balansi ({studentsBalanceList.length})
        </button>
        <button
          onClick={() => setBalanceActiveSubTab("plans")}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
            balanceActiveSubTab === "plans"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          To'lov Rejalari ({chargePlans.length})
        </button>
        <button
          onClick={() => setBalanceActiveSubTab("transactions")}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
            balanceActiveSubTab === "transactions"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Barcha Tranzaksiyalar ({globalTransactionsList.length})
        </button>
      </div>

      {/* Sub-tab 1: O'quvchilar Balansi */}
      {balanceActiveSubTab === "balances" && (
        <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          {studentsBalanceLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : studentsBalanceList.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/10">
              <p className="text-zinc-500 text-xs">O'quvchilar topilmadi.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
              <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">O'quvchi F.I.SH</th>
                    <th className="px-5 py-3">Sinf va Lvl</th>
                    <th className="px-5 py-3">Balans</th>
                    <th className="px-5 py-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                  {studentsBalanceList.map((st) => (
                    <tr key={st.id} className="hover:bg-zinc-900/40 transition">
                      <td className="px-5 py-3 font-medium text-zinc-100">
                        {st.first_name} {st.last_name} {st.middle_name && <span className="text-zinc-500">({st.middle_name})</span>}
                      </td>
                      <td className="px-5 py-3 font-mono">
                        {st.class_name ? `${st.class_name} (Level ${st.class_level ?? '-'})` : "-"}
                      </td>
                      <td className="px-5 py-3 font-semibold font-mono">
                        <span className={`px-2.5 py-1 rounded-full text-xs ${
                          st.balance < 0
                            ? "bg-red-500/10 border border-red-500/20 text-red-400"
                            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        }`}>
                          {parseFloat(st.balance || 0).toLocaleString()} UZS
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => {
                            setPaymentStudentId(st.id);
                            setPaymentAmount("");
                            setPaymentDescription("");
                            setShowAddPaymentModal(true);
                          }}
                          className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-[10px] font-semibold py-1 px-3 rounded-lg transition cursor-pointer"
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
        <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300">Faol To'lov Rejalari (Charge Plans)</h3>
            <button
              onClick={() => {
                setPlanName("");
                setPlanAmount("");
                setPlanStartDate("2026-09-01");
                setPlanEndDate("2027-05-31");
                setPlanChargeDay(1);
                setRawPlanSelectedLevels("");
                setRawPlanSelectedClasses("");
                setRawPlanSelectedStudents("");
                setShowAddChargePlanModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
            >
              + Yangi Plan Yaratish
            </button>
          </div>

          {chargePlansLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : chargePlans.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/10">
              <p className="text-zinc-500 text-xs">To'lov rejalari mavjud emas. Yangi plan qo'shing.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
              <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Plan Nomi</th>
                    <th className="px-5 py-3">Summa</th>
                    <th className="px-5 py-3">Sana oralig'i</th>
                    <th className="px-5 py-3">Kuni</th>
                    <th className="px-5 py-3">Nishon (Target)</th>
                    <th className="px-5 py-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                  {chargePlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-zinc-900/40 transition">
                      <td className="px-5 py-3 font-semibold text-zinc-200">{plan.name}</td>
                      <td className="px-5 py-3 font-mono font-bold text-zinc-100">
                        {parseFloat(plan.amount).toLocaleString()} UZS
                      </td>
                      <td className="px-5 py-3 text-zinc-400 font-mono text-[11px]">
                        {plan.start_date.substring(0, 10)} / {plan.end_date.substring(0, 10)}
                      </td>
                      <td className="px-5 py-3 font-mono">har oyning {plan.charge_day}-kuni</td>
                      <td className="px-5 py-3 text-[11px] text-zinc-400 space-y-1">
                        {plan.levels && plan.levels.length > 0 && (
                          <div>Levels: <span className="text-blue-400">{plan.levels.join(", ")}</span></div>
                        )}
                        {plan.classes && plan.classes.length > 0 && (
                          <div>Classes (IDs): <span className="text-amber-400">{plan.classes.join(", ")}</span></div>
                        )}
                        {plan.students && plan.students.length > 0 && (
                          <div>Students (IDs): <span className="text-teal-400">{plan.students.join(", ")}</span></div>
                        )}
                        {(!plan.levels?.length && !plan.classes?.length && !plan.students?.length) && (
                          <span className="text-zinc-650">Barchaga tegishli</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDeleteChargePlan(plan.id)}
                          className="text-zinc-500 hover:text-red-400 transition cursor-pointer"
                          title="O'chirish"
                        >
                          🗑️
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

      {/* Sub-tab 3: Barcha Tranzaksiyalar */}
      {balanceActiveSubTab === "transactions" && (
        <div className="bg-[#0d0d12]/30 border border-zinc-800/40 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          {globalTransactionsLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : globalTransactionsList.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/10">
              <p className="text-zinc-500 text-xs">Tranzaksiyalar mavjud emas.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/20">
              <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">O'quvchi</th>
                    <th className="px-5 py-3">Summa</th>
                    <th className="px-5 py-3">Turi</th>
                    <th className="px-5 py-3">Izoh</th>
                    <th className="px-5 py-3">Sana / Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                  {globalTransactionsList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-900/40 transition">
                      <td className="px-5 py-3 font-semibold text-zinc-200">
                        {tx.student_name}
                      </td>
                      <td className="px-5 py-3 font-semibold font-mono">
                        <span className={tx.type === "PAYMENT" ? "text-emerald-400" : "text-red-400"}>
                          {tx.type === "PAYMENT" ? "+" : "-"}{parseFloat(tx.amount).toLocaleString()} UZS
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === "PAYMENT"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/20"
                            : "bg-red-950/40 text-red-400 border border-red-900/20"
                        }`}>
                          {tx.type === "PAYMENT" ? "TO'LOV" : "CHIQIM"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{tx.description}</td>
                      <td className="px-5 py-3 text-zinc-550 font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Payment Quick */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative text-zinc-200">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi To'lov Kiritish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">O'quvchi balansiga mablag' qo'shish.</p>

            <form onSubmit={handleAddPaymentQuick} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">O'quvchi *</label>
                <select
                  required
                  value={paymentStudentId}
                  onChange={(e) => setPaymentStudentId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition cursor-pointer"
                >
                  <option value="">O'quvchini tanlang...</option>
                  {studentsBalanceList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.first_name} {st.last_name} {st.class_name ? `(${st.class_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">To'lov Summasi (UZS) *</label>
                <input
                  type="number"
                  required
                  placeholder="Masalan: 500000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Izoh / Tafsilotlar</label>
                <input
                  type="text"
                  placeholder="Kassa orqali naqd pul, plastik karta va hokazo..."
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPaymentModal(false);
                    setPaymentStudentId("");
                    setPaymentAmount("");
                    setPaymentDescription("");
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
                  {actionLoading ? "Saqlanmoqda..." : "To'lovni Kiritish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Payments (Excel sheet) */}
      {showImportPaymentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8 text-zinc-200">
            <h3 className="text-md font-bold text-zinc-200 mb-2">To'lovlarni Excel Orqali Import Qilish</h3>
            <p className="text-xs text-zinc-400 mb-6">O'quvchilar tomonidan amalga oshirilgan to'lovlarni ommaviy yuklash uchun Excel shablonini yuklang.</p>

            {/* Template Download Option */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-400">Excel shablonini ko'chirib oling</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">To'lovlar shablonini yuklab olib, o'quvchilar INA raqami va to'lov summasini to'ldiring.</p>
              </div>
              <a
                href={`${API_URL}/api/schools/import/template/payments?token=${token}`}
                download
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition cursor-pointer"
              >
                📥 Shablonni Yuklash
              </a>
            </div>

            {paymentImportError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{paymentImportError}</div>
            )}

            {!paymentImportResult ? (
              <form onSubmit={handleImportPaymentsSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/20 hover:border-zinc-700 transition relative">
                  <input
                    type="file"
                    required
                    accept=".xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setPaymentFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="text-2xl">💵</div>
                    <p className="text-sm text-zinc-305">
                      {paymentFile ? paymentFile.name : "To'lov Excel shablonini tanlang (.xlsx)"}
                    </p>
                    <p className="text-xs text-zinc-505">Maksimal hajm: 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportPaymentsModal(false);
                      setPaymentFile(null);
                      setPaymentImportError("");
                    }}
                    className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={paymentImportLoading || !paymentFile}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {paymentImportLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Qabul qilindi</span>
                    <span className="text-2xl font-bold">{paymentImportResult.imported_count}</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Rad etildi</span>
                    <span className="text-2xl font-bold">{paymentImportResult.failed_count}</span>
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Status</span>
                    <span className="text-xs font-semibold block mt-1">
                      {paymentImportResult.success ? "✅ Hammasi to'g'ri" : "⚠️ Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {paymentImportResult.errors && paymentImportResult.errors.length > 0 && (
                  <div className="border border-zinc-850 rounded-xl overflow-hidden text-xs">
                    <div className="bg-zinc-950/60 text-zinc-400 px-4 py-2 uppercase font-semibold">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto bg-zinc-950/10">
                      {paymentImportResult.errors.map((err, i) => (
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
                    onClick={() => {
                      setShowImportPaymentsModal(false);
                      setPaymentFile(null);
                      setPaymentImportResult(null);
                    }}
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

      {/* Modal: Add Charge Plan */}
      {showAddChargePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative text-zinc-200">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi To'lov Rejasi (Charge Plan) Yaratish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Yillik reja bo'yicha belgilangan intervalda o'quvchilar balansidan avtomatik ravishda mablag' yechish.</p>

            <form onSubmit={handleCreateChargePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Plan Nomi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Yillik to'lov plani"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Oylik Summa (UZS) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Masalan: 450000"
                    value={planAmount}
                    onChange={(e) => setPlanAmount(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Boshlanish sanasi *</label>
                  <input
                    type="date"
                    required
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Tugash sanasi *</label>
                  <input
                    type="date"
                    required
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Yechish kuni (1-28) *</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    required
                    value={planChargeDay}
                    onChange={(e) => setPlanChargeDay(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-zinc-800/60 pt-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Plan Nishonlari (Target)</h4>
                <p className="text-[10px] text-zinc-500">Quyidagi maydonlardan faqat bittasini to'ldiring yoki hammasini bo'sh qoldiring (barchaga tegishli bo'ladi).</p>
                
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Class Levels (Vergul bilan ajratib: 0,1,2,3...)</label>
                  <input
                    type="text"
                    placeholder="Masalan: 1, 2, 3, 4"
                    value={rawPlanSelectedLevels}
                    onChange={(e) => setRawPlanSelectedLevels(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2 text-xs outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Sinf ID lari (Vergul bilan ajratib)</label>
                  <input
                    type="text"
                    placeholder="Masalan: 1, 3, 5"
                    value={rawPlanSelectedClasses}
                    onChange={(e) => setRawPlanSelectedClasses(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2 text-xs outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">O'quvchi ID lari (Vergul bilan ajratib)</label>
                  <input
                    type="text"
                    placeholder="Masalan: 12, 15, 23"
                    value={rawPlanSelectedStudents}
                    onChange={(e) => setRawPlanSelectedStudents(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-[#2d2d3a] focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2 text-xs outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddChargePlanModal(false);
                    setPlanName("");
                    setPlanAmount("");
                    setPlanStartDate("2026-09-01");
                    setPlanEndDate("2027-05-31");
                    setPlanChargeDay(1);
                    setRawPlanSelectedLevels("");
                    setRawPlanSelectedClasses("");
                    setRawPlanSelectedStudents("");
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
                  {actionLoading ? "Saqlanmoqda..." : "Rejani Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
