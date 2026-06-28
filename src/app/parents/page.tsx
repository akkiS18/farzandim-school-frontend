"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  school_id: string;
}

interface StudentChild {
  id: number;
  first_name: string;
  last_name: string;
  class_id: number;
  class_name: string;
}

interface GradeItem {
  id: number;
  student_id: number;
  subject_name: string;
  teacher_name: string;
  value: string;
  numeric_value?: number;
  grade_date: string;
  status: string;
  approved_by_parent: boolean;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  author: string;
}

export default function ParentDashboard() {
  const router = useRouter();

  // Auth States
  const [token, setToken] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Children & Selection
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | "">("");

  // Grade lists
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState<number | null>(null);
  const [approveAllLoading, setApproveAllLoading] = useState<string | null>(null);

  // Noticeboard list (Noticeboards announcements)
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: "Chorak yakuni va ota-onalar majlisi",
      content: "Joriy chorak yakunlanishi munosabati bilan barcha ota-onalar uchun juma kuni soat 17:00 da umumiy majlis bo'lib o'tadi. Farzandingiz kundaligini tekshirib kelishingiz so'raladi.",
      date: new Date().toLocaleDateString(),
      author: "Maktab Ma'muriyati",
    },
    {
      id: 2,
      title: "Matematika fanidan qo'shimcha to'garak",
      content: "Shanba kunlari soat 10:00 da o'quvchilar uchun matematika fanidan bepul olimpiadaga tayyorgarlik darslari boshlanmoqda.",
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      author: "Matematika o'qituvchisi",
    },
  ]);

  // 1. Check Auth & Load Children list
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
      const parsedUser = JSON.parse(savedUserStr);
      if (parsedUser.role !== "PARENT" && parsedUser.role !== "ADMIN") {
        router.push("/login");
        return;
      }
      setUserInfo(parsedUser);
      fetchLinkedChildren(savedToken, parsedUser.id, savedSchoolId);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  const fetchLinkedChildren = async (authToken: string, parentId: number, currentSchoolId: string) => {
    setLoading(true);
    try {
      // Fetch classes where parent has student children.
      // Wait, we can fetch users with parent filter or directly fetch student list linked to this parent!
      // In the backend, we can query students by parent ID.
      // Let's use the student endpoints or check student parents.
      // Let's call GET /api/schools/users?role=STUDENT
      const response = await fetch(`${API_URL}/api/schools/users?role=STUDENT`, {
        headers: { "Authorization": `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        // Find students that have this parent ID linked (or we show all kids, since parent database query filters parent context)
        // Wait! In tenant user endpoints, if user is PARENT, the backend filters students or we can display the students.
        // Let's look at how the backend returns students:
        // We can query GET /api/schools/users?role=STUDENT
        const childrenList = data.map((u: any) => ({
          id: u.student_id || u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          class_id: u.class_id || 0,
          class_name: u.class_name || "Noma'lum sinf",
        }));
        setChildren(childrenList);
        if (childrenList.length > 0) {
          setSelectedChildId(childrenList[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch grades for selected child
  useEffect(() => {
    if (selectedChildId) {
      fetchChildGrades();
    } else {
      setGrades([]);
    }
  }, [selectedChildId]);

  const fetchChildGrades = async () => {
    setGradesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/grades?student_id=${selectedChildId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setGrades(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGradesLoading(false);
    }
  };

  const handleParentApprove = async (gradeId: number) => {
    setApproveLoading(gradeId);
    try {
      const response = await fetch(`${API_URL}/api/schools/grades/${gradeId}/parent-approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Tasdiqlashda xatolik yuz berdi");
        return;
      }
      setGrades(prev => prev.map(g => g.id === gradeId ? { ...g, approved_by_parent: true } : g));
    } catch (e) {
      console.error(e);
    } finally {
      setApproveLoading(null);
    }
  };

  const handleApproveAll = async (weekKey: string, weekGrades: GradeItem[]) => {
    const pending = weekGrades.filter(g => !g.approved_by_parent && g.status !== 'approved');
    if (pending.length === 0) return;
    setApproveAllLoading(weekKey);
    try {
      await Promise.all(
        pending.map(g =>
          fetch(`${API_URL}/api/schools/grades/${g.id}/parent-approve`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
          })
        )
      );
      const approvedIds = new Set(pending.map(g => g.id));
      setGrades(prev => prev.map(g => approvedIds.has(g.id) ? { ...g, approved_by_parent: true } : g));
    } catch (e) {
      console.error(e);
    } finally {
      setApproveAllLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };

  // Helper: get Monday of the week for a date string
  const getWeekStart = (dateStr: string): Date => {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  };

  const getWeekKey = (dateStr: string): string => getWeekStart(dateStr).toISOString().split('T')[0];

  const getWeekLabel = (weekKey: string): string => {
    const mon = new Date(weekKey);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
    return `${fmt(mon)} — ${fmt(sun)}`;
  };

  // Group grades by week
  const gradesByWeek: { weekKey: string; label: string; items: GradeItem[] }[] = (() => {
    const map = new Map<string, GradeItem[]>();
    for (const g of grades) {
      const k = getWeekKey(g.grade_date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(g);
    }
    // Sort weeks newest first
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekKey, items]) => ({
        weekKey,
        label: getWeekLabel(weekKey),
        items: [...items].sort((a, b) => new Date(b.grade_date).getTime() - new Date(a.grade_date).getTime()),
      }));
  })();

  // Helper to group grades by subject (for chart)
  const gradesBySubject = grades.reduce<{ [subject: string]: GradeItem[] }>((acc, grade) => {
    if (!acc[grade.subject_name]) {
      acc[grade.subject_name] = [];
    }
    acc[grade.subject_name].push(grade);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-900 flex flex-col font-sans selection:bg-zinc-200">
      {/* Top Header */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-sm tracking-wider">OJ</span>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 uppercase">Ota-ona Portali</h1>
            <p className="text-[10px] text-zinc-500 font-mono font-semibold">ONLINE JURNAL</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold">{userInfo?.first_name} {userInfo?.last_name}</p>
            <p className="text-[9px] text-emerald-600 font-mono uppercase tracking-wider font-semibold">Vasiy (Ota-ona)</p>
          </div>
          <button
            onClick={handleLogout}
            className="border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
          >
            Chiqish
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Child Selector */}
        {children.length > 1 && (
          <section className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">O'quvchini tanlang:</span>
            <div className="flex gap-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${selectedChildId === child.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border-zinc-200"
                    }`}
                >
                  {child.first_name} ({child.class_name})
                </button>
              ))}
            </div>
          </section>
        )}

        {children.length === 0 ? (
          <section className="text-center py-20 border border-dashed border-zinc-200 rounded-xl bg-white/40">
            <svg className="w-8 h-8 text-zinc-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <p className="text-zinc-500 text-xs font-mono">Hozircha sizga biriktirilgan o'quvchilar topilmadi.</p>
          </section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left and Middle Columns (Grades and Analytics) */}
            <div className="md:col-span-2 space-y-6">
              {/* Weekly-grouped grades feed */}
              <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Baholar ro&apos;yxati (Haftalar bo&apos;yicha)</h2>
                  {grades.filter(g => !g.approved_by_parent && g.status !== 'approved').length > 0 && (
                    <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 font-bold px-2 py-0.5 rounded-full font-mono">
                      {grades.filter(g => !g.approved_by_parent && g.status !== 'approved').length} ta ko&apos;rib chiqilmagan
                    </span>
                  )}
                </div>

                {gradesLoading ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : grades.length === 0 ? (
                  <p className="text-zinc-400 text-xs italic font-mono text-center py-6">Baholar hali qo&apos;yilmagan.</p>
                ) : (
                  <div className="space-y-5 max-h-[540px] overflow-y-auto pr-1">
                    {gradesByWeek.map(({ weekKey, label, items }) => {
                      const weekPending = items.filter(g => !g.approved_by_parent && g.status !== 'approved');
                      const isWeekLoading = approveAllLoading === weekKey;
                      return (
                        <div key={weekKey} className="border border-zinc-100 rounded-xl overflow-hidden">
                          {/* Week header */}
                          <div className="flex items-center justify-between bg-zinc-50 px-4 py-2.5 border-b border-zinc-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">{label}</span>
                              {weekPending.length > 0 && (
                                <span className="text-[9px] bg-amber-100 border border-amber-200 text-amber-700 font-bold px-1.5 py-0.5 rounded-full font-mono">
                                  {weekPending.length} ta
                                </span>
                              )}
                            </div>
                            {weekPending.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleApproveAll(weekKey, items)}
                                disabled={isWeekLoading}
                                className="text-[9px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 disabled:cursor-not-allowed"
                              >
                                {isWeekLoading ? (
                                  <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Tasdiqlanmoqda...</span></>
                                ) : (
                                  <><span>&#10003;</span><span>Barchasini tasdiqlash</span></>
                                )}
                              </button>
                            )}
                            {weekPending.length === 0 && (
                              <span className="text-[9px] text-emerald-600 font-bold font-mono">&#10003; Hammasi ko&apos;rib chiqilgan</span>
                            )}
                          </div>
                          {/* Grade rows */}
                          <div className="divide-y divide-zinc-100">
                            {items.map((gr) => {
                              const isApproved = gr.status === 'approved';
                              const isParentApproved = gr.approved_by_parent;
                              return (
                                <div key={gr.id} className={`py-3 px-4 flex items-center justify-between hover:bg-zinc-50/60 transition ${
                                  !isParentApproved && !isApproved ? 'border-l-2 border-amber-300' : 'border-l-2 border-transparent'
                                }`}>
                                  <div>
                                    <p className="text-xs font-bold text-zinc-900">{gr.subject_name}</p>
                                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{gr.teacher_name} &bull; {new Date(gr.grade_date).toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isApproved ? (
                                      <span className="text-[9px] bg-blue-50 border border-blue-200 text-blue-600 font-bold px-1.5 py-0.5 rounded font-mono">
                                        &#128274; Tasdiqlangan
                                      </span>
                                    ) : isParentApproved ? (
                                      <span className="text-[9px] bg-teal-50 border border-teal-200 text-teal-600 font-bold px-1.5 py-0.5 rounded font-mono">
                                        &#10003; Ko&apos;rdim
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleParentApprove(gr.id)}
                                        disabled={approveLoading === gr.id}
                                        className="text-[9px] bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-300 text-amber-700 font-bold px-2 py-1 rounded transition cursor-pointer disabled:opacity-60"
                                      >
                                        {approveLoading === gr.id ? '...' : "Ko'rdim ✓"}
                                      </button>
                                    )}
                                    <span className={`w-8 h-8 rounded font-mono font-bold text-xs flex items-center justify-center border shadow-sm ${
                                      isApproved ? 'bg-blue-600 border-blue-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
                                    }`}>
                                      {gr.value}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* performance dynamics chart */}
              <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">O'zgarish Dinamikasi (Dynamics Chart)</h2>

                {grades.length === 0 ? (
                  <p className="text-zinc-400 text-xs italic font-mono text-center py-6">Grafik chizish uchun ma'lumotlar yetarli emas.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(gradesBySubject).map(([subjName, subjGrades]) => {
                      // Filter numeric grades to draw a line
                      const numericPoints = subjGrades
                        .map((g) => {
                          const val = g.numeric_value !== undefined ? g.numeric_value : parseFloat(g.value);
                          return isNaN(val) ? null : val;
                        })
                        .filter((v): v is number => v !== null);

                      if (numericPoints.length < 2) return null;

                      // Map values to coordinates in 300x100 viewbox
                      // min score 1, max score 5
                      const width = 300;
                      const height = 100;
                      const paddingLeft = 25;
                      const paddingRight = 15;
                      const paddingVertical = 15;
                      
                      const pointsStr = numericPoints
                        .map((val, idx) => {
                          const x = paddingLeft + (idx / (numericPoints.length - 1)) * (width - paddingLeft - paddingRight);
                          const y = height - paddingVertical - ((val - 1) / (5 - 1)) * (height - 2 * paddingVertical);
                          return `${x},${y}`;
                        })
                        .join(" ");

                      // Bottom boundary projection coordinates for area polygon
                      const bottomY = height - paddingVertical;
                      const firstX = paddingLeft;
                      const lastX = width - paddingRight;
                      const areaPointsStr = `${firstX},${bottomY} ${pointsStr} ${lastX},${bottomY}`;

                      return (
                        <div key={subjName} className="border-b border-zinc-100 pb-5 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-800">{subjName}</span>
                            <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                              O'rtacha: {(numericPoints.reduce((a, b) => a + b, 0) / numericPoints.length).toFixed(1)}
                            </span>
                          </div>

                          <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-150">
                            <svg className="w-full h-24" viewBox="0 0 300 100">
                              <defs>
                                <linearGradient id={`gradient-${subjName.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#059669" stopOpacity="0.00" />
                                </linearGradient>
                              </defs>

                              {/* Horizontal Grid lines with axis label numbers */}
                              {[1, 2, 3, 4, 5].map((val) => {
                                const y = height - paddingVertical - ((val - 1) / (5 - 1)) * (height - 2 * paddingVertical);
                                return (
                                  <g key={val}>
                                    <line
                                      x1={paddingLeft}
                                      y1={y}
                                      x2={width - paddingRight}
                                      y2={y}
                                      stroke="#e4e4e7"
                                      strokeWidth="0.75"
                                      strokeDasharray="3 3"
                                    />
                                    <text
                                      x="10"
                                      y={y + 3}
                                      fill="#71717a"
                                      fontSize="7"
                                      fontFamily="monospace"
                                      textAnchor="middle"
                                    >
                                      {val}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Polygon Area Under Line */}
                              <polygon points={areaPointsStr} fill={`url(#gradient-${subjName.replace(/\s+/g, '-')})`} />

                              {/* Line Path */}
                              <polyline
                                fill="none"
                                stroke="#059669"
                                strokeWidth="2.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={pointsStr}
                              />

                              {/* Dots & Labels */}
                              {numericPoints.map((val, idx) => {
                                const x = paddingLeft + (idx / (numericPoints.length - 1)) * (width - paddingLeft - paddingRight);
                                const y = height - paddingVertical - ((val - 1) / (5 - 1)) * (height - 2 * paddingVertical);
                                return (
                                  <g key={idx}>
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="3.5"
                                      fill="#ffffff"
                                      stroke="#059669"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x={x}
                                      y={y - 7}
                                      fill="#047857"
                                      fontSize="7"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                      fontFamily="sans-serif"
                                    >
                                      {val}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Noticeboard & Feed */}
            <div className="space-y-6">
              <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">E'lonlar taxtasi (Noticeboard)</h2>
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <article key={ann.id} className="border-b border-zinc-150 pb-3 last:border-b-0 last:pb-0 space-y-1">
                      <h3 className="text-xs font-bold text-zinc-900">{ann.title}</h3>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">{ann.content}</p>
                      <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono pt-1">
                        <span>{ann.author}</span>
                        <span>{ann.date}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Short profile card */}
              {selectedChild && (
                <section className="bg-emerald-950/90 border border-emerald-800/80 text-emerald-100 rounded-xl p-5 space-y-3 font-mono">
                  <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">O'quvchi ma'lumotlari</h3>
                  <div className="text-xs space-y-1">
                    <p className="text-emerald-300">Ism: <strong className="text-white">{selectedChild.first_name} {selectedChild.last_name}</strong></p>
                    <p className="text-emerald-300">Sinf: <strong className="text-white">{selectedChild.class_name}</strong></p>
                    <p className="text-emerald-300">Maktab ID: <strong className="text-white">{schoolId.slice(0, 8)}...</strong></p>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 py-6 text-center text-[10px] text-zinc-400 font-mono mt-auto">
        &copy; {new Date().getFullYear()} ONLINE JURNAL.
      </footer>
    </div>
  );
}
