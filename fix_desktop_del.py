import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\ClubsTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-600', 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done desktop delete button")
