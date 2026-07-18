import React, { useState } from "react";
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
  const [gsNameInput, setGsNameInput] = useState("");
  const [gsTypeInput, setGsTypeInput] = useState("NUMERIC"); // "NUMERIC" | "PERCENTAGE" | "LETTER"
  const [gsMinInput, setGsMinInput] = useState("1");
  const [gsMaxInput, setGsMaxInput] = useState("5");
  const [gsOptionsInput, setGsOptionsInput] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const activeGS = gradingSystems.find((gs) => gs.is_active);

  const handleActivateGS = async (gsId: number) => {
    if (!confirm("Ushbu baholash tizimini faollashtirmoqchimisiz?")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/grading-systems/${gsId}/activate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tizimni faollashtirib bo'lmadi");

      // Reload
      const res = await fetch(`${API_URL}/api/schools/grading-systems`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const resData = await res.json();
      if (res.ok) setGradingSystems(Array.isArray(resData) ? resData : []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGS = async (gsId: number) => {
    if (!confirm("Ushbu baholash tizimini o'chirmoqchimisiz?")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/grading-systems/${gsId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tizimni o'chirib bo'lmadi");

      // Reload
      const res = await fetch(`${API_URL}/api/schools/grading-systems`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const resData = await res.json();
      if (res.ok) setGradingSystems(Array.isArray(resData) ? resData : []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
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
      const response = await fetch(`${API_URL}/api/schools/grading-systems`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Baholash tizimi saqlanmadi");

      // Reload
      const res = await fetch(`${API_URL}/api/schools/grading-systems`, {
        headers: { "Authorization": `Bearer ${token}` },
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
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 font-bold text-lg font-mono">
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

      {/* Modal: Add Grading System */}
      {showAddGSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi Baholash Tizimi Yaratish</h3>
            <p className="text-[11px] text-zinc-550 mb-6">Tizim turini va qiymatlarini belgilang.</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleCreateGS} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Tizim Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 5 ballik baholash"
                  value={gsNameInput}
                  onChange={(e) => setGsNameInput(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Tizim turi</label>
                <select
                  value={gsTypeInput}
                  onChange={(e) => setGsTypeInput(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition cursor-pointer"
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
                  <span className="text-[9px] text-zinc-650 block mt-1 font-sans">Har bir variant JSON formatida "label" va ixtiyoriy "numeric_value" maydonlaridan iborat bo'lishi kerak.</span>
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
    </div>
  );
}
