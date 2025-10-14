import React, { useState, useEffect } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { chatAPI } from '../../services/api'
import { Bot, Sparkles } from 'lucide-react'

const ChatArea = ({ session, onUpdateTitle, sidebarCollapsed }) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (session) {
      loadMessages()
    }
  }, [session])

  const loadMessages = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const data = await chatAPI.getMessages(session.id)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (content) => {
    if (!session || !content.trim()) return

    setSending(true)
    
    // Add user message immediately for better UX
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: content,
      created_at: new Date().toISOString(),
    }
    setMessages([...messages, userMessage])

    try {
      const response = await chatAPI.sendMessage(session.id, content)
      
      // Reload messages to get the complete conversation
      await loadMessages()
      
      // Update session title if it's the first message
      if (messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        onUpdateTitle(session.id, title)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove the optimistically added message on error
      setMessages(messages)
    } finally {
      setSending(false)
    }
  }

  if (!session) {
    return (
      <div className="chat-area empty">
        <div className="empty-state">
          <Bot size={64} strokeWidth={1.5} />
          <h2>Welcome to Medical Assistant</h2>
          <p>Start a conversation to get medical information and assistance</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`chat-area ${sidebarCollapsed ? 'expanded' : ''}`}>
      <div className="chat-header">
        <div className="chat-title">
          <Sparkles size={20} />
          <h2>{session.title}</h2>
        </div>
      </div>

      {loading ? (
        <div className="loading-messages">
          <div className="spinner spin"></div>
          <p>Loading conversation...</p>
        </div>
      ) : (
        <>
          <MessageList messages={messages} />
          <MessageInput onSend={handleSendMessage} disabled={sending} />
        </>
      )}
    </div>
  )
}

export default ChatArea
