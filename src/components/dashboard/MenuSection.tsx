import React, { useState, useEffect } from "react";
import { ImportResult } from "./types";

interface MenuSectionProps {
  token: string;
  API_URL: string;
}

export default function MenuSection({ token, API_URL }: MenuSectionProps) {
  const [activeMenuSubTab, setActiveMenuSubTab] = useState<"cycle" | "exception">("cycle");
  
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
  const [newIntervalName, setNewIntervalName] = useState("");
  const [newIntervalStartDate, setNewIntervalStartDate] = useState("2026-09-01");
  const [newIntervalEndDate, setNewIntervalEndDate] = useState("2027-05-31");
  const [newIntervalWeeks, setNewIntervalWeeks] = useState(4);

  const [menuWeekNumber, setMenuWeekNumber] = useState(1);
  const [menuDayOfWeek, setMenuDayOfWeek] = useState(1);
  const [menuBreakfast, setMenuBreakfast] = useState("");
  const [menuLunch, setMenuLunch] = useState("");
  const [menuSnack, setMenuSnack] = useState("");

  const [menuExcDate, setMenuExcDate] = useState(new Date().toISOString().split("T")[0]);
  const [menuExcBreakfast, setMenuExcBreakfast] = useState("");
  const [menuExcLunch, setMenuExcLunch] = useState("");
  const [menuExcSnack, setMenuExcSnack] = useState("");

  const [selectedMenuFile, setSelectedMenuFile] = useState<File | null>(null);
  const [menuImportLoading, setMenuImportLoading] = useState(false);
  const [menuImportError, setMenuImportError] = useState("");
  const [menuImportResult, setMenuImportResult] = useState<ImportResult | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch initial intervals and exceptions
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
        headers: { "Authorization": `Bearer ${token}` },
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
        headers: { "Authorization": `Bearer ${token}` },
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
        headers: { "Authorization": `Bearer ${token}` },
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
      const response = await fetch(`${API_URL}/api/schools/menu/intervals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newIntervalName.trim(),
          start_date: newIntervalStartDate,
          end_date: newIntervalEndDate,
          cycle_weeks: Number(newIntervalWeeks),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Intervalni saqlab bo'lmadi");

      alert("Yangi interval muvaffaqiyatli qo'shildi!");
      setShowAddIntervalModal(false);
      setNewIntervalName("");
      setNewIntervalWeeks(4);
      fetchMenuIntervals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMenuInterval = async (id: number) => {
    if (!confirm("Haqiqatan ham ushbu interval va unga biriktirilgan aylanma shablonlarni o'chirib yubormoqchimisiz?")) return;
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/schools/menu/intervals/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "O'chirib bo'lmadi");
      }

      alert("Interval muvaffaqiyatli o'chirildi!");
      if (selectedIntervalId === id) {
        setSelectedIntervalId(null);
      }
      fetchMenuIntervals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMenuCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntervalId) return;
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/schools/menu/cycle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          interval_id: Number(selectedIntervalId),
          week_number: Number(menuWeekNumber),
          day_of_week: Number(menuDayOfWeek),
          meals: {
            breakfast: menuBreakfast.trim() || undefined,
            lunch: menuLunch.trim() || undefined,
            snack: menuSnack.trim() || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Shablonni saqlab bo'lmadi");

      setMenuBreakfast("");
      setMenuLunch("");
      setMenuSnack("");
      fetchMenuCycles();
      alert("Kunlik taom aylanma shablonga kiritildi!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveInlineMeal = async (week: number, day: number, mealType: "breakfast" | "lunch" | "snack", value: string) => {
    if (!selectedIntervalId) return;
    
    // Find current meals
    const cycleItem = menuCycles.find((c) => c.week_number === week && c.day_of_week === day);
    let mealsObj: any = { breakfast: "", lunch: "", snack: "" };
    if (cycleItem && cycleItem.meals) {
      try {
        mealsObj = typeof cycleItem.meals === "string" ? JSON.parse(cycleItem.meals) : cycleItem.meals;
      } catch (e) {}
    }

    // Update specific meal
    mealsObj[mealType] = value.trim();

    try {
      const response = await fetch(`${API_URL}/api/schools/menu/cycle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
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
      
      // Update local state directly to be fast
      setMenuCycles((prev) =>
        prev.map((c) => {
          if (c.week_number === week && c.day_of_week === day) {
            return { ...c, meals: mealsObj };
          }
          return c;
        })
      );
      // Wait, if it didn't exist locally, we reload
      if (!cycleItem) {
        fetchMenuCycles();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEditingCell(null);
    }
  };

  const handleSaveMenuException = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/schools/menu/exceptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          menu_date: menuExcDate,
          meals: {
            breakfast: menuExcBreakfast.trim() || undefined,
            lunch: menuExcLunch.trim() || undefined,
            snack: menuExcSnack.trim() || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Istisnoni saqlab bo'lmadi");

      setMenuExcBreakfast("");
      setMenuExcLunch("");
      setMenuExcSnack("");
      fetchMenuExceptions();
      alert("Kunlik istisno taomnomasi muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMenuException = async (id: number) => {
    if (!confirm("Ushbu istisnoni o'chirmoqchisiz?")) return;
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/schools/menu/exceptions/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "O'chirib bo'lmadi");
      }

      alert("Istisno muvaffaqiyatli o'chirildi!");
      fetchMenuExceptions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportMenuExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuFile) return;
    
    // Choose endpoint based on subtab
    const isCycle = activeMenuSubTab === "cycle";
    if (isCycle && !selectedIntervalId) {
      alert("Avval intervalni tanlang");
      return;
    }

    setMenuImportLoading(true);
    setMenuImportError("");
    setMenuImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedMenuFile);
    if (isCycle && selectedIntervalId) {
      formData.append("interval_id", selectedIntervalId.toString());
    }

    try {
      const endpoint = isCycle ? "import/menu/cycle" : "import/menu/exception";
      const response = await fetch(`${API_URL}/api/schools/${endpoint}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMenuImportResult(data);
        if (isCycle) {
          fetchMenuCycles();
        } else {
          fetchMenuExceptions();
        }
      } else {
        setMenuImportError(data.error || "Excel yuklashda xatolik");
      }
    } catch (err: any) {
      setMenuImportError(err.message || "Serverga ulanish xatosi");
    } finally {
      setMenuImportLoading(false);
    }
  };

  const closeMenuExcelModal = () => {
    setSelectedMenuFile(null);
    setMenuImportError("");
    setMenuImportResult(null);
  };

  const daysNameMap = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

  return (
    <div className="space-y-8 animate-fadeIn text-zinc-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🍲</span> Taomnoma Boshqaruvi
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Maktab o'quvchilari uchun aylanma taomnoma shablonlari va maxsus kunlik taomnomalarni boshqaring.
          </p>
        </div>
        {activeMenuSubTab === "cycle" && (
          <button
            onClick={() => setShowAddIntervalModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition duration-200 shadow-lg shadow-blue-600/15 cursor-pointer"
          >
            + Yangi Interval
          </button>
        )}
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex space-x-1 p-0.5 bg-zinc-950/60 border border-zinc-800/60 rounded-xl w-fit">
        <button
          onClick={() => {
            setActiveMenuSubTab("cycle");
            closeMenuExcelModal();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeMenuSubTab === "cycle"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Aylanma Shablon (Template)
        </button>
        <button
          onClick={() => {
            setActiveMenuSubTab("exception");
            closeMenuExcelModal();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeMenuSubTab === "exception"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Kunlik Istisnolar (Overrides)
        </button>
      </div>

      {activeMenuSubTab === "cycle" ? (
        <div className="space-y-8">
          {/* Section 1: Intervals List */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-zinc-300">Taomnoma Intervallari</h2>
            {menuIntervals.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                <p className="text-xs text-zinc-500">Hozircha hech qanday interval yaratilmagan. Yuqoridagi tugma orqali yangi interval yarating.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuIntervals.map((interval) => {
                  const isSelected = selectedIntervalId === interval.id;
                  return (
                    <div
                      key={interval.id}
                      onClick={() => setSelectedIntervalId(interval.id)}
                      className={`p-4 rounded-xl border backdrop-blur-md cursor-pointer transition flex flex-col justify-between h-32 ${
                        isSelected
                          ? "bg-blue-600/10 border-blue-500 text-blue-100 shadow-md shadow-blue-600/5"
                          : "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="truncate pr-2">
                          <h3 className="font-bold text-sm truncate">{interval.name}</h3>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">
                            {new Date(interval.start_date).toLocaleDateString()} - {new Date(interval.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMenuInterval(interval.id);
                          }}
                          className="text-zinc-500 hover:text-red-400 p-1 hover:bg-zinc-800/40 rounded transition"
                          title="O'chirish"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2 mt-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Tsikl davomiyligi:</span>
                        <span className="text-[11px] font-bold font-mono text-blue-400">{interval.cycle_weeks} hafta</span>
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
                <div className="bg-zinc-900/10 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-md font-bold text-zinc-200">
                        Aylanma taomnoma jadvali: <span className="text-blue-400 font-bold">{activeInterval.name}</span>
                      </h2>
                      <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                        Ushbu interval uchun haftalik taomlarni tahrirlang. Katakni <strong>ikki marta bosib</strong> inline tahrirlashingiz mumkin.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowOnlyFoodDays(!showOnlyFoodDays)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 select-none ${
                        showOnlyFoodDays
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      <span>{showOnlyFoodDays ? "✓" : "○"}</span>
                      <span>Faqat taom bor kunlarni ko'rsatish</span>
                    </button>
                  </div>

                  {menuCyclesLoading ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-zinc-500">Jadval yuklanmoqda...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-850">
                      <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                        <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 w-16 sm:w-20 text-center">Hafta</th>
                            <th className="px-4 py-3 w-20 sm:w-28 text-center">Kun</th>
                            <th className="px-4 py-3">Nonushta (Ertalab)</th>
                            <th className="px-4 py-3">Tushlik (Asosiy)</th>
                            <th className="px-4 py-3">Peshinlik / Kechki</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300 bg-zinc-950/10">
                          {(() => {
                            const rowsToRender: any[] = [];

                            for (let w = 1; w <= activeInterval.cycle_weeks; w++) {
                              for (let d = 1; d <= 6; d++) {
                                const cycleItem = menuCycles.find((c) => c.week_number === w && c.day_of_week === d);
                                let mealsObj: any = { breakfast: "", lunch: "", snack: "" };
                                if (cycleItem && cycleItem.meals) {
                                  try {
                                    mealsObj = typeof cycleItem.meals === "string" ? JSON.parse(cycleItem.meals) : cycleItem.meals;
                                  } catch (e) {}
                                }

                                const breakfast = mealsObj.breakfast || "";
                                const lunch = mealsObj.lunch || "";
                                const snack = mealsObj.snack || "";
                                const hasFood = breakfast || lunch || snack;

                                if (showOnlyFoodDays && !hasFood) {
                                  continue;
                                }

                                rowsToRender.push({
                                  week: w,
                                  day: d,
                                  breakfast,
                                  lunch,
                                  snack,
                                });
                              }
                            }

                            if (rowsToRender.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 italic">
                                    Jadvalda ma'lumot topilmadi.
                                  </td>
                                </tr>
                              );
                            }

                            return rowsToRender.map((row) => {
                              const isEditing = (mealType: string) =>
                                editingCell &&
                                editingCell.week === row.week &&
                                editingCell.day === row.day &&
                                editingCell.mealType === mealType;

                              const renderCell = (mealType: "breakfast" | "lunch" | "snack", currentVal: string) => {
                                if (isEditing(mealType)) {
                                  return (
                                    <input
                                      type="text"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onBlur={() => handleSaveInlineMeal(row.week, row.day, mealType, editingValue)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleSaveInlineMeal(row.week, row.day, mealType, editingValue);
                                        } else if (e.key === "Escape") {
                                          setEditingCell(null);
                                        }
                                      }}
                                      className="w-full bg-zinc-900 border border-blue-500 text-zinc-100 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                      autoFocus
                                    />
                                  );
                                }
                                return (
                                  <div
                                    onDoubleClick={() => {
                                      setEditingCell({ week: row.week, day: row.day, mealType });
                                      setEditingValue(currentVal);
                                    }}
                                    className="min-h-8 px-2 py-1.5 rounded hover:bg-zinc-800/40 transition cursor-pointer select-none truncate"
                                    title="Tahrirlash uchun ikki marta bosing"
                                  >
                                    {currentVal || <span className="text-zinc-650 italic">Kiritilmagan</span>}
                                  </div>
                                );
                              };

                              return (
                                <tr key={`${row.week}_${row.day}`} className="hover:bg-zinc-900/20 transition">
                                  <td className="px-4 py-3 text-center w-16 sm:w-20 font-semibold font-mono text-zinc-400">
                                    <span className="bg-zinc-850 px-2 py-0.5 rounded text-[10px] text-zinc-300">
                                      {row.week}-h
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center w-20 sm:w-28 font-medium text-zinc-300">
                                    {daysNameMap[row.day - 1]}
                                  </td>
                                  <td className="px-4 py-2">{renderCell("breakfast", row.breakfast)}</td>
                                  <td className="px-4 py-2">{renderCell("lunch", row.lunch)}</td>
                                  <td className="px-4 py-2">{renderCell("snack", row.snack)}</td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()
          )}

          {/* Section 3: Excel import and Template Download */}
          {selectedIntervalId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Manual Input (Save Template) */}
              <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Aylanma shablon qo'shish</h3>
                  <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                    Quyidagi formani to'ldirib, tanlangan interval shabloniga yangi kunlik taom qo'shishingiz yoki mavjudini almashtirishingiz mumkin.
                  </p>
                </div>
                <form onSubmit={handleSaveMenuCycle} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Hafta raqami</label>
                      <input
                        type="number"
                        min={1}
                        value={menuWeekNumber}
                        onChange={(e) => setMenuWeekNumber(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2 rounded-xl text-xs outline-none transition font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Hafta kuni</label>
                      <select
                        value={menuDayOfWeek}
                        onChange={(e) => setMenuDayOfWeek(Number(e.target.value))}
                        className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition cursor-pointer"
                      >
                        <option value={1}>Dushanba</option>
                        <option value={2}>Seshanba</option>
                        <option value={3}>Chorshanba</option>
                        <option value={4}>Payshanba</option>
                        <option value={5}>Juma</option>
                        <option value={6}>Shanba</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nonushta (Ertalabki taom)</label>
                      <input
                        type="text"
                        placeholder="Masalan: Tuxum 🍳, non, choy..."
                        value={menuBreakfast}
                        onChange={(e) => setMenuBreakfast(e.target.value)}
                        className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tushlik (Asosiy taom)</label>
                      <input
                        type="text"
                        placeholder="Masalan: Mastava 🍲, palov..."
                        value={menuLunch}
                        onChange={(e) => setMenuLunch(e.target.value)}
                        className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Peshinlik / Kechki ovqat</label>
                      <input
                        type="text"
                        placeholder="Masalan: Mevalar 🍎, pechenye, sharbat..."
                        value={menuSnack}
                        onChange={(e) => setMenuSnack(e.target.value)}
                        className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Saqlanmoqda..." : "Shablonni Saqlash"}
                  </button>
                </form>
              </div>

              {/* Excel Import Panel */}
              <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl p-6 backdrop-blur-xl space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">Excel orqali guruhlab yuklash</h3>
                    <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                      Excel fayl yordamida ushbu tanlangan aylanma shablonga ko'plab kunlarni birdaniga kiritishingiz mumkin.
                    </p>
                  </div>

                  <form onSubmit={handleImportMenuExcel} className="space-y-4">
                    <div className="border border-dashed border-zinc-800/80 rounded-2xl p-6 bg-zinc-950/20 text-center hover:bg-zinc-950/30 transition relative group">
                      <input
                        type="file"
                        id="menuExcelFileInput"
                        accept=".xlsx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setSelectedMenuFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-2.5">
                        <span className="text-2xl block">📁</span>
                        <p className="text-xs text-zinc-300 font-medium">
                          {selectedMenuFile ? selectedMenuFile.name : "Excel faylni tanlang yoki sudrab olib keling"}
                        </p>
                        <p className="text-[10px] text-zinc-500">Faqat aylanma shablon .xlsx fayli qabul qilinadi</p>
                      </div>
                    </div>

                    {menuImportError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl font-mono">
                        {menuImportError}
                      </div>
                    )}

                    {menuImportResult && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl space-y-1.5">
                        <p className="font-bold">Muvaffaqiyatli yuklandi!</p>
                        <ul className="text-[11px] list-disc list-inside space-y-0.5 text-zinc-300">
                          <li>Qabul qilindi: <strong className="text-emerald-400">{menuImportResult.imported_count}</strong> ta satr</li>
                          <li>Xatoliklar: <strong className="text-red-400">{menuImportResult.failed_count}</strong> ta</li>
                        </ul>
                        {menuImportResult.errors && menuImportResult.errors.length > 0 && (
                          <div className="border-t border-emerald-500/20 pt-2 mt-2 max-h-32 overflow-y-auto text-[10px] text-red-300 space-y-1 font-mono">
                            {menuImportResult.errors.map((err: any, index: number) => (
                              <p key={index}>{err.row}-qator: {err.error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={menuImportLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50"
                    >
                      {menuImportLoading ? "Yuklanmoqda..." : "Excel-ni yuklash"}
                    </button>
                  </form>
                </div>

                <div className="border-t border-zinc-850 pt-5 mt-6">
                  <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Namuna shablonini yuklab olish</span>
                  <a
                    href={`${API_URL}/api/schools/import/template/menu/cycle?token=${token}`}
                    download
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[10px] font-medium py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer w-fit"
                  >
                    <span>🔽</span>
                    <span>Aylanma shablon shabloni</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Subtab Exceptions Override
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Manual Exception entry */}
            <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl p-6 backdrop-blur-xl space-y-6">
              <div>
                <h2 className="text-md font-bold text-zinc-200">Maxsus kunlik ovqat qo'shish</h2>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Aylanma taomnomaga kirmaydigan ma'lum sanalar (masalan: bayramlar, maxsus tadbirlar kungi ovqatlar) uchun istisno kiriting.
                </p>
              </div>
              <form onSubmit={handleSaveMenuException} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Sana (Istisno kuni)</label>
                  <input
                    type="date"
                    value={menuExcDate}
                    onChange={(e) => setMenuExcDate(e.target.value)}
                    className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2 rounded-xl text-xs outline-none transition font-mono"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nonushta (Ertalabki taom)</label>
                    <input
                      type="text"
                      placeholder="Masalan: Maxsus bo'tqa 🥛, mevalar..."
                      value={menuExcBreakfast}
                      onChange={(e) => setMenuExcBreakfast(e.target.value)}
                      className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tushlik (Asosiy taom)</label>
                    <input
                      type="text"
                      placeholder="Masalan: Shurva, somsa 🥟..."
                      value={menuExcLunch}
                      onChange={(e) => setMenuExcLunch(e.target.value)}
                      className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Peshinlik / Kechki ovqat</label>
                    <input
                      type="text"
                      placeholder="Masalan: Yogurt, shirinlik..."
                      value={menuExcSnack}
                      onChange={(e) => setMenuExcSnack(e.target.value)}
                      className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500 italic mt-1 font-sans">
                    * Eslatma: Barcha taomlarni bo'sh qoldirsangiz, o'sha kundagi istisno o'chadi.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Istisnoli Taomnomani Saqlash"}
                </button>
              </form>
            </div>

            {/* Excel Exception Import */}
            <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl p-6 backdrop-blur-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h2 className="text-md font-bold text-zinc-200">Excel orqali guruhlab yuklash</h2>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Excel fayl yordamida maxsus sanalarni va ularning taomnomalarini tizimga ommaviy yuklang.
                  </p>
                </div>

                <form onSubmit={handleImportMenuExcel} className="space-y-4">
                  <div className="border border-dashed border-zinc-800/80 rounded-2xl p-6 bg-zinc-950/20 text-center hover:bg-zinc-950/30 transition relative group">
                    <input
                      type="file"
                      id="menuExcelFileInput"
                      accept=".xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedMenuFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2.5">
                      <span className="text-2xl block">📁</span>
                      <p className="text-xs text-zinc-305 font-medium">
                        {selectedMenuFile ? selectedMenuFile.name : "Excel faylni tanlang yoki sudrab olib keling"}
                      </p>
                      <p className="text-[10px] text-zinc-500">Faqat maxsus kunlar .xlsx fayli qabul qilinadi</p>
                    </div>
                  </div>

                  {menuImportError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl font-mono">
                      {menuImportError}
                    </div>
                  )}

                  {menuImportResult && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl space-y-1.5">
                      <p className="font-bold">Muvaffaqiyatli yuklandi!</p>
                      <ul className="text-[11px] list-disc list-inside space-y-0.5 text-zinc-300">
                        <li>Qabul qilindi: <strong className="text-emerald-400">{menuImportResult.imported_count}</strong> ta satr</li>
                        <li>Xatoliklar: <strong className="text-red-400">{menuImportResult.failed_count}</strong> ta</li>
                      </ul>
                      {menuImportResult.errors && menuImportResult.errors.length > 0 && (
                        <div className="border-t border-emerald-500/20 pt-2 mt-2 max-h-32 overflow-y-auto text-[10px] text-red-300 space-y-1 font-mono">
                          {menuImportResult.errors.map((err: any, index: number) => (
                            <p key={index}>{err.row}-qator: {err.error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={menuImportLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {menuImportLoading ? "Yuklanmoqda..." : "Excel-ni yuklash"}
                  </button>
                </form>
              </div>

              <div className="border-t border-zinc-850 pt-5 mt-6">
                <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Namuna shablonini yuklab olish</span>
                <a
                  href={`${API_URL}/api/schools/import/template/menu/exception?token=${token}`}
                  download
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[10px] font-medium py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer w-fit"
                >
                  <span>🔽</span>
                  <span>Kunlik istisno shabloni</span>
                </a>
              </div>
            </div>
          </div>

          {/* Exceptions History list */}
          <div className="bg-zinc-900/10 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div>
              <h3 className="text-md font-bold text-zinc-200">Maxsus kunlik taomnomalar tarixi</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Ushbu ro'yxatda tizimga kiritilgan barcha maxsus kunlik taomlar (istisnolar) ko'rsatiladi.</p>
            </div>

            {menuExceptionsLoading ? (
              <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center space-y-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Tarix yuklanmoqda...</span>
              </div>
            ) : menuExceptions.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20 text-zinc-500 text-xs">
                Hozircha hech qanday maxsus kunlik taomnoma kiritilmagan.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-850">
                <table className="min-w-full divide-y divide-zinc-800/60 text-left">
                  <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 w-32">Sana</th>
                      <th className="px-4 py-3">Nonushta</th>
                      <th className="px-4 py-3">Tushlik</th>
                      <th className="px-4 py-3">Peshinlik / Kechki</th>
                      <th className="px-4 py-3 w-20 text-center">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300 bg-zinc-950/10">
                    {menuExceptions.map((exc) => {
                      let mealsObj: any = { breakfast: "", lunch: "", snack: "" };
                      if (exc.meals) {
                        try {
                          mealsObj = typeof exc.meals === "string" ? JSON.parse(exc.meals) : exc.meals;
                        } catch (e) {}
                      }
                      return (
                        <tr key={exc.id} className="hover:bg-zinc-900/20 transition">
                          <td className="px-4 py-3 font-semibold font-mono text-blue-400">
                            {exc.menu_date}
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate">
                            {mealsObj.breakfast || <span className="text-zinc-650 italic">Bo'sh (Bekor qilingan)</span>}
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate">
                            {mealsObj.lunch || <span className="text-zinc-650 italic">Bo'sh (Bekor qilingan)</span>}
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate">
                            {mealsObj.snack || <span className="text-zinc-650 italic">Bo'sh (Bekor qilingan)</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteMenuException(exc.id)}
                              className="text-zinc-500 hover:text-red-400 p-1 hover:bg-zinc-800/40 rounded transition"
                              title="O'chirish"
                            >
                              🗑️
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
        </div>
      )}

      {/* Modal: Add Menu Interval */}
      {showAddIntervalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi Taomnoma Intervali Yaratish</h3>
            <p className="text-[11px] text-zinc-550 mb-6">Taomnoma amal qilish davri va uning takrorlanish (aylanish) haftasini kiriting.</p>

            <form onSubmit={handleSaveMenuInterval} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Interval nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Birinchi chorak taomnomasi"
                  value={newIntervalName}
                  onChange={(e) => setNewIntervalName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Boshlanish sanasi</label>
                  <input
                    type="date"
                    required
                    value={newIntervalStartDate}
                    onChange={(e) => setNewIntervalStartDate(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tugash sanasi</label>
                  <input
                    type="date"
                    required
                    value={newIntervalEndDate}
                    onChange={(e) => setNewIntervalEndDate(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Aylanish haftalari (Cycle weeks)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={12}
                  value={newIntervalWeeks}
                  onChange={(e) => setNewIntervalWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddIntervalModal(false);
                    setNewIntervalName("");
                    setActionLoading(false);
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
                  {actionLoading ? "Saqlanmoqda..." : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
