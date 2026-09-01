import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-white/10 hover:bg-white/20 border border-white/15 text-white', 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700')
content = content.replace('text-indigo-300', 'text-[#1E2B42]')

# Ensure the buttons fit on one line:
# The container is `flex flex-wrap items-center gap-3 relative z-10`. 
# I will change it to `flex flex-wrap sm:flex-nowrap items-center gap-2 relative z-10 w-full sm:w-auto`
content = content.replace('flex flex-wrap items-center gap-3 relative z-10', 'flex flex-wrap sm:flex-nowrap items-center gap-2 relative z-10 w-full md:w-auto')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing Guruh Qoshish")
