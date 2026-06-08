Le fichier README.md est créé à la racine IA/. Il couvre :

Prérequis — Python, Node.js, Ollama avec les versions minimales

Structure du projet en arborescence

Installation backend (venv + pip) et frontend (npm)

Configuration Ollama — local ou sur un autre poste réseau

Démarrage des deux serveurs

Indexation — quand la faire et quand ne pas la faire

Utilisation — via l'interface web et via Swagger, avec exemples

Conseils sur les questions et les fautes de frappe tolérées.

# Chatbot Juridique IA

Chatbot basé sur l'intelligence artificielle permettant d'interroger des documents PDF juridiques en langage naturel.  
Il utilise une recherche vectorielle (ChromaDB) combinée à un modèle de langage (Mistral via Ollama) pour répondre avec précision à partir du contenu des documents.

---

## Prérequis

Avant de commencer, assure-toi d'avoir installé sur ta machine :

| Outil | Version minimale | Lien |
|---|---|---|
| Python | 3.12+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| Ollama | Dernière version | https://ollama.com/download |

---

## Structure du projet

```
IA/
├── backend/        # API FastAPI (Python)
│   ├── app/
│   ├── documents/  # PDFs indexés
│   ├── chroma_db/  # Base vectorielle (générée automatiquement)
│   ├── main.py
│   ├── index.py
│   └── requirements.txt
├── frontend/       # Interface React + TypeScript
│   ├── src/
│   └── package.json
└── README.md
```

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/Wariss-H24/IA.git
cd IA


  2. Backend (Python / FastAPI)

->Créer et activer l'environnement virtuel :

->  bash
->  cd backend
->  python -m venv venv


- Windows :

->  bash
venv\Scripts\activate

- macOS / Linux :
->  bash
source venv/bin/activate


**Installer les dépendances :**

```bash
pip install -r requirements.txt
```

---

### 3. Frontend (React / TypeScript)

```bash
cd ../frontend
npm install
```

---

### 4. Ollama — Modèle de langage

Ollama doit tourner sur un serveur accessible.  
Si tu le lances en local, démarre-le puis télécharge le modèle Mistral :

```bash
ollama serve
ollama pull mistral
```

> Si Ollama tourne sur un autre poste du réseau, modifie l'adresse dans `backend/app/chatbot_ai.py` :
> ```python
> client_ollama = Client(host="http://<IP_DU_SERVEUR>:11434")
> ```

---

## Démarrage

### Backend

```bash
cd backend
venv\Scripts\activate   # (ou source venv/bin/activate sur macOS/Linux)
uvicorn main:app --reload
```

L'API sera disponible sur : **http://localhost:8000**  
La documentation Swagger : **http://localhost:8000/docs**

---

### Frontend

Dans un nouveau terminal :

```bash
cd frontend
npm run dev
```

L'interface sera disponible sur : **http://localhost:5173**

---

## Indexer un document (première utilisation)

Si le dossier `chroma_db/` est absent ou vide, tu dois indexer les documents avant de pouvoir poser des questions.

Place ton PDF dans `backend/documents/` puis lance :

```bash
cd backend
venv\Scripts\activate
python index.py
```

> Si le dossier `chroma_db/` est déjà présent dans le repo cloné, cette étape n'est pas nécessaire.

---

## Utilisation

### Via l'interface web

1. Ouvre **http://localhost:5173**
2. Pose ta question directement dans le champ en bas
3. Appuie sur **Entrée** ou clique sur **Envoyer**

**Uploader un PDF :**
- Clique sur le bouton 📎 pour uploader un nouveau PDF
- Une fois uploadé, les réponses seront filtrées uniquement sur ce document
- Clique sur ✕ à côté du nom du fichier pour revenir à la recherche globale

### Via Swagger (test API)

Ouvre **http://localhost:8000/docs** et teste les endpoints :

| Endpoint | Méthode | Description |
|---|---|---|
| `/` | GET | Vérifier que l'API tourne |
| `/upload` | POST | Uploader et indexer un PDF |
| `/chat` | POST | Poser une question |

**Exemple de requête `/chat` :**
```json
{
  "question": "de quoi parle l'article 30 ?",
  "source": "mon-document.pdf"
}
```

> Le champ `source` est optionnel. S'il est absent, la recherche se fait sur tous les documents indexés.

---

## Conseils d'utilisation

- Pour des questions sur un article précis, précise le numéro : `"article 30"`, `"art 30"` — les fautes de frappe sont tolérées
- Si la réponse est absente du document, le chatbot répondra `"Je ne trouve pas cette information dans le document."`
- Tu peux indexer autant de PDFs que tu veux via le bouton upload ou via `index.py`
