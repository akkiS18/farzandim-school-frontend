import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Header Card replacement
header_old = """<div className="bg-[#12142B] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-2xl overflow-hidden relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3"></div>"""

header_new = """<div className="bg-white border border-zinc-200/70 rounded-none p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative animate-fadeIn">"""
content = content.replace(header_old, header_new)

# Remove the badge inside the header
content = re.sub(r'<div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30\s+rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">\s+<BookMarked className="w-3.5 h-3.5" />\s+<span>Maktab E-Kutubxona & Mutolaa Tizimi</span>\s+</div>', '', content)

# 2. Header Text Colors and Fonts
content = content.replace('<h1 className="text-2xl sm:text-3xl font-black tracking-tight">', '<h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-2"><BookMarked className="w-6 h-6 text-slate-900 shrink-0" />')
content = content.replace('<p className="text-xs sm:text-sm text-slate-300 font-medium">', '<p className="text-xs text-slate-400 font-medium mt-1">')

# 3. Header Buttons
# Excel Import
content = re.sub(r'bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-500/30 text-white\s+font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/25\s+backdrop-blur-md', 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none border border-slate-200 transition cursor-pointer flex items-center gap-2 shadow-xs shrink-0', content)
# Guruh qo'shish
content = re.sub(r'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200\s+font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-2 backdrop-blur-md', 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none border border-slate-200 transition cursor-pointer flex items-center gap-2 shadow-xs shrink-0', content)
# Kitob qo'shish
content = re.sub(r'bg-indigo-500 hover:bg-indigo-400 border border-indigo-400/50 text-white\s+font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-500/25\s+backdrop-blur-md', 'bg-[#1E2B42] text-white font-bold text-xs px-5 py-3 rounded-none shadow-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 shrink-0', content)

# 4. Grid cols
content = content.replace('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5')

# 5. Book Card Redesign
content = content.replace('rounded-3xl', 'rounded-none')
content = content.replace('rounded-2xl', 'rounded-none')
content = content.replace('rounded-xl', 'rounded-none')
content = content.replace('rounded-lg', 'rounded-none')

content = content.replace('bg-indigo-50 text-indigo-700 border border-indigo-200/60', 'bg-slate-100 text-slate-700 border border-slate-200/80')
# Font replacements for cards
content = content.replace('text-[13px] sm:text-[15px] font-black text-slate-900 leading-tight', 'text-sm sm:text-base font-bold font-serif text-[#1E2B42] leading-tight')

# Buttons inside cards
content = re.sub(r'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-\[11px\] rounded-xl', 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-none', content)
content = content.replace('bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px]', 'bg-[#1E2B42] hover:opacity-90 text-white font-bold text-xs')

# Fix amber backgrounds in locations
content = content.replace('bg-amber-50 border border-amber-200', 'bg-slate-50 border border-slate-200')
content = content.replace('text-amber-800', 'text-slate-800')

# Modals headers
content = content.replace('bg-[#1D1E26] text-white', 'bg-slate-50 border-b border-slate-200 text-slate-900')
content = content.replace('text-[#D4F562]', 'text-[#1E2B42]')

# Modal focus rings
content = content.replace('focus:ring-indigo-500', 'focus:ring-[#1E2B42]')
content = content.replace('focus:ring-emerald-500', 'focus:ring-[#1E2B42]')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done LibrarySection")
