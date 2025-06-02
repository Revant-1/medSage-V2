"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { Send, Paperclip, ImageIcon, Loader2, FileText, X, FolderOpen } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import LoadingAnimation from "@/components/loading-animation"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  attachments?: Array<{
    type: "image" | "document"
    url: string
    name: string
  }>
}

interface Document {
  url: string
  pathname: string
  name: string
  type: string
  size: number
  modified: string
}

export default function Chat() {
  const { user, isAuthLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: "system",
      content: "Welcome to MediSage! I'm your AI health assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState(uuidv4())
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [showDocumentSelector, setShowDocumentSelector] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        window.location.href = "/login?redirect=/chat"
      }
    }
  }, [user, isAuthLoading])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Check if there's a chat ID in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const urlChatId = urlParams.get("id")

    if (urlChatId) {
      setChatId(urlChatId)
      fetchChatHistory(urlChatId)
    }
  }, [])

  const fetchChatHistory = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/chat/${id}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.chat) {
          // Convert the chat messages to our Message format
          const chatMessages: Message[] = data.chat.messages.map((msg: any) => ({
            id: uuidv4(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            attachments: msg.attachments,
          }))

          // Add the system welcome message if it doesn't exist
          if (!chatMessages.some((msg) => msg.role === "system")) {
            chatMessages.unshift({
              id: uuidv4(),
              role: "system",
              content: "Welcome to MediSage! I'm your AI health assistant. How can I help you today?",
              timestamp: new Date(),
            })
          }

          setMessages(chatMessages)
        }
      }
    } catch (error) {
      console.error("Error fetching chat history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocuments(true)
      const response = await fetch("/api/list-files")

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDocuments(data.files)
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)

      // Initialize upload progress for each file
      const newProgress: { [key: string]: number } = {}
      filesArray.forEach((file) => {
        newProgress[file.name] = 0
      })

      setUploadProgress(newProgress)
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev]
      const removedFile = newFiles[index]

      // Remove progress tracking for this file
      setUploadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[removedFile.name]
        return newProgress
      })

      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const removeSelectedDocument = (index: number) => {
    setSelectedDocuments((prev) => {
      const newDocs = [...prev]
      newDocs.splice(index, 1)
      return newDocs
    })
  }

  const toggleDocumentSelector = () => {
    if (!showDocumentSelector) {
      fetchDocuments()
    }
    setShowDocumentSelector(!showDocumentSelector)
  }

  const selectDocument = (doc: Document) => {
    if (!selectedDocuments.some((d) => d.pathname === doc.pathname)) {
      setSelectedDocuments([...selectedDocuments, doc])
    }
  }

  const uploadFile = async (file: File): Promise<{ type: string; url: string; name: string } | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      // Create a custom XMLHttpRequest to track upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percentComplete,
            }))
          }
        })

        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              if (data.success) {
                resolve({
                  type: file.type.startsWith("image/") ? "image" : "document",
                  url: data.file.url,
                  name: data.file.originalName,
                })
              } else {
                reject(new Error(data.error || "Upload failed"))
              }
            } catch (error) {
              reject(error)
            }
          } else {
            reject(new Error(`HTTP error ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => reject(new Error("Network error")))
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")))

        xhr.open("POST", "/api/upload")
        xhr.send(formData)
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      return null
    }
  }

  const handleSendMessage = async () => {
    if (!user) {
      window.location.href = "/login?redirect=/chat"
      return
    }

    if (!inputValue.trim() && selectedFiles.length === 0 && selectedDocuments.length === 0) return

    setIsUploading(selectedFiles.length > 0)
    setError(null) // Clear any previous errors

    const newMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    // Handle file uploads if any
    if (selectedFiles.length > 0 || selectedDocuments.length > 0) {
      const uploadedAttachments = []

      // Process new file uploads
      for (const file of selectedFiles) {
        try {
          const attachment = await uploadFile(file)
          if (attachment) {
            uploadedAttachments.push(attachment)
          }
        } catch (error) {
          console.error("Error uploading file:", error)
        }
      }

      // Add selected documents from library
      for (const doc of selectedDocuments) {
        uploadedAttachments.push({
          type: doc.type.match(/^(jpg|jpeg|png|gif|webp)$/i) ? "image" : "document",
          url: doc.url,
          name: doc.name,
        })
      }

      if (uploadedAttachments.length > 0) {
        newMessage.attachments = uploadedAttachments
      }
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setSelectedFiles([])
    setSelectedDocuments([])
    setIsUploading(false)
    setIsLoading(true)
    setShowDocumentSelector(false)

    try {
      // Format messages for API
      const apiMessages = messages
        .filter((msg) => msg.role !== "system")
        .concat([newMessage])
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
          attachments: msg.attachments,
        }))

      // Client-side retry logic
      let response = null
      let data = null
      const maxRetries = 3
      let lastError = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Chat request attempt ${attempt}/${maxRetries}`)

          response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: apiMessages,
              userId: user?.id || "anonymous",
              chatId,
            }),
          })

          data = await response.json()

          if (response.ok && data.response) {
            console.log("Chat request successful on attempt", attempt)
            break
          } else {
            lastError = new Error(data.error || `HTTP ${response.status}`)
            console.error(`Chat request failed on attempt ${attempt}:`, lastError)

            // Wait before retrying
            if (attempt < maxRetries) {
              const delay = 1000 * attempt // 1s, 2s, 3s
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          }
        } catch (fetchError) {
          lastError = fetchError
          console.error(`Network error on attempt ${attempt}:`, fetchError)

          // Wait before retrying
          if (attempt < maxRetries) {
            const delay = 1000 * attempt
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
      }

      if (!data?.response) {
        throw lastError || new Error("Failed to get response after all retries")
      }

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error("Error sending message:", error)
      setError(error.message || "Failed to send message after multiple attempts")

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const examples = [
    "What are the symptoms of diabetes?",
    "How can I improve my sleep quality?",
    "What foods are good for heart health?",
  ]

  if (isLoading && messages.length <= 1) {
    return (
      <DashboardLayout title="Chat with MediSage">
        <div className="flex justify-center items-center h-[calc(100vh-12rem)]">
          <LoadingAnimation />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Chat with MediSage">
      <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)]">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          {messages
            .filter((m) => m.role !== "system")
            .map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-lime-500 to-green-500 text-white dark:from-lime-600 dark:to-green-600"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {message.attachments?.map((attachment, i) => (
                    <div key={i} className="mb-2">
                      {attachment.type === "image" ? (
                        <div className="relative w-full max-w-xs h-40 mb-2 rounded overflow-hidden">
                          <img
                            src={attachment.url || "/placeholder.svg"}
                            alt="Attached medical image"
                            className="object-cover w-full h-full"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error("Image load error:", e)
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-white/20 dark:bg-black/20 p-2 rounded mb-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate">{attachment.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                    {message.content}
                  </ReactMarkdown>
                </div>
              </motion.div>
            ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl dark:bg-gray-700">
                <LoadingAnimation size="small" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Example Suggestions */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setInputValue(example)}
                className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left dark:bg-gray-800 dark:text-gray-200"
              >
                <p className="text-gray-800 text-sm dark:text-gray-200">{example}</p>
              </button>
            ))}
          </div>
        )}

        {/* Document Selector */}
        <AnimatePresence>
          {showDocumentSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white p-4 rounded-lg shadow-md mb-4 dark:bg-gray-800"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Select Documents</h3>
                <button
                  onClick={() => setShowDocumentSelector(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingDocuments ? (
                <div className="flex justify-center py-4">
                  <LoadingAnimation size="small" text="Loading documents..." />
                </div>
              ) : documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4 dark:text-gray-400">
                  No documents found. Upload documents in the Documents section.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {documents.map((doc) => (
                    <button
                      key={doc.pathname}
                      onClick={() => selectDocument(doc)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedDocuments.some((d) => d.pathname === doc.pathname)
                          ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : ""
                      }`}
                    >
                      {doc.type.match(/^(jpg|jpeg|png|gif|webp)$/i) ? (
                        <ImageIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-500" />
                      )}
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium dark:text-gray-200">{doc.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(doc.modified).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Files */}
        <AnimatePresence>
          {(selectedFiles.length > 0 || selectedDocuments.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-2 overflow-hidden"
            >
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`file-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm relative dark:bg-gray-700"
                >
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <FileText className="w-4 h-4 mr-1 text-blue-500" />
                  )}
                  <span className="text-sm truncate max-w-[150px] dark:text-gray-200">{file.name}</span>

                  {/* Progress indicator */}
                  {uploadProgress[file.name] > 0 && uploadProgress[file.name] < 100 && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-green-500 rounded-full"
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  )}

                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    aria-label="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}

              {selectedDocuments.map((doc, index) => (
                <motion.div
                  key={`doc-${doc.pathname}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm dark:bg-gray-700"
                >
                  {doc.type.match(/^(jpg|jpeg|png|gif|webp)$/i) ? (
                    <ImageIcon className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <FileText className="w-4 h-4 mr-1 text-blue-500" />
                  )}
                  <span className="text-sm truncate max-w-[150px] dark:text-gray-200">{doc.name}</span>
                  <button
                    onClick={() => removeSelectedDocument(index)}
                    className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    aria-label="Remove document"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow sticky bottom-0 z-10 dark:bg-gray-800">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            disabled={isLoading || isUploading}
            title="Upload file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={toggleDocumentSelector}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            disabled={isLoading || isUploading}
            title="Select from documents"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none border-0 focus:ring-0 max-h-32 p-2 text-base dark:bg-gray-800 dark:text-gray-200"
            rows={1}
            disabled={isLoading || isUploading}
          />
          <button
            onClick={handleSendMessage}
            disabled={
              isLoading ||
              isUploading ||
              (!inputValue.trim() && selectedFiles.length === 0 && selectedDocuments.length === 0)
            }
            className={`p-2 rounded-full ${
              isLoading ||
              isUploading ||
              (!inputValue.trim() && selectedFiles.length === 0 && selectedDocuments.length === 0)
                ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                : "bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
            }`}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
