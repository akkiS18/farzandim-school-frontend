"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ImportParentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  importLoading: boolean;
  importError: string | null;
  importResult: { imported_count: number; linked_count?: number } | null;
}

export const ImportParentsModal: React.FC<ImportParentsModalProps> = ({
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white border border-neutral-200 shadow-sm w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold font-serif text-[#1E2B42]">Excel Orqali Vasiylarni Yuklash</h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Bir vaqtning o'zida bir nechta ota-ona hisobini bog'lash
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

        <div className="p-6 space-y-5">
          {/* Step 1: Download Template */}
          <div className="bg-slate-50 border border-neutral-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold font-sans text-slate-800">1-bosqich: Shablonni yuklab olish</p>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Sinf o'quvchilari ro'yxati biriktirilgan tayyor shablon
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="bg-white border border-neutral-300 hover:bg-slate-50 text-slate-700 font-bold font-sans text-xs py-2 px-3.5 transition cursor-pointer shrink-0"
            >
              Shablonni yuklash
            </button>
          </div>

          {/* Step 2: Upload Excel File */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-bold font-sans text-slate-800 mb-2">2-bosqich: To'ldirilgan shablonni yuklash</p>
              <label className="border-2 border-dashed border-neutral-300 bg-slate-50 py-6 px-4 text-center block cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                <div className="text-xs font-bold font-sans text-slate-700 mb-1">
                  {selectedFile ? selectedFile.name : "Faylni tanlang (.xlsx)"}
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  {selectedFile ? "Boshqa fayl tanlash uchun bosing" : "yoki shu yerga sudrab tashlang"}
                </div>
              </label>
            </div>

            {/* Status Messages */}
            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#A51C30] text-xs font-bold font-sans rounded-none">
                {importError}
              </div>
            )}
            {importResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-sans rounded-none">
                Muvaffaqiyatli yakunlandi! {importResult.imported_count} ta ota-ona ro'yxatga olindi.
                {importResult.linked_count !== undefined && (
                  <span className="block mt-0.5 text-emerald-700">
                    O'quvchilarga bog'landi: {importResult.linked_count} ta.
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans cursor-pointer transition"
              >
                Yopish
              </button>
              <button
                type="submit"
                disabled={!selectedFile || importLoading}
                className="px-5 py-2 bg-[#A51C30] hover:bg-[#8a1526] text-white text-xs font-bold font-sans disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer transition"
              >
                {importLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-none animate-spin shrink-0"></span>
                )}
                <span>Yuklash va Saqlash</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

