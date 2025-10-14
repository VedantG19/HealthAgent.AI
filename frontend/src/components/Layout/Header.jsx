import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Heart, User, Shield, LogOut, Menu } from 'lucide-react'
import './Layout.css'

const Header = ({ onMenuToggle }) => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
        <div className="header-logo">
          <Heart size={28} strokeWidth={2.5} />
          <span>Medical Assistant</span>
        </div>
      </div>

      <div className="header-right">
        {isAdmin && (
          <button
            className="header-btn admin-badge"
            onClick={() => navigate('/admin')}
            title="Admin Dashboard"
          >
            <Shield size={18} />
            <span>Admin</span>
          </button>
        )}

        <div className="user-menu">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <span className="user-name">{user?.username}</span>
        </div>

        <button className="header-btn logout" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}

export default Header
