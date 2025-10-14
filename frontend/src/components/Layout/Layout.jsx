import React, { useState } from 'react'
import Header from './Header'
import './Layout.css'

const Layout = ({ children, showHeader = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="app-layout">
      {showHeader && <Header onMenuToggle={toggleSidebar} />}
      <main className={`app-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {children}
      </main>
    </div>
  )
}

export default Layout
