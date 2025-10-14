import React, { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

const DocumentUpload = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)

  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setError('')
      setSuccess(false)

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are supported')
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('File size must be less than 100MB')
        return
      }

      setSelectedFile(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      fileInputRef.current.files = e.dataTransfer.files
      handleFileSelect({ target: { files: [file] } })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const { adminAPI } = await import('../../services/api')
      await adminAPI.uploadDocument(selectedFile, (percent) => {
        setProgress(percent)
      })

      setSuccess(true)
      setSelectedFile(null)
      setProgress(0)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent component
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete()
        }, 1000)
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setError('')
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="upload-section">
      <h2 className="section-title">
        <Upload size={24} />
        Upload Medical Document
      </h2>

      {error && (
        <div className="upload-message error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="upload-message success">
          <CheckCircle size={18} />
          <span>Document uploaded and processed successfully!</span>
        </div>
      )}

      <div
        className="upload-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <div className="upload-placeholder">
            <Upload size={48} strokeWidth={1.5} />
            <h3>Drop your PDF here or click to browse</h3>
            <p>Maximum file size: 100MB • PDF format only</p>
          </div>
        ) : (
          <div className="selected-file">
            <div className="file-info">
              <FileText size={32} />
              <div className="file-details">
                <h4>{selectedFile.name}</h4>
                <p>{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            {!uploading && (
              <button className="remove-btn" onClick={handleRemove}>
                <X size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      {selectedFile && (
        <>
          {uploading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </>
      )}
    </div>
  )
}

export default DocumentUpload
