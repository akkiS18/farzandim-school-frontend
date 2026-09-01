import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\ClubsTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace colorful texts
content = content.replace('text-amber-800 hover:bg-amber-50', 'text-slate-800 hover:bg-slate-50')
content = content.replace('text-zinc-800 hover:bg-emerald-50 hover:text-emerald-800', 'text-slate-800 hover:bg-slate-50')
content = content.replace('text-zinc-800 hover:bg-slate-50 hover:text-[#1E2B42]', 'text-slate-800 hover:bg-slate-50')
content = content.replace('text-zinc-800 hover:bg-purple-50 hover:text-purple-800', 'text-slate-800 hover:bg-slate-50')
content = content.replace('text-red-700 hover:bg-red-50', 'text-slate-800 hover:bg-slate-50')

# Replace colorful icons
content = content.replace('bg-amber-100 text-amber-800', 'bg-slate-100 text-slate-600')
content = content.replace('bg-emerald-100 text-emerald-700', 'bg-slate-100 text-slate-600')
content = content.replace('bg-indigo-100 text-[#1E2B42]', 'bg-slate-100 text-slate-600')
content = content.replace('bg-purple-100 text-purple-700', 'bg-slate-100 text-slate-600')
content = content.replace('bg-red-100 text-red-600', 'bg-slate-100 text-slate-600')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing dropdown")
