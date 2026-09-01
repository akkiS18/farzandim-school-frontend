import re
import os

files = [
    r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\ClubsTab.tsx',
    r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\modals\AddClubModal.tsx',
    r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\modals\EditClubModal.tsx',
    r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\modals\ClubStudentsModal.tsx',
    r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\modals\ClubGradingModal.tsx'
]

for file_path in files:
    if not os.path.exists(file_path): continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Rounded corners
    content = content.replace('rounded-3xl', 'rounded-none')
    content = content.replace('rounded-2xl', 'rounded-none')
    content = content.replace('rounded-xl', 'rounded-none')
    content = content.replace('rounded-lg', 'rounded-none')
    
    # Colors
    content = content.replace('bg-[#5B50EC]', 'bg-[#1E2B42]')
    content = content.replace('hover:bg-[#4A3FDB]', 'hover:opacity-90')
    content = content.replace('bg-indigo-50 border-indigo-200 text-indigo-800', 'bg-slate-100 border-slate-200 text-slate-800')
    content = content.replace('text-indigo-600', 'text-[#1E2B42]')
    content = content.replace('focus:ring-indigo-500', 'focus:ring-[#1E2B42]')
    content = content.replace('bg-indigo-600', 'bg-[#1E2B42]')
    content = content.replace('hover:bg-indigo-700', 'hover:opacity-90')

    # Fonts in ClubsTab specifically
    if "ClubsTab.tsx" in file_path:
        content = content.replace('<h3 className="text-sm sm:text-base font-extrabold text-[#1E2B42]">To\'garaklar (Fan To\'garaklari)</h3>', '<h3 className="text-sm sm:text-base font-bold font-serif text-[#1E2B42]">To\'garaklar (Fan To\'garaklari)</h3>')
        content = content.replace('font-extrabold', 'font-bold')
        content = content.replace('font-black', 'font-bold')
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done ClubsTab")
