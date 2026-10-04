"use client";

import { useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Image as ImageIcon,
  UploadCloud,
  X,
  Loader2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname.endsWith("akademx.uz")) {
      return "https://api.akademx.uz";
    }
  }
  return "http://localhost:6560";
};

export const imageURL = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getApiUrl();
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

export function AnnouncementImages({ urls = [] }: { urls?: string[] | null }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft" && urls && urls.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + urls.length) % urls.length : 0));
      } else if (e.key === "ArrowRight" && urls && urls.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % urls.length : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, urls]);

  if (!urls?.length) return null;

  return (
    <>
      {/* ── FEED PREVIEW (Compact & Aspect-Preserving, NOT 100% width) ── */}
      {urls.length === 1 ? (
        <div className="my-2.5">
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="group relative inline-block overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50 hover:border-indigo-400 transition cursor-pointer max-w-xs sm:max-w-sm md:max-w-md shadow-xs text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageURL(urls[0])}
              alt="E'lon rasmi"
              loading="lazy"
              className="max-h-60 sm:max-h-72 w-auto max-w-full object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs font-bold py-1.5 px-3 rounded-full transition-opacity backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Kattalashtirish</span>
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5 my-2.5 max-w-xl">
          {urls.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative block overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50 hover:border-indigo-400 transition cursor-pointer w-24 h-24 sm:w-32 sm:h-32 shrink-0 shadow-xs text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageURL(url)}
                alt={`E'lon rasmi ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-[11px] font-bold py-1 px-2 rounded-full transition-opacity backdrop-blur-xs flex items-center gap-1 shadow-md">
                  <ZoomIn className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── LIGHTBOX MODAL (Norm, Chiroyli va Moslashuvchan Kattalashtirish) ── */}
      {lightboxIndex !== null && urls[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-150 select-none"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-between text-white py-1 px-2 z-10"
          >
            <div className="text-xs sm:text-sm font-bold text-white/80 font-mono">
              {urls.length > 1 ? `${lightboxIndex + 1} / ${urls.length}` : "E'lon rasmi"}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={imageURL(urls[lightboxIndex])}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition cursor-pointer"
                title="Yangi oynada ochish"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Asl holatda ochish</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/15 transition cursor-pointer"
                title="Yopish (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: Image + Navigation */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center my-auto min-h-0 w-full"
          >
            {urls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev !== null ? (prev - 1 + urls.length) % urls.length : 0))
                }
                className="absolute left-2 sm:left-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg"
                title="Oldingi rasm"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageURL(urls[lightboxIndex])}
              alt={`E'lon rasmi ${lightboxIndex + 1}`}
              className="max-h-[75vh] sm:max-h-[82vh] max-w-[90vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl transition-all"
            />

            {urls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev !== null ? (prev + 1) % urls.length : 0))
                }
                className="absolute right-2 sm:right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg"
                title="Keyingi rasm"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Bottom Hint */}
          <div className="w-full text-center text-[11px] text-white/50 py-1 font-sans">
            Yopish uchun ekranning istalgan joyiga bosing yoki <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/70">Esc</span> tugmasini bosing
          </div>
        </div>
      )}
    </>
  );
}

export function AnnouncementImagePicker({
  urls,
  onChange,
  onBusyChange,
  disabled = false,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function upload(files: File[]) {
    setError("");
    if (files.length + urls.length > 10) {
      setError("Ko‘pi bilan 10 ta rasm yuklash mumkin.");
      return;
    }
    const invalid = files.find(
      (f) => !["image/jpeg", "image/png"].includes(f.type) || f.size > 10 * 1024 * 1024
    );
    if (invalid) {
      setError("Faqat JPEG/PNG formatdagi (maksimal 10 MB) rasmlarni tanlang.");
      return;
    }

    setBusy(true);
    onBusyChange(true);
    const next = [...urls];
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const result = await apiRequest<{ url: string }>("/api/schools/announcements/images", {
          method: "POST",
          body,
        });
        next.push(result.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rasm yuklanmadi");
    } finally {
      onChange(next);
      setBusy(false);
      onBusyChange(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 font-mono">
          <ImageIcon className="w-4 h-4 text-indigo-600" />
          <span>E'lon rasmlari (ixtiyoriy)</span>
        </label>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
          {urls.length}/10 ta rasm
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        disabled={busy || disabled || urls.length >= 10}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = "";
          void upload(files);
        }}
        className="hidden"
      />

      {urls.length < 10 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!busy && !disabled && e.dataTransfer.files) {
              void upload(Array.from(e.dataTransfer.files));
            }
          }}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50"
              : "border-slate-300 hover:border-indigo-400 bg-white"
          } ${disabled || busy ? "opacity-50 pointer-events-none" : ""}`}
        >
          {busy ? (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-700">Rasmlar yuklanmoqda...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <UploadCloud className="w-7 h-7 text-indigo-600 mb-0.5" />
              <div className="text-xs font-bold text-slate-800">
                Rasmlarni yuklash uchun bosing yoki shu yerga tashlang
              </div>
              <p className="text-[11px] text-slate-500">
                JPEG, PNG • har biri 10 MB gacha • Telegramga ham albom shaklida yuboriladi
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageURL(url)}
                alt={`Tanlangan rasm ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                disabled={busy || disabled}
                aria-label={`${i + 1}-rasmni olib tashlash`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(urls.filter((_, n) => n !== i));
                }}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md transition cursor-pointer"
                title="O'chirish"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
