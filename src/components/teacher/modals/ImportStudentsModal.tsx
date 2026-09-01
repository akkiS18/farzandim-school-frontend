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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-neutral-200 w-full max-w-lg overflow-hidden transition-all transform scale-100 animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold font-serif text-[#1E2B42]">Excel Orqali O'quvchilarni Yuklash</h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Bir nechta o'quvchini bir vaqtda tizimga qo'shish
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

        <div className="p-6 space-y-6 text-slate-800 bg-white">
          {/* Step 1: Download Template */}
          <div className="bg-slate-50 border border-neutral-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold font-serif text-[#1E2B42]">1-bosqich: Shablonni yuklab olish</p>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Ustunlar: ism, familiya, sharif, sinf va hokazo
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="bg-[#1E2B42] hover:bg-slate-800 text-white font-bold font-sans text-xs py-2 px-4 transition cursor-pointer shrink-0"
            >
              Shablonni yuklash
            </button>
          </div>

          {/* Step 2: Upload Excel File */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-bold font-serif text-[#1E2B42] mb-2">2-bosqich: To'ldirilgan shablonni yuklash</p>
              <label className="border-2 border-dashed border-neutral-300 py-6 px-4 text-center block cursor-pointer hover:bg-slate-50 transition">
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
                <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-bold font-sans text-slate-700">
                  {selectedFile ? selectedFile.name : "Excel faylini tanlang (.xlsx)"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">Fayl hajmi 5MB dan oshmasligi kerak</p>
              </label>
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-[#A51C30] p-3 text-xs font-bold font-sans">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="bg-slate-50 border border-neutral-200 text-[#1E2B42] p-3 text-xs space-y-1">
                <p className="font-bold font-serif">Muvaffaqiyatli yuklandi!</p>
                <ul className="list-disc pl-4 font-mono text-[11px]">
                  <li>Yuklangan o'quvchilar: {importResult.imported_count} ta</li>
                </ul>
              </div>
            )}

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
                disabled={importLoading || !selectedFile}
                className="px-5 py-2 bg-[#A51C30] hover:bg-[#8a1526] text-white text-xs font-bold font-sans disabled:opacity-50 flex items-center space-x-2 cursor-pointer transition"
              >
                {importLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-none animate-spin shrink-0"></span>}
                <span>Yuklash</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

