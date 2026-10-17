export interface ParentInviteData {
  first_name?: string;
  last_name?: string;
  passport?: string | null;
  phone?: string | null;
  student_name?: string | null;
}

export function generateParentInviteText(data: ParentInviteData, studentFullNameFallback?: string): string {
  const studentFullName = (data.student_name || studentFullNameFallback || "o'quvchi").trim();
  const parentName = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "Hurmatli ota-ona";

  // DB-dagi haqiqiy login: ota-onaning pasporti yoki telefoni
  const actualLogin = (data.passport || data.phone || "").trim().toUpperCase();
  const loginDisplay = data.passport
    ? data.passport.trim().toUpperCase()
    : (data.phone || "Kiritilmagan");

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
}
