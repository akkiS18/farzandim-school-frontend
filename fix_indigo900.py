import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\AnnouncementsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('text-indigo-900', 'text-slate-900')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
