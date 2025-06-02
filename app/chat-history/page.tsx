"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { MessageSquare, Trash2, Calendar, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface ChatHistory {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  messageCount: number
}

export default function ChatHistory() {
  const { user } = useAuth()
  const [chats, setChats] = useState<ChatHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchChatHistory()
  }, [])

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/chat-history")

      if (!response.ok) {
        throw new Error("Failed to fetch chat history")
      }

      const data = await response.json()

      if (data.success) {
        setChats(data.chats)
      } else {
        setError(data.error || "Failed to load chat history")
      }
    } catch (error) {
      console.error("Error fetching chat history:", error)
      setError("Failed to load chat history. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteChat = async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) {
      return
    }

    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove the chat from the list
        setChats(chats.filter((chat) => chat.id !== chatId))
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete chat")
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
      setError("Failed to delete chat. Please try again.")
    }
  }

  return (
    <DashboardLayout title="Chat History">
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">{error}</div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No chat history yet</h3>
            <p className="text-gray-500 mb-6">Start a new conversation with MediSage</p>
            <Link href="/chat">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Start New Chat
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">Your previous conversations with MediSage</p>
              <Link href="/chat">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  New Chat
                </button>
              </Link>
            </div>

            {chats.map((chat) => (
              <div key={chat.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{chat.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(new Date(chat.timestamp))}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{chat.messageCount} messages</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteChat(chat.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm line-clamp-2">{chat.lastMessage}</p>
                </div>
                <div className="bg-gray-50 p-3 text-right">
                  <Link href={`/chat?id=${chat.id}`}>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      Continue Conversation →
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
