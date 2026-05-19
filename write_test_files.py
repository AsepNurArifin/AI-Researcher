import sys
sys.path.append(".")
from test_pipeline import generate_sample_pdf, generate_sample_docx

with open("sample_resume_john.pdf", "wb") as f:
    f.write(generate_sample_pdf())

with open("sample_resume_jane.docx", "wb") as f:
    f.write(generate_sample_docx())

print("Created sample_resume_john.pdf and sample_resume_jane.docx successfully.")
