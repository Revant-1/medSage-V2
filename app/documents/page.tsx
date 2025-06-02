"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import DocumentPreviewModal from "@/components/document-preview-modal"
import { useAuth } from "@/contexts/auth-context"
import { Upload, Trash, Edit, Eye, X, Check, FileText, ImageIcon, File, Search, ArrowUpDown } from "lucide-react"
import { formatFileSize } from "@/lib/utils"

interface Document {
  id: string | number
  name: string
  type: string
  date: string
  size?: string
  url?: string
  pathname?: string
}

export default function Documents() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/list-files")

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setDocuments(
          data.files.map((file: any) => ({
            id: file.name,
            name: file.name,
            type: file.type,
            date: new Date(file.modified).toLocaleDateString(),
            size: formatFileSize(file.size),
            url: file.url,
            pathname: file.pathname,
          })),
        )
      } else {
        setError(data.error || "Failed to fetch documents")
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Failed to load documents. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter documents based on search query
  const filteredDocuments = documents
    .filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Document] ?? ""
      const bValue = b[sortBy as keyof Document] ?? ""

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      } else {
        return 0
      }
    })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // Reset form and refresh document list
        setSelectedFile(null)
        setIsUploadModalOpen(false)
        await fetchDocuments()
      } else {
        setError(data.error || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload file. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDocument = async (doc: Document) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/delete-file", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pathname: doc.pathname }),
      })

      const data = await response.json()

      if (data.success) {
        // Close the preview modal if the deleted document is currently being viewed
        if (viewingDocument && viewingDocument.id === doc.id) {
          setViewingDocument(null)
        }
        await fetchDocuments()
      } else {
        setError(data.error || "Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      setError("Failed to delete document. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renameDocument = async (doc: Document, newName: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/rename-file", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pathname: doc.pathname,
          newName: newName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update the document in the local state
        setDocuments(documents.map((d) => (d.id === doc.id ? { ...d, name: newName } : d)))

        // Update the viewing document if it's the renamed one
        if (viewingDocument && viewingDocument.id === doc.id) {
          setViewingDocument({ ...viewingDocument, name: newName })
        }
      } else {
        setError(data.error || "Failed to rename document")
      }
    } catch (error) {
      console.error("Error renaming document:", error)
      setError("Failed to rename document. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />
      case "docx":
      case "doc":
        return <FileText className="h-8 w-8 text-blue-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="h-8 w-8 text-green-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <DashboardLayout title="My Documents">
      <p className="text-gray-600 mb-6 pl-16 lg:pl-0">Manage your health records and documents</p>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 pl-16 lg:pl-0">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="type">Type</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ArrowUpDown className="h-4 w-4" />
            </div>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>

          <button
            onClick={() => {
              setIsUploadModalOpen(true)
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            <Upload className="h-5 w-5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setViewingDocument(doc)}
            >
              {editingDocument && editingDocument.id === doc.id ? (
                <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditingDocument(null)} className="p-1 rounded-full hover:bg-gray-100">
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => {
                        if (newFileName.trim()) {
                          renameDocument(editingDocument, newFileName)
                          setEditingDocument(null)
                        }
                      }}
                      className="p-1 rounded-full hover:bg-green-100"
                    >
                      <Check className="h-5 w-5 text-green-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start">
                    <div className="mr-3">{getFileIcon(doc.type)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-800 mb-1">{doc.name}</h3>
                      <div className="flex gap-2 text-sm text-gray-500">
                        <span className="uppercase">{doc.type}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                        {doc.size && (
                          <>
                            <span>•</span>
                            <span>{doc.size}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewingDocument(doc)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="View"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingDocument(doc)
                        setNewFileName(doc.name)
                      }}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                      title="Rename"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Are you sure you want to delete this document?")) {
                          deleteDocument(doc)
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No documents found</h3>
            <p className="text-gray-500">{searchQuery ? "Try different search terms" : "Upload your first document"}</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Upload Document</h3>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setSelectedFile(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mb-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-500">PDF, DOCX or image files (max. 10MB)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setSelectedFile(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className={`px-4 py-2 rounded-md text-white ${
                  !selectedFile
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-lime-500 to-green-600 hover:opacity-90"
                }`}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {viewingDocument && (
        <DocumentPreviewModal
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
          onDelete={(doc) => {
            deleteDocument(doc)
            setViewingDocument(null)
          }}
          onRename={(doc, newName) => {
            renameDocument(doc, newName)
          }}
        />
      )}
    </DashboardLayout>
  )
}
