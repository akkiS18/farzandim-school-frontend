import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Bulk replace indigo colors in LibrarySection
content = content.replace('bg-indigo-950', 'bg-slate-50 border-b border-slate-200 text-slate-900')
content = content.replace('text-indigo-950', 'text-slate-900')
content = content.replace('text-indigo-900', 'text-slate-800')
content = content.replace('text-indigo-700', 'text-slate-700')
content = content.replace('text-indigo-600', 'text-[#1E2B42]')
content = content.replace('text-indigo-500', 'text-slate-500')
content = content.replace('text-indigo-400', 'text-slate-400')
content = content.replace('text-indigo-300', 'text-slate-400')

content = content.replace('bg-indigo-600', 'bg-[#1E2B42]')
content = content.replace('hover:bg-indigo-700', 'hover:opacity-90')

content = content.replace('bg-indigo-100', 'bg-slate-200')
content = content.replace('bg-indigo-50/70', 'bg-slate-50')
content = content.replace('bg-indigo-50/40', 'bg-slate-50')
content = content.replace('bg-indigo-50', 'bg-slate-100')
content = content.replace('hover:bg-indigo-100', 'hover:bg-slate-200')

content = content.replace('border-indigo-600', 'border-[#1E2B42]')
content = content.replace('border-indigo-500', 'border-[#1E2B42]')
content = content.replace('border-indigo-400', 'border-slate-400')
content = content.replace('border-indigo-300', 'border-slate-300')
content = content.replace('border-indigo-200/80', 'border-slate-200')
content = content.replace('border-indigo-200', 'border-slate-200')
content = content.replace('border-indigo-100', 'border-slate-200')

content = content.replace('focus:border-indigo-500', 'focus:border-[#1E2B42]')
content = content.replace('shadow-indigo-500/20', 'shadow-xs')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing all indigos in Library")
