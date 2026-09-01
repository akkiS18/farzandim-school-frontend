import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Hover title color
content = content.replace('group-hover:text-indigo-600', 'group-hover:text-[#1E2B42]')

# 2. Location block color (bg-amber-50...)
content = content.replace('bg-amber-50/70 border border-amber-200/60 \nrounded-none text-[11px] font-bold text-amber-900', 'bg-slate-50 border border-slate-200 rounded-none text-[11px] font-bold text-slate-700')
content = content.replace('text-amber-600 shrink-0', 'text-slate-500 shrink-0')

# Also fix the map pins in the modals
content = content.replace('text-amber-600', 'text-slate-500')
content = content.replace('bg-amber-50/50 border border-amber-200', 'bg-slate-50 border border-slate-200')
content = content.replace('focus:border-amber-500', 'focus:border-slate-500')

# 3. Edit button color
content = content.replace('text-indigo-600 hover:bg-indigo-50', 'text-slate-500 hover:bg-slate-100')

# 4. Delete button color to crimson (text-rose-600 / text-red-600)
content = content.replace('text-rose-500 hover:bg-rose-50', 'text-rose-600 hover:bg-rose-50')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing Library cards colors")
