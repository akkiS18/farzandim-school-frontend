import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Guruh Qo'shish
old_guruh = """            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold 
text-xs rounded-none transition cursor-pointer flex items-center gap-2 "
            >
              <FolderPlus className="w-4 h-4 text-[#1E2B42]" />
              <span>Guruh Qo'shish</span>
            </button>"""
new_guruh = """            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-none transition cursor-pointer flex items-center justify-center shrink-0"
              title="Guruh Qo'shish"
            >
              <FolderPlus className="w-5 h-5 text-[#1E2B42]" />
            </button>"""
content = content.replace(old_guruh.replace('\r\n', '\n'), new_guruh)

# Kitob Qo'shish
old_kitob = """            <button
              onClick={() => setShowAddBookModal(true)}
              className="px-4.5 py-2.5 bg-[#1E2B42] text-white font-bold text-xs rounded-none transition 
cursor-pointer flex items-center gap-2 shadow-xs hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              <span>Kitob Qo'shish</span>
            </button>"""
new_kitob = """            <button
              onClick={() => setShowAddBookModal(true)}
              className="w-10 h-10 bg-[#1E2B42] text-white font-bold text-xs rounded-none transition cursor-pointer flex items-center justify-center shadow-xs hover:opacity-90 shrink-0"
              title="Kitob Qo'shish"
            >
              <Plus className="w-5 h-5" />
            </button>"""
content = content.replace(old_kitob.replace('\r\n', '\n'), new_kitob)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing remaining header buttons")
