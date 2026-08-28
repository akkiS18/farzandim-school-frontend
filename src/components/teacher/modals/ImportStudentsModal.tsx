"use client";

import React from "react";
import { X } from "lucide-react";

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  importLoading: boolean;
  importError: string | null;
  importResult: { imported_count: number } | null;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  onDownloadTemplate,
  onSubmit,
  selectedFile,
  onFileChange,
  importLoading,
  importError,
  importResult,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden transition-all transform scale-100 animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between text-zinc-900">
          <div>
            <h3 className="text-base font-extrabold text-[#16193E]">Excel Orqali O'quvchilarni Yuklash</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Bir vaqtning o'zida bir nechta o'quvchi hisobini yaratish va sinflarga joylash
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

        <div className="p-6 space-y-5 text-zinc-900">
          {/* Step 1: Download Template */}
          <div className="bg-zinc-50/70 border border-zinc-200/70 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-[#16193E]">1-bosqich: Shablonni yuklab olish</p>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                Ustunlar: ism, familiya, sharif, sinf (namuna bilan birga)
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer shrink-0 shadow-xs"
            >
              Shablonni yuklash
            </button>
          </div>

          {/* Step 2: Upload Excel File */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-extrabold text-[#16193E] mb-2">2-bosqich: To'ldirilgan shablonni yuklash</p>
              <label className="border-2 border-dashed border-zinc-200 rounded-2xl py-6 px-4 text-center block cursor-pointer hover:bg-zinc-50/80 transition">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onFileChange(e.target.files[0]);
                    }
                  }}
                />
                <svg className="w-8 h-8 text-zinc-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-bold text-zinc-800">
                  {selectedFile ? selectedFile.name : "Excel faylini tanlang (.xlsx)"}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">Fayl hajmi 5MB dan oshmasligi kerak</p>
              </label>
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs space-y-1">
                <p className="font-extrabold">Muvaffaqiyatli yuklandi!</p>
                <ul className="list-disc pl-4 font-mono text-[11px] space-y-0.5 font-semibold">
                  <li>Yuklangan o'quvchilar: {importResult.imported_count} ta</li>
                </ul>
              </div>
            )}

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
                disabled={importLoading || !selectedFile}
                className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                {importLoading && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                <span>Yuklash</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
