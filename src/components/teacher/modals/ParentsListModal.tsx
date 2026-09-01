"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
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
                {selectedStudent?.first_name} {selectedStudent?.last_name}
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
                {linkedParents.map((parent) => (
                  <div
                    key={parent.id || parent.user_id}
                    className="flex items-center justify-between p-3.5 border border-neutral-200 bg-slate-50 hover:bg-white transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-bold text-slate-800">
                          {parent.first_name} {parent.last_name} {parent.middle_name || ""}
                        </p>
                        {parent.relation_type && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-none bg-slate-200 text-slate-700 font-sans">
                            {parent.relation_type === "ota"
                              ? "Otasi"
                              : parent.relation_type === "ona"
                              ? "Onasi"
                              : parent.relation_type}
                          </span>
                        )}
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
                    <button
                      type="button"
                      onClick={() => onUnlinkParent(parent.id || parent.user_id)}
                      className="text-xs bg-red-50 border border-red-200 text-[#A51C30] hover:bg-red-100 font-bold py-1.5 px-3 transition cursor-pointer"
                    >
                      Ajratish
                    </button>
                  </div>
                ))}
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
                {/* Yandex / Chrome autofill trap: absorbs the "username" autofill so it doesn't leak to Passport */}
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
  );
}

