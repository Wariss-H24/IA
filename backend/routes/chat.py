from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import shutil
import os

from app.chargement import charger_pdf
from app.indexation import indexer_document
from app.chatbot_ai import rechercher, generer

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.get("/")
def home():
    return {"message": "Backend opérationnel"}


@router.post("/upload")
async def upload(file: UploadFile = File(...)):

    dossier = "./documents"
    os.makedirs(dossier, exist_ok=True)

    chemin = f"{dossier}/{file.filename}"

    with open(chemin, "wb") as f:
        shutil.copyfileobj(file.file, f)

    texte = charger_pdf(chemin)
    nb_chunks = indexer_document(texte, file.filename)

    return {
        "filename": file.filename,
        "message": f"Document indexé avec succès ({nb_chunks} chunks)"
    }


@router.post("/chat")
def chat(data: ChatRequest):

    chunks, sources = rechercher(data.question)
    reponse = generer(data.question, chunks)

    return {
        "answer": reponse,
        "sources": sources
    }
