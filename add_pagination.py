import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
states_injection = """  const [studentSearch, setStudentSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");

  const [page, setPage] = useState(1);
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

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
  }, [activeTab]);
"""
content = content.replace('  const [studentSearch, setStudentSearch] = useState("");\n  const [classSearch, setClassSearch] = useState("");', states_injection)

# Reset page on search change
content = content.replace('setSearchQuery(e.target.value)', '{ setSearchQuery(e.target.value); setPage(1); }')
content = content.replace('setSelectedCategoryId(Number(e.target.value))', '{ setSelectedCategoryId(Number(e.target.value)); setPage(1); }')
content = content.replace('setSelectedCategoryId("all")', '{ setSelectedCategoryId("all"); setPage(1); }')

# Define displayedBooks
content = content.replace('const filteredBooks = useMemo(() => {', 'const displayedBooks = useMemo(() => filteredBooks.slice(0, page * PAGE_SIZE), [filteredBooks, page]);\n\n  const filteredBooks = useMemo(() => {')

# Use displayedBooks in render
content = content.replace('{filteredBooks.map((bk) => (', '{displayedBooks.map((bk) => (')

# Add observer element
observer_element = """              </div>
            )}
            {filteredBooks.length > displayedBooks.length && (
              <div ref={observerTarget} className="h-10 flex items-center justify-center pt-4 pb-10">
                <span className="w-6 h-6 border-2 border-[#1E2B42] border-t-transparent rounded-full animate-spin"></span>
              </div>
            )}
          </div>
"""
# Need to find the exact end of the grid.
# The grid ends with:
#                 ))}
#               </div>
#             )}
#           </div>
grid_end = """                ))}
              </div>
            )}
          </div>"""
content = content.replace(grid_end, observer_element)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done pagination")
