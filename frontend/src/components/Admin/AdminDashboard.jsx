import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import DocumentUpload from './DocumentUpload'
import { adminAPI } from '../../services/api'
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Database,
  HardDrive
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import './Admin.css'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const data = await adminAPI.getDocuments()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId) => {
    if (deleteConfirm === documentId) {
      try {
        await adminAPI.deleteDocument(documentId)
        setDocuments(documents.filter(doc => doc.id !== documentId))
        setDeleteConfirm(null)
      } catch (error) {
        console.error('Failed to delete document:', error)
      }
    } else {
      setDeleteConfirm(documentId)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="status-icon success" />
      case 'failed':
        return <XCircle size={18} className="status-icon error" />
      case 'processing':
        return <Clock size={18} className="status-icon processing spin" />
      default:
        return <Clock size={18} className="status-icon pending" />
    }
  }

  const totalSize = documents.reduce((acc, doc) => acc + doc.file_size, 0)
  const processedCount = documents.filter(doc => doc.processed === 'completed').length

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate('/chat')}>
          <ArrowLeft size={20} />
          <span>Back to Chat</span>
        </button>
        <div className="admin-title">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user?.username}</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>{documents.length}</h3>
            <p>Total Documents</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{processedCount}</h3>
            <p>Processed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <HardDrive size={24} />
          </div>
          <div className="stat-content">
            <h3>{formatFileSize(totalSize)}</h3>
            <p>Total Storage</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <h3>ChromaDB</h3>
            <p>Vector Store</p>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <DocumentUpload onUploadComplete={loadDocuments} />

        <div className="documents-section">
          <h2 className="section-title">
            <FileText size={24} />
            Uploaded Documents
          </h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner spin"></div>
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <Upload size={48} strokeWidth={1.5} />
              <h3>No documents uploaded</h3>
              <p>Upload your first medical document to get started</p>
            </div>
          ) : (
            <div className="documents-table">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div className="status-cell">
                          {getStatusIcon(doc.processed)}
                          <span className={`status-text ${doc.processed}`}>
                            {doc.processed}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="file-cell">
                          <FileText size={16} />
                          <span title={doc.original_filename}>
                            {doc.original_filename}
                          </span>
                        </div>
                      </td>
                      <td>{formatFileSize(doc.file_size)}</td>
                      <td>{formatDate(doc.uploaded_at)}</td>
                      <td>
                        <button
                          className={`delete-icon-btn ${
                            deleteConfirm === doc.id ? 'confirm' : ''
                          }`}
                          onClick={() => handleDelete(doc.id)}
                          title={
                            deleteConfirm === doc.id
                              ? 'Click again to confirm'
                              : 'Delete document'
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
