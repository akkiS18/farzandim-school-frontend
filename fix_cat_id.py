import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('onClick={() => setSelectedCategoryId(cat.id)}', 'onClick={() => { setSelectedCategoryId(cat.id); setPage(1); }}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing cat.id page reset")
