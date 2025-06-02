import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { put } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get form data
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate a unique filename
    const filename = `${user.id}/${uuidv4()}-${file.name}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      file: {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        size: blob.size,
        originalName: file.name,
      },
    })
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
