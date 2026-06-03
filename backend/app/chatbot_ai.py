# Recherche + génération
import chromadb

from ollama import Client

from app.embedding import model

client_ollama = Client(host="http://10.46.3.3:11434")


import re

def extraire_numero_article(question):
    match = re.search(r"ar?t?i?c?l?e\s*(\d+)", question, re.IGNORECASE)
    return match.group(1) if match else None

def rechercher(question, source=None):

    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_collection("documents")
    where = {"source": source} if source else None

    numero = extraire_numero_article(question)

    if numero:
        kwargs = {"include": ["documents", "metadatas"]}
        if where:
            kwargs["where"] = where
        tous = collection.get(**kwargs)
        pattern = re.compile(rf"Art(?:icle|\.?)?\s*{numero}(?!\d)", re.IGNORECASE)
        pattern_titre = re.compile(rf"Article\s+{numero}\s*:", re.IGNORECASE)

        prioritaires, secondaires, metas_p, metas_s = [], [], [], []
        for doc, meta in zip(tous["documents"], tous["metadatas"]):
            if pattern_titre.search(doc):
                prioritaires.append(doc)
                metas_p.append(meta)
            elif pattern.search(doc):
                secondaires.append(doc)
                metas_s.append(meta)

        chunks = prioritaires + secondaires
        metadatas = metas_p + metas_s

        print(f"[DEBUG] numero={numero}, prioritaires={len(prioritaires)}, secondaires={len(secondaires)}")
        for c in prioritaires[:2]:
            print(f"[DEBUG] chunk: {repr(c[:150])}")
        if chunks:
            sources = list({m["source"] for m in metadatas})
            return chunks[:8], sources

    # Fallback : recherche sémantique classique
    question_embedding = model.encode(question).tolist()
    resultats = collection.query(
        query_embeddings=[question_embedding],
        n_results=8,
        where=where,
        include=["documents", "metadatas"]
    )
    chunks = resultats["documents"][0]
    metadatas = resultats["metadatas"][0]
    sources = list({m["source"] for m in metadatas})
    return chunks, sources


def generer(question, chunks):

    contexte = "\n\n".join(chunks)

    prompt = f"""
Tu es un assistant juridique spécialisé dans le Code du Numérique de la République du Bénin.

Réponds de manière précise et complète uniquement à partir du contexte fourni.
Cite l'article concerné si possible.

Si la réponse n'est pas présente dans le contexte, réponds uniquement :
"Je ne trouve pas cette information dans le document."

CONTEXTE :
{contexte}

QUESTION :
{question}

RÉPONSE :"""

    response = client_ollama.chat(
        model="mistral",
        messages=[{"role": "user", "content": prompt}]
    )

    return response["message"]["content"]
