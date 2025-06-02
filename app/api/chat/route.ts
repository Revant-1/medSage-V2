import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, chatId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    // Get current user for authentication
    const user = await getCurrentUser()
    const effectiveUserId = user?.id || userId || "anonymous"

    console.log("Processing chat request for user:", effectiveUserId)

    // Add medical context to the system message
    const systemMessage = {
      role: "system",
      content: `You are MediSage, an AI medical assistant powered by Google's Gemini model. You can analyze both text and images to provide helpful, accurate, and easy-to-understand medical information.

When analyzing medical images (X-rays, lab results, symptoms photos, etc.), provide detailed observations but always emphasize that:
1. You are not a doctor and cannot provide definitive diagnoses
2. Your analysis should not replace professional medical consultation
3. Users should always consult healthcare professionals for proper diagnosis and treatment

For text-based medical questions:
- Focus on evidence-based information
- Be cautious about providing specific diagnoses
- Explain possible causes but emphasize seeing a healthcare provider
- Provide general information about medications, side effects, and warnings
- Be respectful and professional with sensitive topics

If you don't know something or if the question is outside your medical knowledge, admit it and suggest consulting a healthcare professional.`,
    }

    // Prepare messages for AI API
    const aiMessages = [systemMessage, ...messages]

    // Retry logic for AI completion
    const maxRetries = 5
    let lastError = null
    let aiResponse = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Chat AI request attempt ${attempt}/${maxRetries}`)

        const aiCompletionResponse = await fetch(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/ai-completion`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: aiMessages,
              model: "google/gemini-2.0-flash-exp:free",
            }),
          },
        )

        if (aiCompletionResponse.ok) {
          const aiData = await aiCompletionResponse.json()
          if (aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
            aiResponse = aiData.choices[0].message.content
            console.log(`Chat AI request successful on attempt ${attempt}`)
            break
          }
        }

        const errorData = await aiCompletionResponse.json().catch(() => ({}))
        lastError = new Error(errorData.error || `HTTP ${aiCompletionResponse.status}`)
        console.error(`Chat AI request failed on attempt ${attempt}:`, lastError)

        // Wait before retrying with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      } catch (error: any) {
        lastError = error
        console.error(`Chat AI network error on attempt ${attempt}:`, error)

        // Wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    if (!aiResponse) {
      console.error("All chat AI attempts failed:", lastError)
      // Return a fallback response instead of failing
      aiResponse = "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again in a moment."
    }

    // Save chat to database if user is authenticated
    if (user && chatId) {
      try {
        const client = await clientPromise
        const db = client.db("medisage")

        const userMessage = messages[messages.length - 1]
        const chatData = {
          chatId,
          userId: user.id,
          messages: [
            {
              role: "user",
              content: userMessage.content,
              attachments: userMessage.attachments,
              timestamp: new Date(),
            },
            {
              role: "assistant",
              content: aiResponse,
              timestamp: new Date(),
            },
          ],
          updatedAt: new Date(),
        }

        // Check if chat exists
        const existingChat = await db.collection("chats").findOne({ chatId })

        if (existingChat) {
          // Update existing chat
          await db.collection("chats").updateOne(
            { chatId },
            {
              $push: {
                messages: {
                  $each: chatData.messages,
                },
              },
              $set: { updatedAt: new Date() },
            },
          )
        } else {
          // Create new chat
          await db.collection("chats").insertOne({
            ...chatData,
            createdAt: new Date(),
          })
        }

        console.log("Chat saved to database successfully")
      } catch (dbError) {
        console.error("Database error:", dbError)
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
    })
  } catch (error: any) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        response: "I'm sorry, there was an error processing your request. Please try again.",
      },
      { status: 200 }, // Return 200 with fallback message
    )
  }
}
