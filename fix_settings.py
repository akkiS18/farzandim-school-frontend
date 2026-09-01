import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\TeacherSettingsTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Structure and Header
old_header = """  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn pb-36 text-zinc-900">
      <div className="bg-white border border-zinc-200/70 rounded-none p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#1E2B42] flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#1E2B42]" />
              <span>Sozlamalar va Profil</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Shaxsiy ma'lumotlaringizni tahrirlang va tizim sozlamalarini boshqaring.
            </p>
          </div>
        </div>

        {/* Profile info form */}"""
new_header = """  return (
    <div className="space-y-4 max-w-3xl mx-auto animate-fadeIn pb-36 text-slate-900">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/70 rounded-none p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold font-serif text-[#1E2B42]">Sozlamalar va Profil</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Shaxsiy ma'lumotlaringizni tahrirlang va tizim sozlamalarini boshqaring.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-none p-6 sm:p-8 shadow-sm space-y-8">
        {/* Profile info form */}"""
content = content.replace(old_header, new_header)

# 2. Fix fonts and colors
content = content.replace('text-zinc-', 'text-slate-')
content = content.replace('bg-zinc-', 'bg-slate-')
content = content.replace('border-zinc-', 'border-slate-')
content = content.replace('font-extrabold', 'font-bold')

# Section headers
content = content.replace('text-indigo-900 font-mono', 'text-slate-800')
content = content.replace('text-red-600 font-mono', 'text-slate-800')

# Input rings
content = content.replace('focus:ring-2 focus:border-[#1E2B42] focus:ring-0', 'focus:bg-white focus:border-[#1E2B42]')

# Buttons
content = content.replace('bg-[#1E2B42] hover:bg-slate-800 text-white font-bold', 'bg-[#1E2B42] hover:opacity-90 text-white font-bold')
content = content.replace('bg-slate-800 hover:bg-slate-900 text-white font-bold', 'bg-[#1E2B42] hover:opacity-90 text-white font-bold') # For password update button

# Logout button
content = content.replace('bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2.5 px-5 rounded-none \ntransition cursor-pointer border border-red-200', 'bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2.5 px-5 rounded-none transition cursor-pointer border border-rose-200')
content = content.replace('bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2.5 px-5 rounded-none transition cursor-pointer border border-red-200', 'bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2.5 px-5 rounded-none transition cursor-pointer border border-rose-200')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing Settings tab")
