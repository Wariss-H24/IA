# Résumé des améliorations de la recherche par article

## Problème de départ

Quand on posait la question `"de quoi parle l'article 30 ?"`, le chatbot répondait qu'il ne trouvait pas l'information, alors que le contenu était bien dans le PDF indexé.

---

## Cause 1 : La recherche sémantique (embedding) n'est pas adaptée aux numéros d'articles

### Problème
La recherche originale utilisait uniquement l'embedding (similarité vectorielle).  
Quand on cherche `"article 30"`, l'embedding génère un vecteur proche de `"article 3"`, `"article 31"`, `"article 300"` etc.  
ChromaDB ramenait donc des chunks non pertinents.

### Solution
On a remplacé la recherche par embedding pour les articles par une **recherche directe par regex** sur tous les chunks :
- On détecte si la question contient un numéro d'article avec `extraire_numero_article()`
- Si oui, on filtre tous les chunks avec un pattern regex exact
- Sinon, on utilise le fallback sémantique classique

---

## Cause 2 : Le regex `\b` ne fonctionnait pas avec le texte du PDF

### Problème
Le PDF contient `larticle` (sans apostrophe, problème d'encodage PDF).  
Le `\b` (word boundary) en regex ne matchait pas `larticle 3` car `l` et `a` sont collés sans séparateur.

### Solution
Remplacement de `\b` par `(?!\d)` qui signifie **"non suivi d'un chiffre"**.  
Cela permet de matcher `Article 3` sans confondre avec `Article 30` ou `Article 31`,  
et fonctionne aussi avec `larticle` sans apostrophe.

---

## Cause 3 : Article 3 confondu avec Article 30, 31, 33...

### Problème
Le pattern `Art\s*3` matchait aussi `Article 30`, `Article 31` car `3` est contenu dans `30`.

### Solution
Utilisation de `(?!\d)` à la fin du pattern :
```
Art(?:icle|\.?)?\s*3(?!\d)
```
Ce qui matche `Article 3 :` mais pas `Article 30 :`.

---

## Cause 4 : Les chunks contenant le titre exact n'étaient pas priorisés

### Problème
ChromaDB `.get()` retourne les chunks sans ordre de pertinence.  
Le chunk contenant `Article 3 : Activités concernées` pouvait être après la limite de `chunks[:8]`,  
donc le modèle ne le recevait jamais.

### Solution
On trie les chunks en deux catégories avant de les envoyer au modèle :
- **Prioritaires** : chunks contenant `Article 3 :` (le titre exact de l'article)
- **Secondaires** : chunks mentionnant `article 3` dans leur texte

Les prioritaires passent toujours en premier dans le contexte envoyé au LLM.

---

## Cause 5 : Fautes de frappe dans la question (`aticle`, `artice`...)

### Problème
Les utilisateurs écrivent parfois `aticle` (sans `r`) ou `artice` (sans `l`).  
Le regex `article\s*(\d+)` ne matchait pas ces variantes, donc le numéro n'était pas détecté  
et on tombait dans le fallback sémantique qui donnait de mauvais résultats.

### Solution
Rendre chaque lettre optionnelle dans le regex sauf `a` et `e` :
```python
re.search(r"ar?t?i?c?l?e\s*(\d+)", question, re.IGNORECASE)
```
Ce qui couvre :
- `article` ✅
- `aticle` ✅ (sans r)
- `artice` ✅ (sans l)
- `aricle` ✅ (sans t)

---

## Résultat final : flux de recherche

```
Question utilisateur
        │
        ▼
extraire_numero_article()
        │
   ┌────┴────┐
   │ Numéro  │ Non → Recherche sémantique (embedding)
   │ détecté?│
   └────┬────┘
        │ Oui
        ▼
collection.get() → tous les chunks
        │
        ▼
Filtrage regex : Article X :  → prioritaires
                 article X    → secondaires
        │
        ▼
chunks = prioritaires + secondaires → LLM (Mistral)
```

---

## Amélioration du prompt

Le prompt a aussi été amélioré pour être plus précis :

| Avant | Après |
|---|---|
| "Tu es un assistant spécialisé" | "Tu es un assistant juridique spécialisé dans le Code du Numérique du Bénin" |
| Pas de consigne de citation | "Cite l'article concerné si possible" |
| Réponse vague si absent | "Je ne trouve pas cette information dans le document." |
| Pas de balise de fin | Ajout de `RÉPONSE :` pour guider le modèle |
