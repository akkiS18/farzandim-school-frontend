import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\AnnouncementsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Top Header h1
content = content.replace('h1 className="text-lg sm:text-2xl font-black text-slate-900', 'h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900')

# Card Title h4
content = content.replace('h4 className="font-extrabold text-slate-900 text-base sm:text-lg"', 'h4 className="font-serif font-bold text-slate-900 text-lg sm:text-xl tracking-tight"')

# Empty State title
content = content.replace('p className="text-zinc-800 text-sm font-extrabold"', 'h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900"')
content = content.replace('Hech qanday e\'lon topilmadi</p>', 'Hech qanday e\'lon topilmadi</h3>')

# Modal Headers h3
content = content.replace('h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2"', 'h3 className="font-serif font-bold text-xl text-slate-900 flex items-center gap-2"')

# Other font-extrabold / font-black fixes for tags
content = content.replace('font-extrabold', 'font-bold')
content = content.replace('font-black', 'font-bold')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
