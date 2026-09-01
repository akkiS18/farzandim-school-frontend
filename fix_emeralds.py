import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix green Download button inside Book card
content = content.replace('bg-emerald-600 hover:bg-emerald-700 text-white', 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200')

# Fix download link input color
content = content.replace('bg-emerald-50/50 border border-emerald-200', 'bg-slate-50 border border-slate-200')
content = content.replace('text-emerald-700 uppercase', 'text-slate-700 uppercase')
content = content.replace('focus:border-emerald-500', 'focus:border-[#1E2B42]')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing green items")
