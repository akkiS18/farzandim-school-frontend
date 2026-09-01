import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Excel Import button text & style
content = re.sub(r'className="px-4 py-2\.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none\s+border border-slate-200 transition cursor-pointer flex items-center gap-2 shadow-xs shrink-0"\s+title="Kitoblarni Excel shablon orqali ommaviy yuklash"\s+>\s+<FileSpreadsheet className="w-4 h-4 text-\[#1E2B42\]" />\s+<span>Excel Import</span>',
                 r'className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none border border-slate-200 transition cursor-pointer flex items-center justify-center shadow-xs shrink-0" title="Excel Import">\n              <FileSpreadsheet className="w-5 h-5 text-[#1E2B42]" />', content)

# Replace Guruh Qoshish button text & style
content = re.sub(r'className="px-4 py-2\.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold\s+text-xs rounded-none transition cursor-pointer flex items-center gap-2 "\s+>\s+<FolderPlus className="w-4 h-4 text-\[#1E2B42\]" />\s+<span>Guruh Qo\'shish</span>',
                 r'className="w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-none transition cursor-pointer flex items-center justify-center shadow-xs shrink-0" title="Guruh Qo\'shish">\n              <FolderPlus className="w-5 h-5 text-[#1E2B42]" />', content)

# Replace Kitob Qoshish button text & style
content = re.sub(r'className="px-4\.5 py-2\.5 bg-\[#1E2B42\] text-white font-bold text-xs rounded-none transition\s+cursor-pointer flex items-center gap-2 shadow-xs hover:opacity-90"\s+>\s+<Plus className="w-4 h-4" />\s+<span>Kitob Qo\'shish</span>',
                 r'className="w-10 h-10 bg-[#1E2B42] text-white font-bold text-xs rounded-none transition cursor-pointer flex items-center justify-center shadow-xs hover:opacity-90 shrink-0" title="Kitob Qo\'shish">\n              <Plus className="w-5 h-5" />', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done header buttons fix")
