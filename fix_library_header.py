import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-none p-6 sm:p-8 \nshadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border \nborder-slate-800', 'bg-white border border-zinc-200/70 rounded-none p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6')

# Remove the line break issue during powershell output
content = re.sub(r'<div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-none p-6 sm:p-8\s*shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border\s*border-slate-800">', '<div className="bg-white border border-zinc-200/70 rounded-none p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative animate-fadeIn">', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Library Header Fix")
