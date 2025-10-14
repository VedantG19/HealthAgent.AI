import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import ChatLayout from './components/Chat/ChatLayout'
import AdminDashboard from './components/Admin/AdminDashboard'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth routes without layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes with layout */}
        <Route
          path="/chat/*"
          element={
            <ProtectedRoute>
              <Layout showHeader={false}>
                <ChatLayout />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout showHeader={false}>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          }
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
