import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\AnnouncementsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lime-300 background for selected classes/levels
content = content.replace('bg-[#ECFCCA] border-lime-300 text-white', 'bg-[#1E2B42] border-[#1E2B42] text-white')

# Also fix the focus:ring-[#D4F562] that was left
content = content.replace('focus:ring-[#D4F562]', 'focus:ring-[#1E2B42]')
content = content.replace('focus:ring-indigo-500', 'focus:ring-[#1E2B42]')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
