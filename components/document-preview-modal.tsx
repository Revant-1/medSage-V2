"use client"

import { useState, useEffect } from "react"
import { X, Download, Trash2, Edit, Check, Loader2, FileText, ImageIcon, File, Copy, ExternalLink } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"

interface Document {
  id: string | number
  name: string
  type: string
  date: string
  size?: string
  url?: string
  pathname?: string
}

interface DocumentPreviewModalProps {
  document: Document | null
  onClose: () => void
  onDelete: (doc: Document) => void
  onRename: (doc: Document, newName: string) => void
}

export default function DocumentPreviewModal({ document, onClose, onDelete, onRename }: DocumentPreviewModalProps) {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summary, setSummary] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"preview" | "summary">("preview")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (document) {
      setNewName(document.name)
      generateSummary()

      // Set preview URL
      if (document.url) {
        setPreviewUrl(document.url)
      } else if (document.pathname) {
        setPreviewUrl(`/api/view-file?pathname=${encodeURIComponent(document.pathname)}`)
      }
    }
  }, [document])

  const generateSummary = async () => {
    if (!document) return

    setIsGeneratingSummary(true)
    setSummary("")

    try {
      // Get document content or metadata
      let documentContent = `Document Name: ${document.name}\nType: ${document.type.toUpperCase()}\nDate: ${document.date}`

      if (document.url || document.pathname) {
        // For simplicity, we're just using metadata, but in a real app you might extract text from PDFs, etc.
        documentContent += `\nThis is a ${document.type.toUpperCase()} file.`
      }

      // Generate summary using our secure server API route
      const response = await fetch("/api/ai-completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-pro",
          messages: [
            {
              role: "system",
              content:
                "You are a medical document analyzer. Provide a detailed summary of the document based on its metadata. Format your response in Markdown with appropriate headings, bullet points, and emphasis where needed. Include a 'Key Points' section and a 'Recommendations' section.",
            },
            {
              role: "user",
              content: `Please analyze this medical document and provide a detailed summary formatted in Markdown:\n\n${documentContent}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      const summaryText = data.choices[0]?.message?.content || "Unable to generate summary."
      setSummary(summaryText)
    } catch (error) {
      console.error("Error generating summary:", error)
      setSummary("Failed to generate summary. Please try again.")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleRename = () => {
    if (!document || !newName.trim()) return
    onRename(document, newName)
    setIsEditing(false)
  }

  const copyToClipboard = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-12 w-12 text-red-500" />
      case "docx":
      case "doc":
        return <FileText className="h-12 w-12 text-blue-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="h-12 w-12 text-green-500" />
      default:
        return <File className="h-12 w-12 text-gray-500" />
    }
  }

  if (!document) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setNewName(document.name)
                  }}
                  className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {getFileIcon(document.type)}
                <div>
                  <h3 className="text-xl font-semibold">{document.name}</h3>
                  <p className="text-sm text-gray-500">
                    {document.type.toUpperCase()} • {document.date} • {document.size}
                  </p>
                </div>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`px-4 py-3 font-medium ${
                activeTab === "preview"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
            <button
              className={`px-4 py-3 font-medium ${
                activeTab === "summary"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("summary")}
            >
              AI Summary
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "preview" && (
              <div className="p-4">
                <div className="bg-gray-50 rounded-lg min-h-[300px] flex items-center justify-center">
                  {document.type === "pdf" ? (
                    <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg" title={document.name} />
                  ) : document.type === "jpg" || document.type === "jpeg" || document.type === "png" ? (
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt={document.name}
                      className="max-w-full max-h-[60vh] object-contain"
                    />
                  ) : (
                    <div className="text-center p-6">
                      {getFileIcon(document.type)}
                      <p className="mt-3 text-gray-600">Preview not available for this file type</p>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-blue-600 hover:underline"
                      >
                        Open file <ExternalLink className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "summary" && (
              <div className="p-6">
                {isGeneratingSummary ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
                    <p className="text-gray-600">Generating AI summary...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                  </div>
                ) : summary ? (
                  <div className="prose prose-green max-w-none">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No summary available</p>
                    <button
                      onClick={generateSummary}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Generate Summary
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="border-t p-4 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="h-5 w-5" />
                <span className="hidden md:inline">Rename</span>
              </button>
              <button
                onClick={() => window.open(previewUrl, "_blank")}
                className="flex items-center justify-center gap-2 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span className="hidden md:inline">Download</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                <span className="hidden md:inline">{copied ? "Copied!" : "Copy Link"}</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this document?")) {
                    onDelete(document)
                  }
                }}
                className="flex items-center justify-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
                <span className="hidden md:inline">Delete</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
