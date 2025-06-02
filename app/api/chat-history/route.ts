import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("medisage")
    const chatCollection = db.collection("chats")

    // Get chat history for the user
    const chats = await chatCollection.find({ userId: user.id }).sort({ updatedAt: -1 }).toArray()

    // Format the response
    const formattedChats = chats.map((chat) => ({
      id: chat.chatId,
      title: chat.messages[0]?.content.substring(0, 50) + "..." || "New Chat",
      lastMessage: chat.messages[chat.messages.length - 1]?.content.substring(0, 100) + "..." || "",
      timestamp: chat.updatedAt,
      messageCount: chat.messages.length / 2, // Divide by 2 because each interaction has user + assistant message
    }))

    return NextResponse.json({
      success: true,
      chats: formattedChats,
    })
  } catch (error) {
    console.error("Chat history API error:", error)
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 })
  }
}
