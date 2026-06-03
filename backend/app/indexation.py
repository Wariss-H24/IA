import chromadb

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.embedding import model

DB_PATH = "./chroma_db"

COLLECTION = "documents"


def indexer_document(texte, nom_fichier):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    chunks = splitter.split_text(texte)

    client = chromadb.PersistentClient(path=DB_PATH)

    try:
        collection = client.get_collection(COLLECTION)
    except:
        collection = client.create_collection(COLLECTION)

    existing = collection.count()

    for i, chunk in enumerate(chunks):

        embedding = model.encode(chunk).tolist()

        collection.add(
            ids=[f"chunk_{existing + i}"],
            documents=[chunk],
            embeddings=[embedding],
            metadatas=[{"source": nom_fichier}]
        )

    return len(chunks)
