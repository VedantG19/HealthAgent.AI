import React, { useEffect, useRef } from 'react'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), 'h:mm a')
    } catch {
      return ''
    }
  }

  if (messages.length === 0) {
    return (
      <div className="messages-container empty">
        <div className="empty-messages">
          <Bot size={48} strokeWidth={1.5} />
          <h3>Start a conversation</h3>
          <p>Ask me anything about medical conditions, symptoms, or book an appointment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-container">
      <div className="messages-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? (
                <User size={20} />
              ) : (
                <Bot size={20} />
              )}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? 'You' : 'Medical Assistant'}
                </span>
                <span className="message-time">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <div className="message-text">
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList
