import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { list } from "@vercel/blob"

export async function GET(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // List files from Vercel Blob
    const { blobs } = await list({
      prefix: `${user.id}/`,
    })

    // Format the response
    const files = blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      name: blob.pathname.split("/").pop() || "",
      type: blob.pathname.split(".").pop() || "",
      size: blob.size,
      modified: blob.uploadedAt,
    }))

    return NextResponse.json({
      success: true,
      files,
    })
  } catch (error) {
    console.error("List files API error:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}
