import os
import pandas as pd
from pypdf import PdfReader
from docx import Document


def charger_pdf(chemin):
    reader = PdfReader(chemin)
    texte = ""
    for page in reader.pages:
        contenu = page.extract_text()
        if contenu:
            texte += contenu + "\n"
    return texte


def charger_txt(chemin):
    with open(chemin, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def charger_docx(chemin):
    doc = Document(chemin)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def charger_csv(chemin):
    df = pd.read_csv(chemin, encoding="utf-8")
    return df.to_string(index=False)


def charger_xlsx(chemin):
    df = pd.read_excel(chemin)
    return df.to_string(index=False)


EXTENSIONS = {
    ".pdf":  charger_pdf,
    ".txt":  charger_txt,
    ".tsx":  charger_txt,
    ".ts":   charger_txt,
    ".docx": charger_docx,
    ".csv":  charger_csv,
    ".xlsx": charger_xlsx,
}


def charger_document(chemin):
    ext = os.path.splitext(chemin)[1].lower()
    if ext not in EXTENSIONS:
        raise ValueError(f"Format non supporté : {ext}")
    return EXTENSIONS[ext](chemin)