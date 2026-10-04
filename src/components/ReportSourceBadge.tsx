import React from "react";

type Source = {
  generation_source?: string;
  generation_model?: string;
  generation_reason?: string;
};

export default function ReportSourceBadge({ summary }: { summary?: Source }) {
  const source = summary?.generation_source;
  const reason = summary?.generation_reason;
  const model = summary?.generation_model || "Gemini AI";

  if (source === "ai") {
    return (
      <span
        title={`Haqiqiy AI orqali generatsiya qilingan (Model: ${model})`}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs select-none"
      >
        <span>✨</span>
        <span>AI orqali</span>
      </span>
    );
  }

  if (source === "template") {
    const reasonText =
      reason === "api_key_missing"
        ? "AI kaliti sozlanmagan"
        : reason === "network_error"
        ? "AI xizmati bilan ulanishda xatolik yuz berdi"
        : reason === "empty_response"
        ? "AI yaroqli javob qaytarmadi"
        : reason?.startsWith("http_")
        ? `AI xizmati xatosi (${reason.slice(5)})`
        : "AI ga ulanib bo'lmadi";

    return (
      <span
        title={`AI ulanmagani sababli dinamik shablon orqali yaratilgan (${reasonText})`}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-xs select-none"
      >
        <span>⚡</span>
        <span>Dinamik shablon</span>
      </span>
    );
  }

  return (
    <span
      title="Eski hisobotda yaratilish manbasi qayd etilmagan"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 select-none"
    >
      <span>—</span>
      <span>Noma’lum</span>
    </span>
  );
}
