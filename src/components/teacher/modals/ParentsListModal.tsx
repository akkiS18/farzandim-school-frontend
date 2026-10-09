"use client";

import React, { useEffect, useState } from "react";
import { X, Copy, Check, Send, User } from "lucide-react";
import PasswordInput from "@/components/common/PasswordInput";

interface LinkedParent {
  id?: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  relation_type?: string;
  phone?: string;
  passport?: string;
  email?: string;
  parent_code?: string;
}

interface ParentsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: any;
  linkedParents: LinkedParent[];
  linkedParentsLoading: boolean;
  onUnlinkParent: (parentId: any) => void;
  parentFirstName: string;
  setParentFirstName: (v: string) => void;
  parentLastName: string;
  setParentLastName: (v: string) => void;
  parentMiddleName: string;
  setParentMiddleName: (v: string) => void;
  parentPhone: string;
  setParentPhone: (v: string) => void;
  parentPassport: string;
  setParentPassport: (v: string) => void;
  parentPassword: string;
  setParentPassword: (v: string) => void;
  onLinkParentSubmit: (e: React.FormEvent) => void;
  actionLoading: boolean;
}

export default function ParentsListModal({
  isOpen,
  onClose,
  selectedStudent,
  linkedParents,
  linkedParentsLoading,
  onUnlinkParent,
  parentFirstName,
  setParentFirstName,
  parentLastName,
  setParentLastName,
  parentMiddleName,
  setParentMiddleName,
  parentPhone,
  setParentPhone,
  parentPassport,
  setParentPassport,
  parentPassword,
  setParentPassword,
  onLinkParentSubmit,
  actionLoading,
}: ParentsListModalProps) {
  const [viewingParentCard, setViewingParentCard] = useState<LinkedParent | null>(null);
  const [copiedParentId, setCopiedParentId] = useState<number | string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setViewingParentCard(null);
      setCopiedParentId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewingParentCard) {
          setViewingParentCard(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, viewingParentCard]);

  const generateInviteText = (parent: LinkedParent) => {
    const studentFullName = `${selectedStudent?.first_name || ""} ${selectedStudent?.last_name || ""}`.trim() || "o'quvchi";
    const parentName = `${parent.first_name || ""} ${parent.last_name || ""}`.trim() || "Hurmatli ota-ona";
    
    // DB-dagi haqiqiy login: ota-onaning pasporti yoki telefoni
    const actualLogin = (parent.passport || parent.phone || "").trim().toUpperCase();
    const loginDisplay = parent.passport
      ? parent.passport.trim().toUpperCase()
      : (parent.phone || "Kiritilmagan");

    const baseUrl = typeof window !== "undefined" 
      ? window.location.origin 
      : "https://farzandim.uz";

    const autoLoginUrl = actualLogin
      ? `${baseUrl}/login?mode=passport&passport=${encodeURIComponent(actualLogin)}`
      : `${baseUrl}/login?mode=passport`;

    return `Hurmatli ota-ona (${parentName}),

"Farzandim" maktab boshqaruvi va onlayn kundalik tizimiga xush kelibsiz! Farzandingiz (${studentFullName})ning maktabdagi baholari, dars jadvali va davomatini muntazam kuzatib borish uchun tizimga taklif qilamiz.

🔗 Tizimga avtomatik kirish havolasi:
${autoLoginUrl}

(Yuqoridagi havola ustiga bossangiz, ota-onalar bo'limi avtomatik ochiladi)

🔑 Tizimga kirish ma'lumotlaringiz:
🔹 Login: ${loginDisplay}
🔹 Parol: ||123||
(Parol ustiga bossangiz ko'rinadi. Tizimga kirgach, xavfsizlik uchun parolingizni o'zgartirishingiz mumkin)

🌐 Veb-sayt: ${baseUrl}

ℹ️ Eslatma:
Hurmatli ota-ona, agar tizimdagi ism-familiyangiz yoki pasport seriya raqamingizda texnik noaniqliklar bo'lsa, dasturchilar guruhi nomidan uzr so'raymiz. Tizimga kirishda qiyinchilikka duch kelsangiz yoki ma'lumotlarda xatolik sezsangiz, iltimos, farzandingizning sinf rahbariga xabar bering. Shuningdek, veb-sayt ishlashida kamchiliklar kuzatilayotgan bo'lsa, texnik yordam uchun @farzandim_edu_bot Telegram botiga yozishingiz mumkin — mutaxassislarimiz barchasini zudlik bilan to'g'rilab berishadi.`;
  };

  const handleCopyInvite = (parent: LinkedParent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = generateInviteText(parent);
    const pId = parent.id || parent.user_id || 1;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedParentId(pId);
      setTimeout(() => {
        setCopiedParentId((curr) => (curr === pId ? null : curr));
      }, 2500);
    }).catch((err) => {
      console.error("Nusxalashda xatolik:", err);
      alert("Nusxalashda xatolik yuz berdi");
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white border border-neutral-200 shadow-sm w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-neutral-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-lg font-bold font-serif text-[#1E2B42]">Vasiylar Boshqaruvi</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                O'quvchi:{" "}
                <strong className="text-slate-800">
                  {selectedStudent?.last_name} {selectedStudent?.first_name}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white hover:bg-slate-100 border border-neutral-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Linked Parents List */}
            <div>
              <h4 className="text-sm font-bold font-serif text-slate-800 mb-3 flex items-center">
                <span>Bog'langan Ota-onalar</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-none font-sans font-bold">
                  {linkedParents.length}
                </span>
              </h4>

              {linkedParentsLoading ? (
                <div className="text-center py-8 border border-dashed border-neutral-300 bg-slate-50">
                  <div className="w-6 h-6 border-2 border-[#1E2B42] border-t-transparent rounded-none animate-spin mx-auto mb-1"></div>
                  <p className="text-xs text-slate-500 font-sans">Yuklanmoqda...</p>
                </div>
              ) : linkedParents.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-neutral-300 bg-slate-50">
                  <p className="text-xs text-slate-500 font-sans">
                    Ushbu o'quvchiga hali ota-ona bog'lanmagan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedParents.map((parent) => {
                    const pId = parent.id || parent.user_id;
                    const isCopied = copiedParentId === pId;

                    return (
                      <div
                        key={pId}
                        onClick={() => setViewingParentCard(parent)}
                        className="flex items-center justify-between p-3.5 border border-neutral-200 bg-slate-50 hover:bg-indigo-50/20 hover:border-indigo-200 transition cursor-pointer group"
                        title="Ota-ona kartochkasini ochish uchun bosing"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition-colors truncate">
                              {parent.first_name} {parent.last_name} {parent.middle_name || ""}
                            </p>
                            {parent.relation_type && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-none bg-slate-200 text-slate-700 font-sans shrink-0">
                                {parent.relation_type === "ota"
                                  ? "Otasi"
                                  : parent.relation_type === "ona"
                                  ? "Onasi"
                                  : parent.relation_type}
                              </span>
                            )}
                            <span className="text-[10px] text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block shrink-0">
                              (kartochkani ko'rish →)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-sans mt-1 flex flex-wrap items-center gap-2">
                            <span>
                              Tel:{" "}
                              <b className="text-slate-700">
                                {parent.phone || "? (Otasi/Onasi raqamiga biriktirilgan)"}
                              </b>
                            </span>
                            <span>|</span>
                            <span>
                              Pasport:{" "}
                              <b className="text-slate-700 font-bold">
                                {parent.passport || "Kiritilmagan"}
                              </b>
                            </span>
                            {parent.email && <span>| Email: {parent.email}</span>}
                          </p>
                          {parent.parent_code && (
                            <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-none font-sans inline-block mt-1 font-bold">
                              Taklif kodi: {parent.parent_code}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleCopyInvite(parent, e)}
                            title="Telegram taklifnomasini nusxalash"
                            className={`p-2 border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                              isCopied
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Nusxalandi</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Taklifnoma</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnlinkParent(pId);
                            }}
                            className="text-xs bg-red-50 border border-red-200 text-[#A51C30] hover:bg-red-100 font-bold py-2 px-3 transition cursor-pointer"
                          >
                            Ajratish
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <hr className="border-neutral-200" />

            {/* Manual Link/Add parent Form */}
            <form onSubmit={onLinkParentSubmit} className="space-y-4">
              <h4 className="text-sm font-bold font-serif text-slate-800 uppercase tracking-wider">
                Yangi Ota-onani Bog'lash (Qo'shish)
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                    Ism *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                    placeholder="Masalan: Asror"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                    Familiya *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentLastName}
                    onChange={(e) => setParentLastName(e.target.value)}
                    className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                    placeholder="Masalan: Karimov"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                    Otasining ismi (Sharifi)
                  </label>
                  <input
                    type="text"
                    value={parentMiddleName}
                    onChange={(e) => setParentMiddleName(e.target.value)}
                    className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                    placeholder="Masalan: Baxtiyorovich"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                    Telefon *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="new-password" name="off"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                    placeholder="Masalan: +998901234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                    Pasport
                  </label>
                  <input
                    type="text"
                    autoComplete="new-password" name="off"
                    value={parentPassport}
                    onChange={(e) => setParentPassport(e.target.value)}
                    className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                    placeholder="Masalan: AA1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                    Parol *
                  </label>
                  {/* Yandex / Chrome autofill trap */}
                  <input type="text" name="fakeusernameremembered" autoComplete="username" className="absolute w-0 h-0 opacity-0 -z-10" tabIndex={-1} aria-hidden="true" />
                  <PasswordInput
                    autoComplete="new-password"
                    required
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-neutral-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans cursor-pointer transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#A51C30] hover:bg-[#8a1526] text-white text-xs font-bold font-sans disabled:opacity-50 flex items-center space-x-2 cursor-pointer transition"
                >
                  {actionLoading && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-none animate-spin shrink-0"></span>
                  )}
                  <span>Ota-onani bog'lash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ─── PARENT DETAIL CARD MODAL ─── */}
      {viewingParentCard && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-60 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingParentCard(null);
          }}
        >
          <div className="bg-white border border-neutral-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            {/* Card Header */}
            <div className="px-5 py-3.5 border-b border-neutral-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-[#1E2B42] text-white flex items-center justify-center text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#1E2B42]">Ota-ona Kartochkasi</h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Farzandi: <b>{selectedStudent?.last_name} {selectedStudent?.first_name}</b> {selectedStudent?.class_name ? `(${selectedStudent.class_name})` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingParentCard(null)}
                className="p-1.5 bg-white hover:bg-slate-100 border border-neutral-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Profile Card Header */}
              <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-neutral-200">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-base font-bold text-[#1E2B42]">
                    {viewingParentCard.first_name} {viewingParentCard.last_name} {viewingParentCard.middle_name || ""}
                  </h4>
                  {viewingParentCard.relation_type && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-[#1E2B42] text-white font-sans">
                      {viewingParentCard.relation_type === "ota"
                        ? "Otasi"
                        : viewingParentCard.relation_type === "ona"
                        ? "Onasi"
                        : viewingParentCard.relation_type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Biriktirilgan o'quvchi: <span className="font-semibold text-slate-700">{selectedStudent?.last_name} {selectedStudent?.first_name}</span> {selectedStudent?.class_name ? `(${selectedStudent.class_name})` : ""}
                </p>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-sans">
                <div className="p-3 bg-slate-50 border border-neutral-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Asosiy Login (Pasport)
                  </span>
                  <span className="font-mono font-bold text-[#1E2B42] text-sm">
                    {viewingParentCard.passport || viewingParentCard.phone || "Kiritilmagan"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-neutral-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Telefon raqami
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {viewingParentCard.phone || "Kiritilmagan"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-neutral-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Standart parol
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    123 <span className="text-[10px] text-slate-400 font-sans font-normal">(yoki pasport)</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-neutral-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Taklif kodi
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {viewingParentCard.parent_code || "Mavjud emas"}
                  </span>
                </div>
              </div>

              {/* Telegram Invitation Prompt Section */}
              <div className="border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-indigo-950 font-serif">
                    Telegram Taklifnomasi
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyInvite(viewingParentCard)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs ${
                      copiedParentId === (viewingParentCard.id || viewingParentCard.user_id || 1)
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {copiedParentId === (viewingParentCard.id || viewingParentCard.user_id || 1) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Nusxalandi!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Nusxa olish</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Prompt Preview Text */}
                <div className="bg-white border border-indigo-200/60 p-3 rounded-none text-xs font-sans text-slate-700 whitespace-pre-wrap leading-relaxed select-all max-h-44 overflow-y-auto">
                  {generateInviteText(viewingParentCard)}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <a
                    href={`https://t.me/share/url?url=https://farzandim.uz&text=${encodeURIComponent(generateInviteText(viewingParentCard))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram orqali yuborish</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-5 py-3 border-t border-neutral-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingParentCard(null)}
                className="px-4 py-2 border border-neutral-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold font-sans cursor-pointer transition"
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
