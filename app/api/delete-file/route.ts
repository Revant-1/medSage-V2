import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { del } from "@vercel/blob"

export async function DELETE(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get pathname from request body
    const { pathname } = await req.json()

    if (!pathname) {
      return NextResponse.json({ error: "No pathname provided" }, { status: 400 })
    }

    // Delete from Vercel Blob
    await del(pathname)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Delete file API error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
