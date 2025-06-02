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
    const testResultsCollection = db.collection("testResults")

    // Get test results for the user
    let testResults = await testResultsCollection.find({ userId: user.id }).sort({ timestamp: -1 }).toArray()

    if (testResults.length === 0) {
      // Generate mock data if no results exist
      testResults = generateMockTestResults(user.id, 5)

      // Save mock data to database
      if (testResults.length > 0) {
        await testResultsCollection.insertMany(testResults)
      }
    }

    return NextResponse.json({
      success: true,
      data: testResults,
    })
  } catch (error) {
    console.error("Test results API error:", error)
    return NextResponse.json({ error: "Failed to fetch test results" }, { status: 500 })
  }
}

// Helper function to generate mock test results
function generateMockTestResults(userId: string, count: number) {
  const results = []
  const now = new Date()
  const testTypes = ["test-1", "test-2"]
  const names = ["Heart Health Assessment", "Cardiovascular Risk Assessment"]

  for (let i = 0; i < count; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 15) // Every 15 days

    const testTypeIndex = i % 2
    const probability = Math.floor(Math.random() * 100)
    const risk_score = (probability / 100) * 10

    results.push({
      _id: `mock_${i}_${Date.now()}`,
      userId,
      name: names[testTypeIndex],
      testType: testTypes[testTypeIndex],
      formData: {
        age: Math.floor(Math.random() * (70 - 30 + 1)) + 30,
        gender: Math.random() > 0.5 ? "0" : "1",
        // Add other form fields as needed
      },
      prediction: {
        risk_score,
        probability,
        prediction: probability > 50 ? 1 : 0,
      },
      timestamp: date.toISOString(),
    })
  }

  return results
}
