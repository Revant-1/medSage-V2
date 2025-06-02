import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { list, del, put } from "@vercel/blob"

export async function PUT(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { pathname, newName } = await req.json()

    if (!pathname || !newName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the file from Vercel Blob
    const { blobs } = await list({
      prefix: pathname,
    })

    if (blobs.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const blob = blobs[0]

    // Get the file extension
    const fileExtension = pathname.split(".").pop() || ""

    // Create new pathname with the new name
    const pathParts = pathname.split("/")
    pathParts.pop() // Remove the old filename
    const newPathname = [...pathParts, `${newName}.${fileExtension}`].join("/")

    // Download the file
    const fileResponse = await fetch(blob.url)
    const fileData = await fileResponse.blob()

    // Upload with new name
    const newBlob = await put(newPathname, fileData, {
      access: "public",
    })

    // Delete the old file
    await del(pathname)

    return NextResponse.json({
      success: true,
      file: {
        url: newBlob.url,
        pathname: newBlob.pathname,
        contentType: newBlob.contentType,
        size: newBlob.size,
      },
    })
  } catch (error) {
    console.error("Rename file API error:", error)
    return NextResponse.json({ error: "Failed to rename file" }, { status: 500 })
  }
}
