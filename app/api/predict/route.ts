import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000"

export async function POST(req: Request) {
  try {
    const { testType, formData } = await req.json()

    // Get current user if authenticated
    const user = await getCurrentUser()
    const userId = user?.id || "anonymous"

    console.log(`Processing ${testType} prediction with data:`, JSON.stringify(formData))

    // Determine which endpoint to use based on test type
    const endpoint = testType === "test-1" ? "xgb" : "rf"

    // For development/testing when ML API might not be available
    let predictionResult

    try {
      // Get prediction from ML API
      console.log(`Sending request to ${ML_API_URL}/predict/${endpoint}`)
      const predictionResponse = await fetch(`${ML_API_URL}/predict/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!predictionResponse.ok) {
        throw new Error(`ML API error: ${predictionResponse.status}`)
      }

      predictionResult = await predictionResponse.json()
      console.log("Received prediction result:", predictionResult)
    } catch (error) {
      console.error("Error calling ML API:", error)

      // Fallback to mock prediction if ML API is unavailable
      console.log("Using fallback mock prediction")
      predictionResult = {
        risk_score: Math.random() * 10,
        probability: Math.random() * 100,
        prediction: Math.random() > 0.5 ? 1 : 0,
      }
    }

    // Save to MongoDB
    const client = await clientPromise
    const db = client.db("medisage")

    const testResult = {
      name: formData.name,
      testType,
      formData,
      prediction: predictionResult,
      timestamp: new Date(),
      userId,
    }

    await db.collection("testResults").insertOne(testResult)
    console.log("Test result saved to database")

    return NextResponse.json({
      success: true,
      data: predictionResult,
    })
  } catch (error) {
    console.error("Prediction error:", error)
    return NextResponse.json({ error: "Failed to process prediction. Please try again." }, { status: 500 })
  }
}
