# Explication complète du backend

Le backend est une API construite avec **FastAPI** (Python).  
Il reçoit les questions de l'utilisateur, cherche les bonnes informations dans les PDFs indexés, et génère une réponse via le modèle Mistral.

---

## Vue d'ensemble du flux

```
Utilisateur pose une question
         │
         ▼
   routes/chat.py        ← reçoit la requête HTTP
         │
         ▼
   chatbot_ai.py         ← cherche les chunks pertinents dans ChromaDB
         │
         ▼
   chatbot_ai.py         ← envoie les chunks + la question à Mistral (Ollama)
         │
         ▼
   Réponse renvoyée à l'utilisateur
```

---

## Fichier par fichier

---

### `main.py` — Point d'entrée de l'API

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router

app = FastAPI(title="Chatbot IA")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    ...
)

app.include_router(router)
```

C'est le fichier qui **démarre l'application**. C'est lui qu'on lance avec `uvicorn main:app --reload`.

- `FastAPI(title="Chatbot IA")` — crée l'application avec un titre visible dans Swagger
- `CORSMiddleware` — autorise le frontend (http://localhost:5173) à appeler l'API. Sans ça, le navigateur bloquerait les requêtes venant d'une autre adresse
- `allow_origins=["*"]` — accepte les requêtes de n'importe quelle adresse (pratique en développement)
- `app.include_router(router)` — branche les routes définies dans `routes/chat.py` sur l'application

---

### `index.py` — Script d'indexation manuelle

```python
from app.chargement import charger_pdf
from app.indexation import indexer_document

texte = charger_pdf("./documents/Benin-Loi-2017-20-...")
nb = indexer_document(texte, "Benin-Loi-2017-20-...")
print(f"Indexé : {nb} chunks")
```

Ce fichier n'est **pas une API**, c'est un script qu'on lance une seule fois en ligne de commande :
```bash
python index.py
```

Il lit le PDF placé dans `documents/`, extrait son texte, le découpe en morceaux et les stocke dans ChromaDB.  
À utiliser uniquement si `chroma_db/` est absent ou si tu veux indexer un nouveau document manuellement.

---

### `app/chargement.py` — Lecture du PDF

```python
from pypdf import PdfReader

def charger_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    texte = ""
    for page in reader.pages:
        contenu = page.extract_text()
        if contenu:
            texte += contenu + "\n"
    return texte
```

**`charger_pdf(pdf_path)`**  
Prend le chemin d'un fichier PDF en paramètre et retourne tout son texte en une seule chaîne de caractères.

- `PdfReader(pdf_path)` — ouvre le PDF
- `reader.pages` — liste de toutes les pages du PDF
- `page.extract_text()` — extrait le texte d'une page
- `if contenu` — ignore les pages vides (pages d'images sans texte)
- Retourne le texte complet du PDF page par page

---

### `app/embedding.py` — Modèle de vectorisation

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
```

Ce fichier charge le modèle d'embedding au démarrage du serveur.  
Le modèle `paraphrase-multilingual-MiniLM-L12-v2` est un modèle multilingue capable de comprendre le français.

**Son rôle :** convertir un texte en vecteur (liste de nombres) qui représente le sens du texte.  
Deux textes avec un sens proche auront des vecteurs proches mathématiquement.

Il est importé par `indexation.py` et `chatbot_ai.py` qui en ont besoin.

---

### `app/indexation.py` — Découpage et stockage dans ChromaDB

```python
def indexer_document(texte, nom_fichier):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
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
```

**`indexer_document(texte, nom_fichier)`**  
Prend le texte brut du PDF et son nom, découpe le texte, vectorise chaque morceau et les enregistre dans ChromaDB.

Étape par étape :

1. `RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)`  
   Découpe le texte en morceaux de **500 caractères** avec un chevauchement de **100 caractères**.  
   Le chevauchement évite de couper une phrase importante entre deux chunks.

2. `chromadb.PersistentClient(path=DB_PATH)`  
   Ouvre la base vectorielle stockée dans `chroma_db/`. Si elle n'existe pas encore, ChromaDB la crée.

3. `client.get_collection` / `create_collection`  
   Récupère la collection `"documents"` si elle existe, sinon la crée.

4. `collection.count()`  
   Compte les chunks déjà présents pour ne pas écraser les anciens en continuant la numérotation des IDs.

5. `model.encode(chunk).tolist()`  
   Convertit le chunk en vecteur grâce au modèle d'embedding.

6. `collection.add(...)`  
   Sauvegarde dans ChromaDB : le texte du chunk, son vecteur, et le nom du fichier source comme métadonnée.

7. Retourne le nombre de chunks créés (affiché dans le terminal).

---

### `app/chatbot_ai.py` — Recherche et génération de réponse

C'est le fichier le plus important. Il contient 3 fonctions.

---

#### `extraire_numero_article(question)`

```python
def extraire_numero_article(question):
    match = re.search(r"ar?t?i?c?l?e\s*(\d+)", question, re.IGNORECASE)
    return match.group(1) if match else None
```

Détecte si la question contient un numéro d'article, même avec des fautes de frappe.

- `ar?t?i?c?l?e` — chaque lettre après `a` est optionnelle, ce qui tolère `aticle`, `artice`, `aricle`...
- `\s*(\d+)` — capture le numéro qui suit
- Retourne le numéro (`"3"`, `"30"`) ou `None` si aucun article n'est mentionné

---

#### `rechercher(question, source=None)`

```python
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

        if chunks:
            sources = list({m["source"] for m in metadatas})
            return chunks[:8], sources

    # Fallback : recherche sémantique
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
```

Cherche les chunks les plus pertinents pour répondre à la question.

- `where = {"source": source}` — si un fichier est spécifié, filtre uniquement sur ce PDF
- **Si un numéro d'article est détecté :**
  - `collection.get()` — récupère tous les chunks de la base
  - `pattern_titre` — cherche les chunks qui contiennent `Article 30 :` (le vrai contenu de l'article) → **prioritaires**
  - `pattern` — cherche les chunks qui mentionnent `Art 30` ou `article 30` ailleurs → **secondaires**
  - `(?!\d)` — empêche de confondre `Article 3` avec `Article 30`
  - Retourne prioritaires en premier, puis secondaires (max 8 chunks)
- **Sinon (fallback sémantique) :**
  - `model.encode(question)` — convertit la question en vecteur
  - `collection.query()` — trouve les 8 chunks dont les vecteurs sont les plus proches de la question

---

#### `generer(question, chunks)`

```python
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
```

Envoie la question et les chunks trouvés au modèle Mistral pour générer une réponse.

- `"\n\n".join(chunks)` — assemble tous les chunks en un seul texte de contexte
- Le **prompt** indique au modèle :
  - Son rôle (assistant juridique spécialisé)
  - De répondre uniquement à partir du contexte fourni (pas d'invention)
  - De citer l'article si possible
  - Quoi répondre si l'information est absente
- `RÉPONSE :` à la fin — guide le modèle à répondre directement
- `client_ollama.chat()` — envoie le prompt au serveur Ollama et retourne la réponse

---

### `routes/chat.py` — Les endpoints de l'API

```python
class ChatRequest(BaseModel):
    question: str
    source: str | None = None
```

**`ChatRequest`** — définit le format JSON attendu pour les requêtes `/chat`.  
`source` est optionnel : s'il est absent, la recherche se fait sur tous les documents.

---

**`GET /`**
```python
@router.get("/")
def home():
    return {"message": "Backend opérationnel"}
```
Simple vérification que le serveur tourne. Utile pour tester rapidement.

---

**`POST /upload`**
```python
@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    dossier = "./documents"
    os.makedirs(dossier, exist_ok=True)
    chemin = f"{dossier}/{file.filename}"
    with open(chemin, "wb") as f:
        shutil.copyfileobj(file.file, f)
    texte = charger_pdf(chemin)
    nb_chunks = indexer_document(texte, file.filename)
    return {"filename": file.filename, "message": f"Document indexé avec succès ({nb_chunks} chunks)"}
```

Reçoit un fichier PDF depuis le frontend, le sauvegarde dans `documents/`, l'indexe dans ChromaDB et retourne le nom du fichier.

- `UploadFile` — type FastAPI pour recevoir un fichier
- `os.makedirs(exist_ok=True)` — crée le dossier `documents/` s'il n'existe pas
- `shutil.copyfileobj` — copie le fichier reçu sur le disque
- Appelle `charger_pdf()` puis `indexer_document()` pour indexer directement

---

**`POST /chat`**
```python
@router.post("/chat")
def chat(data: ChatRequest):
    chunks, sources = rechercher(data.question, data.source)
    reponse = generer(data.question, chunks)
    return {"answer": reponse, "sources": sources}
```

Le endpoint principal. Reçoit la question, cherche les chunks pertinents, génère la réponse et la retourne avec les sources.

- `data.question` — la question posée par l'utilisateur
- `data.source` — le nom du PDF sur lequel filtrer (optionnel)
- Retourne `answer` (la réponse) et `sources` (les fichiers utilisés)

---

## Résumé des dépendances

| Librairie | Rôle |
|---|---|
| `fastapi` | Framework pour créer l'API REST |
| `uvicorn` | Serveur qui fait tourner FastAPI |
| `pypdf` | Lecture et extraction du texte des PDFs |
| `sentence-transformers` | Modèle d'embedding (vectorisation du texte) |
| `chromadb` | Base de données vectorielle pour stocker et chercher les chunks |
| `langchain-text-splitters` | Découpage intelligent du texte en chunks |
| `ollama` | Client Python pour communiquer avec le serveur Ollama (Mistral) |
| `python-multipart` | Nécessaire pour recevoir des fichiers uploadés dans FastAPI |
