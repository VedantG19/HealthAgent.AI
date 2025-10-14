import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const formData = new URLSearchParams()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },
  
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData)
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },
}

// Session API
export const sessionAPI = {
  createSession: async (title = 'New Chat') => {
    const response = await api.post('/api/sessions/', { title })
    return response.data
  },
  
  getSessions: async () => {
    const response = await api.get('/api/sessions/')
    return response.data
  },
  
  getSession: async (sessionId) => {
    const response = await api.get(`/api/sessions/${sessionId}`)
    return response.data
  },
  
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/api/sessions/${sessionId}`)
    return response.data
  },
  
  updateSessionTitle: async (sessionId, title) => {
    const response = await api.patch(`/api/sessions/${sessionId}/title`, null, {
      params: { title }
    })
    return response.data
  },
}

// Chat API
export const chatAPI = {
  sendMessage: async (sessionId, content) => {
    const response = await api.post(`/api/chat/${sessionId}/message`, {
      content,
      role: 'user'
    })
    return response.data
  },
  
  getMessages: async (sessionId) => {
    const response = await api.get(`/api/chat/${sessionId}/messages`)
    return response.data
  },
}

// Admin API
export const adminAPI = {
  uploadDocument: async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/api/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        if (onProgress) onProgress(percentCompleted)
      },
    })
    return response.data
  },
  
  getDocuments: async () => {
    const response = await api.get('/api/admin/documents')
    return response.data
  },
  
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/admin/documents/${documentId}`)
    return response.data
  },
}

export default api
