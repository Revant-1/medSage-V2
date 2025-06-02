import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Get current user
    const user = await getCurrentUser()
    const chatId = params.id

    if (!chatId) {
      return NextResponse.json({ error: "No chat ID provided" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("medisage")
    const chatCollection = db.collection("chats")

    // Find the chat
    const chat = await chatCollection.findOne({ chatId })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // If user is authenticated, check if they own the chat
    if (user && chat.userId !== user.id && chat.userId !== "anonymous") {
      return NextResponse.json({ error: "Unauthorized to access this chat" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      chat,
    })
  } catch (error) {
    console.error("Get chat API error:", error)
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const chatId = params.id

    if (!chatId) {
      return NextResponse.json({ error: "No chat ID provided" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("medisage")
    const chatCollection = db.collection("chats")

    // Delete the chat
    const result = await chatCollection.deleteOne({
      chatId,
      userId: user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Chat not found or not authorized to delete" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Delete chat API error:", error)
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
  }
}
