import { useState, useRef, useEffect } from 'react'
import './App.css'

const API = 'http://localhost:8000'

type Role = 'user' | 'bot'

interface Message {
  role: Role
  text: string
  sources?: string[]
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Bonjour ! Posez-moi une question sur Benin-Loi-2017-20-Portant-code-du-numerique-en-Republique-du-Benin ou uploadez un PDF.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const question = input.trim()
    if (!question || loading) return

    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, source: uploadedFile ?? undefined })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.answer, sources: data.sources }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Erreur de connexion au serveur.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
      const data = await res.json()
      setUploadedFile(data.filename)
      setMessages(prev => [...prev, { role: 'bot', text: `✅ Document "${data.filename}" indexé avec succès. Vous pouvez maintenant poser vos questions.` }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '❌ Erreur lors de l\'upload du document.' }])
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚖️</span>
            <span>Chatbot Juridique</span>
          </div>
          {uploadedFile && (
            <div className="active-doc">
              <span className="doc-icon">📄</span>
              <span className="doc-name">{uploadedFile}</span>
              <button className="clear-doc" onClick={() => setUploadedFile(null)} title="Retirer le filtre">✕</button>
            </div>
          )}
        </div>
      </header>

      <main className="chat-area">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="bubble">
                <p>{msg.text}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources">
                    {msg.sources.map((s, j) => (
                      <span key={j} className="source-tag">📄 {s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="input-area">
        <div className="input-inner">
          <button
            className="upload-btn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Uploader un PDF"
          >
            {uploading ? '⏳' : '📎'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.tsx,.ts,.docx,.csv,.xlsx" onChange={handleUpload} hidden />
          <textarea
            className="input-box"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            rows={1}
            disabled={loading}
          />
          <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
            Envoyer
          </button>
        </div>
      </footer>
    </div>
  )
}
