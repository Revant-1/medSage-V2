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
    const settingsCollection = db.collection("userSettings")

    // Get user settings
    const settings = await settingsCollection.findOne({ userId: user.id })

    // Return default settings if none exist
    if (!settings) {
      const defaultSettings = {
        userId: user.id,
        notifications: true,
        darkMode: false,
        language: "en",
        dataSharing: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Save default settings
      await settingsCollection.insertOne(defaultSettings)

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      })
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const settings = await req.json()

    // Validate settings
    if (!settings) {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("medisage")
    const settingsCollection = db.collection("userSettings")

    // Update settings
    const result = await settingsCollection.updateOne(
      { userId: user.id },
      {
        $set: {
          ...settings,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
