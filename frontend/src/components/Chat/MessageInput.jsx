// import React, { useState, useRef } from 'react'
// import { Send, Loader } from 'lucide-react'

// const MessageInput = ({ onSend, disabled }) => {
//   const [message, setMessage] = useState('')
//   const textareaRef = useRef(null)

//   const handleSubmit = (e) => {
//     e.preventDefault()
//     if (message.trim() && !disabled) {
//       onSend(message)
//       setMessage('')
//       if (textareaRef.current) {
//         textareaRef.current.style.height = 'auto'
//       }
//     }
//   }

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault()
//       handleSubmit(e)
//     }
//   }

//   const handleChange = (e) => {
//     setMessage(e.target.value)
    
//     // Auto-resize textarea
//     if (textareaRef.current) {
//       textareaRef.current.style.height = 'auto'
//       textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
//     }
//   }

//   return (
//     <div className="message-input-container">
//       <form onSubmit={handleSubmit} className="message-input-form">
//         <textarea
//           ref={textareaRef}
//           value={message}
//           onChange={handleChange}
//           onKeyDown={handleKeyDown}
//           placeholder="Ask about symptoms, treatments, or book an appointment..."
//           disabled={disabled}
//           rows={1}
//         />
//         <button
//           type="submit"
//           disabled={disabled || !message.trim()}
//           className="send-button"
//         >
//           {disabled ? (
//             <Loader size={20} className="spin" />
//           ) : (
//             <Send size={20} />
//           )}
//         </button>
//       </form>
//       <p className="input-hint">
//         Press Enter to send, Shift + Enter for new line
//       </p>
//     </div>
//   )
// }

// export default MessageInput
import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader, Mic, MicOff } from 'lucide-react'

const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const textareaRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US' // Change to 'hi-IN' for Hindi, etc.
      
      recognitionInstance.onstart = () => {
        setIsListening(true)
      }
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        
        setMessage(transcript)
        
        // Auto-resize textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
        }
      }
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
    }
  }

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about symptoms, treatments, or book an appointment..."
          disabled={disabled}
          rows={1}
        />
        
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          disabled={disabled}
          title={isListening ? 'Stop recording' : 'Voice input'}
        >
          {isListening ? (
            <MicOff size={20} className="pulse" />
          ) : (
            <Mic size={20} />
          )}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="send-button"
        >
          {disabled ? (
            <Loader size={20} className="spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
      
      <p className="input-hint">
        {isListening ? (
          <span className="listening-text">🎤 Listening... Speak now</span>
        ) : (
          'Press Enter to send, Shift + Enter for new line'
        )}
      </p>
    </div>
  )
}

export default MessageInput
