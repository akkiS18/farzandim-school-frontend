import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\teacher\ClubsTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Desktop delete button
desktop_old = 'className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-none transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"\n                      title="To\'garakni o\'chirish"'
desktop_new = 'className="p-2 sm:p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-none transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"\n                      title="To\'garakni o\'chirish"'
content = content.replace(desktop_old, desktop_new)

# Mobile delete button text
mobile_old = 'className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-none transition cursor-pointer"'
mobile_new = 'className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-none transition cursor-pointer"'
content = content.replace(mobile_old, mobile_new)

# Mobile delete button icon container
mobile_icon_old = 'className="w-7 h-7 rounded-none bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">\n                            <Trash2 className="w-3.5 h-3.5" />'
mobile_icon_new = 'className="w-7 h-7 rounded-none bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">\n                            <Trash2 className="w-3.5 h-3.5" />'
content = content.replace(mobile_icon_old, mobile_icon_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing ClubsTab delete buttons")
