import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\AnnouncementsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace colorful target badges
content = content.replace('text-[#65A30D] font-bold bg-[#ECFCCA]', 'text-slate-700 font-extrabold bg-slate-100 border border-slate-200')
content = content.replace('text-[#0284C7] font-extrabold bg-[#E0F2FE]', 'text-slate-700 font-extrabold bg-slate-100 border border-slate-200')
content = content.replace('text-[#FF7A00] font-extrabold bg-[#FFEADB]', 'text-slate-700 font-extrabold bg-slate-100 border border-slate-200')
content = content.replace('text-slate-700 font-extrabold bg-purple-100', 'text-slate-700 font-extrabold bg-slate-100 border border-slate-200')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
