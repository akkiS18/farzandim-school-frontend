import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Emerald icon in Excel import
content = content.replace('text-emerald-200', 'text-[#1E2B42]')

# Fix Guruh qo'shish button icon
content = content.replace('text-indigo-200', 'text-[#1E2B42]')

# Fix Kitob Qo'shish button bg
content = re.sub(r'bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-none\s+transition cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-500/25', 'bg-[#1E2B42] text-white font-bold text-xs rounded-none transition cursor-pointer flex items-center gap-2 shadow-xs hover:opacity-90', content)

# Remove any stray backdrop-blur-md
content = content.replace('backdrop-blur-md', '')

# Fix Modal bg-slate-900 header to white
content = content.replace('bg-slate-900 text-white', 'bg-white text-slate-900 border-b border-zinc-200/80')
content = content.replace('text-indigo-400', 'text-[#1E2B42]')
content = content.replace('text-white hover:bg-white/10', 'text-slate-500 hover:bg-slate-100')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Library Fixes")
