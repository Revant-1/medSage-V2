import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    let { messages, model = "google/gemini-2.0-flash-exp:free" } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY

    if (!apiKey) {
      console.error("No OpenRouter API key found")
      return NextResponse.json({ error: "AI service configuration error" }, { status: 500 })
    }

    // Transform messages to support multimodal content (text + images)
    const transformedMessages = messages.map((message) => {
      if (message.role === "user" && message.attachments && message.attachments.length > 0) {
        // Create multimodal content array
        const content = []

        // Add text content if exists
        if (message.content && message.content.trim()) {
          content.push({
            type: "text",
            text: message.content,
          })
        }

        // Add image attachments
        message.attachments.forEach((attachment) => {
          if (attachment.type === "image" && attachment.url) {
            content.push({
              type: "image_url",
              image_url: {
                url: attachment.url,
              },
            })
          } else if (attachment.type === "document") {
            // For documents, add as text reference
            content.push({
              type: "text",
              text: `[Document attached: ${attachment.name}]`,
            })
          }
        })

        return {
          role: message.role,
          content: content.length > 0 ? content : message.content,
        }
      }

      // For non-user messages or messages without attachments, keep as simple text
      return {
        role: message.role,
        content: message.content,
      }
    })

    // Retry logic with exponential backoff
    const maxRetries = 5
    let lastError = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI completion attempt ${attempt}/${maxRetries} with model: ${model}`)

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
            "X-Title": "MediSage Health Assistant",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: transformedMessages,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error(`OpenRouter API error on attempt ${attempt}:`, response.status, errorData)

          // If it's a 400 error with Gemini, try fallback model
          if (response.status === 400 && model.includes("gemini") && attempt === 1) {
            model = "anthropic/claude-3-haiku:beta"
            console.log("Switching to fallback model due to Gemini error:", model)
            continue
          }

          throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`)
        }

        const data = await response.json()

        if (data.choices && data.choices[0] && data.choices[0].message) {
          console.log(`AI completion successful on attempt ${attempt}`)
          return NextResponse.json({
            choices: [
              {
                message: {
                  content: data.choices[0].message.content,
                },
              },
            ],
            model: model,
            usage: data.usage,
          })
        } else {
          throw new Error("Invalid response format from OpenRouter")
        }
      } catch (error: any) {
        lastError = error
        console.error(`AI completion attempt ${attempt} failed:`, error.message)

        // If this is the last attempt, or if it's a non-retryable error, break
        if (attempt === maxRetries || error.message.includes("401") || error.message.includes("403")) {
          break
        }

        // Exponential backoff: 1s, 2s, 4s, 5s, 5s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        console.log(`Waiting ${delay}ms before retry...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // If we get here, all retries failed
    console.error("All AI completion attempts failed:", lastError)

    return NextResponse.json(
      {
        error: "AI service temporarily unavailable. Please try again in a moment.",
        details: lastError?.message || "Unknown error",
      },
      { status: 503 },
    )
  } catch (error: any) {
    console.error("AI completion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
