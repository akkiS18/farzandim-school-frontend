import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix modal X button hover styles
content = content.replace('hover:text-white p-1 rounded-full hover:bg-white/10', 'hover:text-slate-600 p-1 rounded-none hover:bg-slate-100')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Fixing X buttons")
