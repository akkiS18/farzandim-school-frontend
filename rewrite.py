import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\AnnouncementsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Emojis in Create Modal
content = content.replace("📢 Oddiy E'lon", "Oddiy E'lon")
content = content.replace("📊 Interaktiv So'rovnoma", "Interaktiv So'rovnoma")

# Emojis in Telegram / Web
# Instead of guessing the character, let's use regex matching for " Telegram Bot" and " Web Sayt"
content = re.sub(r'<span.*?>.*?Telegram Bot</span>', '<span>Telegram Bot</span>', content)
content = re.sub(r'<span.*?>.*?Web Sayt</span>', '<span>Web Sayt</span>', content)

# Remove all rounded-* 
content = re.sub(r'rounded-(3xl|2xl|xl|lg|md|sm|full)', 'rounded-none', content)

# Replace specific colors
content = content.replace("bg-[#D4F562]", "bg-[#1E2B42]")
content = content.replace("text-[#1D1E26]", "text-white")
content = content.replace("text-[#16193E]", "text-slate-900")
content = content.replace("bg-indigo-600", "bg-[#1E2B42]")
content = content.replace("text-indigo-600", "text-[#1E2B42]")
content = content.replace("border-indigo-600", "border-[#1E2B42]")

# Add intersection observer state variables
if "const [page, setPage]" not in content:
    state_injection = """  const [page, setPage] = useState(1);
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, []);
"""
    content = content.replace('  const [votingOptionId, setVotingOptionId] = useState<number | null>(null);\n',
                              '  const [votingOptionId, setVotingOptionId] = useState<number | null>(null);\n\n' + state_injection)

# Reset page on filter changes
content = content.replace('setSearchQuery(e.target.value)', 'setSearchQuery(e.target.value); setPage(1);')
content = content.replace('setActiveFilter("all")', 'setActiveFilter("all"); setPage(1);')
content = content.replace('setActiveFilter("announcements")', 'setActiveFilter("announcements"); setPage(1);')
content = content.replace('setActiveFilter("polls")', 'setActiveFilter("polls"); setPage(1);')

# displayedAnnouncements
disp_ann = """
    return matchesFilter;
  });

  const displayedAnnouncements = filteredAnnouncements.slice(0, page * PAGE_SIZE);
"""
if "const displayedAnnouncements" not in content:
    content = content.replace("""
    return matchesFilter;
  });
""", disp_ann)

content = content.replace("{filteredAnnouncements.map((ann) => {", "{displayedAnnouncements.map((ann) => {")

obs_target = """
          </div>
          {filteredAnnouncements.length > displayedAnnouncements.length && (
            <div ref={observerTarget} className="h-10 flex items-center justify-center pt-4">
              <span className="w-6 h-6 border-2 border-[#1E2B42] border-t-transparent rounded-full animate-spin"></span>
            </div>
          )}
"""
if "ref={observerTarget}" not in content:
    content = content.replace("          </div>\n        )}", obs_target + "        )}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
