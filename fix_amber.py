import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'bg-amber-50/70 border border-amber-200/60\s+rounded-none text-\[11px\] font-bold text-amber-900', 'bg-slate-50 border border-slate-200 rounded-none text-[11px] font-bold text-slate-700', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done amber fix")
