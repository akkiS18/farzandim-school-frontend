import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none \nborder border-slate-200 transition cursor-pointer flex items-center gap-2 shadow-xs shrink-0', 
    'px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0 flex-1 sm:flex-none whitespace-nowrap')

content = content.replace('px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold \ntext-xs rounded-none transition cursor-pointer flex items-center gap-2 ',
    'px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-none transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none whitespace-nowrap')

content = content.replace('px-4.5 py-2.5 bg-[#1E2B42] text-white font-bold text-xs rounded-none transition \ncursor-pointer flex items-center gap-2 shadow-xs hover:opacity-90',
    'px-3 py-2.5 bg-[#1E2B42] text-white font-bold text-xs rounded-none transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 flex-1 sm:flex-none whitespace-nowrap')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done styling buttons")
