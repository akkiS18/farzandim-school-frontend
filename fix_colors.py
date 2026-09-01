import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\AnnouncementsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the white-on-white text in the header
# Find the specific h1 and replace text-white with text-slate-900
content = re.sub(r'h1 className="text-lg sm:text-2xl font-black text-white', 'h1 className="text-lg sm:text-2xl font-black text-slate-900', content)
content = re.sub(r'<Megaphone className="w-6 h-6 text-white shrink-0" />', '<Megaphone className="w-6 h-6 text-slate-900 shrink-0" />', content)

# Fix colorful badges (Indigo, Blue, Purple, Amber, Sky) -> Slate
# Notice I'll replace standard patterns.
content = content.replace('bg-indigo-50 text-indigo-700 border border-indigo-100', 'bg-slate-100 text-slate-700 border border-slate-200')
content = content.replace('bg-blue-50 text-blue-700 border border-blue-100', 'bg-slate-100 text-slate-700 border border-slate-200')
content = content.replace('bg-purple-50 text-purple-700 border border-purple-200', 'bg-slate-100 text-slate-700 border border-slate-200')
content = content.replace('bg-amber-50 text-amber-700 border border-amber-200', 'bg-slate-100 text-slate-700 border border-slate-200')
content = content.replace('bg-sky-50 text-sky-700 border border-sky-200', 'bg-slate-100 text-slate-700 border border-slate-200')

# Options colors
content = content.replace('bg-indigo-50/80 border-indigo-300 text-indigo-900', 'bg-slate-100 border-slate-400 text-slate-900')
content = content.replace('bg-indigo-200/60', 'bg-[#1E2B42]/10')
content = content.replace('bg-indigo-100/70', 'bg-slate-100/70')

# Gradient avatar
content = content.replace('bg-gradient-to-tr from-indigo-500 to-purple-600', 'bg-[#1E2B42]')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
