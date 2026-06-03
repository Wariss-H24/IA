from pypdf import PdfReader

def charger_pdf(pdf_path):

    reader = PdfReader(pdf_path)

    texte = ""

    for page in reader.pages:
        contenu = page.extract_text()

        if contenu:
            texte += contenu + "\n"

    return texte