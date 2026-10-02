"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";
const imageURL = (url: string) => url.startsWith("/") ? `${API_URL}${url}` : url;

export function AnnouncementImages({ urls = [] }: { urls?: string[] | null }) {
  if (!urls?.length) return null;
  return <div className="grid grid-cols-2 gap-2 my-3">
    {urls.map((url, i) => <a key={`${url}-${i}`} href={imageURL(url)} target="_blank" rel="noreferrer" className={urls.length === 1 ? "col-span-2" : ""}>
      {/* Stored uploads support both the local backend and R2. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageURL(url)} alt={`E’lon rasmi ${i + 1}`} loading="lazy" className="w-full max-h-80 object-contain rounded-lg bg-slate-50" />
    </a>)}
  </div>;
}

export function AnnouncementImagePicker({ urls, onChange, onBusyChange, disabled = false }: {
  urls: string[]; onChange: (urls: string[]) => void; onBusyChange: (busy: boolean) => void; disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: File[]) {
    setError("");
    if (files.length + urls.length > 10) { setError("Ko‘pi bilan 10 ta rasm tanlang."); return; }
    if (files.some(f => !["image/jpeg", "image/png"].includes(f.type) || f.size > 10 * 1024 * 1024)) {
      setError("JPEG/PNG rasmlar tanlang. Har biri 10 MB gacha."); return;
    }
    setBusy(true); onBusyChange(true);
    const next = [...urls];
    try {
      for (const file of files) {
        const body = new FormData(); body.append("file", file);
        const result = await apiRequest<{ url: string }>("/api/schools/announcements/images", { method: "POST", body });
        next.push(result.url);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Rasm yuklanmadi"); }
    finally { onChange(next); setBusy(false); onBusyChange(false); }
  }
  return <div className="space-y-2">
    <label className="block text-xs font-bold">Rasmlar ({urls.length}/10)
      <input type="file" accept="image/jpeg,image/png" multiple disabled={busy || disabled || urls.length >= 10}
        onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ""; void upload(files); }} className="block mt-2 w-full text-xs" />
    </label>
    <p className="text-xs text-slate-500">JPEG/PNG · har biri 10 MB gacha · Telegramga ham yuboriladi</p>
    {busy && <p role="status" className="text-xs">Rasmlar yuklanmoqda…</p>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-2">{urls.map((url, i) => <div key={`${url}-${i}`} className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageURL(url)} alt={`Tanlangan rasm ${i + 1}`} className="w-24 h-24 object-cover rounded-lg" />
      <button type="button" disabled={busy || disabled} aria-label={`${i + 1}-rasmni olib tashlash`} onClick={() => onChange(urls.filter((_, n) => n !== i))}
        className="absolute top-0 right-0 bg-white text-red-700 border rounded-full w-7 h-7">×</button>
    </div>)}</div>
  </div>;
}
