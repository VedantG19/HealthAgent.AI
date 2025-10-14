import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatArea from './ChatArea'
import { sessionAPI } from '../../services/api'
import './Chat.css'

const ChatLayout = () => {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await sessionAPI.getSessions()
      setSessions(data)
      
      // If no sessions, create a new one
      if (data.length === 0) {
        await handleNewChat()
      } else {
        // Select the most recent session
        setCurrentSession(data[0])
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = async () => {
    try {
      const newSession = await sessionAPI.createSession()
      setSessions([newSession, ...sessions])
      setCurrentSession(newSession)
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleSelectSession = (session) => {
    setCurrentSession(session)
  }

  const handleDeleteSession = async (sessionId) => {
    try {
      await sessionAPI.deleteSession(sessionId)
      const updatedSessions = sessions.filter(s => s.id !== sessionId)
      setSessions(updatedSessions)
      
      if (currentSession?.id === sessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSession(updatedSessions[0])
        } else {
          await handleNewChat()
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleUpdateSessionTitle = async (sessionId, newTitle) => {
    try {
      await sessionAPI.updateSessionTitle(sessionId, newTitle)
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, title: newTitle } : s
      ))
    } catch (error) {
      console.error('Failed to update session title:', error)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spin"></div>
        <p>Loading your chats...</p>
      </div>
    )
  }

  return (
    <div className="chat-layout">
      <Sidebar
        sessions={sessions}
        currentSession={currentSession}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <ChatArea
        session={currentSession}
        onUpdateTitle={handleUpdateSessionTitle}
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  )
}

export default ChatLayout
