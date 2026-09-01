import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\ClubsTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Club item title font
content = content.replace('h4 className="text-base font-bold text-[#1E2B42] truncate"', 'h4 className="text-base font-serif font-bold text-[#1E2B42] truncate"')

# Badges and buttons
content = content.replace('text-[#0284C7] bg-[#E0F2FE]', 'text-slate-700 bg-slate-100 border border-slate-200')
content = content.replace('bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800', 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800')
content = content.replace('bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-800', 'bg-slate-100 hover:bg-red-100 border border-slate-200 text-slate-800')
content = content.replace('bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700', 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done ClubsTab tweaks")
