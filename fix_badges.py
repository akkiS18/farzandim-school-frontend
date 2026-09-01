import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\AnnouncementsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'bg-(indigo|blue|purple|amber|sky|red)-50', 'bg-slate-100', content)
content = re.sub(r'text-(indigo|blue|purple|amber|sky|red)-700', 'text-slate-700', content)
content = re.sub(r'border-(indigo|blue|purple|amber|sky|red)-(100|200)', 'border-slate-200', content)
content = re.sub(r'text-(indigo|blue|purple|amber|sky|red)-600', 'text-[#1E2B42]', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
