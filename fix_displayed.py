import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

filtered_books_end = "  }, [books, selectedCategoryId, categories, searchQuery]);"
new_end = filtered_books_end + "\n\n  const displayedBooks = useMemo(() => filteredBooks.slice(0, page * PAGE_SIZE), [filteredBooks, page]);"
content = content.replace(filtered_books_end, new_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing displayedBooks")
