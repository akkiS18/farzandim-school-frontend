import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\AnnouncementsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Main Header Title
content = content.replace('h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-2"', 'h3 className="text-sm sm:text-base font-bold font-serif text-[#1E2B42] flex items-center gap-2"')
content = content.replace('</h1', '</h3')

# 2. Megaphone icon color
content = content.replace('Megaphone className="w-6 h-6 text-slate-900 shrink-0"', 'Megaphone className="w-5 h-5 text-[#1E2B42] shrink-0"')

# 3. Empty State Title
content = content.replace('h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900"', 'h3 className="text-sm sm:text-base font-bold font-serif text-[#1E2B42]"')

# 4. Item Title (Announcement Title) -> Removing font-serif and making it regular or medium, smaller size
content = content.replace('h4 className="font-serif font-bold text-slate-900 text-lg sm:text-xl tracking-tight"', 'h4 className="text-sm sm:text-base font-bold text-[#1E2B42]"')
# Wait, "bold bolmasin" -> let's make it font-medium
content = content.replace('h4 className="text-sm sm:text-base font-bold text-[#1E2B42]"', 'h4 className="text-sm sm:text-base font-semibold text-[#1E2B42]"')

# 5. Make the badges non-bold
content = content.replace('font-bold bg-slate-100', 'font-medium bg-slate-100')
content = content.replace('font-extrabold bg-slate-100', 'font-medium bg-slate-100')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
