"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export default function PublicChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: "system",
      content: "Welcome to MediSage! I'm your AI health assistant powered by Gemini. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatId] = useState(uuidv4())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setIsLoading(true)
    setError(null)

    try {
      // Format messages for AI API
      const apiMessages = [
        {
          role: "system",
          content: `You are MediSage, an AI medical assistant powered by Google's Gemini model. Provide helpful, accurate, and easy-to-understand information about medical topics. 
          Always clarify that you're not a doctor and your advice doesn't replace professional medical consultation.
          Focus on evidence-based information and be cautious about providing specific diagnoses.
          If asked about symptoms, explain possible causes but emphasize the importance of seeing a healthcare provider.
          For medications, explain general information about usage, common side effects, and important warnings.
          When discussing sensitive topics, be respectful and professional.
          If you don't know something or if the question is outside your medical knowledge, admit it and suggest consulting a healthcare professional.`,
        },
        ...messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        {
          role: "user",
          content: inputValue,
        },
      ]

      // Call our secure server-side API route
      const response = await fetch("/api/ai-completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: "google/gemini-2.0-flash-exp:free",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response from AI service")
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Save the conversation to MongoDB
      try {
        await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: inputValue,
              },
              {
                role: "assistant",
                content: aiResponse,
              },
            ],
            userId: "anonymous",
            chatId,
          }),
        })
      } catch (error) {
        console.error("Error saving chat:", error)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex items-center justify-between mobile-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="font-bold text-green-600">MediSage Chat</span>
        </div>
        <Link href="/login">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm mobile-button">Sign In</button>
        </Link>
      </header>

      <div className="flex flex-col flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="mt-2 text-sm underline hover:no-underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-white rounded-lg shadow mobile-card"
        >
          {messages
            .filter((msg) => msg.role !== "system")
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
                      ? "bg-gradient-to-r from-lime-500 to-green-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <ReactMarkdown className="prose prose-sm max-w-none">{message.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </motion.div>

        {/* Example Suggestions */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {examples.map((example, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setInputValue(example)}
                className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left mobile-card touch-feedback"
              >
                <p className="text-gray-800 text-sm">{example}</p>
              </motion.button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow sticky bottom-0 z-10 mobile-card">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none border-0 focus:ring-0 max-h-32 p-2 text-base mobile-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className={`p-2 rounded-full ${
              isLoading || !inputValue.trim()
                ? "bg-gray-200 text-gray-400"
                : "bg-green-500 text-white hover:bg-green-600 touch-feedback"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>
            This is a demo of MediSage powered by Gemini. For full features,{" "}
            <Link href="/login" className="text-green-600 hover:underline">
              sign in
            </Link>{" "}
            or{" "}
            <Link href="/register" className="text-green-600 hover:underline">
              create an account
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
