import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { createToken, setAuthCookie } from "@/lib/auth"
import { hash } from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("medisage")
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const result = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create user object (without password)
    const user = {
      id: result.insertedId.toString(),
      name,
      email,
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
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}
