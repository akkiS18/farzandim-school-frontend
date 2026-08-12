import React, { useState, useEffect } from "react";
import { useDialog } from "../../hooks/useDialog";
import CustomDialogModal from "../CustomDialogModal";
import { DateRangePresets } from "../DateRangePresets";
import { TargetPresets } from "../TargetPresets";
import { ImportResult } from "./types";

interface MenuSectionProps {
  token: string;
  API_URL: string;
}

export default function MenuSection({ token, API_URL }: MenuSectionProps) {
  const [activeMenuSubTab, setActiveMenuSubTab] = useState<"cycle" | "exception">("cycle");
  const { dialogState, showAlert, showConfirm } = useDialog();
  
  // State lists
  const [menuIntervals, setMenuIntervals] = useState<any[]>([]);
  const [selectedIntervalId, setSelectedIntervalId] = useState<number | null>(null);
  const [menuCycles, setMenuCycles] = useState<any[]>([]);
  const [menuCyclesLoading, setMenuCyclesLoading] = useState(false);
  const [menuExceptions, setMenuExceptions] = useState<any[]>([]);
  const [menuExceptionsLoading, setMenuExceptionsLoading] = useState(false);

  // Filters & visual settings
  const [showOnlyFoodDays, setShowOnlyFoodDays] = useState(false);
  const [editingCell, setEditingCell] = useState<{ week: number; day: number; mealType: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Modals & Form values
  const [showAddIntervalModal, setShowAddIntervalModal] = useState(false);
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false);

  const [newIntervalName, setNewIntervalName] = useState("");
  const [newIntervalStartDate, setNewIntervalStartDate] = useState("2026-09-01");
  const [newIntervalEndDate, setNewIntervalEndDate] = useState("2027-05-31");
  const [newIntervalWeeks, setNewIntervalWeeks] = useState(4);
  // TargetPresets states for interval modal
  const [intervalTargetLevels, setIntervalTargetLevels] = useState<number[]>([]);
  const [intervalTargetClasses, setIntervalTargetClasses] = useState<number[]>([]);
  const [intervalTargetStudents, setIntervalTargetStudents] = useState<number[]>([]);

  const [menuWeekNumber, setMenuWeekNumber] = useState(1);
  const [menuDayOfWeek, setMenuDayOfWeek] = useState(1);
  const [menuBreakfast, setMenuBreakfast] = useState("");
  const [menuLunch, setMenuLunch] = useState("");
  const [menuSnack, setMenuSnack] = useState("");
  const [menuDinner, setMenuDinner] = useState("");

  const [menuExcDate, setMenuExcDate] = useState(new Date().toISOString().split("T")[0]);
  const [menuExcBreakfast, setMenuExcBreakfast] = useState("");
  const [menuExcLunch, setMenuExcLunch] = useState("");
  const [menuExcSnack, setMenuExcSnack] = useState("");
  const [menuExcDinner, setMenuExcDinner] = useState("");

  const [selectedMenuFile, setSelectedMenuFile] = useState<File | null>(null);
  const [menuImportLoading, setMenuImportLoading] = useState(false);
  const [menuImportError, setMenuImportError] = useState("");
  const [menuImportResult, setMenuImportResult] = useState<ImportResult | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  // Fetch initial intervals and exceptions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddIntervalModal(false);
        setShowAddExceptionModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (token) {
      fetchMenuIntervals();
      fetchMenuExceptions();
    }
  }, [token]);

  // Fetch cycles when selected interval changes
  useEffect(() => {
    if (selectedIntervalId && token) {
      fetchMenuCycles();
    } else {
      setMenuCycles([]);
    }
  }, [selectedIntervalId, token]);

  const fetchMenuIntervals = async () => {
    try {
      const response = await fetch(`${API_URL}/api/schools/menu/intervals`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setMenuIntervals(Array.isArray(data) ? data : []);
        if (data && data.length > 0 && !selectedIntervalId) {
          setSelectedIntervalId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMenuCycles = async () => {
    if (!selectedIntervalId) return;
    setMenuCyclesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/menu/cycle?interval_id=${selectedIntervalId}`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setMenuCycles(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMenuCyclesLoading(false);
    }
  };

  const fetchMenuExceptions = async () => {
    setMenuExceptionsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/menu/exceptions`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setMenuExceptions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMenuExceptionsLoading(false);
    }
  };

  const handleSaveMenuInterval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntervalName.trim()) return;
    setActionLoading(true);

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/menu/intervals`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newIntervalName.trim(),
          start_date: newIntervalStartDate,
          end_date: newIntervalEndDate,
          cycle_weeks: Number(newIntervalWeeks),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Intervalni saqlab bo'lmadi");

      showAlert("Yangi interval muvaffaqiyatli qo'shildi!");
      setShowAddIntervalModal(false);
      setNewIntervalName("");
      setNewIntervalWeeks(4);
      fetchMenuIntervals();
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMenuInterval = (id: number) => {
    showConfirm(
      "Ushbu intervalni o'chirmoqchisiz? Tizim undagi aylanma shablonlarni ham o'chirib yuboradi.",
      async () => {
        setActionLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/schools/menu/intervals/${id}`, {
            method: "DELETE",
            headers: safeFetchHeaders(),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "O'chirib bo'lmadi");
          }
          showAlert("Interval muvaffaqiyatli o'chirildi!");
          if (selectedIntervalId === id) setSelectedIntervalId(null);
          fetchMenuIntervals();
        } catch (err: any) {
          showAlert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
      { title: "Intervalni o'chirish", type: "danger", confirmText: "Ha, o'chirish" }
    );
  };

  const handleSaveMenuCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntervalId) return;
    setActionLoading(true);

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/menu/cycle`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          interval_id: Number(selectedIntervalId),
          week_number: Number(menuWeekNumber),
          day_of_week: Number(menuDayOfWeek),
          meals: {
            breakfast: menuBreakfast.trim() || undefined,
            lunch: menuLunch.trim() || undefined,
            snack: menuSnack.trim() || undefined,
            dinner: menuDinner.trim() || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Shablonni saqlab bo'lmadi");

      setMenuBreakfast("");
      setMenuLunch("");
      setMenuSnack("");
      setMenuDinner("");
      fetchMenuCycles();
      showAlert("Kunlik taom aylanma shablonga kiritildi!");
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveInlineMeal = async (week: number, day: number, mealType: "breakfast" | "lunch" | "snack" | "dinner", value: string) => {
    if (!selectedIntervalId) return;
    
    // Find current meals
    const cycleItem = menuCycles.find((c) => c.week_number === week && c.day_of_week === day);
    let mealsObj: any = { breakfast: "", lunch: "", snack: "", dinner: "" };
    if (cycleItem && cycleItem.meals) {
      try {
        mealsObj = typeof cycleItem.meals === "string" ? JSON.parse(cycleItem.meals) : cycleItem.meals;
      } catch (e) {}
    }

    mealsObj[mealType] = value.trim();

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/menu/cycle`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          interval_id: Number(selectedIntervalId),
          week_number: week,
          day_of_week: day,
          meals: mealsObj,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Saqlashda xatolik");
      }
      
      setMenuCycles((prev) =>
        prev.map((c) => {
          if (c.week_number === week && c.day_of_week === day) {
            return { ...c, meals: mealsObj };
          }
          return c;
        })
      );
      if (!cycleItem) {
        fetchMenuCycles();
      }
    } catch (e: any) {
      showAlert(e.message);
    } finally {
      setEditingCell(null);
    }
  };

  const handleSaveMenuException = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/menu/exceptions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          menu_date: menuExcDate,
          meals: {
            breakfast: menuExcBreakfast.trim() || undefined,
            lunch: menuExcLunch.trim() || undefined,
            snack: menuExcSnack.trim() || undefined,
            dinner: menuExcDinner.trim() || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Istisnoni saqlab bo'lmadi");

      setMenuExcBreakfast("");
      setMenuExcLunch("");
      setMenuExcSnack("");
      setMenuExcDinner("");
      setShowAddExceptionModal(false);
      fetchMenuExceptions();
      showAlert("Kunlik istisno taomnomasi muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMenuException = (id: number) => {
    showConfirm(
      "Ushbu istisnoni o'chirmoqchisiz?",
      async () => {
        setActionLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/schools/menu/exceptions/${id}`, {
            method: "DELETE",
            headers: safeFetchHeaders(),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "O'chirib bo'lmadi");
          }
          showAlert("Istisno muvaffaqiyatli o'chirildi!");
          fetchMenuExceptions();
        } catch (err: any) {
          showAlert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
      { title: "Istisnoni o'chirish", type: "danger", confirmText: "Ha, o'chirish" }
    );
  };

  const closeMenuExcelModal = () => {
    setSelectedMenuFile(null);
    setMenuImportResult(null);
    setMenuImportError("");
  };

  const daysOfWeekMap = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

  return (
    <div className="space-y-6 font-sans text-[#1D1E26] select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight">Taomnoma Boshqaruvi</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            O'quvchilar uchun haftalik va kunlik taomnomalarni sozlang.
          </p>
        </div>
        {activeMenuSubTab === "cycle" && (
          <button
            onClick={() => setShowAddIntervalModal(true)}
            className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
          >
            + Yangi Interval
          </button>
        )}
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/60 text-xs font-extrabold">
        <button
          onClick={() => {
            setActiveMenuSubTab("cycle");
            closeMenuExcelModal();
          }}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeMenuSubTab === "cycle"
              ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Aylanma Shablon (Template)
        </button>
        <button
          onClick={() => {
            setActiveMenuSubTab("exception");
            closeMenuExcelModal();
          }}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeMenuSubTab === "exception"
              ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Kunlik Istisnolar (Overrides)
        </button>
      </div>

      {activeMenuSubTab === "cycle" ? (
        <div className="space-y-8">
          {/* Section 1: Intervals List */}
          <div className="space-y-3">
            <h2 className="text-base font-black text-[#1D1E26]">Taomnoma Intervallari</h2>
            {menuIntervals.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-medium">Hozircha hech qanday interval yaratilmagan. Yuqoridagi tugma orqali yangi interval yarating.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuIntervals.map((interval) => {
                  const isSelected = selectedIntervalId === interval.id;
                  return (
                    <div
                      key={interval.id}
                      onClick={() => setSelectedIntervalId(interval.id)}
                      className={`p-5 rounded-3xl border cursor-pointer transition flex flex-col justify-between h-36 shadow-xs ${
                        isSelected
                          ? "bg-[#ECFCCA]/50 border-lime-300 ring-2 ring-[#D4F562]/30 text-[#1D1E26]"
                          : "bg-white border-slate-100/80 hover:shadow-md text-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="truncate pr-2">
                          <h3 className="font-black text-sm text-[#1D1E26] truncate">{interval.name}</h3>
                          <p className="text-[11px] text-slate-400 font-mono mt-1">
                            {new Date(interval.start_date).toLocaleDateString()} - {new Date(interval.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMenuInterval(interval.id);
                          }}
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-xl transition"
                          title="O'chirish"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tsikl davomiyligi:</span>
                        <span className="text-xs font-black font-mono text-[#65A30D]">{interval.cycle_weeks} hafta</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Visual Grid Table */}
          {selectedIntervalId && (
            (() => {
              const activeInterval = menuIntervals.find((i) => i.id === selectedIntervalId);
              if (!activeInterval) return null;

              return (
                <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-black text-[#1D1E26]">
                        Aylanma taomnoma jadvali: <span className="text-[#65A30D] font-black">{activeInterval.name}</span>
                      </h2>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Ushbu interval uchun haftalik taomlarni tahrirlang. Katakni <strong>ikki marta bosib</strong> inline tahrirlashingiz mumkin.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowOnlyFoodDays(!showOnlyFoodDays)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 select-none cursor-pointer ${
                        showOnlyFoodDays
                          ? "bg-[#D4F562] text-[#1D1E26] shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{showOnlyFoodDays ? "✓" : "○"}</span>
                      <span>Faqat taom bor kunlarni ko'rsatish</span>
                    </button>
                  </div>

                  {menuCyclesLoading ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-400">Jadval yuklanmoqda...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                          <tr>
                            <th className="px-4 py-4 w-20 text-center">Hafta</th>
                            <th className="px-4 py-4 w-28 text-center">Kun</th>
                            <th className="px-4 py-4">1-Mahal (Nonushta)</th>
                            <th className="px-4 py-4">2-Mahal (Tushlik)</th>
                            <th className="px-4 py-4">3-Mahal (Peshinlik)</th>
                            <th className="px-4 py-4">4-Mahal (Poldnik / Polnik)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                          {(() => {
                            const rowsToRender: any[] = [];

                            for (let w = 1; w <= activeInterval.cycle_weeks; w++) {
                              for (let d = 1; d <= 6; d++) {
                                const cycleItem = menuCycles.find((c) => c.week_number === w && c.day_of_week === d);
                                let mealsObj: any = { breakfast: "", lunch: "", snack: "", dinner: "" };
                                if (cycleItem && cycleItem.meals) {
                                  try {
                                    mealsObj = typeof cycleItem.meals === "string" ? JSON.parse(cycleItem.meals) : cycleItem.meals;
                                  } catch (e) {}
                                }

                                const hasFood = mealsObj.breakfast || mealsObj.lunch || mealsObj.snack || mealsObj.dinner;
                                if (showOnlyFoodDays && !hasFood) continue;

                                rowsToRender.push({
                                  week: w,
                                  day: d,
                                  dayName: daysOfWeekMap[d - 1] || `${d}-kun`,
                                  meals: mealsObj,
                                });
                              }
                            }

                            if (rowsToRender.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                                    Taom kiritilgan kunlar mavjud emas.
                                  </td>
                                </tr>
                              );
                            }

                            return rowsToRender.map((row, idx) => (
                              <tr key={`${row.week}-${row.day}`} className="hover:bg-slate-50/80 transition">
                                <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400 bg-slate-50/50">
                                  {row.week}-hafta
                                </td>
                                <td className="px-4 py-3.5 text-center font-bold text-[#1D1E26]">
                                  {row.dayName}
                                </td>
                                
                                {["breakfast", "lunch", "snack", "dinner"].map((mealKey) => {
                                  const isEditing = editingCell?.week === row.week && editingCell?.day === row.day && editingCell?.mealType === mealKey;
                                  const currentText = row.meals[mealKey] || "";

                                  return (
                                    <td
                                      key={mealKey}
                                      onDoubleClick={() => {
                                        setEditingCell({ week: row.week, day: row.day, mealType: mealKey });
                                        setEditingValue(currentText);
                                      }}
                                      className="px-4 py-3.5 border-l border-slate-100 hover:bg-lime-50/50 transition cursor-pointer relative"
                                    >
                                      {isEditing ? (
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="text"
                                            autoFocus
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleSaveInlineMeal(row.week, row.day, mealKey as any, editingValue);
                                              } else if (e.key === "Escape") {
                                                setEditingCell(null);
                                              }
                                            }}
                                            className="w-full bg-white border border-[#D4F562] text-slate-800 text-xs px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-[#D4F562]"
                                          />
                                          <button
                                            onClick={() => handleSaveInlineMeal(row.week, row.day, mealKey as any, editingValue)}
                                            className="bg-[#D4F562] text-[#1D1E26] font-bold text-[10px] px-2 py-1 rounded-lg"
                                          >
                                            OK
                                          </button>
                                        </div>
                                      ) : currentText ? (
                                        <span className="text-slate-800 font-bold">{currentText}</span>
                                      ) : (
                                        <span className="text-slate-300 text-xs italic">+ Qo'shish</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      ) : (
        /* Subtab Exception: Overrides List */
        <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[#1D1E26]">Kunlik Istisnolar Ro'yxati</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Muayyan sana uchun aylanma taomnomani bekor qiluvchi taomlar.</p>
            </div>
            <button
              onClick={() => setShowAddExceptionModal(true)}
              className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              + Yangi Istisno Qo'shish
            </button>
          </div>

          {menuExceptionsLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : menuExceptions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-slate-400 text-xs font-medium">Hozircha hech qanday istisno taomnoma kiritilmagan. "+ Yangi Istisno Qo'shish" tugmasini bosing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                  <tr>
                    <th className="px-6 py-4">Sana</th>
                    <th className="px-6 py-4">1-Mahal (Nonushta)</th>
                    <th className="px-6 py-4">2-Mahal (Tushlik)</th>
                    <th className="px-6 py-4">3-Mahal (Peshinlik)</th>
                    <th className="px-6 py-4">4-Mahal (Poldnik / Polnik)</th>
                    <th className="px-6 py-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                  {menuExceptions.map((exc) => {
                    let m: any = { breakfast: "", lunch: "", snack: "", dinner: "" };
                    if (exc.meals) {
                      try {
                        m = typeof exc.meals === "string" ? JSON.parse(exc.meals) : exc.meals;
                      } catch (e) {}
                    }
                    return (
                      <tr key={exc.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-mono font-bold text-[#1D1E26]">
                          {new Date(exc.menu_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{m.breakfast || "-"}</td>
                        <td className="px-6 py-4">{m.lunch || "-"}</td>
                        <td className="px-6 py-4">{m.snack || "-"}</td>
                        <td className="px-6 py-4">{m.dinner || "-"}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteMenuException(exc.id)}
                            className="text-xs bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-extrabold py-1.5 px-3 rounded-xl transition cursor-pointer"
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
          )}
        </div>
      )}

      {/* Modal: Add Interval */}
      {showAddIntervalModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddIntervalModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Yangi Taomnoma Interval Yaratish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Taomnoma aylanadigan vaqt oralig'ini va haftalar sonini belgilang.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddIntervalModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenuInterval} className="space-y-4">
              {/* Date Range Presets */}
              <DateRangePresets
                startDate={newIntervalStartDate}
                endDate={newIntervalEndDate}
                onStartDateChange={setNewIntervalStartDate}
                onEndDateChange={setNewIntervalEndDate}
                token={token}
                apiUrl={API_URL}
                category="menu_interval"
                theme="lime"
                label="Sana oralig'i shablonlari (Date Range Presets)"
                startLabel="Boshlanish sanasi"
                endLabel="Tugash sanasi"
              />

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Interval Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 1-Chorak taomnomasi"
                  value={newIntervalName}
                  onChange={(e) => setNewIntervalName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Boshlanish Sanasi</label>
                  <input
                    type="date"
                    required
                    value={newIntervalStartDate}
                    onChange={(e) => setNewIntervalStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Tugash Sanasi</label>
                  <input
                    type="date"
                    required
                    value={newIntervalEndDate}
                    onChange={(e) => setNewIntervalEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Aylanma Tsikl (Haftalarda)</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  required
                  value={newIntervalWeeks}
                  onChange={(e) => setNewIntervalWeeks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
                />
              </div>

              {/* Target Presets */}
              <TargetPresets
                selectedLevels={intervalTargetLevels}
                selectedClasses={intervalTargetClasses}
                selectedStudents={intervalTargetStudents}
                onLevelsChange={setIntervalTargetLevels}
                onClassesChange={setIntervalTargetClasses}
                onStudentsChange={setIntervalTargetStudents}
                token={token}
                apiUrl={API_URL}
                theme="lime"
                label="O'quvchilar To'plamlari (Kimlar uchun?)"
              />

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddIntervalModal(false)}
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

      {/* Modal: Add Daily Exception */}
      {showAddExceptionModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddExceptionModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Kunlik Istisno Taomnoma Qo'shish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Muayyan sana uchun 4 mahal taomnomani belgilang.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExceptionModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenuException} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Sana</label>
                <input
                  type="date"
                  required
                  value={menuExcDate}
                  onChange={(e) => setMenuExcDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">1-Mahal: Nonushta</label>
                <input
                  type="text"
                  placeholder="Masalan: Bo'tqa va Choy"
                  value={menuExcBreakfast}
                  onChange={(e) => setMenuExcBreakfast(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">2-Mahal: Tushlik</label>
                <input
                  type="text"
                  placeholder="Masalan: Moshxo'rda, Osh, Salat"
                  value={menuExcLunch}
                  onChange={(e) => setMenuExcLunch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">3-Mahal: Peshinlik</label>
                <input
                  type="text"
                  placeholder="Masalan: Meva sharbati va Pirojniy"
                  value={menuExcSnack}
                  onChange={(e) => setMenuExcSnack(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">4-Mahal: Poldnik / Polnik</label>
                <input
                  type="text"
                  placeholder="Masalan: Sut, Kulcha va Meva"
                  value={menuExcDinner}
                  onChange={(e) => setMenuExcDinner(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExceptionModal(false)}
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
