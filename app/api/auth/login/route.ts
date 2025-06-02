import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { createToken, setAuthCookie } from "@/lib/auth"
import { compare } from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("medisage")
    const usersCollection = db.collection("users")

    // Find user
    const user = await usersCollection.findOne({ email })

    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Check password
    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create user object (without password)
    const userObj = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
    }

    // Create token
    const token = await createToken(userObj)

    // Create response
    const response = NextResponse.json({
      success: true,
      user: userObj,
    })

    // Set auth cookie
    return setAuthCookie(response, token)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}
