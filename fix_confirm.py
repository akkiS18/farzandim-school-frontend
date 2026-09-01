import re

file_path = r'c:\Users\Acer\Documents\Farzandim\school-frontend\src\components\dashboard\LibrarySection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_confirm = """                        <button
                          onClick={async () => {
                            if (confirm(`Haqiqatan ham "${bk.title}" kitobini o'chirmoqchimisiz?`)) {
                              try {
                                await api.delete(`/api/schools/books/${bk.id}`);
                                loadLibraryData();
                              } catch (err: any) {
                                alert(err.message || "O'chirishda xatolik");
                              }
                            }
                          }}"""

new_confirm = """                        <button
                          onClick={() => {
                            showConfirm(
                              `Haqiqatan ham "${bk.title}" kitobini o'chirmoqchimisiz?`,
                              async () => {
                                try {
                                  await api.delete(`/api/schools/books/${bk.id}`);
                                  loadLibraryData();
                                  showToast("Kitob muvaffaqiyatli o'chirildi!", "success");
                                } catch (err: any) {
                                  showToast(err.message || "O'chirishda xatolik", "error");
                                }
                              },
                              { title: "Kitobni o'chirish", type: "danger", confirmText: "Ha, o'chirish" }
                            );
                          }}"""

content = content.replace(old_confirm, new_confirm)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Confirm")
