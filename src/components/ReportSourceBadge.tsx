type Source = { generation_source?: string; generation_model?: string; generation_reason?: string };
export default function ReportSourceBadge({ summary }: { summary?: Source }) {
  const source = summary?.generation_source;
  const label = source === "ai" ? "AI orqali" : source === "template" ? "Avtomatik shablon" : "Manba noma’lum";
  const reason = summary?.generation_reason;
  const detail = source === "ai" ? `Model: ${summary?.generation_model || "AI"}` : source === "template"
    ? reason === "api_key_missing" ? "AI kaliti sozlanmagan" : reason === "network_error" ? "AI bilan ulanishda xatolik" : reason === "empty_response" ? "AI yaroqli javob qaytarmadi" : reason?.startsWith("http_") ? `AI xizmati xatosi (${reason.slice(5)})` : "AI ishlamagani uchun dinamik shablon yaratildi"
    : "Eski hisobotda yaratilish manbasi qayd etilmagan";
  return <span title={detail} className={`inline-flex px-2 py-1 rounded text-[11px] font-bold ${source === "ai" ? "bg-emerald-100 text-emerald-900" : source === "template" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}>{label}</span>;
}
