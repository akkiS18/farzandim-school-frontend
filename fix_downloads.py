import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace book card download button
old_btn = 'className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-none text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"'
new_btn = 'className="flex-1 px-3 py-2 bg-[#1E2B42] hover:opacity-90 text-white rounded-none text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs border border-[#1E2B42]"'
content = content.replace(old_btn, new_btn)

# And there might be a modal download template button
old_btn2 = 'className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-none transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm shadow-emerald-600/20"'
new_btn2 = 'className="px-3.5 py-2 bg-[#1E2B42] hover:opacity-90 text-white font-bold text-xs rounded-none transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs border border-[#1E2B42]"'
content = content.replace(old_btn2, new_btn2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing download buttons")
