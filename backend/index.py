from app.chargement import charger_pdf
from app.indexation import indexer_document

texte = charger_pdf("./documents/Benin-Loi-2017-20-Portant-code-du-numerique-en-Republique-du-Benin.pdf")
nb = indexer_document(texte, "Benin-Loi-2017-20-Portant-code-du-numerique-en-Republique-du-Benin.pdf")
print(f"Indexé : {nb} chunks")
