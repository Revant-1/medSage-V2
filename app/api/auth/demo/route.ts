import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { createToken, setAuthCookie } from "@/lib/auth"
import { hash } from "bcryptjs"

export async function POST() {
  try {
    const client = await clientPromise
    const db = client.db("medisage")
    const usersCollection = db.collection("users")

    // Check if demo account exists
    let demoUser = await usersCollection.findOne({ email: "demo@medisage.com" })

    // If demo account doesn't exist, create it
    if (!demoUser) {
      const hashedPassword = await hash("demo123", 10)

      const result = await usersCollection.insertOne({
        name: "Demo User",
        email: "demo@medisage.com",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDemo: true,
      })

      demoUser = {
        _id: result.insertedId,
        name: "Demo User",
        email: "demo@medisage.com",
        isDemo: true,
      }
    }

    // Create user object (without password)
    const user = {
      id: demoUser._id.toString(),
      name: demoUser.name,
      email: demoUser.email,
      isDemo: true,
    }

    // Create token
    const token = await createToken(user)

    // Create response
    const response = NextResponse.json({
      success: true,
      user,
    })

    // Set auth cookie
    return setAuthCookie(response, token)
  } catch (error) {
    console.error("Demo login error:", error)
    return NextResponse.json({ error: "Failed to login with demo account" }, { status: 500 })
  }
}
