import shutil
import os

src_pdf = "sample_resume_john.pdf"
src_docx = "sample_resume_jane.docx"

dest_dir1 = r"C:\Users\Arifi\.gemini\antigravity\brain\ecc9519a-d56d-40c5-bfd9-2fbab19066e1"
dest_dir2 = r"C:\Users\Arifi\.gemini\antigravity\brain\ecc9519a-d56d-40c5-bfd9-2fbab19066e1\browser"

for dest_dir in [dest_dir1, dest_dir2]:
    if os.path.exists(dest_dir):
        shutil.copy(src_pdf, os.path.join(dest_dir, "sample_resume_john.pdf"))
        shutil.copy(src_docx, os.path.join(dest_dir, "sample_resume_jane.docx"))
        print(f"Copied test files to {dest_dir}")
    else:
        print(f"Directory {dest_dir} does not exist")
