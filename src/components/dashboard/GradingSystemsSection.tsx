import React, { useState, useEffect } from "react";
import { useDialog } from "../../hooks/useDialog";
import CustomDialogModal from "../CustomDialogModal";
import { GradingSystem } from "./types";

interface GradingSystemsSectionProps {
  gradingSystems: GradingSystem[];
  token: string;
  API_URL: string;
  setGradingSystems: React.Dispatch<React.SetStateAction<GradingSystem[]>>;
}

export default function GradingSystemsSection({
  gradingSystems,
  token,
  API_URL,
  setGradingSystems,
}: GradingSystemsSectionProps) {
  const [showAddGSModal, setShowAddGSModal] = useState(false);
  const { dialogState, showAlert, showConfirm } = useDialog();
  const [gsNameInput, setGsNameInput] = useState("");
  const [gsTypeInput, setGsTypeInput] = useState("NUMERIC"); // "NUMERIC" | "PERCENTAGE" | "LETTER"
  const [gsMinInput, setGsMinInput] = useState("1");
  const [gsMaxInput, setGsMaxInput] = useState("5");
  const [gsOptionsInput, setGsOptionsInput] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddGSModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeGS = gradingSystems.find((gs) => gs.is_active);

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  const handleActivateGS = (gsId: number) => {
    showConfirm(
      "Ushbu baholash tizimini faollashtirmoqchimisiz?",
      async () => {
        setActionLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/schools/grading-systems/${gsId}/activate`, {
            method: "POST",
            headers: safeFetchHeaders(),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Tizimni faollashtirib bo'lmadi");
          const res = await fetch(`${API_URL}/api/schools/grading-systems`, {
            headers: safeFetchHeaders(),
          });
          const resData = await res.json();
          if (res.ok) setGradingSystems(Array.isArray(resData) ? resData : []);
        } catch (e: any) {
          showAlert(e.message);
        } finally {
          setActionLoading(false);
        }
      },
      { title: "Baholash tizimini faollashtirish", type: "confirm", confirmText: "Ha, faollashtirish" }
    );
  };

  const handleDeleteGS = (gsId: number) => {
    showConfirm(
      "Ushbu baholash tizimini o'chirmoqchimisiz?",
      async () => {
        setActionLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/schools/grading-systems/${gsId}`, {
            method: "DELETE",
            headers: safeFetchHeaders(),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Tizimni o'chirib bo'lmadi");
          const res = await fetch(`${API_URL}/api/schools/grading-systems`, {
            headers: safeFetchHeaders(),
          });
          const resData = await res.json();
          if (res.ok) setGradingSystems(Array.isArray(resData) ? resData : []);
        } catch (e: any) {
          showAlert(e.message);
        } finally {
          setActionLoading(false);
        }
      },
      { title: "Baholash tizimini o'chirish", type: "danger", confirmText: "Ha, o'chirish" }
    );
  };

  const handleCreateGS = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");

    let payload: any = {
      name: gsNameInput,
      type: gsTypeInput,
    };

    if (gsTypeInput === "LETTER") {
      try {
        payload.options = JSON.parse(gsOptionsInput);
      } catch (err) {
        setActionError("Variantlar JSON formatida xato. Iltimos, formatingizni tekshiring");
        setActionLoading(false);
        return;
      }
    } else {
      payload.min_value = Number(gsMinInput);
      payload.max_value = Number(gsMaxInput);
    }

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/grading-systems`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Baholash tizimi saqlanmadi");

      // Reload
      const res = await fetch(`${API_URL}/api/schools/grading-systems`, {
        headers: safeFetchHeaders(),
      });
      const resData = await res.json();
      if (res.ok) setGradingSystems(Array.isArray(resData) ? resData : []);

      setShowAddGSModal(false);
      setGsNameInput("");
      setGsOptionsInput("");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#1D1E26] select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          
        </div>
        <button
          onClick={() => setShowAddGSModal(true)}
          className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
        >
          + Yangi Tizim
        </button>
      </div>

      {activeGS && (
        <div className="bg-[#ECFCCA]/50 border border-lime-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] bg-[#ECFCCA] text-[#65A30D] px-3 py-1 rounded-full font-black uppercase font-mono tracking-wider">
              Faol Baholash Tizimi
            </span>
            <h2 className="text-xl font-black text-[#1D1E26] mt-3">{activeGS.name}</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Turi: <strong className="text-[#1D1E26]">{activeGS.type}</strong>
              {activeGS.type === "NUMERIC" && ` (Diapazon: ${activeGS.min_value} - ${activeGS.max_value})`}
              {activeGS.type === "PERCENTAGE" && ` (Diapazon: ${activeGS.min_value}% - ${activeGS.max_value}%)`}
            </p>
          </div>
          <div className="w-14 h-14 bg-white border border-lime-200 rounded-2xl flex items-center justify-center text-[#65A30D] font-black text-xl font-mono shadow-xs">
            {activeGS.type === "NUMERIC" ? activeGS.max_value : activeGS.type === "PERCENTAGE" ? "%" : "A"}
          </div>
        </div>
      )}

      {gradingSystems.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-slate-400 text-xs font-medium">Baholash tizimlari topilmadi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gradingSystems.map((gs) => (
            <div
              key={gs.id}
              className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between h-48 transition duration-200 ${
                gs.is_active
                  ? "border-lime-300 ring-2 ring-[#D4F562]/30"
                  : "border-slate-100/80 hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-[#1D1E26]">{gs.name}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black font-mono uppercase tracking-wider ${
                    gs.is_active
                      ? "bg-[#ECFCCA] text-[#65A30D]"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {gs.is_active ? "Faol" : "Nofaol"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-medium mt-3">
                  Turi: <span className="text-[#1D1E26] font-bold">{gs.type}</span>
                </p>
                {gs.type === "NUMERIC" && (
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Qiymatlar: <span className="text-[#1D1E26] font-bold">{gs.min_value} - {gs.max_value}</span>
                  </p>
                )}
                {gs.type === "PERCENTAGE" && (
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Foiz diapazoni: <span className="text-[#1D1E26] font-bold">{gs.min_value}% - {gs.max_value}%</span>
                  </p>
                )}
                {gs.type === "LETTER" && gs.options && (
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-1 items-center font-medium">
                    <span>Variantlar:</span>
                    {gs.options.map((opt: any, index: number) => (
                      <span key={index} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-mono text-[10px] font-bold">
                        {opt.label} ({opt.numeric_value} ball)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                {!gs.is_active && (
                  <button
                    onClick={() => handleActivateGS(gs.id)}
                    disabled={actionLoading}
                    className="bg-[#1D1E26] text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                  >
                    Faollashtirish
                  </button>
                )}
                {!gs.is_active && gs.name !== "5 ballik sistema" && gs.name !== "100 ballik sistema" && (
                  <button
                    onClick={() => handleDeleteGS(gs.id)}
                    disabled={actionLoading}
                    className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    O'chirish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Grading System */}
      {showAddGSModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddGSModal(false);
              setGsNameInput("");
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Yangi Baholash Tizimi Yaratish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Tizim turini va qiymatlarini belgilang.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddGSModal(false);
                  setGsNameInput("");
                  setActionError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3.5 rounded-2xl font-medium">{actionError}</div>
            )}

            <form onSubmit={handleCreateGS} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Tizim Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 5 ballik baholash"
                  value={gsNameInput}
                  onChange={(e) => setGsNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Tizim turi</label>
                <select
                  value={gsTypeInput}
                  onChange={(e) => setGsTypeInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition cursor-pointer font-bold"
                >
                  <option value="NUMERIC">Numeric (Raqamli)</option>
                  <option value="PERCENTAGE">Percentage (Foizli)</option>
                  <option value="LETTER">Letter (Harfli / Matnli)</option>
                </select>
              </div>

              {(gsTypeInput === "NUMERIC" || gsTypeInput === "PERCENTAGE") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Eng kichik qiymat</label>
                    <input
                      type="number"
                      required
                      value={gsMinInput}
                      onChange={(e) => setGsMinInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Eng katta qiymat</label>
                    <input
                      type="number"
                      required
                      value={gsMaxInput}
                      onChange={(e) => setGsMaxInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                    />
                  </div>
                </div>
              )}

              {gsTypeInput === "LETTER" && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Variantlar (JSON)</label>
                  <textarea
                    required
                    placeholder='Masalan: [{"label": "A", "numeric_value": 5}, {"label": "B", "numeric_value": 4}]'
                    value={gsOptionsInput}
                    onChange={(e) => setGsOptionsInput(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Har bir variant JSON formatida "label" va ixtiyoriy "numeric_value" maydonlaridan iborat bo'lishi kerak.</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGSModal(false);
                    setGsNameInput("");
                    setGsOptionsInput("");
                    setActionError("");
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  {actionLoading ? "Yaratilmoqda..." : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Dialog Modal */}
      <CustomDialogModal
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </div>
  );
}
