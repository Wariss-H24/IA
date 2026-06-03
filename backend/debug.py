import chromadb, re

client = chromadb.PersistentClient(path="./chroma_db")
col = client.get_collection("documents")
tous = col.get(include=["documents"])
docs = tous["documents"]

numero = "3"
pattern_titre = re.compile(rf"Article\s+{numero}\s*:", re.IGNORECASE)
pattern = re.compile(rf"Art(?:icle|\.?)?\s*{numero}(?!\d)", re.IGNORECASE)

p = [d for d in docs if pattern_titre.search(d)]
s = [d for d in docs if pattern.search(d)]

print(f"Prioritaires (titre exact): {len(p)}")
print(f"Pattern general: {len(s)}")

print("\n--- PRIORITAIRES ---")
for c in p[:3]:
    print(repr(c[:400]))
    print()
