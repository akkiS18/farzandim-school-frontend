"use client";

import React from "react";
import { X } from "lucide-react";

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
  actionLoading: boolean;
  onLinkParentSubmit: (e: React.FormEvent) => void;
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
  actionLoading,
  onLinkParentSubmit,
}: ParentsListModalProps) {
  if (!isOpen || !selectedStudent) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[85vh] animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#16193E]">Vasiylar Boshqaruvi</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              O'quvchi:{" "}
              <strong className="text-zinc-800">
                {selectedStudent.first_name} {selectedStudent.last_name}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Linked Parents list */}
          <div>
            <h4 className="text-xs font-bold text-zinc-700 mb-3 flex items-center">
              <span>Bog'langan Ota-onalar</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-full font-mono font-bold">
                {linkedParents.length}
              </span>
            </h4>

            {linkedParentsLoading ? (
              <div className="text-center py-8 border border-dashed border-zinc-200 rounded-2xl">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
              </div>
            ) : linkedParents.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                <p className="text-xs text-zinc-400 font-mono">
                  Ushbu o'quvchiga hali ota-ona bog'lanmagan.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedParents.map((parent) => (
                  <div
                    key={parent.id || parent.user_id}
                    className="flex items-center justify-between p-3.5 border border-zinc-200/70 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-extrabold text-zinc-800">
                          {parent.first_name} {parent.last_name} {parent.middle_name || ""}
                        </p>
                        {parent.relation_type && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                            {parent.relation_type === "ota"
                              ? "Otasi"
                              : parent.relation_type === "ona"
                              ? "Onasi"
                              : parent.relation_type}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono mt-1 flex flex-wrap items-center gap-2">
                        <span>
                          Tel:{" "}
                          <b className="text-zinc-700">
                            {parent.phone || "— (Otasi/Onasi raqamiga biriktirilgan)"}
                          </b>
                        </span>
                        <span>|</span>
                        <span>
                          Pasport:{" "}
                          <b className="text-indigo-700 font-bold">
                            {parent.passport || "Kiritilmagan"}
                          </b>
                        </span>
                        {parent.email && <span>| Email: {parent.email}</span>}
                      </p>
                      {parent.parent_code && (
                        <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-mono inline-block mt-1 font-bold">
                          Taklif kodi: {parent.parent_code}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onUnlinkParent(parent.id || parent.user_id)}
                      className="text-xs bg-red-50 border border-red-200 text-red-650 hover:bg-red-100 font-bold py-1.5 px-3 rounded-xl transition cursor-pointer"
                    >
                      Ajratish
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-zinc-100" />

          {/* Manual Link/Add parent Form */}
          <form onSubmit={onLinkParentSubmit} className="space-y-4">
            <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">
              Yangi Ota-onani Bog'lash (Qo'shish)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Ism *
                </label>
                <input
                  type="text"
                  required
                  value={parentFirstName}
                  onChange={(e) => setParentFirstName(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                  placeholder="Masalan: Asror"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Familiya *
                </label>
                <input
                  type="text"
                  required
                  value={parentLastName}
                  onChange={(e) => setParentLastName(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                  placeholder="Masalan: Karimov"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Otasining ismi (Sharifi)
                </label>
                <input
                  type="text"
                  value={parentMiddleName}
                  onChange={(e) => setParentMiddleName(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                  placeholder="Masalan: Baxtiyorovich"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Telefon *
                </label>
                <input
                  type="text"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                  placeholder="Masalan: +998901234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Pasport
                </label>
                <input
                  type="text"
                  value={parentPassport}
                  onChange={(e) => setParentPassport(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                  placeholder="Masalan: AA1234567"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Parol *
                </label>
                <input
                  type="password"
                  required
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                  placeholder="Kamida 6 ta belgi"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                {actionLoading && (
                  <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
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
