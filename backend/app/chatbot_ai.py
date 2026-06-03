# Recherche + génération
import chromadb

from ollama import Client

from app.embedding import model

client_ollama = Client(host="http://10.46.3.3:11434")


def rechercher(question):

    client = chromadb.PersistentClient(path="./chroma_db")

    collection = client.get_collection("documents")

    question_embedding = model.encode(question).tolist()

    resultats = collection.query(
        query_embeddings=[question_embedding],
        n_results=3,
        include=["documents", "metadatas"]
    )

    chunks = resultats["documents"][0]
    metadatas = resultats["metadatas"][0]

    sources = list({m["source"] for m in metadatas})

    return chunks, sources


def generer(question, chunks):

    contexte = "\n\n".join(chunks)

    prompt = f"""
Tu es un assistant spécialisé.

Réponds uniquement à partir du contexte.

Si la réponse n'est pas présente dans le contexte répond :

"Je ne suis pas formé pour répondre à cette question."

CONTEXTE :
{contexte}

QUESTION :
{question}
"""

    response = client_ollama.chat(
        model="mistral",
        messages=[{"role": "user", "content": prompt}]
    )

    return response["message"]["content"]
