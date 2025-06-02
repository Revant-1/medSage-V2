import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import type { NextResponse } from "next/server"

// User type definition
export interface User {
  id: string
  name: string
  email: string
  image?: string
}

// Create a JWT token
export async function createToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)

  return token
}

// Verify a JWT token
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return payload as User
  } catch (error) {
    return null
  }
}

// Get the current user from the request
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}

// Set the auth token in cookies
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: "auth-token",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}

// Clear the auth token from cookies
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  })

  return response
}
