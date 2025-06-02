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

    // Get URL parameters
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId") || user.id

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("medisage")
    const healthDataCollection = db.collection("healthData")

    // Get health data for the user or use default data
    let healthData = await healthDataCollection.findOne({ userId })

    if (!healthData) {
      // Return default data if no data exists
      healthData = {
        userId,
        heartRate: generateMockData(70, 80, 30),
        bloodPressure: generateMockBloodPressure(30),
        cholesterol: generateMockCholesterol(10),
        spo2: generateMockSpo2(30),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Save default data to database
      await healthDataCollection.insertOne(healthData)
    }

    return NextResponse.json({
      success: true,
      data: healthData,
    })
  } catch (error) {
    console.error("Health data API error:", error)
    return NextResponse.json({ error: "Failed to fetch health data" }, { status: 500 })
  }
}

// Helper function to generate mock data
function generateMockData(min: number, max: number, count: number) {
  const data = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (count - i))

    data.push({
      date: date.toISOString(),
      value: Math.floor(Math.random() * (max - min + 1)) + min,
    })
  }

  return data
}

function generateMockBloodPressure(count: number) {
  const data = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (count - i))

    data.push({
      date: date.toISOString(),
      systolic: Math.floor(Math.random() * (140 - 110 + 1)) + 110,
      diastolic: Math.floor(Math.random() * (90 - 70 + 1)) + 70,
    })
  }

  return data
}

function generateMockCholesterol(count: number) {
  const data = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (count - i) * 30) // Monthly readings

    data.push({
      date: date.toISOString(),
      total: Math.floor(Math.random() * (220 - 150 + 1)) + 150,
      hdl: Math.floor(Math.random() * (80 - 40 + 1)) + 40,
      ldl: Math.floor(Math.random() * (130 - 80 + 1)) + 80,
    })
  }

  return data
}

function generateMockSpo2(count: number) {
  const data = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (count - i))

    // Generate SpO2 values between 94 and 100
    data.push({
      date: date.toISOString(),
      value: Math.floor(Math.random() * (100 - 94 + 1)) + 94,
    })
  }

  return data
}

export async function POST(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const healthData = await req.json()

    // Validate health data
    if (!healthData) {
      return NextResponse.json({ error: "Invalid health data" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("medisage")
    const healthDataCollection = db.collection("healthData")

    // Update health data
    const result = await healthDataCollection.updateOne(
      { userId: user.id },
      {
        $set: {
          ...healthData,
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
    console.error("Health data API error:", error)
    return NextResponse.json({ error: "Failed to update health data" }, { status: 500 })
  }
}
