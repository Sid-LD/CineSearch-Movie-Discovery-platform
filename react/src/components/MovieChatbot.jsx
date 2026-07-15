import { useState, useRef, useEffect } from 'react'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are CineAI, a friendly and knowledgeable movie expert assistant. 
You help users discover movies, answer questions about films, actors, directors, and suggest movies based on mood, genre, or preferences.
Keep your answers concise and engaging. Use emojis occasionally to make responses fun.
When suggesting movies, always include the release year and a brief reason why they'd enjoy it.
If asked about non-movie topics, politely redirect the conversation back to movies.`

const SUGGESTIONS = [
  '🎬 Suggest a thriller for tonight',
  '🌟 Best movies of 2024',
  '😢 Movies that will make me cry',
  '🚀 Sci-fi movies like Interstellar',
  '😂 Best comedy movies ever',
  '🏆 Oscar winners worth watching',
]

const TypingIndicator = () => (
  <div className="chat-message ai-message">
    <div className="chat-avatar ai-avatar">🎬</div>
    <div className="chat-bubble ai-bubble typing-bubble">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
)

const MovieChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! 🎬 I'm CineAI, your personal movie expert. Ask me anything — recommendations, trivia, what to watch tonight!",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || isLoading) return

    setInput('')
    setShowSuggestions(false)
    setIsLoading(true)

    const userMessage = { role: 'user', content: userText }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...updatedMessages,
          ],
          max_tokens: 500,
          temperature: 0.8,
        }),
      })

      if (!response.ok) throw new Error('Groq API error')

      const data = await response.json()
      const aiReply = data.choices?.[0]?.message?.content || 'Sorry, I could not get a response. Please try again!'

      setMessages((prev) => [...prev, { role: 'assistant', content: aiReply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Sorry, I ran into an error. Please check your Groq API key or try again!',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hey! 🎬 I'm CineAI, your personal movie expert. Ask me anything — recommendations, trivia, what to watch tonight!",
    }])
    setShowSuggestions(true)
  }

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-header-avatar">🎬</div>
              <div>
                <p className="chatbot-header-title">CineAI</p>
                <p className="chatbot-header-subtitle">
                  <span className="chatbot-online-dot" /> Movie Expert
                </p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-action-btn" onClick={clearChat} title="Clear chat">🗑</button>
              <button className="chatbot-action-btn" onClick={() => setIsOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="chat-avatar ai-avatar">🎬</div>
                )}
                <div className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="chat-avatar user-avatar">👤</div>
                )}
              </div>
            ))}

            {isLoading && <TypingIndicator />}

            {/* Quick suggestions */}
            {showSuggestions && !isLoading && (
              <div className="chat-suggestions">
                <p className="suggestions-label">Try asking:</p>
                <div className="suggestions-grid">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      className="suggestion-chip"
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-wrap">
            <input
              ref={inputRef}
              className="chatbot-input"
              type="text"
              placeholder="Ask about movies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        id="chatbot-toggle-btn"
        className={`chatbot-fab ${isOpen ? 'chatbot-fab-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with CineAI"
      >
        {isOpen ? '✕' : '🎬'}
        {!isOpen && <span className="chatbot-fab-label">CineAI</span>}
      </button>
    </>
  )
}

export default MovieChatbot
